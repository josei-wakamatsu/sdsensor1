import React, { useState, useEffect } from "react";

const API_BASE_URL = "https://sdsensor1.onrender.com"; // 🔹 バックエンドのURL

export default function App() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [deviceData, setDeviceData] = useState(null);
  const [costs, setCosts] = useState({ realTime: 0, hour: 0, day: 0, future: {} });

  // 🔹 デバイスID一覧を取得
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/devices`)
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch((err) => console.error("Error fetching devices:", err));
  }, []);

  // 🔹 選択したデバイスの情報を取得
  useEffect(() => {
    if (!selectedDevice) return;

    // 📌 温度データ取得
    fetch(`${API_BASE_URL}/api/data/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => setDeviceData(data))
      .catch((err) => console.error("Error fetching device data:", err));

    // 📌 コスト情報取得
    fetch(`${API_BASE_URL}/api/price/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => setCosts((prev) => ({ ...prev, realTime: parseFloat(data.price) || 0 })))
      .catch((err) => console.error("Error fetching real-time price:", err));

    fetch(`${API_BASE_URL}/api/price/hour/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => setCosts((prev) => ({ ...prev, hour: parseFloat(data.totalPrice) || 0 })))
      .catch((err) => console.error("Error fetching hourly price:", err));

    fetch(`${API_BASE_URL}/api/price/day/${selectedDevice}`)
      .then((res) => res.json())
      .then((data) => {
        const dailyCost = parseFloat(data.totalPrice) || 0;
        setCosts((prev) => ({
          ...prev,
          day: dailyCost,
          future: {
            day200: (dailyCost * 200).toFixed(2),
            day300: (dailyCost * 300).toFixed(2),
            day365: (dailyCost * 365).toFixed(2),
          },
        }));
      })
      .catch((err) => console.error("Error fetching daily price:", err));
  }, [selectedDevice]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>🔥 廃熱回収システム モニタリング</h2>

      {/* 🔹 デバイス選択 */}
      <label>デバイスを選択:</label>
      <select onChange={(e) => setSelectedDevice(e.target.value)}>
        <option value="">選択してください</option>
        {devices.map((device, index) => (
          <option key={index} value={device}>
            {device}
          </option>
        ))}
      </select>

      {/* 🔹 データ表示 */}
      {selectedDevice && deviceData && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
          <h3>📡 {selectedDevice} のデータ</h3>
          <p>📅 取得時刻: {deviceData.time}</p>

          {/* 🔥 温度情報 */}
          <h4>🌡️ 温度データ</h4>
          <p>tempC1: {deviceData.tempC[0]}°C</p>
          <p>tempC2: {deviceData.tempC[1]}°C</p>
          <p>tempC3: {deviceData.tempC[2]}°C</p>
          <p>tempC4: {deviceData.tempC[3]}°C</p>

          {/* 💰 コスト情報 */}
          <h4>💰 コスト情報</h4>
          <p>🔸 リアルタイムのコスト: ¥{costs.realTime.toFixed(2)}</p>
          <p>🔸 過去1時間のコスト合計: ¥{costs.hour.toFixed(2)}</p>
          <p>🔸 過去1日のコスト合計: ¥{costs.day.toFixed(2)}</p>

          {/* 📊 予測コスト */}
          <h4>📊 予測コスト</h4>
          <p>200日: ¥{costs.future.day200}</p>
          <p>300日: ¥{costs.future.day300}</p>
          <p>365日: ¥{costs.future.day365}</p>
        </div>
      )}
    </div>
  );
}
