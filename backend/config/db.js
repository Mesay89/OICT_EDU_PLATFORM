import mongoose from "mongoose";

const connectDB = async ({
  retries = 5,
  serverSelectionTimeoutMS = 30000,
} = {}) => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not set in environment variables");
    process.exit(1);
  }

  // Sanitize the URI for logging (don't print credentials)
  const safeUri = process.env.MONGO_URI.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:@\/]+)(:[^@]+)?@/,
    "$1<user>:<password>@",
  );

  let attempt = 0;

  const options = {
    serverSelectionTimeoutMS,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000, // Check connection every 10s
    maxPoolSize: 10, // Maintain up to 10 socket connections
    retryWrites: true,
  };

  const tryConnect = async () => {
    attempt += 1;
    try {
      console.log(
        `🔌 Attempting MongoDB connection (attempt ${attempt}) to ${safeUri}`,
      );
      const conn = await mongoose.connect(process.env.MONGO_URI, options);
      console.log('\n' + '='.repeat(60));
      console.log('✅ MongoDB Connected Successfully!');
      console.log(`📍 Host: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
      console.log('='.repeat(60) + '\n');
      return conn;
    } catch (error) {
      console.error(
        `❌ MongoDB connection failed (attempt ${attempt}): ${error.message}`,
      );
      if (error.stack) console.error(error.stack);

      // Common actionable hints
      if (
        /Authentication failed/i.test(error.message) ||
        /auth/i.test(error.message)
      ) {
        console.error(
          "Hint: Authentication failed — check DB username/password in your .env and Atlas Database Access users.",
        );
      }
      if (
        /whitelist|IP|network/i.test(error.message) ||
        /server selection error/i.test(error.message) ||
        /could not connect to any servers/i.test(error.message)
      ) {
        console.error(
          "Hint: Network issue — ensure your current machine IP is added in MongoDB Atlas Network Access (IP whitelist) or allow 0.0.0.0/0 for development.",
        );
      }

      if (attempt <= retries) {
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        console.log(
          `Retrying MongoDB connection in ${Math.round(delay / 1000)}s...`,
        );
        await new Promise((res) => setTimeout(res, delay));
        return tryConnect();
      }

      console.error(
        `❌ All ${retries} MongoDB connection attempts failed. Giving up.`,
      );
      process.exit(1);
    }
  };

  return tryConnect();
};

export default connectDB;
