import { Routes, Route } from 'react-router'
import Dashboard from './pages/Dashboard'
import Chart from './pages/Chart'
import Logs from './pages/Logs'
import Study from './pages/Study'
import StrategyLab from './pages/StrategyLab'
import Settings from './pages/Settings'
import KimiPanel from './components/KimiPanel'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chart" element={<Chart />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/study" element={<Study />} />
        <Route path="/lab" element={<StrategyLab />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <KimiPanel />
    </>
  )
}
