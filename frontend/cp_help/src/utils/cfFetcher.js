import axios from 'axios';

class CodeforcesFetcher {
  constructor() {
    this.queue = [];
    this.activeRequests = 0;
    this.CONCURRENCY_LIMIT = 3;
    this.CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in ms
  }

  // Get cached stats from localStorage
  getCachedStats(handle) {
    try {
      const cached = localStorage.getItem(`cf_stats_${handle}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.fetchedAt < this.CACHE_DURATION) {
          return parsed.stats;
        }
      }
    } catch (e) {
      console.warn("Failed to read localStorage:", e);
    }
    return null;
  }

  // Save stats to localStorage
  setCachedStats(handle, stats) {
    try {
      localStorage.setItem(`cf_stats_${handle}`, JSON.stringify({
        stats,
        fetchedAt: Date.now()
      }));
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }
  }

  // Main entry point for FriendCard
  getStats(handle) {
    return new Promise((resolve, reject) => {
      // 1. Check Cache first
      const cached = this.getCachedStats(handle);
      if (cached) {
        console.log(`[cfFetcher] ⚡ Cache HIT for ${handle}`);
        return resolve({ data: { stats: cached } });
      }

      // 2. If not cached, push to queue
      console.log(`[cfFetcher] 🕒 Queued fetch for ${handle}`);
      this.queue.push({ handle, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.queue.length === 0 || this.activeRequests >= this.CONCURRENCY_LIMIT) {
      return;
    }

    this.activeRequests++;
    const { handle, resolve, reject } = this.queue.shift();
    console.log(`[cfFetcher] 🚀 Processing ${handle} (Active: ${this.activeRequests}/${this.CONCURRENCY_LIMIT})`);

    try {
      // Fetch both endpoints in parallel for this handle
      const [ratingRes, statusRes] = await Promise.all([
        axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`).catch(() => null),
        axios.get(`https://codeforces.com/api/user.status?handle=${handle}`).catch(() => null)
      ]);

      let contestsCount = undefined;
      let solvedCount = undefined;

      if (ratingRes && ratingRes.data && ratingRes.data.status === 'OK') {
        console.log(`[cfFetcher] Raw Rating API for ${handle}:`, ratingRes.data);
        contestsCount = ratingRes.data.result.length;
      }

      if (statusRes && statusRes.data && statusRes.data.status === 'OK') {
        console.log(`[cfFetcher] Raw Status API for ${handle}: (Total Submissions: ${statusRes.data.result.length})`);
        const solved = new Set();
        statusRes.data.result.forEach(submission => {
          if (submission.verdict === 'OK' && submission.problem) {
            solved.add(`${submission.problem.contestId}-${submission.problem.index}`);
          }
        });
        solvedCount = solved.size;
      }

      // Default to 0 if Codeforces fails, to prevent infinite loops in the UI
      const stats = {
        contestsCount: contestsCount !== undefined ? contestsCount : 0,
        solvedCount: solvedCount !== undefined ? solvedCount : 0
      };

      console.log(`[cfFetcher] ✅ Success for ${handle}:`, stats);
      this.setCachedStats(handle, stats);
      resolve({ data: { stats } });

    } catch (error) {
      console.error(`[cfFetcher] ❌ Error for ${handle}:`, error.message);
      reject(error);
    } finally {
      this.activeRequests--;
      console.log(`[cfFetcher] 🏁 Finished ${handle} (Active: ${this.activeRequests}/${this.CONCURRENCY_LIMIT})`);
      
      // Wait 250ms before allowing another request to start, just to be safe
      setTimeout(() => this.processQueue(), 250);
    }
  }
}

// Export a singleton instance
export const cfFetcher = new CodeforcesFetcher();
