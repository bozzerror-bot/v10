import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Play, Square, RefreshCw, Target, BarChart3, Star, Settings, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAlexStore } from '../store/useAlexStore';

const STRATEGIES = [
  { key: 'BOS', name: 'Break of Structure', color: '#3b82f6', conf: 72 },
  { key: 'CHoCH', name: 'Change of Character', color: '#a855f7', conf: 68 },
  { key: 'TREND', name: 'EMA Trend Follow', color: '#10b981', conf: 65 },
  { key: 'SCALP', name: 'RSI Scalp', color: '#eab308', conf: 60 },
  { key: 'FVG', name: 'Fair Value Gap', color: '#ec4899', conf: 67 },
  { key: 'DIVERGENCE', name: 'RSI Divergence', color: '#14b8a6', conf: 62 },
];

function calcEMA(v: number[], p: number) { const k = 2 / (p + 1), r: number[] = []; let prev = v[0] || 0; for (let i = 0; i < v.length; i++) { prev = i === 0 ? v[i] : v[i] * k + prev * (1 - k); r.push(prev); } return r; }
function calcRSI(c: number[], p = 14) { const r: number[] = []; let g = 0, l = 0; for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1], G = Math.max(d, 0), L = Math.max(-d, 0); if (i <= p) { g += G; l += L; r.push(i === p ? (l === 0 ? 100 : 100 - 100 / (1 + g / l)) : 50); } else { g = (g * (p - 1) + G) / p; l = (l * (p - 1) + L) / p; r.push(l === 0 ? 100 : 100 - 100 / (1 + g / l)); } } return r; }

interface K { open: number; high: number; low: number; close: number; volume: number; }

function simStrat(k: K[], strat: string): { side: 'LONG' | 'SHORT'; entry: number } | null {
  if (k.length < 20) return null;
  const last = k[k.length - 1]; const c = k.map(x => x.close);
  const e20 = calcEMA(c, 20), e50 = calcEMA(c, 50); const rsi = calcRSI(c);
  switch (strat) {
    case 'BOS': { const highs = k.slice(-11, -1).map(x => x.high), lows = k.slice(-11, -1).map(x => x.low); if (last.close > Math.max(...highs) * 1.003) return { side: 'LONG', entry: last.close }; if (last.close < Math.min(...lows) * 0.997) return { side: 'SHORT', entry: last.close }; return null; }
    case 'TREND': if (e20[e20.length - 1] > e50[e50.length - 1] && rsi[rsi.length - 1] > 50) return { side: 'LONG', entry: last.close }; if (e20[e20.length - 1] < e50[e50.length - 1] && rsi[rsi.length - 1] < 50) return { side: 'SHORT', entry: last.close }; return null;
    case 'SCALP': { const r = rsi[rsi.length - 1]; if (r < 30) return { side: 'LONG', entry: last.close }; if (r > 70) return { side: 'SHORT', entry: last.close }; return null; }
    case 'CHoCH': { const r = rsi[rsi.length - 1]; if (e20[e20.length - 1] < e50[e50.length - 1] && r > 40 && r < 60) return { side: 'LONG', entry: last.close }; if (e20[e20.length - 1] > e50[e50.length - 1] && r > 40 && r < 60) return { side: 'SHORT', entry: last.close }; return null; }
    case 'FVG': for (let i = k.length - 6; i < k.length - 1; i++) { const prev = k[i - 1], next = k[i + 1]; if (prev.high < next.low && last.close < next.low) return { side: 'LONG', entry: last.close }; if (prev.low > next.high && last.close > next.high) return { side: 'SHORT', entry: last.close }; } return null;
    case 'DIVERGENCE': { const pll = c[c.length - 1] < c[c.length - 8], rhl = rsi[rsi.length - 1] > rsi[rsi.length - 8]; if (pll && rhl && rsi[rsi.length - 1] < 45) return { side: 'LONG', entry: last.close }; const phh = c[c.length - 1] > c[c.length - 8], rlh = rsi[rsi.length - 1] < rsi[rsi.length - 8]; if (phh && rlh && rsi[rsi.length - 1] > 55) return { side: 'SHORT', entry: last.close }; } return null;
    default: return null;
  }
}
function simExit(future: K[], sig: { side: 'LONG' | 'SHORT'; entry: number }): number {
  for (const k of future) { const p = sig.side === 'LONG' ? (k.close - sig.entry) / sig.entry * 100 : (sig.entry - k.close) / sig.entry * 100; if (p >= 1.5 || p <= -1) return p; }
  const last = future[future.length - 1]; if (!last) return 0; return sig.side === 'LONG' ? (last.close - sig.entry) / sig.entry * 100 : (sig.entry - last.close) / sig.entry * 100;
}

export default function StrategyLab() {
  const nav = useNavigate();
  const store = useAlexStore();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [period, setPeriod] = useState(7);
  const [autoLearn, setAutoLearn] = useState(true);

  const flat = useMemo(() => Object.values(store.backtestResults).flat(), [store.backtestResults]);
  const hasResults = flat.length > 0;
  const agg = useMemo(() => {
    const a: Record<string, { wins: number; losses: number; pnl: number; trades: number }> = {};
    flat.forEach(r => { if (!a[r.strategy]) a[r.strategy] = { wins: 0, losses: 0, pnl: 0, trades: 0 }; a[r.strategy].wins += r.wins; a[r.strategy].losses += r.losses; a[r.strategy].pnl += r.totalPnl; a[r.strategy].trades += r.trades; });
    return Object.entries(a).map(([key, v]) => { const s = STRATEGIES.find(x => x.key === key); return { key, name: s?.name ?? key, color: s?.color ?? '#64748b', ...v, wr: v.trades > 0 ? (v.wins / v.trades) * 100 : 0 }; });
  }, [flat]);
  const overall = useMemo(() => {
    if (!flat.length) return null;
    const tt = flat.reduce((s, r) => s + r.trades, 0);
    const tw = flat.reduce((s, r) => s + r.wins, 0);
    const pnl = flat.reduce((s, r) => s + r.totalPnl, 0);
    const best = agg.length ? agg.reduce((a, b) => a.wr > b.wr ? a : b) : null;
    return { tt, tw, pnl, wr: tt > 0 ? (tw / tt) * 100 : 0, best };
  }, [flat, agg]);

  async function runBacktest() {
    if (running) return; setRunning(true); setProgress(0);
    const coins = store.settings.selectedCoins.length > 0 ? store.settings.selectedCoins : ['BTCUSDT', 'ETHUSDT'];
    const all: Record<string, any[]> = {};
    for (let i = 0; i < coins.length; i++) {
      const sym = coins[i];
      try {
        const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=15m&limit=${period * 96}`);
        const d = await r.json(); if (!Array.isArray(d)) continue;
        const klines: K[] = d.map((x: string[]) => ({ open: +x[1], high: +x[2], low: +x[3], close: +x[4], volume: +x[5] }));
        const res: any[] = [];
        for (const s of STRATEGIES) {
          let wins = 0, losses = 0, pnl = 0, bt = -Infinity, wt = Infinity;
          for (let j = 50; j < klines.length - 5; j++) {
            const sig = simStrat(klines.slice(0, j + 1), s.key);
            if (sig) { const ep = simExit(klines.slice(j + 1, j + 6), sig); if (ep > 0) wins++; else losses++; pnl += ep; if (ep > bt) bt = ep; if (ep < wt) wt = ep; }
          }
          const total = wins + losses;
          if (total > 0) res.push({ strategy: s.key, symbol: sym, wins, losses, winRate: total > 0 ? wins / total : 0, totalPnl: pnl, avgTrade: pnl / total, bestTrade: bt === -Infinity ? 0 : bt, worstTrade: wt === Infinity ? 0 : wt, trades: total, confidence: s.conf });
        }
        if (res.length) all[sym] = res;
      } catch {}
      setProgress(Math.round(((i + 1) / coins.length) * 100));
    }
    store.setBacktestResults(all); store.setBacktestComplete(true);
    if (autoLearn) store.applyBacktestLearnings(all);
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0] p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3"><button onClick={() => nav('/')} className="text-[#475569] hover:text-white"><ArrowLeft className="w-5 h-5" /></button><Brain className="w-5 h-5 text-indigo-400" /><h1 className="text-lg font-bold">Strategy Lab</h1></div>
      {hasResults && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0a0a12] border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
        <div><p className="text-sm font-medium">Self-Learning Active</p><p className="text-[10px] text-[#475569]">{flat.length} backtests analyzed</p></div>
        <label className="flex items-center gap-2 text-xs"><span className="text-[#475569]">Auto-Learn</span><button onClick={() => setAutoLearn(!autoLearn)} className={`w-10 h-5 rounded-full transition-colors ${autoLearn ? 'bg-emerald-500' : 'bg-[#1a1a2e]'}`}><div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${autoLearn ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></label>
      </motion.div>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {STRATEGIES.map((s, i) => { const st = agg.find(a => a.key === s.key); return (
          <motion.div key={s.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-xs font-semibold">{s.key}</span></div>
            <p className="text-[10px] text-[#475569] mb-2">{s.name}</p>
            {st ? <div className="space-y-1"><div className="flex justify-between text-[10px]"><span className="text-[#475569]">WR</span><span style={{ color: s.color }}>{st.wr.toFixed(1)}%</span></div><div className="flex justify-between text-[10px]"><span className="text-[#475569]">P&L</span><span className={st.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${st.pnl.toFixed(2)}</span></div></div> : <p className="text-[10px] text-[#475569]">No data</p>}
          </motion.div>
        )})}
      </div>
      <div className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">{[7, 14, 30].map(d => <button key={d} onClick={() => setPeriod(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === d ? 'bg-sky-500 text-white' : 'bg-[#1a1a2e] text-[#94a3b8]'}`}>{d}d</button>)}</div>
        <button onClick={runBacktest} disabled={running} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${running ? 'bg-[#1a1a2e] text-[#475569]' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>{running ? <><Square className="w-4 h-4" />{progress}%</> : <><Play className="w-4 h-4" />Run Backtest</>}</button>
        {hasResults && <button onClick={() => store.applyBacktestLearnings(store.backtestResults)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><RefreshCw className="w-3 h-3" />Apply Learnings</button>}
      </div>
      {running && <div className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden"><motion.div className="h-full bg-sky-500" animate={{ width: `${progress}%` }} /></div>}
      {overall && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ l: 'Total Trades', v: overall.tt, i: BarChart3 }, { l: 'Win Rate', v: `${overall.wr.toFixed(1)}%`, i: Target }, { l: 'Total P&L', v: `$${overall.pnl.toFixed(2)}`, c: overall.pnl >= 0 ? 'text-emerald-400' : 'text-red-400', i: TrendingUp }, { l: 'Best Strategy', v: overall.best?.name ?? 'N/A', i: Star }].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4"><div className="flex items-center gap-2 mb-1 text-[#475569]"><s.i className="w-4 h-4" /><span className="text-[10px]">{s.l}</span></div><div className={`text-lg font-bold ${s.c || ''}`}>{s.v}</div></motion.div>
        ))}
      </div>}
      {Object.keys(store.coinProfiles).length > 0 && <div className="bg-[#0a0a12] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /><h3 className="font-semibold text-sm">Per-Coin Optimal Settings</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-white/[0.06] text-[#475569]"><th className="text-left px-4 py-2">Coin</th><th className="text-left px-4 py-2">Best Strategy</th><th className="text-right px-4 py-2">Win Rate</th><th className="text-right px-4 py-2">Optimal TP</th><th className="text-right px-4 py-2">Optimal SL</th></tr></thead>
          <tbody>{Object.values(store.coinProfiles).map(p => (
            <tr key={p.symbol} className="border-b border-white/[0.03]"><td className="px-4 py-2 font-medium">{p.symbol.replace('USDT', '')}</td><td className="px-4 py-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">{p.bestStrategy}</span></td><td className="px-4 py-2 text-right">{p.bestWinRate}%</td><td className="px-4 py-2 text-right text-emerald-400">{p.optimalTP.toFixed(2)}%</td><td className="px-4 py-2 text-right text-red-400">{p.optimalSL.toFixed(2)}%</td></tr>
          ))}</tbody>
        </table></div>
      </div>}
      {Object.keys(store.strategyWeights).length > 0 && <div className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3"><Settings className="w-4 h-4 text-amber-400" /><h3 className="font-semibold text-sm">Strategy Weights</h3></div>
        <div className="space-y-2">{Object.entries(store.strategyWeights).sort(([, a], [, b]) => b - a).map(([key, weight]) => { const s = STRATEGIES.find(x => x.key === key); return (
          <div key={key} className="flex items-center gap-3"><span className="text-xs w-28">{s?.name ?? key}</span><div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, weight * 50)}%`, backgroundColor: s?.color ?? '#64748b' }} /></div><span className="text-xs font-mono w-10 text-right">{weight.toFixed(2)}</span></div>
        )})}</div>
      </div>}
      {!hasResults && !running && <div className="text-center py-16 text-[#475569]"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No backtest data yet</p><p className="text-xs mt-1">Run a backtest to see strategy performance</p></div>}
    </div>
  );
}

function TrendingUp({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>; }
