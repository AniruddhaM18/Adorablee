import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import projectRouter from "./routes/projectRouter.js";
import authRouter from "./routes/authRouter.js";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chatRoutes.js";
import { getCorsAllowedOrigins } from "./config.js";

const app = express();

const trustProxy =
  process.env.TRUST_PROXY === "true" ||
  process.env.TRUST_PROXY === "1" ||
  (process.env.NODE_ENV === "production" && process.env.TRUST_PROXY !== "false");
if (trustProxy) {
  app.set("trust proxy", 1);
}

app.use(helmet());

const corsOrigins = getCorsAllowedOrigins();
// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin) {
//         callback(null, true);
//         return;
//       }
//       if (corsOrigins.includes(origin)) {
//         callback(null, true);
//         return;
//       }
//       callback(null, false);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   })
// );
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false, // remove this line entirely
}));
app.options('*', cors());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.use("/project", projectRouter);

app.use("/auth", authRouter);

app.use("/api", chatRouter);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ message: "Internal server error" });
});

const portRaw = parseInt(process.env.PORT ?? "3001", 10);
const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 3001;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, closing server…`);
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
