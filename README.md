# Alex AI Trading Bot V10

> AI-powered cryptocurrency scalping bot using Smart Money Concepts (SMC) strategies. Dark-themed dashboard with animated Jarvis-style AI avatar, real-time Binance data, and zero fake/simulated data.

## Live Demo

**Deployed at:** https://sxj3rmhg2hbca.ok.kimi.link

## Features

- **6 SMC Strategies:** Break of Structure (BOS), Change of Character (CHoCH), EMA Trend Follow, RSI Scalp, Fair Value Gap (FVG), RSI Divergence
- **Real Binance Data:** Live price feeds via WebSocket + REST API, real candlestick charts, real trade logs
- **Zero Fake Data:** Every number, chart, and log entry comes from real market data or actual trade execution
- **Jarvis AI Avatar:** Animated breathing/pulsing avatar with mood-based color changes
- **Strategy Lab:** Backtest all 6 strategies on real historical data with self-learning weight optimization
- **Market Study:** Multi-timeframe analysis (15m, 1h, 4h) across all 20 coins
- **Signal Queue:** Manual approval mode for risk-averse trading
- **Kimi AI Panel:** Floating AI assistant with real-time status and quick actions
- **Password-Locked Settings:** "Jassim is watching you" overlay with password "Bozzerror"
- **Data Persistence:** All trades, positions, and settings survive page refresh (localStorage)
- **Auto-Trading:** Trades execute automatically when signals meet confidence threshold (>= 70%)
- **Adaptive TP/SL:** Minimum 1:2 risk/reward enforced on every trade
- **1-Hour Refresh Cycle:** Automatic strategy confidence re-evaluation every hour

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS v3 + shadcn/ui
- Zustand (state management with persist middleware)
- Framer Motion (animations)
- Recharts (P&L chart)
- lightweight-charts v5 (candlestick charts)
- Binance API (price feeds + klines)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### Option 2: GitHub + Vercel
1. Push this repo to GitHub
2. Connect repo to Vercel dashboard
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

## Project Structure

```
src/
  store/
    useAlexStore.ts       # Zustand store - all state + persistence
  hooks/
    useTradingEngine.ts   # Trading engine - 6 strategies + scan loop
    useBinancePrices.ts   # Binance WebSocket + REST price feed
  pages/
    Dashboard.tsx         # Main dashboard - Jarvis, P&L, radar, positions
    Chart.tsx             # Candlestick chart - real Binance klines
    Logs.tsx              # Trade logs - real data only
    Study.tsx             # Market study - multi-timeframe analysis
    StrategyLab.tsx       # Backtest + self-learning strategy weights
    Settings.tsx          # Password-locked settings panel
  components/
    KimiPanel.tsx         # Floating AI assistant
  App.tsx                 # Router with all routes
  main.tsx                # Entry point with BrowserRouter
```

## 20 Supported Coins

BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, LINK, DOT, MATIC, LTC, UNI, ATOM, ETC, FIL, ARB, OP, SUI, TIA

## Strategy Details

| Strategy | Key | Confidence | Best For |
|----------|-----|------------|----------|
| Break of Structure | BOS | 72% | Trend continuation |
| Change of Character | CHoCH | 68% | Trend reversal |
| EMA Trend Follow | TREND | 65% | Strong trends |
| RSI Scalp | SCALP | 60% | Oversold/overbought |
| Fair Value Gap | FVG | 67% | Gap fills |
| RSI Divergence | DIVERGENCE | 62% | Reversals |

## Important Notes

1. **CORS:** Binance API blocks browser requests from some static hosts. For production, consider a backend proxy.
2. **Paper Trading:** Connect to `testnet.binancefuture.com` for risk-free real-order testing.
3. **This is a frontend dashboard.** Actual trade execution requires a backend with API key authentication.
4. **All data is real** - no simulated or fake data anywhere in the codebase.

## Version History

- **V10** (current): 6 strategies, zero fake data, password lock, Kimi AI panel, 1h refresh
- V9: Signal queue, notifications, coin profiles
- V8: Dark theme, Jarvis avatar, adaptive TP/SL
- V7: Multi-strategy engine, Kelly sizing
- V6-V1: Earlier prototypes

## License

MIT - Built with passion for the crypto trading community.
