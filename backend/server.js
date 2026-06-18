import './config/loadEnv.js';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import cohortRoutes from "./routes/cohortRoutes.js";
import lmsRoutes from "./routes/lmsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import peerReviewRoutes from "./routes/peerReviewRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import bundleRoutes from "./routes/bundleRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import externalRoutes from "./routes/externalRoutes.js";
import { initTelegramBot } from "./services/telegramBotService.js";

const app = express();

// Security and Performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for local development and simplicity
}));
app.use(compression());

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://localhost:8081", // Mobile Web Preview
      "http://localhost:8082",
      "http://localhost:8083",
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Mobile Physical Devices
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/comm", communicationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/cohorts", cohortRoutes);
app.use("/api/lms", lmsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/peer-review", peerReviewRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/external", externalRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    await initTelegramBot(app);
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Error: ${err?.message ?? err}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

export default app;
