import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl = "https://sdsensor1.onrender.com";

const App = () => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [yesterdayCost, setYesterdayCost] = useState(null);

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

    const fetchYesterdayCost = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/yesterday-cost`);
        setYesterdayCost(response.data);
      } catch (error) {
        console.error("昨日のコストデータの取得に失敗しました:", error);
      }
    };

    fetchRealTimeData();
    fetchDailyData();
    fetchYesterdayCost();
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
          <div className="grid grid-cols-5 gap-4 text-center">
            {Object.entries(realTimeData.temperature || {}).map(([key, value]) => (
              <div key={key} className="bg-white p-4 rounded-md shadow w-48">
                <h3 className="text-gray-700">{key}</h3>
                <p className="text-xl font-bold">{value ?? "N/A"} °C</p>
              </div>
            ))}
            <div className="bg-white p-4 rounded-md shadow w-48">
              <h3 className="text-gray-700">流量</h3>
              <p className="text-xl font-bold">{realTimeData?.flow ?? "N/A"} L/min</p>
            </div>
          </div>
        </div>
      )}
      {/* ✅ 昨日のコスト */}
      {yesterdayCost && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">昨日のコスト</h2>
          <div className="grid grid-cols-1 gap-4 text-center">
            <ul className="list-none">
              <li>電気代: {yesterdayCost?.electricity ?? 0} 円</li>
              <li>ガス代: {yesterdayCost?.gas ?? 0} 円</li>
              <li>灯油代: {yesterdayCost?.kerosene ?? 0} 円</li>
              <li>重油代: {yesterdayCost?.heavy_oil ?? 0} 円</li>
            </ul>
          </div>
        </div>
      )}

      {/* ✅ 年間コストメリット（横並び） */}
      {dailyData && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">年間コストメリット</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {["240", "300", "365"].map((days) => (
              <div key={days} className="bg-white p-4 rounded-md shadow w-60">
                <h3 className="text-gray-700">{days} 日</h3>
                <ul className="list-none">
                  <li>電気代: {dailyData?.yearlySavings?.[days]?.electricity ?? 0} 円</li>
                  <li>ガス代: {dailyData?.yearlySavings?.[days]?.gas ?? 0} 円</li>
                  <li>灯油代: {dailyData?.yearlySavings?.[days]?.kerosene ?? 0} 円</li>
                  <li>重油代: {dailyData?.yearlySavings?.[days]?.heavy_oil ?? 0} 円</li>
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
