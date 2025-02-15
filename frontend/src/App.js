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
      <h1 className="text-2xl font-bold text-center mb-4">熱回収システム ダッシュボード</h1>

      {/* ✅ リアルタイムデータ表示 */}
      {realTimeData && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">リアルタイムデータ</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-md shadow">
              <h3 className="text-gray-700">給水1</h3>
              <p className="text-xl font-bold">{realTimeData.temperature.supply1} °C</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow">
              <h3 className="text-gray-700">給水2</h3>
              <p className="text-xl font-bold">{realTimeData.temperature.supply2} °C</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow">
              <h3 className="text-gray-700">排水1</h3>
              <p className="text-xl font-bold">{realTimeData.temperature.discharge1} °C</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow">
              <h3 className="text-gray-700">排水2</h3>
              <p className="text-xl font-bold">{realTimeData.temperature.discharge2} °C</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow col-span-2">
              <h3 className="text-gray-700">流量</h3>
              <p className="text-xl font-bold">{realTimeData.flow} L/min</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow col-span-2">
              <h3 className="text-gray-700">現在の熱量</h3>
              <p className="text-xl font-bold">{realTimeData.energy} kJ</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 料金単価表示 */}
      {realTimeData && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">料金単価</h2>
          <ul className="list-disc pl-4">
            <li>電気代: {realTimeData.unitCosts.electricity} 円/kWh</li>
            <li>ガス代: {realTimeData.unitCosts.gas} 円/kWh</li>
            <li>灯油代: {realTimeData.unitCosts.kerosene} 円/kWh</li>
            <li>重油代: {realTimeData.unitCosts.heavy_oil} 円/kWh</li>
          </ul>
        </div>
      )}

      {/* ✅ 1日のデータ表示 */}
      {dailyData && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">過去1日の合計</h2>
          <p className="text-center">合計熱量: {dailyData.totalEnergy} kJ</p>
          <ul className="list-disc pl-4">
            <li>電気代: {dailyData.totalCost.electricity} 円</li>
            <li>ガス代: {dailyData.totalCost.gas} 円</li>
            <li>灯油代: {dailyData.totalCost.kerosene} 円</li>
            <li>重油代: {dailyData.totalCost.heavy_oil} 円</li>
          </ul>
        </div>
      )}

      {/* ✅ 年間コストメリット */}
      {dailyData && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">年間コストメリット</h2>
          <div className="grid grid-cols-3 gap-4">
            {["240 days", "300 days", "365 days"].map((days) => (
              <div key={days} className="bg-white p-4 rounded-md shadow text-center">
                <h3 className="text-gray-700">{days}</h3>
                <ul className="list-none">
                  <li>電気代: {dailyData.yearlySavings[days].electricity} 円</li>
                  <li>ガス代: {dailyData.yearlySavings[days].gas} 円</li>
                  <li>灯油代: {dailyData.yearlySavings[days].kerosene} 円</li>
                  <li>重油代: {dailyData.yearlySavings[days].heavy_oil} 円</li>
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
