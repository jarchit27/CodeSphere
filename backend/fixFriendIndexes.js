const mongoose = require("mongoose");
const config = require("./config.json"); 

async function fixIndexes() {
  try {
    await mongoose.connect(config.connectString);
    const db = mongoose.connection.db;

    // Drop old index on "handle" (if exists)
    try {
      console.log("Dropping old index 'handle_1'...");
      await db.collection("friends").dropIndex("handle_1");
    } catch (err) {
      if (err.codeName === "IndexNotFound") {
        console.log("Index 'handle_1' not found. Skipping drop.");
      } else {
        throw err;
      }
    }

    console.log("Creating compound unique index on { userId, handle }...");
    await db.collection("friends").createIndex({ userId: 1, handle: 1 }, { unique: true });

    console.log("✅ Index fixed successfully.");
  } catch (error) {
    console.error("❌ Failed to fix indexes:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndexes();