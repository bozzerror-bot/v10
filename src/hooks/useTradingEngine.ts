import { useEffect, useRef } from 'react';
import { useAlexStore, COINS } from '../store/useAlexStore';

const KLINES_URL = 'https://api.binance.com/api/v3/klines';

interface Kline { open: number; high: number; low: number; close: number; volume: number; time: number; }
interface Signal { side: 'LONG' | 'SHORT'; strategy: string; confidence: number; entry: number; stopLoss: number; takeProfit: number; leverage: number; reasoning: string; regime: string; }

async function fetchKlines(sym: string, intv: string, limit: number): Promise<Kline[]> {
  try {
    const r = await fetch(`${KLINES_URL}?symbol=${sym}&interval=${intv}&limit=${limit}`);
    if (!r.ok) return [];
    const d = await r.json();
    if (!Array.isArray(d)) return [];
    return d.map((x: string[]) => ({ time: +x[0], open: +x[1], high: +x[2], low: +x[3], close: +x[4], volume: +x[5] }));
  } catch { return []; }
}

function calcEMA(v: number[], p: number): number[] {
  const k = 2 / (p + 1), r: number[] = []; let prev = v[0] || 0;
  for (let i = 0; i < v.length; i++) { prev = i === 0 ? v[i] : v[i] * k + prev * (1 - k); r.push(prev); }
  return r;
}
function calcRSI(c: number[], p = 14): number[] {
  const r: number[] = []; let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1], G = Math.max(d, 0), L = Math.max(-d, 0); if (i <= p) { g += G; l += L; r.push(i === p ? (l === 0 ? 100 : 100 - 100 / (1 + g / l)) : 50); } else { g = (g * (p - 1) + G) / p; l = (l * (p - 1) + L) / p; r.push(l === 0 ? 100 : 100 - 100 / (1 + g / l)); } }
  return r;
}
function calcATR(k: Kline[], p = 14): number {
  if (k.length < 2) return k[0]?.close * 0.02 || 1;
  let s = 0; const st = Math.max(1, k.length - p);
  for (let i = st; i < k.length; i++) s += Math.max(k[i].high - k[i].low, Math.abs(k[i].high - k[i - 1].close), Math.abs(k[i].low - k[i - 1].close));
  return s / Math.min(p, k.length - 1);
}
function findSwingHighs(k: Kline[], lb = 3): number[] { const h: number[] = []; for (let i = lb; i < k.length - lb; i++) { const c = k[i].high; if (k.slice(i - lb, i).every(x => x.high < c) && k.slice(i + 1, i + 1 + lb).every(x => x.high < c)) h.push(c); } return h.slice(-3); }
function findSwingLows(k: Kline[], lb = 3): number[] { const l: number[] = []; for (let i = lb; i < k.length - lb; i++) { const c = k[i].low; if (k.slice(i - lb, i).every(x => x.low > c) && k.slice(i + 1, i + 1 + lb).every(x => x.low > c)) l.push(c); } return l.slice(-3); }

function validateTPSL(side: 'LONG' | 'SHORT', entry: number, sl: number, tp: number): { sl: number; tp: number } {
  if (side === 'LONG') {
    if (tp <= entry) tp = entry * 1.02; if (sl >= entry) sl = entry * 0.995;
    if (tp <= sl) { const risk = entry - sl; tp = entry + risk * 2; }
  } else {
    if (tp >= entry) tp = entry * 0.98; if (sl <= entry) sl = entry * 1.005;
    if (tp >= sl) { const risk = sl - entry; tp = entry - risk * 2; }
  }
  return { sl, tp };
}

/* ═══════════════════════════════════════════
   6 STRATEGIES ONLY
   ═══════════════════════════════════════════ */
function strategyBOS(k: Kline[]): Signal | null {
  if (k.length < 30) return null; const h = findSwingHighs(k), l = findSwingLows(k);
  if (h.length < 2 || l.length < 2) return null; const close = k[k.length - 1].close; const atr = calcATR(k);
  const lh = h[h.length - 1], ph = h[h.length - 2], ll = l[l.length - 1], pl = l[l.length - 2];
  if (lh > ph * 1.005) return { side: 'LONG', strategy: 'BOS', confidence: 72, entry: close, stopLoss: close - atr * 2.5, takeProfit: close + atr * 4, leverage: 3, reasoning: `BOS: broke above swing high ${ph.toFixed(2)} -> ${lh.toFixed(2)}`, regime: 'uptrend' };
  if (ll < pl * 0.995) return { side: 'SHORT', strategy: 'BOS', confidence: 72, entry: close, stopLoss: close + atr * 2.5, takeProfit: close - atr * 4, leverage: 3, reasoning: `BOS: broke below swing low ${pl.toFixed(2)} -> ${ll.toFixed(2)}`, regime: 'downtrend' };
  return null;
}
function strategyCHoCH(k: Kline[]): Signal | null {
  if (k.length < 40) return null; const c = k.map(x => x.close); const rsi = calcRSI(c); const lr = rsi[rsi.length - 1];
  const atr = calcATR(k); const close = c[c.length - 1]; const e20 = calcEMA(c, 20), e50 = calcEMA(c, 50);
  const up = e20[e20.length - 1] > e50[e50.length - 1]; const h = findSwingHighs(k), l = findSwingLows(k);
  if (!up && lr > 40 && lr < 65 && l.length >= 2) { const ll = l[l.length - 1], pl = l[l.length - 2]; if (ll > pl) return { side: 'LONG', strategy: 'CHoCH', confidence: 68, entry: close, stopLoss: close - atr * 2, takeProfit: close + atr * 3.5, leverage: 4, reasoning: `CHoCH: bullish shift, RSI ${lr.toFixed(1)}`, regime: 'downtrend' }; }
  if (up && lr < 60 && lr > 35 && h.length >= 2) { const lh = h[h.length - 1], ph = h[h.length - 2]; if (lh < ph) return { side: 'SHORT', strategy: 'CHoCH', confidence: 68, entry: close, stopLoss: close + atr * 2, takeProfit: close - atr * 3.5, leverage: 4, reasoning: `CHoCH: bearish shift, RSI ${lr.toFixed(1)}`, regime: 'uptrend' }; }
  return null;
}
function strategyTrend(k: Kline[]): Signal | null {
  if (k.length < 50) return null; const c = k.map(x => x.close); const e20 = calcEMA(c, 20), e50 = calcEMA(c, 50);
  const rsi = calcRSI(c); const lr = rsi[rsi.length - 1]; const atr = calcATR(k); const close = c[c.length - 1];
  if (e20[e20.length - 1] > e50[e50.length - 1] * 1.003 && lr > 45 && lr < 75) return { side: 'LONG', strategy: 'TREND', confidence: 65, entry: close, stopLoss: close - atr * 3, takeProfit: close + atr * 5, leverage: 2, reasoning: `TREND: EMA20>50, RSI ${lr.toFixed(1)}`, regime: 'uptrend' };
  if (e20[e20.length - 1] < e50[e50.length - 1] * 0.997 && lr < 55 && lr > 25) return { side: 'SHORT', strategy: 'TREND', confidence: 65, entry: close, stopLoss: close + atr * 3, takeProfit: close - atr * 5, leverage: 2, reasoning: `TREND: EMA20<50, RSI ${lr.toFixed(1)}`, regime: 'downtrend' };
  return null;
}
function strategyScalp(k: Kline[]): Signal | null {
  if (k.length < 20) return null; const c = k.map(x => x.close); const rsi7 = calcRSI(c, 7);
  const lr = rsi7[rsi7.length - 1], pr = rsi7[rsi7.length - 2] || lr; const atr = calcATR(k); const close = c[c.length - 1];
  if (lr < 28 && pr < lr) return { side: 'LONG', strategy: 'SCALP', confidence: 60, entry: close, stopLoss: close - atr * 1.5, takeProfit: close + atr * 2, leverage: 5, reasoning: `SCALP: RSI oversold ${lr.toFixed(1)}`, regime: 'sideways' };
  if (lr > 72 && pr > lr) return { side: 'SHORT', strategy: 'SCALP', confidence: 60, entry: close, stopLoss: close + atr * 1.5, takeProfit: close - atr * 2, leverage: 5, reasoning: `SCALP: RSI overbought ${lr.toFixed(1)}`, regime: 'sideways' };
  return null;
}
function strategyFVG(k: Kline[]): Signal | null {
  if (k.length < 15) return null; const cur = k[k.length - 1]; const atr = calcATR(k);
  for (let i = k.length - 6; i < k.length - 1; i++) {
    const prev = k[i - 1], next = k[i + 1];
    if (prev.high < next.low && cur.close < next.low) return { side: 'LONG', strategy: 'FVG', confidence: 67, entry: cur.close, stopLoss: cur.close - atr * 2, takeProfit: cur.close + atr * 3.5, leverage: 3, reasoning: `FVG: gap ${prev.high.toFixed(2)}->${next.low.toFixed(2)} unfilled`, regime: 'uptrend' };
    if (prev.low > next.high && cur.close > next.high) return { side: 'SHORT', strategy: 'FVG', confidence: 67, entry: cur.close, stopLoss: cur.close + atr * 2, takeProfit: cur.close - atr * 3.5, leverage: 3, reasoning: `FVG: gap ${prev.low.toFixed(2)}->${next.high.toFixed(2)} unfilled`, regime: 'downtrend' };
  }
  return null;
}
function strategyDivergence(k: Kline[]): Signal | null {
  if (k.length < 20) return null; const c = k.map(x => x.close); const rsi = calcRSI(c); if (rsi.length < 15) return null;
  const atr = calcATR(k); const close = c[c.length - 1];
  const pll = c[c.length - 1] < c[c.length - 8], rhl = rsi[rsi.length - 1] > rsi[rsi.length - 8];
  if (pll && rhl && rsi[rsi.length - 1] < 45) return { side: 'LONG', strategy: 'DIVERGENCE', confidence: 62, entry: close, stopLoss: close - atr * 2, takeProfit: close + atr * 4, leverage: 3, reasoning: 'DIV: bullish divergence', regime: 'reversal' };
  const phh = c[c.length - 1] > c[c.length - 8], rlh = rsi[rsi.length - 1] < rsi[rsi.length - 8];
  if (phh && rlh && rsi[rsi.length - 1] > 55) return { side: 'SHORT', strategy: 'DIVERGENCE', confidence: 62, entry: close, stopLoss: close + atr * 2, takeProfit: close - atr * 4, leverage: 3, reasoning: 'DIV: bearish divergence', regime: 'reversal' };
  return null;
}

const STRATEGIES = [strategyBOS, strategyCHoCH, strategyTrend, strategyScalp, strategyFVG, strategyDivergence];
const BASE_CONF: Record<string, number> = { BOS: 72, CHoCH: 68, TREND: 65, SCALP: 60, FVG: 67, DIVERGENCE: 62 };

function getAdaptiveTPSL(sym: string, side: 'LONG' | 'SHORT', entry: number, k: Kline[]) {
  const p = useAlexStore.getState().coinProfiles[sym];
  if (p && p.optimalTP > 0 && p.optimalSL > 0) {
    return { tp: entry * (1 + (side === 'LONG' ? p.optimalTP : -p.optimalTP) / 100), sl: entry * (1 + (side === 'LONG' ? -p.optimalSL : p.optimalSL) / 100) };
  }
  const atr = calcATR(k);
  return { tp: side === 'LONG' ? entry + atr * 4 : entry - atr * 4, sl: side === 'LONG' ? entry - atr * 2.5 : entry + atr * 2.5 };
}
function calcConf(base: number, strat: string, conf: boolean, streak: number, stress: number, losses: number, w: Record<string, number>) {
  let c = base + (w[strat] || 0.5) * 10; if (conf) c += 5; if (streak >= 3) c += 3; if (stress > 6) c -= 5; if (losses > 2) c -= 3;
  return Math.min(95, Math.max(60, Math.round(c)));
}

async function scanCoin(sym: string): Promise<Signal | null> {
  const store = useAlexStore.getState();
  const k15 = await fetchKlines(sym, '15m', 50); const k1h = await fetchKlines(sym, '1h', 50);
  if (k15.length < 30) return null;
  const sigs: Signal[] = [];
  for (const fn of STRATEGIES) { try { const s = fn(k15); if (s) sigs.push(s); } catch {} }
  if (!sigs.length) return null;
  const c15 = k15.map(x => x.close); const e20 = calcEMA(c15, 20), e50 = calcEMA(c15, 50);
  const up15 = e20[e20.length - 1] > e50[e50.length - 1];
  const up1h = k1h.length > 20 ? calcEMA(k1h.map(x => x.close), 20)[19] > calcEMA(k1h.map(x => x.close), 50)[49] : up15;
  const confl = up15 === up1h;
  const recentLosses = store.trades.slice(0, 5).filter(t => t.pnl < 0).length;
  for (const s of sigs) s.confidence = calcConf(BASE_CONF[s.strategy] || 60, s.strategy, confl, store.streak, store.stressLevel, recentLosses, store.strategyWeights);
  sigs.sort((a, b) => b.confidence - a.confidence);
  const best = sigs[0]; if (best.confidence < 70) return null;
  const { tp, sl } = getAdaptiveTPSL(sym, best.side, best.entry, k15);
  const v = validateTPSL(best.side, best.entry, sl, tp);
  best.takeProfit = v.tp; best.stopLoss = v.sl;
  return best;
}

function executeEntry(sig: Signal, sym: string) {
  const store = useAlexStore.getState();
  if (store.positions.some(p => p.symbol === sym && p.status === 'open' && p.side === sig.side)) return;
  const coin = store.coins.find(c => c.symbol === sym);
  const entryPrice = coin?.price || sig.entry;
  const size = sig.confidence >= 85 ? 250 : sig.confidence >= 75 ? 200 : sig.confidence >= 70 ? 150 : 100;
  const lev = Math.min(sig.leverage, store.settings.maxLeverage);
  const id = `${sym}-${Date.now()}`;
  const now = new Date().toISOString();
  const pos = { id, symbol: sym, side: sig.side, entryPrice, currentPrice: entryPrice, size: size * lev, leverage: lev, margin: size, pnl: 0, pnlPercent: 0, stopLoss: sig.stopLoss, takeProfit: sig.takeProfit, strategy: sig.strategy, regime: sig.regime, entryTime: now, timeframe: '15m', status: 'open' as const };
  store.addPosition(pos);
  store.addTrade({ id, time: now, symbol: sym, side: sig.side, price: entryPrice, size: size * lev, leverage: lev, margin: size, pnl: 0, pnlPercent: 0, status: 'open', strategy: sig.strategy, regime: sig.regime, reasoning: sig.reasoning, timeframe: '15m' });
  store.addReasoning({ time: now, type: 'trade', symbol: sym, strategy: sig.strategy, confidence: sig.confidence, text: `${sig.side} ${sym} @ ${entryPrice.toFixed(2)} | ${sig.strategy} ${sig.confidence}%` });
  store.setMood(sig.side === 'LONG' ? 'confident' : 'cautious');
}

function checkExits(prices: Record<string, number>) {
  const store = useAlexStore.getState();
  for (const p of store.positions) {
    if (p.status !== 'open') continue; const price = prices[p.symbol]; if (!price) continue;
    let exit = false, reason = '';
    if (p.side === 'LONG') { if (price <= p.stopLoss) { exit = true; reason = 'Stop Loss'; } else if (price >= p.takeProfit) { exit = true; reason = 'Take Profit'; } }
    else { if (price >= p.stopLoss) { exit = true; reason = 'Stop Loss'; } else if (price <= p.takeProfit) { exit = true; reason = 'Take Profit'; } }
    if (exit) { store.closePosition(p.id, price, reason); store.setMood(store.totalPnl >= 0 ? 'confident' : 'cautious'); }
  }
}

async function runRefresh() {
  const store = useAlexStore.getState();
  if (Date.now() - store.lastRefreshTime < 3600 * 1000) return;
  const profiles = { ...store.coinProfiles };
  const coins = store.settings.selectedCoins.length > 0 ? store.settings.selectedCoins : COINS.slice(0, 10);
  for (const sym of coins) {
    try {
      const k = await fetchKlines(sym, '15m', 200); if (k.length < 50) continue;
      const results: { strat: string; pnl: number }[] = [];
      for (let i = 50; i < k.length - 5; i++) {
        for (const fn of STRATEGIES) {
          try { const sig = fn(k.slice(0, i + 1)); if (sig) { let ep = 0; for (let j = 1; j <= 5 && i + j < k.length; j++) { const p = sig.side === 'LONG' ? (k[i + j].close - sig.entry) / sig.entry * 100 : (sig.entry - k[i + j].close) / sig.entry * 100; ep = p; if (p >= 1.5 || p <= -1) break; } results.push({ strat: sig.strategy, pnl: ep }); } } catch {}
        }
      }
      const byStrat: Record<string, { wins: number; losses: number; pnl: number }> = {};
      results.forEach(r => { if (!byStrat[r.strat]) byStrat[r.strat] = { wins: 0, losses: 0, pnl: 0 }; byStrat[r.strat].pnl += r.pnl; if (r.pnl > 0) byStrat[r.strat].wins++; else byStrat[r.strat].losses++; });
      let bestS = '', bestP = -Infinity;
      for (const [s, d] of Object.entries(byStrat)) { if (d.pnl > bestP) { bestS = s; bestP = d.pnl; } }
      const wins = results.filter(r => r.strat === bestS && r.pnl > 0).map(r => r.pnl);
      const losses = results.filter(r => r.strat === bestS && r.pnl < 0).map(r => Math.abs(r.pnl));
      profiles[sym] = { symbol: sym, bestStrategy: bestS, bestWinRate: Math.round((byStrat[bestS]?.wins || 0) / (results.length || 1) * 100), optimalTP: Math.round((wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 2) * 1.5 * 10) / 10, optimalSL: Math.round((losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 1) * 1.2 * 10) / 10, avgVolatility: Math.abs(store.coins.find(c => c.symbol === sym)?.change24h || 2), lastUpdated: Date.now() };
    } catch {}
  }
  store.setCoinProfiles(profiles); store.setLastRefreshTime(Date.now());
}

export function useTradingEngine() {
  const isRunning = useAlexStore(s => s.isRunning);
  const tradingEnabled = useAlexStore(s => s.settings.tradingEnabled);
  const cycleRef = useRef(0);

  useEffect(() => {
    if (!isRunning || !tradingEnabled) return;
    const iv = setInterval(async () => {
      const store = useAlexStore.getState();
      if (!store.settings.tradingEnabled) return;
      store.incrementCycle(); cycleRef.current++;
      const prices: Record<string, number> = {};
      store.coins.forEach(c => { if (c.price > 0) prices[c.symbol] = c.price; });
      store.updatePositionPrices(prices); checkExits(prices);
      const coins = store.settings.selectedCoins.length > 0 ? store.settings.selectedCoins : COINS.slice(0, 10);
      if (coins.length > 0) {
        const sym = coins[cycleRef.current % coins.length];
        const sig = await scanCoin(sym);
        if (sig) {
          if (store.settings.autoTrade) { executeEntry(sig, sym); }
          store.addReasoning({ time: new Date().toISOString(), type: 'scan', symbol: sym, strategy: sig.strategy, confidence: sig.confidence, text: `${sig.side} signal on ${sym}: ${sig.strategy} ${sig.confidence}%` });
        } else {
          store.addReasoning({ time: new Date().toISOString(), type: 'scan', symbol: sym, strategy: 'NONE', confidence: 0, text: `Scanned ${sym} - no signal` });
        }
      }
    }, 30000);
    return () => clearInterval(iv);
  }, [isRunning, tradingEnabled]);

  useEffect(() => { const iv = setInterval(runRefresh, 60000); runRefresh(); return () => clearInterval(iv); }, []);
}
