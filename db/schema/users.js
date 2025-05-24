import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  test: text("test").notNull(),
  slay: text("slay").notNull(),
  age: integer("age"),
  createdAt: timestamp("created_at").defaultNow(),
});