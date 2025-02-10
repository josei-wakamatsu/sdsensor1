const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const cors = require("cors");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();
const PORT = 3098;
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

// 最新データの取得（deviceId を固定）
app.get("/api/data/takahashigarilei", async (req, res) => {
  const deviceId = "takahashigarilei";
  try {
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const querySpec = {
      query: `SELECT TOP 1 * FROM c WHERE c.device = @deviceId ORDER BY c.time DESC`,
      parameters: [{ name: "@deviceId", value: deviceId }],
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    if (items.length === 0) {
      return res.status(404).json({ error: `No data found for deviceId: ${deviceId}` });
    }

    const latestData = items[0];
    const responseData = {
      device: latestData.device,
      time: latestData.time,
      vReal: [latestData.vReal1, latestData.vReal2, latestData.vReal3, latestData.vReal4, latestData.vReal5, latestData.vReal6],
      tempC: [latestData.tempC1, latestData.tempC2, latestData.tempC3, latestData.tempC4, latestData.tempC5, latestData.tempC6],
      flow: [latestData.Flow1, latestData.Flow2]
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching latest data:", error);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
});

// WebSocket 通信
wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  ws.on("message", async () => {
    const deviceId = "kurodashika";
    try {
      const database = client.database(databaseId);
      const container = database.container(containerId);
      const querySpec = {
        query: `SELECT TOP 1 * FROM c WHERE c.device = @deviceId ORDER BY c.time DESC`,
        parameters: [{ name: "@deviceId", value: deviceId }],
      };

      const { resources: items } = await container.items.query(querySpec).fetchAll();
      if (items.length > 0) {
        const latestData = items[0];
        const responseData = {
          device: latestData.device,
          time: latestData.time,
          vReal: [latestData.vReal1, latestData.vReal2, latestData.vReal3, latestData.vReal4, latestData.vReal5, latestData.vReal6],
          tempC: [latestData.tempC1, latestData.tempC2, latestData.tempC3, latestData.tempC4, latestData.tempC5, latestData.tempC6],
          flow: [latestData.Flow1, latestData.Flow2]
        };
        ws.send(JSON.stringify(responseData));
      }
    } catch (error) {
      console.error("WebSocket Error:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected");
  });
});
