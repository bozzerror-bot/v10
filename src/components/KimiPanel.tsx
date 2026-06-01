import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MessageCircle, TrendingUp, Brain, AlertTriangle } from 'lucide-react';
import { useAlexStore } from '../store/useAlexStore';

export default function KimiPanel() {
  const [open, setOpen] = useState(false);
  const store = useAlexStore();
  const [messages, setMessages] = useState<{ q: string; a: string }[]>([]);
  const openPos = store.positions.filter(p => p.status === 'open').length;

  function ask(q: string) {
    let a = '';
    switch (q) {
      case 'How is Alex?': a = `Alex is feeling **${store.mood}**. Stress level: ${store.stressLevel}/10. Open positions: ${openPos}. Total P&L: $${store.totalPnl.toFixed(2)}.`; break;
      case 'Best strategy?': { const best = Object.entries(store.strategyWeights).sort(([, a], [, b]) => b - a)[0]; a = best ? `Best strategy: **${best[0]}** (weight: ${best[1].toFixed(2)}). ${store.coinProfiles['BTCUSDT'] ? `Best for BTC: ${store.coinProfiles['BTCUSDT'].bestStrategy}` : ''}` : 'Run a backtest to find the best strategy.'; } break;
      case 'Any risks?': a = store.stressLevel > 6 ? `⚠️ High stress (${store.stressLevel}/10). Consider reducing position sizes.` : store.lossCount > store.winCount ? `⚠️ More losses (${store.lossCount}) than wins (${store.winCount}). Review your strategies.` : '✅ Risk levels are normal.'; break;
      case 'Start trading': { store.setIsRunning(true); store.updateSettings({ tradingEnabled: true }); a = '✅ Trading started!'; } break;
      default: a = `Current status: ${store.mood}, P&L: $${store.totalPnl.toFixed(2)}, ${openPos} open positions.`;
    }
    setMessages(prev => [{ q, a }, ...prev]);
  }

  return (
    <>
      <motion.button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        {open ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-20 right-4 z-50 w-80 bg-[#0a0a12] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center"><Zap className="w-4 h-4 text-indigo-400" /></div><span className="text-sm font-semibold">Kimi AI</span></div>
              <button onClick={() => setOpen(false)} className="text-[#475569] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><Brain className="w-3 h-3 text-violet-400" /><span className="text-[#475569]">Mood:</span><span className="text-white">{store.mood}</span></div>
                <div className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-amber-400" /><span className="text-[#475569]">Stress:</span><div className="flex-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${store.stressLevel * 10}%` }} /></div></div>
                <div className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-[#475569]">P&L:</span><span className={store.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${store.totalPnl.toFixed(2)}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['How is Alex?', 'Best strategy?', 'Any risks?', 'Start trading'].map(q => (
                  <button key={q} onClick={() => ask(q)} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] hover:bg-indigo-500/20 transition-colors">{q}</button>
                ))}
              </div>
              {messages.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {messages.map((m, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg p-2.5 text-xs space-y-1">
                      <p className="text-[#475569] font-medium">{m.q}</p>
                      <p className="text-white" dangerouslySetInnerHTML={{ __html: m.a.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
