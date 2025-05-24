import { integer } from "drizzle-orm/gel-core";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  test: text("test").notNull(),
  tey: text("tey").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const test = pgTable("tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  test: text("test").notNull(),
  tey: text("tey").notNull(),
  lol: integer("lol").default(5),
  huuo: integer("huuo").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

