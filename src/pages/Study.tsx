import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAlexStore, COINS } from '../store/useAlexStore';

interface K { open: number; high: number; low: number; close: number; volume: number; }

function calcEMA(v: number[], p: number) { const k = 2 / (p + 1), r: number[] = []; let prev = v[0] || 0; for (let i = 0; i < v.length; i++) { prev = i === 0 ? v[i] : v[i] * k + prev * (1 - k); r.push(prev); } return r; }
function calcATR(k: K[], p = 14) { let s = 0; const st = Math.max(1, k.length - p); for (let i = st; i < k.length; i++) s += Math.max(k[i].high - k[i].low, Math.abs(k[i].high - k[i - 1].close), Math.abs(k[i].low - k[i - 1].close)); return s / Math.min(p, k.length - 1); }
function findSwingHL(k: K[]) { const highs: number[] = [], lows: number[] = []; for (let i = 3; i < k.length - 3; i++) { if (k.slice(i - 3, i).every(x => x.high < k[i].high) && k.slice(i + 1, i + 4).every(x => x.high < k[i].high)) highs.push(k[i].high); if (k.slice(i - 3, i).every(x => x.low > k[i].low) && k.slice(i + 1, i + 4).every(x => x.low > k[i].low)) lows.push(k[i].low); } return { highs: highs.slice(-5), lows: lows.slice(-5) }; }

export default function Study() {
  const nav = useNavigate();
  const store = useAlexStore();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, any>>({});

  async function runStudy() {
    if (running) return;
    setRunning(true); setProgress(0); setResults({});
    const all: Record<string, any> = {};
    let done = 0;
    await Promise.all(COINS.map(async (sym) => {
      const res: Record<string, any> = {};
      for (const tf of ['15m', '1h', '4h']) {
        try {
          const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=100`);
          if (!r.ok) continue;
          const d = await r.json();
          if (!Array.isArray(d)) continue;
          const klines: K[] = d.map((x: string[]) => ({ open: +x[1], high: +x[2], low: +x[3], close: +x[4], volume: +x[5] }));
          if (klines.length < 30) continue;
          const closes = klines.map(x => x.close);
          const e20 = calcEMA(closes, 20), e50 = calcEMA(closes, 50);
          const trend = e20[e20.length - 1] > e50[e50.length - 1] * 1.005 ? 'uptrend' : e20[e20.length - 1] < e50[e50.length - 1] * 0.995 ? 'downtrend' : 'sideways';
          const hl = findSwingHL(klines);
          const atr = calcATR(klines);
          const avgVol = klines.reduce((s, x) => s + x.volume, 0) / klines.length;
          res[tf] = { trend, support: hl.lows, resistance: hl.highs, volatility: (atr / closes[closes.length - 1] * 100).toFixed(2), avgVolume: avgVol.toFixed(0) };
        } catch {}
      }
      if (Object.keys(res).length > 0) all[sym] = res;
      done++;
      setProgress(Math.round((done / COINS.length) * 100));
    }));
    setResults(all);
    store.setMarketStudyData(Object.fromEntries(Object.entries(all).map(([sym, r]: [string, any]) => [sym, { supportLevels: r['15m']?.support || [], resistanceLevels: r['15m']?.resistance || [], trendDirection: r['15m']?.trend || 'sideways', trend15m: r['15m']?.trend || 'sideways', trend1h: r['1h']?.trend || 'sideways', volatility: parseFloat(r['15m']?.volatility || '0'), avgVolume: parseFloat(r['15m']?.avgVolume || '0'), bestTimes: 'Volatile hours: 08:00-12:00, 14:00-18:00 UTC', lastUpdated: Date.now() }])));
    store.setMarketStudyComplete(true);
    store.setMood('Ready to Trade');
    store.setStress(3);
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0] p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => nav('/')} className="text-[#475569] hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <Brain className="w-5 h-5 text-violet-400" /><h1 className="text-lg font-bold">Market Study</h1>
      </div>
      <button onClick={runStudy} disabled={running} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${running ? 'bg-[#1a1a2e] text-[#475569]' : 'bg-violet-500 hover:bg-violet-600 text-white'}`}>{running ? `${progress}%` : 'Run Study'}</button>
      {running && <div className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden"><motion.div className="h-full bg-violet-500" animate={{ width: `${progress}%` }} /></div>}

      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(results).map(([sym, r]: [string, any], i) => (
            <motion.div key={sym} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><span className="font-bold text-sm">{sym.replace('USDT', '')}</span>
                {r['15m'] && <TrendIcon trend={r['15m'].trend} />}
              </div>
              <div className="flex gap-4 text-xs mb-2">
                {['15m', '1h', '4h'].map(tf => r[tf] && (
                  <div key={tf} className="flex items-center gap-1"><span className="text-[#475569]">{tf}:</span><span className={r[tf].trend === 'uptrend' ? 'text-emerald-400' : r[tf].trend === 'downtrend' ? 'text-red-400' : 'text-amber-400'}>{r[tf].trend}</span></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {r['15m']?.support?.map((s: number, i: number) => <span key={`s${i}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">S: ${s.toFixed(2)}</span>)}
                {r['15m']?.resistance?.map((s: number, i: number) => <span key={`r${i}`} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">R: ${s.toFixed(2)}</span>)}
              </div>
              <div className="flex gap-3 text-xs text-[#475569]">
                <span>Vol: {r['15m']?.volatility}%</span>
                <span>Vol: {parseInt(r['15m']?.avgVolume || '0').toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'uptrend') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'downtrend') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-amber-400" />;
}
