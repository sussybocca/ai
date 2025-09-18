import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateText } from "./services/gemini";
import { insertMessageSchema, promptSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate AI text endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = promptSchema.parse(req.body);
      
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ 
          error: "Prompt is required and cannot be empty" 
        });
      }

      if (prompt.length > 2000) {
        return res.status(400).json({ 
          error: "Prompt exceeds maximum length of 2000 characters" 
        });
      }

      const response = await generateText(prompt);
      
      // Store the message in memory
      const message = await storage.createMessage({
        prompt: prompt.trim(),
        response: response.trim()
      });

      res.json({
        id: message.id,
        prompt: message.prompt,
        response: message.response,
        createdAt: message.createdAt,
        tokens: Math.floor(response.length / 4) // Rough estimate
      });
    } catch (error: any) {
      console.error("Generate endpoint error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid request format",
          details: error.errors
        });
      }
      
      res.status(500).json({
        error: error.message || "Failed to generate AI response"
      });
    }
  });

  // Get message history
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error: any) {
      console.error("Messages endpoint error:", error);
      res.status(500).json({
        error: "Failed to retrieve messages"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
