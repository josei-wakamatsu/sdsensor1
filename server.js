const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const cors = require("cors");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const PORT = 3099;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const wss = new WebSocket.Server({ server });

// Cosmos DB 接続情報
const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルートエンドポイント
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// 最新データの取得 (deviceId を "SDsensor-demo1" に変更)
app.get("/api/data/SDsensor-demo1", async (req, res) => {
  try {
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const querySpec = {
      query: `SELECT TOP 1 * FROM c WHERE c.device = @deviceId ORDER BY c.time DESC`,
      parameters: [{ name: "@deviceId", value: "SDsensor-demo1" }],
    };
    
    const { resources: items } = await container.items.query(querySpec).fetchAll();
    if (items.length === 0) {
      return res.status(404).json({ error: `No data found for deviceId: SDsensor-demo1` });
    }
    res.status(200).json(items[0]);
  } catch (error) {
    console.error("Error fetching latest data:", error);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
});

// WebSocket 通信
wss.on("connection", (ws) => {
  console.log("WebSocket connected");
  setInterval(async () => {
    try {
      const database = client.database(databaseId);
      const container = database.container(containerId);
      const querySpec = {
        query: `SELECT TOP 1 * FROM c WHERE c.device = @deviceId ORDER BY c.time DESC`,
        parameters: [{ name: "@deviceId", value: "SDsensor-demo1" }],
      };
      
      const { resources: items } = await container.items.query(querySpec).fetchAll();
      if (items.length > 0) {
        ws.send(JSON.stringify(items[0]));
      }
    } catch (error) {
      console.error("WebSocket Error:", error);
    }
  }, 1000);
  
  ws.on("close", () => {
    console.log("WebSocket disconnected");
  });
});
