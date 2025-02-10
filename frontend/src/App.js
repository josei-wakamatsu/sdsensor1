import React, { useState, useEffect } from "react";

const API_BASE_URL = "https://sdsensor1.onrender.com"; // 🔹 バックエンドのURL
const DEVICE_IDS = ["hainetsukaishu-demo1", "hainetsukaishu-demo2", "takahashigarilei", "kurodasika"]; // 🔹 4つのデバイスIDを定義

export default function App() {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [deviceData, setDeviceData] = useState(null);
  const [costs, setCosts] = useState({ realTime: null, hour: null, day: null, future: {} });

  console.log("Available Device IDs:", DEVICE_IDS); // ✅ デバイスリストをデバッグ

  // 🔹 選択したデバイスの情報を取得
  useEffect(() => {
    if (!selectedDevice) return;

    console.log("Fetching data for:", selectedDevice); // ✅ 選択されたデバイスをデバッグ

    // 📌 温度データ取得
    fetch(`${API_BASE_URL}/api/data/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Received device data:", data); // ✅ データをデバッグ
        setDeviceData(data || "データなし");
      })
      .catch((err) => {
        console.error("Error fetching device data:", err);
        setDeviceData("データなし");
      });

    // 📌 コスト情報取得
    fetch(`${API_BASE_URL}/api/price/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => setCosts((prev) => ({ ...prev, realTime: data?.price ?? "データなし" })))
      .catch((err) => {
        console.error("Error fetching real-time price:", err);
        setCosts((prev) => ({ ...prev, realTime: "データなし" }));
      });

    fetch(`${API_BASE_URL}/api/price/hour/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => setCosts((prev) => ({ ...prev, hour: data?.totalPrice ?? "データなし" })))
      .catch((err) => {
        console.error("Error fetching hourly price:", err);
        setCosts((prev) => ({ ...prev, hour: "データなし" }));
      });

    fetch(`${API_BASE_URL}/api/price/day/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => {
        const dailyCost = data?.totalPrice ?? "データなし";
        setCosts((prev) => ({
          ...prev,
          day: dailyCost,
          future: {
            day200: dailyCost !== "データなし" ? (dailyCost * 200).toFixed(2) : "データなし",
            day300: dailyCost !== "データなし" ? (dailyCost * 300).toFixed(2) : "データなし",
            day365: dailyCost !== "データなし" ? (dailyCost * 365).toFixed(2) : "データなし",
          },
        }));
      })
      .catch((err) => {
        console.error("Error fetching daily price:", err);
        setCosts((prev) => ({
          ...prev,
          day: "データなし",
          future: { day200: "データなし", day300: "データなし", day365: "データなし" },
        }));
      });
  }, [selectedDevice]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>株式会社ショウワ　排熱回収システム モニタリング</h1>

      {/* 🔹 デバイス選択 */}
      <label>デバイスを選択:</label>
      <select
        onChange={(e) => {
          console.log("Selected Device:", e.target.value); // ✅ 選択されたデバイスをデバッグ
          setSelectedDevice(e.target.value);
        }}
      >
        <option value="">選択してください</option>
        {DEVICE_IDS.map((device, index) => (
          <option key={index} value={device}>
            {device}
          </option>
        ))}
      </select>

      {/* 🔹 データ表示 */}
      {selectedDevice && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
          <h3>📡 {selectedDevice} のデータ</h3>
          {deviceData === "データなし" ? (
            <p>データなし</p>
          ) : (
            <>
              <p>📅 取得時刻: {deviceData.time}</p>

              {/* 🔥 温度情報 */}
              <h4>🌡️ 温度データ</h4>
              <p>tempC1: {deviceData.tempC?.[0] ?? "データなし"}°C</p>
              <p>tempC2: {deviceData.tempC?.[1] ?? "データなし"}°C</p>

              {/* 💰 コスト情報 */}
              <h4>💰 コスト情報</h4>
              <p>🔸 リアルタイムのコスト: ¥{costs.realTime}</p>
              <p>🔸 過去1時間のコスト合計: ¥{costs.hour}</p>
              <p>🔸 過去1日のコスト合計: ¥{costs.day}</p>

              {/* 📊 予測コスト */}
              <h4>📊 予測コスト</h4>
              <p>200日: ¥{costs.future.day200}</p>
              <p>300日: ¥{costs.future.day300}</p>
              <p>365日: ¥{costs.future.day365}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
