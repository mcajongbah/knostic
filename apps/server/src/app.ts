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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost on any port in development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      // Allow exact match to configured CLIENT_URL
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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
