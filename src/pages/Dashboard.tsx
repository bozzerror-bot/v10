import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Square, TrendingUp, TrendingDown, Activity, BarChart3, Brain, LineChart, ClipboardList, Settings as St, Zap, ScanLine, Timer } from 'lucide-react';
import { useAlexStore, COINS } from '../store/useAlexStore';

const STRATEGIES = ['Break of Structure', 'Change of Character', 'EMA Trend', 'RSI Scalp', 'Fair Value Gap', 'RSI Divergence'];
const STRAT_MAP: Record<string, string> = { BOS: 'Break of Structure', CHoCH: 'Change of Character', TREND: 'EMA Trend', SCALP: 'RSI Scalp', FVG: 'Fair Value Gap', DIVERGENCE: 'RSI Divergence' };

function fmt(n: number) { return n >= 1000 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(6); }

function JarvisAvatar({ size = 120, mood = 'neutral', isRunning = false }: { size?: number; mood?: string; isRunning?: boolean }) {
  const pos = mood === 'confident' || mood === 'optimistic';
  const neg = mood === 'cautious' || mood === 'fearful';
  const o = pos ? 'from-emerald-500/30 to-emerald-900/10' : neg ? 'from-red-500/30 to-red-900/10' : 'from-sky-500/30 to-violet-900/10';
  const i = pos ? 'bg-emerald-500/20' : neg ? 'bg-red-500/20' : 'bg-sky-500/20';
  const ec = pos ? '#34d399' : neg ? '#f87171' : '#38bdf8';
  return (
    <motion.div style={{ width: size, height: size }} className={`relative rounded-full bg-gradient-to-br ${o} border border-white/[0.08] flex items-center justify-center shrink-0`}
      animate={{ scale: isRunning ? [1, 1.03, 1] : 1, rotate: isRunning ? [0, 1, -1, 0] : 0 }} transition={{ duration: 2, repeat: Infinity }}>
      {isRunning && <motion.div className={`absolute inset-0 rounded-full bg-gradient-to-br ${o}`} animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />}
      <div className={`relative w-3/5 h-3/5 rounded-full ${i} flex items-center justify-center`}>
        <svg width="60%" height="40%" viewBox="0 0 40 16">
          <motion.ellipse cx="10" cy="8" rx="5" ry={5} fill={ec} animate={{ opacity: [0.8, 1, 0.8], ry: isRunning ? [4, 5, 4] : 5 }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.ellipse cx="30" cy="8" rx="5" ry={5} fill={ec} animate={{ opacity: [0.8, 1, 0.8], ry: isRunning ? [4, 5, 4] : 5 }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} />
        </svg>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const store = useAlexStore();
  const { isRunning, mood, stressLevel, cycle, positions, trades, pnlHistory, totalPnl, winCount, lossCount, coinProfiles, settings } = store;
  const [countdown, setCountdown] = useState(30);

  useEffect(() => { const t = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000); return () => clearInterval(t); }, []);

  const handleStartStop = useCallback(() => {
    const next = !isRunning;
    useAlexStore.getState().setIsRunning(next);
    store.updateSettings({ tradingEnabled: next });
  }, [isRunning, store]);

  const openPos = positions.filter(p => p.status === 'open');
  const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount) * 100).toFixed(1) : '0';

  const getConfidence = useCallback((sym: string, strat: string): number => {
    const p = coinProfiles[sym]; if (!p) return 0;
    if (STRAT_MAP[p.bestStrategy] === strat || p.bestStrategy === strat) return Math.round(p.bestWinRate || 0);
    return 0;
  }, [coinProfiles]);

  const selected = settings.selectedCoins.length > 0 ? settings.selectedCoins : COINS.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0] p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <JarvisAvatar size={80} mood={mood} isRunning={isRunning} />
          <div>
            <h1 className="text-xl font-bold">Alex AI Trading Bot</h1>
            <p className="text-xs text-[#475569]">Smart Money Concepts Scalping</p>
            <p className="text-xs text-[#475569]">Mood: <span className="text-sky-400">{mood}</span> | Stress: {stressLevel}/10</p>
          </div>
        </div>
        <button onClick={handleStartStop} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
          {isRunning ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Start Trading</>}
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: 'Total P&L', value: `$${totalPnl.toFixed(2)}`, icon: totalPnl >= 0 ? TrendingUp : TrendingDown, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' }, { label: 'Win Rate', value: `${winRate}%`, icon: Activity, color: 'text-sky-400' }, { label: 'Open Positions', value: `${openPos.length}`, icon: BarChart3, color: 'text-violet-400' }, { label: 'Active Strategies', value: '6', icon: Brain, color: 'text-amber-400' }].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 text-[#475569]"><s.icon className="w-4 h-4" /><span className="text-[10px]">{s.label}</span></div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* P&L Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">P&L History</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlHistory}>
              <defs><linearGradient id="gpnl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={totalPnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} /><stop offset="95%" stopColor={totalPnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v: string) => v ? new Date(v).toLocaleTimeString() : ''} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke={totalPnl >= 0 ? '#22c55e' : '#ef4444'} fill="url(#gpnl)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Strategy Radar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><ScanLine className="w-4 h-4 text-sky-400" /><span className="text-sm font-semibold">Strategy Radar</span>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-1 ml-2"><div className="w-1.5 h-1.5 rounded-full bg-sky-400" /><div className="w-1.5 h-1.5 rounded-full bg-sky-400" /><div className="w-1.5 h-1.5 rounded-full bg-sky-400" /></motion.div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#475569]"><Timer className="w-3 h-3" />Next scan in {countdown}s</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-white/[0.04]">
              <th className="text-left px-3 py-2 text-[#475569] font-medium sticky left-0 bg-[#0a0a12]">Coin</th>
              {STRATEGIES.map(s => <th key={s} className="text-center px-1.5 py-2 text-[#475569] font-medium min-w-[80px]">{s.length > 14 ? s.slice(0, 12) + '..' : s}</th>)}
            </tr></thead>
            <tbody>{selected.slice(0, 8).map((sym, ri) => (
              <motion.tr key={sym} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + ri * 0.05 }} className="border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-semibold sticky left-0 bg-[#0a0a12]">{sym.replace('USDT', '')}</td>
                {STRATEGIES.map(strat => { const sc = getConfidence(sym, strat); const g = sc >= 70; const y = sc >= 50 && sc < 70;
                  return (<td key={strat} className="px-1.5 py-2"><div className={`flex items-center justify-center rounded-md py-1.5 border ${g ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : y ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/[0.02] border-white/[0.04] text-[#475569]'}`}><span className="font-semibold text-[10px]">{sc > 0 ? `${sc}%` : '—'}</span></div></td>);
                })}
              </motion.tr>
            ))}</tbody>
          </table>
        </div>
      </motion.div>

      {/* Open Positions */}
      {openPos.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] font-semibold text-sm">Open Positions ({openPos.length})</div>
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-white/[0.04] text-[#475569]"><th className="text-left px-3 py-2">Symbol</th><th className="text-left px-3 py-2">Side</th><th className="text-right px-3 py-2">Entry</th><th className="text-right px-3 py-2">P&L</th><th className="text-right px-3 py-2">SL</th><th className="text-right px-3 py-2">TP</th><th className="text-left px-3 py-2">Strategy</th></tr></thead>
            <tbody>{openPos.map(p => (
              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-medium">{p.symbol.replace('USDT', '')}</td>
                <td className={`px-3 py-2 font-semibold ${p.side === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>{p.side}</td>
                <td className="px-3 py-2 text-right">{fmt(p.entryPrice)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-red-400">{fmt(p.stopLoss)}</td>
                <td className="px-3 py-2 text-right text-emerald-400">{fmt(p.takeProfit)}</td>
                <td className="px-3 py-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">{p.strategy}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        </motion.div>
      )}

      {/* Live Coins */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {store.coins.filter(c => selected.includes(c.symbol)).slice(0, 8).map((c, i) => (
          <motion.div key={c.symbol} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-3 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{c.symbol.replace('USDT', '')}</span><span className={`text-xs font-semibold ${c.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%</span></div>
            <div className="text-lg font-bold">{fmt(c.price)}</div>
            <div className="text-[10px] text-[#475569] mt-1">H: {fmt(c.high24h)} L: {fmt(c.low24h)}</div>
          </motion.div>
        ))}
        {store.coins.length === 0 && selected.slice(0, 8).map((sym, i) => (
          <motion.div key={sym} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-3">
            <div className="font-semibold text-sm">{sym.replace('USDT', '')}</div>
            <div className="text-lg font-bold text-[#475569]">Loading...</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      {trades.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">{trades.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center gap-3 text-xs">
              <span className={`font-semibold ${t.side === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side}</span>
              <span className="text-[#475569]">{t.symbol.replace('USDT', '')}</span>
              <span className="text-sky-400">{t.strategy}</span>
              <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}</span>
              <span className="text-[#475569] ml-auto">{new Date(t.time).toLocaleTimeString()}</span>
            </div>
          ))}</div>
        </motion.div>
      )}

      {/* Nav */}
      <div className="grid grid-cols-5 gap-2">
        {[{ p: '/chart', l: 'Chart', i: LineChart }, { p: '/logs', l: 'Logs', i: ClipboardList }, { p: '/study', l: 'Study', i: Brain }, { p: '/lab', l: 'Lab', i: Zap }, { p: '/settings', l: 'Settings', i: St }].map((n, i) => (
          <motion.button key={n.p} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }} onClick={() => nav(n.p)} className="flex flex-col items-center gap-1 p-3 bg-[#0a0a12] border border-white/[0.06] rounded-xl hover:border-white/20 transition-colors text-[#94a3b8] hover:text-white">
            <n.i className="w-5 h-5" /><span className="text-[10px]">{n.l}</span>
          </motion.button>
        ))}
      </div>

      <div className="text-center text-[10px] text-[#475569] pt-4 pb-2">Alex V10 | Cycle #{cycle} {isRunning ? <span className="text-emerald-400">Active</span> : <span className="text-amber-400">Paused</span>}</div>
    </div>
  );
}
