import { useState, useEffect } from 'react';
import axios from 'axios';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(PointElement, LinearScale, Title, Tooltip);

export default function Home() {
  const [sensitivity, setSensitivity] = useState(2.0);
  const [score, setScore] = useState(5);
  const [minSens, setMinSens] = useState(0.5);
  const [maxSens, setMaxSens] = useState(5.0);
  const [nextSens, setNextSens] = useState<number | null>(null);
  const [history, setHistory] = useState<{ sensitivity: number; score: number }[]>([]);

  const handleReset = async () => {
  try {
    await axios.post('http://localhost:8000/reset');
    setHistory([]);
    setNextSens(null);
    alert("履歴リセット完了");
  } catch (err) {
    alert("リセット失敗");
    console.error(err);
  }
};

  // 最初に履歴を取得
  useEffect(() => {
    axios.get('http://localhost:8000/history').then((res) => {
      setHistory(res.data);
    });
  }, []);

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:8000/suggest', {
        sensitivity,
        score,
        min_sens: minSens,
        max_sens: maxSens,
      });
      setNextSens(res.data.next_sensitivity);

      // 感度を送った直後に履歴を更新
      const historyRes = await axios.get('http://localhost:8000/history');
      setHistory(historyRes.data);
    } catch (err) {
      alert('API通信に失敗しました');
      console.error(err);
    }
  };

  // グラフ用データ定義
  const chartData = {
    datasets: [
      {
        label: '感度 vs スコア',
        data: history.map((h) => ({ x: h.sensitivity, y: h.score })),
        backgroundColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        title: { display: true, text: '感度' },
      },
      y: {
        title: { display: true, text: 'スコア' },
        min: 0,
        max: 10,
      },
    },
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🎮 感度くん</h1>

      <div>
        <label>最小感度: </label>
        <input
          type="number"
          value={minSens}
          onChange={(e) => setMinSens(parseFloat(e.target.value))}
        />
      </div>

      <div>
        <label>最大感度: </label>
        <input
          type="number"
          value={maxSens}
          onChange={(e) => setMaxSens(parseFloat(e.target.value))}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>今回使った感度: </label>
        <input
          type="number"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
        />
      </div>

      <div>
        <label>自己評価スコア（1〜10）: </label>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(parseFloat(e.target.value))}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSubmit}>次の感度を提案</button>
      </div>

      
      {nextSens !== null && !isNaN(nextSens) && (
         <div style={{ marginTop: 30 }}>
           <strong>💡 次に試すべき感度は: {nextSens.toFixed(3)}</strong>
         </div>
      )}

      {history.length > 0 && (
  <div style={{ marginTop: 40 }}>
    <h2>📜 入力履歴</h2>
    <ul>
      {history.map((item, index) => (
        <li key={index}>
          感度: {item.sensitivity.toFixed(3)} ／ スコア: {item.score}
        </li>
      ))}
    </ul>
  </div>
)}

      <div style={{ marginTop: 40 }}>
        <h2>📊 感度 vs スコア（履歴）</h2>
        <Scatter data={chartData} options={chartOptions} />
      </div>

      <button onClick={handleReset} style={{ marginTop: 20 }}>履歴リセット</button>
    </div>
  );
}
