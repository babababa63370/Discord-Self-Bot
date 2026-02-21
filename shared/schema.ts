import { pgTable, text, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botConfigs = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  lastError: text("last_error"),
});

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  conditionType: text("condition_type").notNull(), // 'interval', 'message'
  conditionValue: text("condition_value").notNull(), // e.g. '120' or JSON for message filter
  channelId: text("channel_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  actions: jsonb("actions").$type<string[]>().default([]).notNull(), // List of commands/messages to send
});

export const insertConfigSchema = createInsertSchema(botConfigs).omit({ id: true });
export const insertCommandSchema = createInsertSchema(commands).omit({ id: true });

export type BotConfig = typeof botConfigs.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertConfigSchema>;

export type Command = typeof commands.$inferSelect;
export type InsertCommand = z.infer<typeof insertCommandSchema>;

// API Types
export type UpdateConfigRequest = Partial<InsertBotConfig>;
export type CreateCommandRequest = InsertCommand;
export type UpdateCommandRequest = Partial<InsertCommand>;
