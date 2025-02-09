import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function App() {
  const [latestData, setLatestData] = useState({ tempC1: 0, vReal1: 0 });
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState("");

  const backendUrl = "https://hainetukaishusouti.onrender.com";
  const deviceId = "SDsensor-demo1"; // デバイスIDを修正

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/data/${deviceId}`);
        const data = response.data;

        if (data && data.tempC1 !== undefined && data.vReal1 !== undefined) {
          setLatestData({ tempC1: data.tempC1, vReal1: data.vReal1 });

          // グラフデータを更新
          setChartData((prevData) => [...prevData.slice(-19), { time: new Date().toLocaleTimeString(), ...data }]);
        } else {
          throw new Error("無効なデータを受信しました。");
        }
        setError("");
      } catch (error) {
        console.error("データ取得エラー:", error);
        setError("データの取得に失敗しました (前回のデータを表示中)");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [backendUrl, deviceId]);

  return (
    <div>
      <h1>ショウワ　SDセンサ</h1>
      <h2>現在の振動データ＆温度データ</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        <h2>最新データ</h2>
        <p><strong>温度 (°C):</strong> {latestData.tempC1} °C</p>
        <p><strong>振動 (Hz):</strong> {latestData.vReal1} Hz</p>
      </div>
      <h2>現在のデータグラフ</h2>
      <ResponsiveContainer width="90%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="tempC1" stroke="#8884d8" name="温度 (°C)" />
          <Line type="monotone" dataKey="vReal1" stroke="#82ca9d" name="振動 (Hz)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
