import { Client } from "discord.js-selfbot-v13";
import { storage } from "./storage";
import { type BotConfig, type Command } from "@shared/schema";

class BotManager {
  public client: Client | null = null;
  private intervals: NodeJS.Timeout[] = [];

  async start(token: string) {
    if (this.client) {
      this.stop();
    }
    
    this.client = new Client({ checkUpdate: false } as any);

    this.client.on('ready', async () => {
      console.log(`Self-bot logged in as ${this.client?.user?.tag}!`);
      await storage.updateConfigStatus(true, null);
      this.reloadCommands();
    });

    this.client.on('messageCreate', async (msg) => {
      if (msg.author.id === this.client?.user?.id) return;
      this.handleMessage(msg);
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

  async executeCommandActions(cmd: Command) {
    if (!this.client || !this.client.isReady()) return;
    
    try {
      const channel = await this.client.channels.fetch(cmd.channelId);
      if (channel && (channel.isText() || (channel as any).type === 'GUILD_TEXT' || (channel as any).type === 'DM')) {
        const actions = (cmd.actions && cmd.actions.length > 0 ? cmd.actions : [{ type: 'message', value: cmd.name }]) as any[];
        
        for (const action of actions) {
          if (action.type === 'wait') {
            const delay = action.delay || parseInt(action.value) || 1000;
            await new Promise(r => setTimeout(r, delay));
            continue;
          }

          const content = action.value;
          try {
            if (content.startsWith('/')) {
              const args = content.substring(1).split(' ');
              const commandName = args.shift()!;
              const targetId = cmd.targetBotId;
              if (!targetId) {
                throw new Error("Target Bot ID is required for slash commands (e.g. /ping)");
              }
              await (channel as any).sendSlash(targetId, commandName, args.join(' '));
            } else {
              await (channel as any).send(content);
            }
          } catch (e) {
            console.error(`Failed to execute action "${content}" for command ${cmd.name}:`, e);
          }
          
          if (actions.indexOf(action) < actions.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    } catch (e) {
      console.error(`General failure in executeCommandActions for ${cmd.name}:`, e);
    }
  }

  private async handleMessage(msg: any) {
    const commands = await storage.getCommands();
    for (const cmd of commands) {
      if (!cmd.isActive || cmd.conditionType !== 'message') continue;
      
      try {
        const filter = JSON.parse(cmd.conditionValue);
        const matchesUser = !filter.userId || msg.author.id === filter.userId;
        
        let matchesContent = true;
        if (filter.content) {
          if (filter.matchType === 'exact') {
            matchesContent = msg.content === filter.content;
          } else if (filter.matchType === 'startsWith') {
            matchesContent = msg.content.startsWith(filter.content);
          } else {
            matchesContent = msg.content.includes(filter.content);
          }
        }
        
        if (matchesUser && matchesContent) {
          await this.executeCommandActions(cmd);
        }
      } catch (e) {
        // Silently ignore invalid JSON or match errors
      }
    }
  }

  async reloadCommands() {
    if (!this.client || !this.client.isReady()) return;
    this.clearIntervals();
    
    const commands = await storage.getCommands();
    for (const cmd of commands) {
      if (!cmd.isActive || cmd.conditionType !== 'interval') continue;
      
      const minutes = parseInt(cmd.conditionValue, 10);
      if (isNaN(minutes) || minutes <= 0) continue;
      
      const interval = setInterval(() => this.executeCommandActions(cmd), minutes * 60 * 1000);
      this.intervals.push(interval);
    }
  }
}

export const botManager = new BotManager();

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
