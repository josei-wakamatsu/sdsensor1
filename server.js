const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3095;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// フロントエンドのURLを許可
const allowedOrigins = [
  "https://sdsensor-hainetsukaishu.onrender.com", // フロントエンドのURL
  "http://localhost:5173", // ローカル開発用
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ CORSエラーチェックのためのログ
app.use((req, res, next) => {
  console.log(`CORS Request from: ${req.headers.origin}`);
  next();
});

// Cosmos DB 接続情報
const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

// 固定デバイス ID
const DEVICE_ID = "hainetsukaishu-demo1";

// 単価（円/kWh）
const unitCosts = {
  electricity: 30, // 電気代
  gas: 20,         // ガス代
  kerosene: 15,    // 灯油代
  heavy_oil: 10,   // 重油代
};

// ✅ **リアルタイムデータ取得API**
app.get("/api/realtime", async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    const database = client.database(databaseId);
    const container = database.container(containerId);

    const querySpec = {
      query: `SELECT TOP 1 * FROM c WHERE c.device = @deviceId ORDER BY c.time DESC`,
      parameters: [{ name: "@deviceId", value: DEVICE_ID }],
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    if (items.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    const latestData = items[0];
    res.status(200).json({
      device: DEVICE_ID,
      time: latestData.time,
      temperature: {
        supply1: latestData.tempC1,
        supply2: latestData.tempC2,
        discharge1: latestData.tempC3,
        discharge2: latestData.tempC4,
      },
      flow: latestData.Flow1,
      energy: "0.00",
      unitCosts,
      cost: { electricity: "0.00", gas: "0.00", kerosene: "0.00", heavy_oil: "0.00" },
    });
  } catch (error) {
    console.error("Error fetching realtime data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// ✅ **過去1日のデータ取得API**
app.get("/api/daily", async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.status(200).json({
      device: DEVICE_ID,
      totalEnergy: "0.00",
      totalCost: { electricity: "0.00", gas: "0.00", kerosene: "0.00", heavy_oil: "0.00" },
      yearlySavings: { "240 days": {}, "300 days": {}, "365 days": {} },
    });
  } catch (error) {
    console.error("Error fetching daily data:", error);
    res.status(500).json({ error: "Failed to fetch daily data" });
  }
});

// ✅ **オプションリクエスト対応**
app.options("*", cors());

// ✅ **CORSデバッグ用**
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});
