import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from './components/Sidebar';
import HubPage from './pages/HubPage';
import PaperTradingPage from './pages/PaperTradingPage';
import StrategiesPage from './pages/StrategiesPage';
import SECFilingsPage from './pages/SECFilingsPage';
import GlobalHeatmapPage from './pages/GlobalHeatmapPage';
import AutomationHubPage from './pages/AutomationHubPage';
import QuantDashboard from './pages/QuantDashboard';
import MacroRegime from './pages/MacroRegime';
import WorldIntel from './pages/WorldIntel';
import Terminal from './pages/Terminal';
import ResearchQueue from './pages/ResearchQueue';
import Approvals from './pages/Approvals';
import SystemHealth from './pages/SystemHealth';
import AutomationV1 from './pages/AutomationV1';
import AutomationV2 from './pages/AutomationV2';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('modern'); // 'modern', 'wellington', or 'nautical'

  const modeClass = viewMode === 'wellington' ? 'wellington-mode' : viewMode === 'nautical' ? 'nautical-mode' : '';

  return (
    <div className={`app-container ${modeClass}`}>
      <BrowserRouter>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<HubPage viewMode={viewMode} />} />
            <Route path="/paper-trading" element={<PaperTradingPage viewMode={viewMode} />} />
            <Route path="/strategies" element={<StrategiesPage viewMode={viewMode} />} />
            <Route path="/sec-filings" element={<SECFilingsPage viewMode={viewMode} />} />
            <Route path="/heatmap" element={<GlobalHeatmapPage viewMode={viewMode} />} />
            <Route path="/quant" element={<QuantDashboard viewMode={viewMode} />} />
            <Route path="/macro" element={<MacroRegime viewMode={viewMode} />} />
            <Route path="/intel" element={<WorldIntel viewMode={viewMode} />} />
            <Route path="/terminal" element={<Terminal viewMode={viewMode} />} />
            <Route path="/research" element={<ResearchQueue viewMode={viewMode} />} />
            <Route path="/approvals" element={<Approvals viewMode={viewMode} />} />
            <Route path="/health" element={<SystemHealth viewMode={viewMode} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/automation-hub" element={<AutomationHubPage viewMode={viewMode} />} />
            <Route path="/funds-paper-trading" element={<PaperTradingPage viewMode={viewMode} />} />
            <Route path="/automation-v1" element={<AutomationV1 viewMode={viewMode} />} />
            <Route path="/automation-v2" element={<AutomationV2 viewMode={viewMode} />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
