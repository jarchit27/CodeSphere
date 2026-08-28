const EventEmitter = require('events');
const CfStats = require('../models/cfStats.model');
const { syncHandle } = require('./cfSyncService');

const CONCURRENCY = 3;
const INTERVAL_MS = 250;
const STALE_MS = 2 * 60 * 60 * 1000; // 2 hours

// Event-driven architecture: emits 'synced' and 'error' events
// so SSE endpoints can push real-time updates to connected clients
const syncEmitter = new EventEmitter();

let active = 0;
const queue = new Set(); 

async function enqueue(handle) {
    if (!handle) return;
    
    const stats = await CfStats.findOne({ handle: handle });
    if (stats && stats.lastSyncedAt && (Date.now() - stats.lastSyncedAt.getTime() < STALE_MS)) {
        return; // Not stale
    }
    
    if (!queue.has(handle)) {
        queue.add(handle);
        processQueue();
    }
}

async function processQueue() {
    if (active >= CONCURRENCY || queue.size === 0) return;
    
    const iterator = queue.values();
    const handle = iterator.next().value;
    queue.delete(handle);
    
    active++;
    try {
        const updatedStats = await syncHandle(handle);
        console.log(`[SyncQueue] ✅ Synced: ${handle}`);
        // Emit event so SSE clients get notified instantly
        syncEmitter.emit('synced', { handle, stats: updatedStats });
    } catch (e) {
        console.error(`[SyncQueue] ❌ Error syncing ${handle}:`, e.message);
        syncEmitter.emit('error', { handle, error: e.message });
    } finally {
        active--;
        setTimeout(processQueue, INTERVAL_MS);
    }
}

async function reseedQueueOnStartup() {
    console.log(`[SyncQueue] Scanning for stale Codeforces handles to re-seed...`);
    try {
        const twoHoursAgo = new Date(Date.now() - STALE_MS);
        
        const staleStats = await CfStats.find({
            $or: [
                { lastSyncedAt: null },
                { lastSyncedAt: { $lt: twoHoursAgo } }
            ]
        }).select('handle');
        
        if (staleStats.length > 0) {
            console.log(`[SyncQueue] Found ${staleStats.length} stale handles. Enqueuing...`);
            for (const stat of staleStats) {
                queue.add(stat.handle);
            }
            processQueue();
        } else {
            console.log(`[SyncQueue] No stale handles found.`);
        }
    } catch (error) {
        console.error(`[SyncQueue] Failed to re-seed queue:`, error);
    }
}

module.exports = { 
    enqueue,
    reseedQueueOnStartup,
    syncEmitter
};
