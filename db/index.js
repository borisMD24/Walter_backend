import * as schema from "./schema/index.js";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from "dotenv";

config({ path: ".env.local" });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
export { schema };