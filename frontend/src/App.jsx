import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl = "https://sdsensor1.onrender.com";

const App = () => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [dailyData, setDailyData] = useState(null);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/realtime`);
        setRealTimeData(response.data);
      } catch (error) {
        console.error("リアルタイムデータの取得に失敗しました:", error);
      }
    };

    const fetchDailyData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/daily`);
        setDailyData(response.data);
      } catch (error) {
        console.error("1日のデータの取得に失敗しました:", error);
      }
    };

    fetchRealTimeData();
    fetchDailyData();
    const interval = setInterval(fetchRealTimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white p-6">
      <h1 className="text-2xl font-bold text-center mb-4">排熱回収システム</h1>

      {/* ✅ リアルタイムデータ表示（横並び） */}
      {realTimeData && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">リアルタイムデータ</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            {["supply1", "supply2", "discharge1", "discharge2"].map((key, index) => (
              <div key={index} className="bg-white p-4 rounded-md shadow w-48">
                <h3 className="text-gray-700">{key.includes("supply") ? `給水${index + 1}` : `排水${index - 1}`}</h3>
                <p className="text-xl font-bold">{realTimeData?.temperature?.[key] ?? "N/A"} °C</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ 単価の表示 */}
      {dailyData && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">エネルギー単価</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            {["electricity", "gas", "kerosene", "heavy_oil"].map((key, index) => (
              <div key={index} className="bg-white p-4 rounded-md shadow w-48">
                <h3 className="text-gray-700">{key === "electricity" ? "電気代" : key === "gas" ? "ガス代" : key === "kerosene" ? "灯油代" : "重油代"}</h3>
                <p className="text-xl font-bold">{dailyData?.rates?.[key] ?? 0} {key === "electricity" ? "円/kWh" : "円/L"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ 昨日のコスト計算結果 */}
      {dailyData && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">昨日のコスト</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            {["electricity", "gas", "kerosene", "heavy_oil"].map((key, index) => (
              <div key={index} className="bg-white p-4 rounded-md shadow w-48">
                <h3 className="text-gray-700">{key === "electricity" ? "電気" : key === "gas" ? "ガス" : key === "kerosene" ? "灯油" : "重油"}</h3>
                <p className="text-xl font-bold">{dailyData?.cost?.[key] ?? 0} 円</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ 年間コストメリット */}
      {dailyData && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">年間コストメリット</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {["240", "300", "365"].map((days) => (
              <div key={days} className="bg-white p-4 rounded-md shadow w-60">
                <h3 className="text-gray-700">{days} 日</h3>
                <ul className="list-none">
                  {["electricity", "gas", "kerosene", "heavy_oil"].map((key) => (
                    <li key={key}>{key === "electricity" ? "電気代" : key === "gas" ? "ガス代" : key === "kerosene" ? "灯油代" : "重油代"}: {dailyData?.yearlySavings?.[days]?.[key] ?? 0} 円</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-500 text-sm text-center mt-10">© 2006-2025 株式会社 ショウワ 無断転載禁止。</p>
    </div>
  );
};

export default App;
