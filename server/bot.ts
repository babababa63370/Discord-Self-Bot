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
      console.log(`[SUCCESS] Connecté en tant que ${this.client?.user?.tag}`);
      await storage.updateConfigStatus(true, null);
      this.reloadCommands();
    });

    this.client.on('messageCreate', async (msg) => {
      // On n'ignore plus systématiquement l'auteur pour pouvoir lancer le !+test soi-même
      this.handleMessage(msg);
    });

    try {
      await this.client.login(token);
    } catch (err: any) {
      console.error("[ERROR] Login failed:", err);
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
      if (channel && (channel.isText() || (channel as any).type === 'GUILD_TEXT')) {

        const actions = (cmd.actions && cmd.actions.length > 0 
          ? cmd.actions 
          : [{ type: 'message', value: cmd.name }]) as any[];

        for (const action of actions) {
          if (action.type === 'wait') {
            const delay = action.delay || parseInt(action.value) || 1000;
            await new Promise(r => setTimeout(r, delay));
            continue;
          }

          let content = action.value;
          try {
            if (content.startsWith('/')) {
              const argsArray = content.substring(1).split(' ');
              const commandName = argsArray.shift()!;
              const targetId = cmd.targetBotId;

              if (!targetId) throw new Error("Target Bot ID manquant");

              // Correction pour éviter l'erreur "Value outside range (0)"
              let finalArgs = argsArray.join(' ').trim();
              if (commandName.includes('top') && (finalArgs === "" || finalArgs === "0")) {
                finalArgs = "1"; 
              }

              await (channel as any).sendSlash(targetId, commandName, finalArgs);
              console.log(`[/] Action Slash: /${commandName} ${finalArgs}`);

            } else {
              await (channel as any).send(content);
              console.log(`[MSG] Action Message: ${content}`);
            }
          } catch (e) {
            console.error(`[ERROR] Action failed (${content}):`, e);
          }

          if (actions.indexOf(action) < actions.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
    } catch (e) {
      console.error(`[ERROR] Global failure for ${cmd.name}:`, e);
    }
  }

  private async handleMessage(msg: any) {
    const commands = await storage.getCommands();

    // --- NOUVEAU : Commande de test manuel !+test [id] ---
    if (msg.content.startsWith('!+test')) {
      const argId = msg.content.split(' ')[1];
      if (argId) {
        const targetCmd = commands.find(c => c.id === parseInt(argId));
        if (targetCmd) {
          console.log(`[TEST] Lancement manuel de la commande ID: ${argId}`);
          await this.executeCommandActions(targetCmd);
          return;
        }
      }
    }

    // --- Logique habituelle de réponse aux messages ---
    if (msg.author.id === this.client?.user?.id) return;

    for (const cmd of commands) {
      if (!cmd.isActive || cmd.conditionType !== 'message') continue;

      try {
        const filter = JSON.parse(cmd.conditionValue);
        // Vérifie si le message vient du bon salon configuré
        if (msg.channelId !== cmd.channelId) continue;

        const matchesUser = !filter.userId || msg.author.id === filter.userId;
        let matchesContent = true;
        if (filter.content) {
          matchesContent = filter.matchType === 'exact' 
            ? msg.content === filter.content 
            : msg.content.includes(filter.content);
        }

        if (matchesUser && matchesContent) {
          await this.executeCommandActions(cmd);
        }
      } catch (e) {}
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
    if (config?.isActive && config.token) botManager.start(config.token);
  } catch (e) {}
}, 1000);