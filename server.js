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

// **対象のデバイスリスト**
const DEVICE_IDS = [
  "hainetsukaishu-demo1",
  "hainetsukaishu-demo2",
  "hainetsukaishu-demo3",
  "hainetsukaishu-demo4",
  "hainetsukaishu-demo5"
];

// **熱量計算関数**
function calculatePrice(tempDiff, flow, unitPrice) {
  const specificHeat = 4.186; // 水の比熱 (kJ/kg・℃)
  const density = 1000; // 水の密度 (kg/m³)

  const energy_kJ = tempDiff * flow * density * specificHeat;
  return energy_kJ * unitPrice / 3600; // kJ → kWh
}

// ✅ **1. 特定の deviceId のリアルタイム価格を取得**
app.get("/api/price/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const unitPrice = 0.1; // **1kWh あたりの単価（仮）**

  if (!DEVICE_IDS.includes(deviceId)) {
    return res.status(400).json({ error: "Invalid deviceId" });
  }

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
    const tempDiff = latestData.tempC4 - latestData.tempC3;
    const flow = latestData.Flow1;
    const price = calculatePrice(tempDiff, flow, unitPrice);

    res.status(200).json({
      device: deviceId,
      time: latestData.time,
      price: price.toFixed(2)
    });
  } catch (error) {
    console.error("Error fetching latest price:", error);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

// ✅ **2. 過去1時間の合計価格を取得**
app.get("/api/price/hour/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const unitPrice = 0.1;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  if (!DEVICE_IDS.includes(deviceId)) {
    return res.status(400).json({ error: "Invalid deviceId" });
  }

  try {
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const querySpec = {
      query: `SELECT * FROM c WHERE c.device = @deviceId AND c.time >= @oneHourAgo ORDER BY c.time DESC`,
      parameters: [
        { name: "@deviceId", value: deviceId },
        { name: "@oneHourAgo", value: oneHourAgo }
      ],
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    const totalPrice = items.reduce((sum, data) => {
      const tempDiff = data.tempC4 - data.tempC3;
      const flow = data.Flow1;
      return sum + calculatePrice(tempDiff, flow, unitPrice);
    }, 0);

    res.status(200).json({ device: deviceId, totalPrice: totalPrice.toFixed(2) });
  } catch (error) {
    console.error("Error fetching hourly price:", error);
    res.status(500).json({ error: "Failed to fetch hourly price" });
  }
});

// ✅ **3. 過去1日の合計価格を取得**
app.get("/api/price/day/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const unitPrice = 0.1;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  if (!DEVICE_IDS.includes(deviceId)) {
    return res.status(400).json({ error: "Invalid deviceId" });
  }

  try {
    const database = client.database(databaseId);
    const container = database.container(containerId);
    const querySpec = {
      query: `SELECT * FROM c WHERE c.device = @deviceId AND c.time >= @oneDayAgo ORDER BY c.time DESC`,
      parameters: [
        { name: "@deviceId", value: deviceId },
        { name: "@oneDayAgo", value: oneDayAgo }
      ],
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    const totalPrice = items.reduce((sum, data) => {
      const tempDiff = data.tempC4 - data.tempC3;
      const flow = data.Flow1;
      return sum + calculatePrice(tempDiff, flow, unitPrice);
    }, 0);

    res.status(200).json({ device: deviceId, totalPrice: totalPrice.toFixed(2) });
  } catch (error) {
    console.error("Error fetching daily price:", error);
    res.status(500).json({ error: "Failed to fetch daily price" });
  }
});
