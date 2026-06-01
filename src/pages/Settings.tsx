import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Unlock, Eye, EyeOff, AlertTriangle, Trash2, Settings as St } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAlexStore, COINS } from '../store/useAlexStore';

export default function Settings() {
  const nav = useNavigate();
  const store = useAlexStore();
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showApi, setShowApi] = useState(false);

  function checkPwd() { if (pwd.toLowerCase() === 'bozzerror') { setUnlocked(true); setErr(false); } else { setErr(true); } }

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0]">
      {!unlocked && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a12] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
            <Lock className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-red-500">Jassim is watching you</h2>
            <p className="text-xs text-[#475569]">Enter password to access settings</p>
            <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setErr(false); }} onKeyDown={e => e.key === 'Enter' && checkPwd()} className={`w-full bg-[#1a1a2e] border ${err ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50`} placeholder="Password..." />
            {err && <p className="text-xs text-red-400">Wrong password</p>}
            <button onClick={checkPwd} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Unlock</button>
          </motion.div>
        </div>
      )}
      <div className={`max-w-2xl mx-auto p-4 md:p-6 space-y-5 ${!unlocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <div className="flex items-center gap-3"><button onClick={() => nav('/')} className="text-[#475569] hover:text-white"><ArrowLeft className="w-5 h-5" /></button><St className="w-5 h-5 text-amber-400" /><h1 className="text-lg font-bold">Settings</h1></div>
        <div className="bg-[#0a0a12] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div><label className="text-xs text-[#475569] block mb-1">Bot Name</label><input value={store.settings.name} onChange={e => store.updateSettings({ name: e.target.value })} className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-[#475569] block mb-1">Risk Tolerance: {store.settings.riskTolerance}</label><input type="range" min={1} max={10} value={store.settings.riskTolerance} onChange={e => store.updateSettings({ riskTolerance: +e.target.value })} className="w-full accent-sky-500" /></div>
          <div><label className="text-xs text-[#475569] block mb-1">Max Leverage: {store.settings.maxLeverage}x</label><input type="range" min={1} max={20} value={store.settings.maxLeverage} onChange={e => store.updateSettings({ maxLeverage: +e.target.value })} className="w-full accent-sky-500" /></div>
          <div><label className="text-xs text-[#475569] block mb-1">Entry Size (USDT)</label><input type="number" value={store.settings.entrySize} onChange={e => store.updateSettings({ entrySize: +e.target.value })} className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-[#475569] block mb-1">Default Timeframe</label><select value={store.settings.interval} onChange={e => store.updateSettings({ interval: e.target.value })} className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-lg px-3 py-2 text-sm">{['1m', '5m', '15m', '1h', '4h'].map(tf => <option key={tf} value={tf}>{tf}</option>)}</select></div>
          <div className="flex items-center justify-between"><span className="text-sm">Auto-Trade</span><button onClick={() => store.updateSettings({ autoTrade: !store.settings.autoTrade })} className={`w-12 h-6 rounded-full transition-colors ${store.settings.autoTrade ? 'bg-emerald-500' : 'bg-[#1a1a2e]'}`}><div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${store.settings.autoTrade ? 'translate-x-6' : 'translate-x-0.5'}`} /></button></div>
          <div className="flex items-center justify-between"><span className="text-sm">Notifications</span><button onClick={() => store.updateSettings({ notificationsEnabled: !store.settings.notificationsEnabled })} className={`w-12 h-6 rounded-full transition-colors ${store.settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-[#1a1a2e]'}`}><div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${store.settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} /></button></div>
          <div><label className="text-xs text-[#475569] block mb-1">Selected Coins</label><div className="grid grid-cols-4 gap-2">{COINS.map(c => (
            <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="checkbox" checked={store.settings.selectedCoins.includes(c)} onChange={e => store.updateSettings({ selectedCoins: e.target.checked ? [...store.settings.selectedCoins, c] : store.settings.selectedCoins.filter(x => x !== c) })} className="accent-sky-500" />{c.replace('USDT', '')}</label>
          ))}</div></div>
          <div className="relative"><label className="text-xs text-[#475569] block mb-1">API Key</label><input type={showApi ? 'text' : 'password'} value={store.settings.apiKey} onChange={e => store.updateSettings({ apiKey: e.target.value })} className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-lg px-3 py-2 text-sm pr-10" /><button onClick={() => setShowApi(!showApi)} className="absolute right-3 top-7 text-[#475569]">{showApi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
          <div className="relative"><label className="text-xs text-[#475569] block mb-1">API Secret</label><input type={showApi ? 'text' : 'password'} value={store.settings.apiSecret} onChange={e => store.updateSettings({ apiSecret: e.target.value })} className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-lg px-3 py-2 text-sm pr-10" /></div>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Danger Zone</h3>
          {!confirmReset ? <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"><Trash2 className="w-4 h-4" />Reset All Data</button> : (
            <div className="space-y-2"><p className="text-xs text-red-400">Are you sure? This will delete all trades, positions, and settings.</p><div className="flex gap-2"><button onClick={() => { store.resetAll(); setConfirmReset(false); }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Confirm Reset</button><button onClick={() => setConfirmReset(false)} className="px-4 py-2 bg-[#1a1a2e] text-[#94a3b8] rounded-lg text-sm">Cancel</button></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
