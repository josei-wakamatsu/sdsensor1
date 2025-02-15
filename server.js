const express = require("express");
const { CosmosClient } = require("@azure/cosmos");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3095;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Cosmos DB 接続情報
const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.DATABASE_ID;
const containerId = process.env.CONTAINER_ID;

// ミドルウェア
app.use(cors());
app.use(express.json());

// 固定デバイス ID
const DEVICE_ID = "hainetsukaishu-demo1";

// 熱量計算関数
function calculateEnergy(tempDiff, flow) {
  const specificHeat = 4.186; // 水の比熱 (kJ/kg・℃)
  const density = 1000; // 水の密度 (kg/m³)

  return tempDiff * flow * density * specificHeat; // kJ
}

// 料金計算関数（電気代・ガス代・灯油代）
function calculateCost(energy_kJ) {
  const kWh = energy_kJ / 3600; // kJ → kWh

  return {
    electricity: kWh * 30, // 30円/kWh
    gas: kWh * 20, // 20円/kWh
    kerosene: kWh * 15, // 15円/kWh
    heavy_oil: kWh * 10, // 10円/kWh
  };
}

// ✅ **リアルタイムの熱量と料金取得**
app.get("/api/realtime", async (req, res) => {
  try {
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
    const tempDiff = latestData.tempC4 - latestData.tempC3;
    const flow = latestData.Flow1;
    const energy = calculateEnergy(tempDiff, flow);
    const cost = calculateCost(energy);

    res.status(200).json({
      device: DEVICE_ID,
      time: latestData.time,
      temperature: {
        tempC1: latestData.tempC1,
        tempC2: latestData.tempC2,
        tempC3: latestData.tempC3,
        tempC4: latestData.tempC4,
      },
      flow: latestData.Flow1,
      energy: energy.toFixed(2),
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

    const totalEnergy = items.reduce((sum, data) => {
      const tempDiff = data.tempC4 - data.tempC3;
      const flow = data.Flow1;
      return sum + calculateEnergy(tempDiff, flow);
    }, 0);

    const totalCost = calculateCost(totalEnergy);

    res.status(200).json({
      device: DEVICE_ID,
      totalEnergy: totalEnergy.toFixed(2),
      totalCost,
    });
  } catch (error) {
    console.error("Error fetching daily data:", error);
    res.status(500).json({ error: "Failed to fetch daily data" });
  }
});

// サーバー動作確認エンドポイント
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running!" });
});
