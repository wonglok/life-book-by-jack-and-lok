import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = (globalThis as Record<string, unknown>).__mongoose;
if (!cached) {
  cached = (globalThis as Record<string, unknown>).__mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
