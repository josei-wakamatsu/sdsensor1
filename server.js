const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3095;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ✅ CORS 設定
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

// ✅ CORS エラーデバッグ用ログ
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

// 熱量計算関数
function calculateEnergy(tempDiff, flow) {
  const specificHeat = 4.186; // 水の比熱 (kJ/kg・℃)
  const density = 1000; // 水の密度 (kg/m³)
  return tempDiff * flow * density * specificHeat; // kJ
}

// 料金計算関数
function calculateCost(energy_kJ) {
  const kWh = energy_kJ / 3600; // kJ → kWh
  return {
    electricity: (kWh * unitCosts.electricity).toFixed(2),
    gas: (kWh * unitCosts.gas).toFixed(2),
    kerosene: (kWh * unitCosts.kerosene).toFixed(2),
    heavy_oil: (kWh * unitCosts.heavy_oil).toFixed(2),
  };
}

// ✅ **リアルタイムの熱量と料金取得**
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
    const tempDiff = latestData.tempC4 - latestData.tempC3; // 排水温度差
    const flow = latestData.Flow1;
    const energy = calculateEnergy(tempDiff, flow);
    const cost = calculateCost(energy);

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
      energy: energy.toFixed(2),
      unitCosts,
      cost,
    });
  } catch (error) {
    console.error("Error fetching realtime data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// ✅ **過去1日の熱量・料金合計**
app.get("/api/daily", async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    const database = client.database(databaseId);
    const container = database.container(containerId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setDate(now.getDate() - 1);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const querySpec = {
      query: `SELECT * FROM c WHERE c.device = @deviceId AND c.time >= @startOfDay AND c.time <= @endOfDay ORDER BY c.time DESC`,
      parameters: [
        { name: "@deviceId", value: DEVICE_ID },
        { name: "@startOfDay", value: startOfDay.toISOString() },
        { name: "@endOfDay", value: endOfDay.toISOString() },
      ],
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    if (items.length === 0) {
      return res.status(404).json({ error: "No data found for the day" });
    }

    // 1日分の熱量合計
    const totalEnergy = items.reduce((sum, data) => {
      const tempDiff = data.tempC4 - data.tempC3;
      const flow = data.Flow1;
      return sum + calculateEnergy(tempDiff, flow);
    }, 0);

    const totalCost = calculateCost(totalEnergy);
    
    // 年間コストメリット計算
    const yearlySavings = {
      "240 days": {
        electricity: (totalCost.electricity * 240).toFixed(2),
        gas: (totalCost.gas * 240).toFixed(2),
        kerosene: (totalCost.kerosene * 240).toFixed(2),
        heavy_oil: (totalCost.heavy_oil * 240).toFixed(2),
      },
      "300 days": {
        electricity: (totalCost.electricity * 300).toFixed(2),
        gas: (totalCost.gas * 300).toFixed(2),
        kerosene: (totalCost.kerosene * 300).toFixed(2),
        heavy_oil: (totalCost.heavy_oil * 300).toFixed(2),
      },
      "365 days": {
        electricity: (totalCost.electricity * 365).toFixed(2),
        gas: (totalCost.gas * 365).toFixed(2),
        kerosene: (totalCost.kerosene * 365).toFixed(2),
        heavy_oil: (totalCost.heavy_oil * 365).toFixed(2),
      },
    };

    res.status(200).json({
      device: DEVICE_ID,
      totalEnergy: totalEnergy.toFixed(2),
      totalCost,
      yearlySavings,
    });
  } catch (error) {
    console.error("Error fetching daily data:", error);
    res.status(500).json({ error: "Failed to fetch daily data" });
  }
});

// ✅ **OPTIONSリクエスト対応**
app.options("*", cors());

// ✅ **CORSデバッグ用**
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});
