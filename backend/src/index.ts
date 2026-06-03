import "./env";
import express from "express";
import cors from "cors";
import aiRouter from "./routes/ai";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "EthFinance AI Copilot",
    version: "1.0.0",
    deepseek: !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "your-key-here",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/ai", aiRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 AI Financial Copilot running on http://localhost:${PORT}`);
  console.log(`   DeepSeek: ${process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "your-key-here" ? "✅ configured" : "⚠️  demo mode (solo contexto EthFinance OS)"}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use (another backend is running).`);
    console.error(`   Free it: lsof -i :${PORT}   then   kill <PID>`);
    console.error(`   Or stop the old terminal with Ctrl+C (not Ctrl+Z).\n`);
    process.exit(1);
  }
  throw err;
});

export default app;
