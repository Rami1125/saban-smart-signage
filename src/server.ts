// ============================================================================
// Server: Express / Bun Local Backend for Webhook & AI SDK Transport
// Version: 3.0.0
// ============================================================================

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "saban-ai-brain", version: "3.0.0" });
});

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { sku } = req.body;
    res.json({
      role: "assistant",
      content: `שלום! כאן נועה מסבן ❤️. קיבלתי את פנייתך לגבי פריט ${sku || "כללי"}. במה נוכל לסייע?`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sheets-sync", async (req: Request, res: Response) => {
  try {
    res.json({ status: "success", received: req.body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SabanOS Unified Brain Server running on port ${PORT}`);
});
