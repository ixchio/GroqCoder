import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
// @ts-expect-error iknown issue with mongoose types
let cached = global.mongoose;

if (!cached) {
  // @ts-expect-error iknown issue with mongoose types
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((mongoose) => {
        return mongoose;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
