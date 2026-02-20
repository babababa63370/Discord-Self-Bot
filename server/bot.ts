import { Client } from "discord.js-selfbot-v13";
import { storage } from "./storage";
import { type BotConfig } from "@shared/schema";

class BotManager {
  public client: Client | null = null;
  private intervals: NodeJS.Timeout[] = [];

  async start(token: string) {
    if (this.client) {
      this.stop();
    }
    
    this.client = new Client({
      checkUpdate: false,
    });

    this.client.on('ready', async () => {
      console.log(`Self-bot logged in as ${this.client?.user?.tag}!`);
      await storage.updateConfigStatus(true, null);
      this.reloadCommands();
    });

    try {
      await this.client.login(token);
    } catch (err: any) {
      console.error("Failed to login:", err);
      await storage.updateConfigStatus(false, err.message || "Failed to login");
      this.client = null;
    }
  }

  stop() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.clearIntervals();
    storage.updateConfigStatus(false, null).catch(console.error);
  }

  private clearIntervals() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  async reloadCommands() {
    if (!this.client || !this.client.isReady()) return;
    
    this.clearIntervals();
    
    const commands = await storage.getCommands();
    
    for (const cmd of commands) {
      if (!cmd.isActive) continue;
      
      if (cmd.conditionType === 'interval') {
        const minutes = parseInt(cmd.conditionValue, 10);
        if (isNaN(minutes) || minutes <= 0) continue;
        
        const interval = setInterval(async () => {
          try {
            const channel = await this.client?.channels.fetch(cmd.channelId);
            if (channel && channel.isText()) {
              if (cmd.name.startsWith('/')) {
                // Execute slash command
                await channel.send(cmd.name);
              } else {
                await channel.send(cmd.name);
              }
            }
          } catch (e) {
            console.error(`Failed to execute interval command ${cmd.name}:`, e);
          }
        }, minutes * 60 * 1000);
        
        this.intervals.push(interval);
      }
    }
  }

  async syncConfig(config: BotConfig) {
    if (config.isActive && !this.client) {
      await this.start(config.token);
    } else if (!config.isActive && this.client) {
      this.stop();
    } else if (config.isActive && this.client) {
       // if token changed
       if (this.client.token !== config.token) {
           await this.start(config.token);
       }
    }
  }
}

export const botManager = new BotManager();

// On startup, we can check if it was active
setTimeout(async () => {
  try {
    const config = await storage.getConfig();
    if (config?.isActive && config.token) {
      botManager.start(config.token);
    }
  } catch (e) {
    console.error("Startup bot check failed:", e);
  }
}, 1000);
