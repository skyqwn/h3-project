import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Neon serverless HTTP driver — the recommended Drizzle driver for Vercel +
// Neon. DATABASE_URL is injected by the Vercel Neon integration (and pulled
// into .env.local for local dev).
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
