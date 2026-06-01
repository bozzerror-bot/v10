import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { COINS } from '../store/useAlexStore';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function Chart() {
  const nav = useNavigate();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('15m');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ price: 0, high: 0, low: 0, change: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const candleSeries = useRef<any>(null);
  const volSeries = useRef<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      if (!Array.isArray(data)) { setLoading(false); return; }
      const candles = data.map((d: any[]) => ({ time: d[0] / 1000, open: +d[1], high: +d[2], low: +d[3], close: +d[4] }));
      const volumes = data.map((d: any[]) => ({ time: d[0] / 1000, value: +d[5], color: +d[4] >= +d[1] ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)' }));
      if (chartInstance.current) chartInstance.current.remove();
      if (!chartRef.current) return;
      const chart = createChart(chartRef.current, { layout: { background: { type: ColorType.Solid, color: '#0a0a12' }, textColor: '#94a3b8' }, grid: { vertLines: { color: '#1a1a2e' }, horzLines: { color: '#1a1a2e' } }, width: chartRef.current.clientWidth, height: 400 });
      chartInstance.current = chart;
      candleSeries.current = chart.addSeries(CandlestickSeries, { upColor: '#22c55e', downColor: '#ef4444', borderUpColor: '#22c55e', borderDownColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444' });
      candleSeries.current.setData(candles);
      volSeries.current = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' });
      volSeries.current.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      volSeries.current.setData(volumes);
      chart.timeScale().fitContent();
      const sRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (sRes.ok) { const s = await sRes.json(); setStats({ price: +s.lastPrice, high: +s.highPrice, low: +s.lowPrice, change: +s.priceChangePercent }); }
    } catch {}
    setLoading(false);
  }, [symbol, interval]);

  useEffect(() => { loadData(); const iv = window.setInterval(() => { loadData(); }, 10000); return () => window.clearInterval(iv); }, [loadData]);

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0] p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => nav('/')} className="text-[#475569] hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <BarChart3 className="w-5 h-5 text-sky-400" /><h1 className="text-lg font-bold">Chart</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={symbol} onChange={e => setSymbol(e.target.value)} className="bg-[#0a0a12] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white">
          {COINS.map(c => <option key={c} value={c}>{c.replace('USDT', '')}</option>)}
        </select>
        {INTERVALS.map(iv => <button key={iv} onClick={() => setInterval(iv)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${interval === iv ? 'bg-sky-500 text-white' : 'bg-[#0a0a12] border border-white/[0.06] text-[#94a3b8] hover:text-white'}`}>{iv}</button>)}
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-[#475569]">Price: <span className="text-white font-semibold">${stats.price.toLocaleString()}</span></span>
        <span className="text-[#475569]">24h High: <span className="text-emerald-400">${stats.high.toLocaleString()}</span></span>
        <span className="text-[#475569]">24h Low: <span className="text-red-400">${stats.low.toLocaleString()}</span></span>
        <span className="text-[#475569]">Change: <span className={stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%</span></span>
      </div>
      {loading && <div className="text-center py-8 text-[#475569] text-sm">Loading...</div>}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl overflow-hidden">
        <div ref={chartRef} className="w-full" style={{ height: 400 }} />
      </motion.div>
    </div>
  );
}
