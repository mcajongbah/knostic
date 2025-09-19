import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import cors from "cors";
import express from "express";
import multer from "multer";
import { csvController } from "./controllers/csvController";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const upload = multer({ storage: multer.memoryStorage() });

// Build allowed origins list from env
const staticAllowedOrigins: string[] = [];
if (process.env.CLIENT_URL) staticAllowedOrigins.push(process.env.CLIENT_URL);
if (process.env.ALLOWED_ORIGINS) {
  staticAllowedOrigins.push(
    ...process.env.ALLOWED_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow localhost in development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      // Exact match against configured origins
      if (staticAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Simple wildcard support (e.g., https://knostic-client-*.vercel.app)
      const matchesWildcard = staticAllowedOrigins.some((pattern) => {
        if (!pattern.includes("*")) return false;
        const regex = new RegExp(
          "^" +
            pattern
              .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
              .replace(/\\\*/g, ".*") +
            "$"
        );
        return regex.test(origin);
      });
      if (matchesWildcard) {
        return callback(null, true);
      }

      // Fallback: allow knostic-client vercel domains in production
      if (process.env.NODE_ENV === "production") {
        const vercelClientRegex =
          /^https?:\/\/[^/]*knostic-client[^/]*\.vercel\.app$/i;
        if (vercelClientRegex.test(origin)) {
          return callback(null, true);
        }
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// Ensure preflight requests are handled
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post(
  "/api/upload",
  upload.fields([
    { name: "strings", maxCount: 1 },
    { name: "classifications", maxCount: 1 },
  ]),
  csvController.uploadFiles
);

app.post("/api/validate", csvController.validateData);
app.post("/api/export", csvController.exportFiles);

app.use(errorHandler);

export default app;
