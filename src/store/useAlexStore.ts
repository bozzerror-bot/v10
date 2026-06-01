import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const COINS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'DOGEUSDT','ADAUSDT','AVAXUSDT','LINKUSDT','DOTUSDT',
  'MATICUSDT','LTCUSDT','UNIUSDT','ATOMUSDT','ETCUSDT',
  'FILUSDT','ARBUSDT','OPUSDT','SUIUSDT','TIAUSDT'
] as const;
export type CoinSymbol = typeof COINS[number];

export interface CoinData {
  symbol: string; name: string; price: number; change24h: number;
  high24h: number; low24h: number; volume24h: number; isReal: boolean;
}
export interface Position {
  id: string; symbol: string; side: 'LONG' | 'SHORT'; entryPrice: number;
  currentPrice: number; size: number; leverage: number; margin: number;
  pnl: number; pnlPercent: number; stopLoss: number; takeProfit: number;
  strategy: string; regime: string; entryTime: string; timeframe: string;
  status: 'open' | 'closed'; closePrice?: number; closeTime?: string; closeReason?: string;
}
export interface TradeLog {
  id: string; time: string; symbol: string; side: 'LONG' | 'SHORT';
  price: number; size: number; leverage: number; margin: number;
  pnl: number; pnlPercent: number; status: 'open' | 'closed';
  strategy: string; regime: string; reasoning: string; timeframe: string;
  closePrice?: number; closeTime?: string; closeReason?: string;
}
export interface ReasoningEntry {
  time: string; type: 'trade' | 'close' | 'hold' | 'system' | 'scan' | 'refresh';
  symbol: string; strategy: string; confidence: number; text: string;
}
export interface StudyCoinData {
  supportLevels: number[]; resistanceLevels: number[];
  trendDirection: 'uptrend' | 'downtrend' | 'sideways';
  trend15m: 'uptrend' | 'downtrend' | 'sideways';
  trend1h: 'uptrend' | 'downtrend' | 'sideways';
  volatility: number; avgVolume: number; bestTimes: string; lastUpdated: number;
}
export interface BacktestResult {
  strategy: string; symbol: string; wins: number; losses: number;
  winRate: number; totalPnl: number; avgTrade: number;
  bestTrade: number; worstTrade: number; trades: number; confidence: number;
}
export interface CoinStrategyProfile {
  symbol: string; bestStrategy: string; bestWinRate: number;
  optimalTP: number; optimalSL: number; avgVolatility: number; lastUpdated: number;
}
export interface Notification {
  id: string; time: string; type: 'entry' | 'exit' | 'signal' | 'refresh' | 'warning';
  title: string; message: string; read: boolean;
}

export interface AlexSettings {
  name: string; riskTolerance: number; confidence: number; patience: number;
  adaptability: number; maxLeverage: number; selectedCoins: string[];
  interval: string; tradingEnabled: boolean; apiKey: string; apiSecret: string;
  entrySize: number; autoTrade: boolean; notificationsEnabled: boolean;
}

interface AlexState {
  coins: CoinData[]; priceHistory: Record<string, number[]>;
  isRunning: boolean; cycle: number; positions: Position[]; trades: TradeLog[];
  reasoning: ReasoningEntry[]; pnlHistory: { time: string; value: number }[];
  mood: string; stressLevel: number; streak: number; totalPnl: number;
  winCount: number; lossCount: number; marketStudyComplete: boolean;
  marketStudyProgress: number; marketStudyData: Record<string, StudyCoinData>;
  backtestResults: Record<string, BacktestResult[]>; backtestComplete: boolean;
  backtestProgress: number; coinProfiles: Record<string, CoinStrategyProfile>;
  strategyWeights: Record<string, number>; lastRefreshTime: number;
  settings: AlexSettings;
  notifications: Notification[];
}

interface AlexActions {
  setCoins: (coins: CoinData[]) => void; updatePrice: (symbol: string, price: number) => void;
  addPriceHistory: (symbol: string, price: number) => void;
  setIsRunning: (running: boolean) => void; addPosition: (p: Position) => void;
  closePosition: (id: string, closePrice: number, reason: string) => void;
  updatePositionPrices: (prices: Record<string, number>) => void;
  addTrade: (t: TradeLog) => void; addReasoning: (r: ReasoningEntry) => void;
  updateSettings: (s: Partial<AlexSettings>) => void; setMood: (m: string) => void;
  setStress: (l: number) => void; incrementCycle: () => void; resetAll: () => void;
  setMarketStudyComplete: (c: boolean) => void; setMarketStudyProgress: (p: number) => void;
  setMarketStudyData: (d: Record<string, StudyCoinData>) => void;
  setBacktestResults: (r: Record<string, BacktestResult[]>) => void;
  setBacktestComplete: (c: boolean) => void; setBacktestProgress: (p: number) => void;
  applyBacktestLearnings: (r: Record<string, BacktestResult[]>) => void;
  setCoinProfiles: (p: Record<string, CoinStrategyProfile>) => void;
  updateStrategyWeights: (w: Record<string, number>) => void;
  setLastRefreshTime: (t: number) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const defSettings: AlexSettings = {
  name: 'Alex', riskTolerance: 5, confidence: 5, patience: 5, adaptability: 5,
  maxLeverage: 5, selectedCoins: COINS.slice(0, 10), interval: '15m',
  tradingEnabled: false, apiKey: '', apiSecret: '', entrySize: 100,
  autoTrade: true, notificationsEnabled: true,
};

export const useAlexStore = create<AlexState & AlexActions>()(
  immer(persist((set) => ({
    coins: [], priceHistory: {}, isRunning: false, cycle: 0, positions: [],
    trades: [], reasoning: [], pnlHistory: [], mood: 'neutral', stressLevel: 0,
    streak: 0, totalPnl: 0, winCount: 0, lossCount: 0, marketStudyComplete: false,
    marketStudyProgress: 0, marketStudyData: {}, backtestResults: {},
    backtestComplete: false, backtestProgress: 0, coinProfiles: {},
    strategyWeights: { BOS: 1, CHoCH: 1, TREND: 1, SCALP: 1, FVG: 1, DIVERGENCE: 1 },
    lastRefreshTime: 0, settings: defSettings, notifications: [],

    setCoins: (coins) => set((s) => { s.coins = coins; }),
    updatePrice: (symbol, price) => set((s) => {
      const c = s.coins.find(x => x.symbol === symbol);
      if (c) { c.price = price; if (c.high24h > 0) c.change24h = ((price - (c.high24h + c.low24h) / 2) / ((c.high24h + c.low24h) / 2)) * 100; }
      s.positions.filter(p => p.symbol === symbol && p.status === 'open').forEach(p => {
        p.currentPrice = price;
        const d = p.side === 'LONG' ? price - p.entryPrice : p.entryPrice - price;
        p.pnl = d * p.size; p.pnlPercent = (d / p.entryPrice) * 100;
      });
    }),
    addPriceHistory: (symbol, price) => set((s) => {
      if (!s.priceHistory[symbol]) s.priceHistory[symbol] = [];
      s.priceHistory[symbol].push(price);
      if (s.priceHistory[symbol].length > 200) s.priceHistory[symbol] = s.priceHistory[symbol].slice(-200);
    }),
    setIsRunning: (running) => set((s) => { s.isRunning = running; }),
    addPosition: (p) => set((s) => { s.positions.push(p); }),
    closePosition: (id, closePrice, reason) => set((s) => {
      const p = s.positions.find(x => x.id === id && x.status === 'open');
      if (!p) return;
      const d = p.side === 'LONG' ? closePrice - p.entryPrice : p.entryPrice - closePrice;
      const pnl = d * p.size;
      p.status = 'closed'; p.currentPrice = closePrice; p.closePrice = closePrice;
      p.closeTime = new Date().toISOString(); p.closeReason = reason;
      p.pnl = pnl; p.pnlPercent = (d / p.entryPrice) * 100;
      s.totalPnl += pnl;
      if (pnl > 0) { s.winCount++; s.streak = s.streak >= 0 ? s.streak + 1 : 1; }
      else { s.lossCount++; s.streak = s.streak <= 0 ? s.streak - 1 : -1; }
      s.stressLevel = Math.max(0, Math.min(10, s.stressLevel + (pnl < 0 ? 2 : -1)));
      s.mood = pnl > 0 ? 'confident' : 'cautious';
      s.pnlHistory.push({ time: new Date().toISOString(), value: s.totalPnl });
      s.reasoning.unshift({ time: new Date().toISOString(), type: 'close', symbol: p.symbol, strategy: p.strategy, confidence: 0, text: `Closed ${p.side} ${p.symbol} @ ${closePrice.toFixed(2)} | ${reason} | PnL: ${pnl.toFixed(2)}` });
    }),
    updatePositionPrices: (prices) => set((s) => {
      s.positions.filter(p => p.status === 'open').forEach(p => {
        const price = prices[p.symbol]; if (!price) return;
        p.currentPrice = price;
        const d = p.side === 'LONG' ? price - p.entryPrice : p.entryPrice - price;
        p.pnl = d * p.size; p.pnlPercent = (d / p.entryPrice) * 100;
      });
    }),
    addTrade: (t) => set((s) => { s.trades.unshift(t); if (s.trades.length > 500) s.trades = s.trades.slice(0, 500); }),
    addReasoning: (r) => set((s) => { s.reasoning.unshift(r); if (s.reasoning.length > 500) s.reasoning = s.reasoning.slice(0, 500); }),
    updateSettings: (newS) => set((s) => { Object.assign(s.settings, newS); }),
    setMood: (m) => set((s) => { s.mood = m; }),
    setStress: (l) => set((s) => { s.stressLevel = Math.max(0, Math.min(10, l)); }),
    incrementCycle: () => set((s) => { s.cycle++; }),
    resetAll: () => set((s) => {
      s.cycle = 0; s.positions = []; s.trades = []; s.reasoning = [];
      s.pnlHistory = []; s.mood = 'neutral'; s.stressLevel = 0; s.streak = 0;
      s.totalPnl = 0; s.winCount = 0; s.lossCount = 0; s.marketStudyComplete = false;
      s.marketStudyProgress = 0; s.marketStudyData = {}; s.backtestResults = {};
      s.backtestComplete = false; s.backtestProgress = 0; s.coinProfiles = {};
      s.strategyWeights = { BOS: 1, CHoCH: 1, TREND: 1, SCALP: 1, FVG: 1, DIVERGENCE: 1 };
      s.lastRefreshTime = 0; s.settings = { ...defSettings }; s.isRunning = false;
    }),
    setMarketStudyComplete: (c) => set((s) => { s.marketStudyComplete = c; }),
    setMarketStudyProgress: (p) => set((s) => { s.marketStudyProgress = p; }),
    setMarketStudyData: (d) => set((s) => { s.marketStudyData = d; }),
    setBacktestResults: (r) => set((s) => { s.backtestResults = r; }),
    setBacktestComplete: (c) => set((s) => { s.backtestComplete = c; }),
    setBacktestProgress: (p) => set((s) => { s.backtestProgress = p; }),
    applyBacktestLearnings: (results) => set((s) => {
      const flat = Object.values(results).flat();
      const bySym: Record<string, BacktestResult[]> = {};
      flat.forEach(r => { if (!bySym[r.symbol]) bySym[r.symbol] = []; bySym[r.symbol].push(r); });
      for (const [sym, res] of Object.entries(bySym)) {
        res.sort((a, b) => b.totalPnl - a.totalPnl || b.winRate - a.winRate);
        const best = res[0]; if (!best) continue;
        s.coinProfiles[sym] = { symbol: sym, bestStrategy: best.strategy, bestWinRate: Math.round(best.winRate * 100), optimalTP: Math.abs(best.bestTrade) * 1.5, optimalSL: Math.abs(best.worstTrade) * 1.2, avgVolatility: res.reduce((sum, r) => sum + Math.abs(r.avgTrade), 0) / res.length, lastUpdated: Date.now() };
      }
      const byStrat: Record<string, { pnl: number; trades: number }> = {};
      flat.forEach(r => { if (!byStrat[r.strategy]) byStrat[r.strategy] = { pnl: 0, trades: 0 }; byStrat[r.strategy].pnl += r.totalPnl; byStrat[r.strategy].trades += r.trades; });
      let maxPnl = -Infinity;
      Object.values(byStrat).forEach(v => { if (v.pnl > maxPnl) maxPnl = v.pnl; });
      if (maxPnl <= 0) maxPnl = 1;
      for (const [strat, v] of Object.entries(byStrat)) {
        s.strategyWeights[strat] = Math.max(0.3, Math.min(2.0, 0.5 + 0.5 * (v.pnl / maxPnl)));
      }
    }),
    setCoinProfiles: (p) => set((s) => { s.coinProfiles = p; }),
    updateStrategyWeights: (w) => set((s) => { Object.assign(s.strategyWeights, w); }),
    setLastRefreshTime: (t) => set((s) => { s.lastRefreshTime = t; }),
    addNotification: (n) => set((s) => { s.notifications.unshift(n); if (s.notifications.length > 100) s.notifications = s.notifications.slice(0, 100); }),
    markNotificationRead: (id) => set((s) => { const n = s.notifications.find(x => x.id === id); if (n) n.read = true; }),
    clearNotifications: () => set((s) => { s.notifications = []; }),
  }), { name: 'alex-v10', partialize: (s) => ({
    cycle: s.cycle, positions: s.positions, trades: s.trades, reasoning: s.reasoning,
    pnlHistory: s.pnlHistory, mood: s.mood, stressLevel: s.stressLevel, streak: s.streak,
    totalPnl: s.totalPnl, winCount: s.winCount, lossCount: s.lossCount,
    marketStudyComplete: s.marketStudyComplete, marketStudyProgress: s.marketStudyProgress,
    marketStudyData: s.marketStudyData, backtestResults: s.backtestResults,
    backtestComplete: s.backtestComplete, backtestProgress: s.backtestProgress,
    coinProfiles: s.coinProfiles, strategyWeights: s.strategyWeights,
    lastRefreshTime: s.lastRefreshTime, settings: s.settings, notifications: s.notifications,
  })}))
);
