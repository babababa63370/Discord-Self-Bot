import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { botManager } from "./bot";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.config.get.path, async (req, res) => {
    const config = await storage.getConfig();
    res.json(config);
  });

  app.post(api.config.update.path, async (req, res) => {
    try {
      const input = api.config.update.input.parse(req.body);
      const config = await storage.updateConfig(input);
      res.json(config);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.post(api.config.toggle.path, async (req, res) => {
    try {
      const input = api.config.toggle.input.parse(req.body);
      let config = await storage.getConfig();
      if (!config || !config.token) {
        return res.status(400).json({ message: 'Token not configured' });
      }
      
      const updated = await storage.updateConfigStatus(input.isActive, null);
      if (input.isActive) {
        botManager.start(updated.token).catch(e => console.error(e));
      } else {
        botManager.stop();
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Internal error' });
    }
  });

  app.get(api.commands.list.path, async (req, res) => {
    const list = await storage.getCommands();
    res.json(list);
  });

  app.post(api.commands.create.path, async (req, res) => {
    try {
      const input = api.commands.create.input.parse(req.body);
      const cmd = await storage.createCommand(input);
      botManager.reloadCommands();
      res.status(201).json(cmd);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Internal error' });
    }
  });

  app.put(api.commands.update.path, async (req, res) => {
    try {
      const input = api.commands.update.input.parse(req.body);
      const cmd = await storage.updateCommand(Number(req.params.id), input);
      botManager.reloadCommands();
      res.json(cmd);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Internal error' });
    }
  });

  app.delete(api.commands.delete.path, async (req, res) => {
    await storage.deleteCommand(Number(req.params.id));
    botManager.reloadCommands();
    res.status(204).send();
  });

  app.post(api.commands.test.path, async (req, res) => {
    const cmd = (await storage.getCommands()).find(c => c.id === Number(req.params.id));
    if (!cmd) return res.status(404).json({ message: 'Command not found' });
    
    if (!botManager.client || !botManager.client.isReady()) {
      return res.status(400).json({ success: false, message: 'Bot not connected' });
    }
    
    try {
      await botManager.executeCommandActions(cmd);
      res.json({ success: true, message: 'Test executed' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  return httpServer;
}
