import { db } from "./db";
import {
  botConfigs,
  commands,
  type BotConfig,
  type InsertBotConfig,
  type UpdateConfigRequest,
  type Command,
  type InsertCommand,
  type UpdateCommandRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getConfig(): Promise<BotConfig | null>;
  updateConfig(updates: UpdateConfigRequest): Promise<BotConfig>;
  getCommands(): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(id: number, updates: UpdateCommandRequest): Promise<Command>;
  deleteCommand(id: number): Promise<void>;
  updateConfigStatus(isActive: boolean, lastError?: string | null): Promise<BotConfig>;
}

export class DatabaseStorage implements IStorage {
  async getConfig(): Promise<BotConfig | null> {
    const [config] = await db.select().from(botConfigs).limit(1);
    return config || null;
  }

  async updateConfig(updates: UpdateConfigRequest): Promise<BotConfig> {
    let config = await this.getConfig();
    if (!config) {
      const [newConfig] = await db.insert(botConfigs).values({ token: updates.token || '', isActive: false }).returning();
      config = newConfig;
    }
    
    const [updated] = await db.update(botConfigs)
      .set(updates)
      .where(eq(botConfigs.id, config.id))
      .returning();
    return updated;
  }
  
  async updateConfigStatus(isActive: boolean, lastError?: string | null): Promise<BotConfig> {
    let config = await this.getConfig();
    if (!config) {
      const [newConfig] = await db.insert(botConfigs).values({ token: '', isActive: false }).returning();
      config = newConfig;
    }
    
    const [updated] = await db.update(botConfigs)
      .set({ isActive, lastError })
      .where(eq(botConfigs.id, config.id))
      .returning();
    return updated;
  }

  async getCommands(): Promise<Command[]> {
    return await db.select().from(commands);
  }

  async createCommand(command: InsertCommand): Promise<Command> {
    const [newCommand] = await db.insert(commands).values(command as any).returning();
    return newCommand;
  }

  async updateCommand(id: number, updates: UpdateCommandRequest): Promise<Command> {
    const [updated] = await db.update(commands)
      .set(updates as any)
      .where(eq(commands.id, id))
      .returning();
    return updated;
  }

  async deleteCommand(id: number): Promise<void> {
    await db.delete(commands).where(eq(commands.id, id));
  }
}

export const storage = new DatabaseStorage();
