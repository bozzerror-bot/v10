import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardList, Download } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAlexStore } from '../store/useAlexStore';

type Filter = 'all' | 'open' | 'closed' | 'profitable' | 'loss';

export default function Logs() {
  const nav = useNavigate();
  const { trades, totalPnl, winCount, lossCount } = useAlexStore();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    let t = [...trades];
    switch (filter) { case 'open': t = t.filter(x => x.status === 'open'); break; case 'closed': t = t.filter(x => x.status === 'closed'); break; case 'profitable': t = t.filter(x => x.pnl > 0); break; case 'loss': t = t.filter(x => x.pnl < 0); break; }
    return t;
  }, [trades, filter]);

  const best = trades.length > 0 ? trades.reduce((a, b) => a.pnl > b.pnl ? a : b).pnl : 0;
  const worst = trades.length > 0 ? trades.reduce((a, b) => a.pnl < b.pnl ? a : b).pnl : 0;
  const wr = winCount + lossCount > 0 ? ((winCount / (winCount + lossCount)) * 100).toFixed(1) : '0';

  function exportJSON() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `alex-trades-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0] p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/')} className="text-[#475569] hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <ClipboardList className="w-5 h-5 text-sky-400" /><h1 className="text-lg font-bold">Trade Logs</h1>
        </div>
        <button onClick={exportJSON} className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a12] border border-white/[0.06] rounded-lg text-xs hover:border-white/20 transition-colors"><Download className="w-3 h-3" />Export</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {([['all', 'All'], ['open', 'Open'], ['closed', 'Closed'], ['profitable', 'Profitable'], ['loss', 'Loss']] as [Filter, string][]).map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-sky-500 text-white' : 'bg-[#0a0a12] border border-white/[0.06] text-[#94a3b8]'}`}>{l} ({f === 'all' ? trades.length : f === 'open' ? trades.filter(x => x.status === 'open').length : f === 'closed' ? trades.filter(x => x.status === 'closed').length : f === 'profitable' ? trades.filter(x => x.pnl > 0).length : trades.filter(x => x.pnl < 0).length})</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{ l: 'Total Trades', v: `${trades.length}` }, { l: 'Win Rate', v: `${wr}%` }, { l: 'Total P&L', v: `$${totalPnl.toFixed(2)}`, c: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' }, { l: 'Best', v: `+$${best.toFixed(2)}`, c: 'text-emerald-400' }, { l: 'Worst', v: `-$${Math.abs(worst).toFixed(2)}`, c: 'text-red-400' }].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-3">
            <div className="text-[10px] text-[#475569]">{s.l}</div>
            <div className={`text-sm font-bold ${s.c || 'text-white'}`}>{s.v}</div>
          </motion.div>
        ))}
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-16 text-[#475569]"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No trades yet.</p><p className="text-xs mt-1">Start trading to see real logs.</p></div>
      ) : (
        <div className="bg-[#0a0a12] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/[0.04] text-[#475569]"><th className="text-left px-3 py-2">Time</th><th className="text-left px-3 py-2">Symbol</th><th className="text-left px-3 py-2">Side</th><th className="text-right px-3 py-2">Price</th><th className="text-right px-3 py-2">Size</th><th className="text-right px-3 py-2">Lev</th><th className="text-right px-3 py-2">P&L</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Strategy</th><th className="text-left px-3 py-2">Reason</th></tr></thead>
              <tbody>{filtered.map(t => (
                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-[#475569]">{new Date(t.time).toLocaleString()}</td>
                  <td className="px-3 py-2 font-medium">{t.symbol.replace('USDT', '')}</td>
                  <td className={`px-3 py-2 font-semibold ${t.side === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side}</td>
                  <td className="px-3 py-2 text-right">${t.price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{t.size.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right">{t.leverage}x</td>
                  <td className={`px-3 py-2 text-right font-semibold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}</td>
                  <td className="px-3 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-amber-500/10 text-amber-400' : t.pnl > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{t.status}</span></td>
                  <td className="px-3 py-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">{t.strategy}</span></td>
                  <td className="px-3 py-2 text-[#475569]">{t.closeReason || '-'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
