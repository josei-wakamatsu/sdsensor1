import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl = "https://sdsensor1.onrender.com";

const App = () => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [unitCosts, setUnitCosts] = useState({
    electricity: 30,
    gas: 20,
    kerosene: 15,
    heavy_oil: 10,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/realtime`);
        setRealTimeData(response.data);
        setError(null);
      } catch (error) {
        setRealTimeData(null);
        setError("データの取得に失敗しました。");
      }
    };
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateEnergy = (supplyTemp, dischargeTemp, flow) => {
    const specificHeat = 4.186;
    const density = 1000;
    return (supplyTemp - dischargeTemp) * flow * density * specificHeat;
  };

  const calculateCost = (energy_kJ) => {
    const kWh = energy_kJ / 3600;
    return {
      electricity: (kWh * unitCosts.electricity).toFixed(2),
      gas: (kWh * unitCosts.gas).toFixed(2),
      kerosene: (kWh * unitCosts.kerosene).toFixed(2),
      heavy_oil: (kWh * unitCosts.heavy_oil).toFixed(2),
    };
  };

  const handleUnitCostChange = (e) => {
    setUnitCosts({ ...unitCosts, [e.target.name]: e.target.value });
  };

  let energy = 0, cost = {};
  if (realTimeData) {
    energy = calculateEnergy(realTimeData.temperature.supply1, realTimeData.temperature.discharge1, realTimeData.flow);
    cost = calculateCost(energy);
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      <h1 className="text-2xl font-bold text-center mb-6">排熱回収システム</h1>

      {/* 単価入力 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.keys(unitCosts).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-gray-700">{key} (円/kWh)</label>
            <input
              type="number"
              name={key}
              value={unitCosts[key]}
              onChange={handleUnitCostChange}
              className="border rounded p-2"
            />
          </div>
        ))}
      </div>

      {/* 計算結果 */}
      {realTimeData && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">計算結果</h2>
          <p>熱量: {energy.toFixed(2)} kJ</p>
          <p>電気代: {cost.electricity} 円</p>
          <p>ガス代: {cost.gas} 円</p>
          <p>灯油代: {cost.kerosene} 円</p>
          <p>重油代: {cost.heavy_oil} 円</p>
        </div>
      )}
    </div>
  );
};

export default App;
