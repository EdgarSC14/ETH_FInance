import path from "path";
import dotenv from "dotenv";

/** Always load backend/.env regardless of process.cwd() (e.g. pnpm dev:all from repo root). */
dotenv.config({ path: path.resolve(__dirname, "../.env") });
