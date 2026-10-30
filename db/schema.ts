import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: serial().primaryKey(),
  title: text().notNull(),
  company: text().notNull(),
  district: text().notNull(),
  salary: text().notNull().default(""),
  type: text().notNull().default(""),
  phone: text().notNull(),
  description: text().notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
