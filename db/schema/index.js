import { integer } from "drizzle-orm/gel-core";
import { boolean, foreignKey, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").defaultNow(),
});

export const hues = pgTable("hues", {
  id: serial("id").primaryKey(),
  hueId: text("hue_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  up: boolean("up").default(false),
  brightness: integer("brightness")
    .default(0),
  colorMode: text("color_mode", { 
    enum: ["xy", "ct", "hs"] 
  }).default("xy"),
  model: text("model"),
});

