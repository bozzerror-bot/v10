import { useEffect, useState, useRef } from 'react';
import { useAlexStore } from '../store/useAlexStore';

const WS_URL = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';
const REST_URL = 'https://api.binance.com/api/v3/ticker/24hr';

export function useBinancePrices() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coinsRef = useRef(useAlexStore.getState().coins.map(c => c.symbol));

  useEffect(() => {
    coinsRef.current = useAlexStore.getState().coins.map(c => c.symbol);
  }, [useAlexStore.getState().coins.length]);

  function updatePrices(data: any[]) {
    const store = useAlexStore.getState();
    for (const t of data) {
      if (!t || !t.s) continue;
      const sym = t.s as string;
      const price = parseFloat(t.c);
      if (price > 0) {
        store.updatePrice(sym, price);
        store.addPriceHistory(sym, price);
      }
    }
  }

  function connectWS() {
    try {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => { setConnected(true); };
      ws.onmessage = (e) => {
        try { const data = JSON.parse(e.data); if (Array.isArray(data)) updatePrices(data); } catch {}
      };
      ws.onerror = () => { setConnected(false); };
      ws.onclose = () => { setConnected(false); if (retryRef.current) clearTimeout(retryRef.current); retryRef.current = setTimeout(connectWS, 5000); };
      wsRef.current = ws;
    } catch { setConnected(false); }
  }

  async function fetchREST() {
    try {
      const r = await fetch(REST_URL); if (!r.ok) return;
      const data = await r.json(); if (!Array.isArray(data)) return;
      const store = useAlexStore.getState();
      for (const t of data) {
        const sym = t.symbol as string;
        if (!store.settings.selectedCoins.includes(sym)) continue;
        const price = parseFloat(t.lastPrice); if (price > 0) {
          store.updatePrice(sym, price); store.addPriceHistory(sym, price);
        }
      }
    } catch {}
  }

  useEffect(() => {
    connectWS();
    const restIv = setInterval(() => { if (!connected) fetchREST(); }, 5000);
    return () => { wsRef.current?.close(); clearInterval(restIv); if (retryRef.current) clearTimeout(retryRef.current); };
  }, []);

  return { connected };
}
