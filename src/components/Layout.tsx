import { useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  BrainCircuit,
  Droplets,
  FileSpreadsheet,
  GitBranch,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { SCENARIO_CONFIGS } from '../data/workflowData';
import type { DataSourceMode, PageId, ScenarioId, WaterStatus } from '../types/water';

interface LayoutProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  scenario: ScenarioId;
  onChangeScenario: (scenario: ScenarioId) => void;
  dataSource: DataSourceMode;
  overallStatus: WaterStatus;
  activeAlertCount: number;
  onRunAI: () => void;
  isAnalyzingAI: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home Page', icon: Home },
  { id: 'dashboard', label: 'Monitoring Dashboard', icon: Activity },
  { id: 'quality', label: 'Water Quality Analysis', icon: Droplets },
  { id: 'pipeline', label: 'Pipeline Monitoring', icon: GitBranch },
  { id: 'ai', label: 'AI Prediction & Advice', icon: BrainCircuit },
  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'about', label: 'About Project', icon: BookOpen },
];

export function Layout({
  activePage,
  onNavigate,
  scenario,
  onChangeScenario,
  dataSource,
  overallStatus,
  activeAlertCount,
  onRunAI,
  isAnalyzingAI,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((n) => n.id === activePage) ?? NAV_ITEMS[0];

  const handleNavClick = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 py-5 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-600 text-white shrink-0">
            <Droplets className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <div className="font-display font-bold text-base tracking-tight text-slate-900 leading-tight">
              HydroGuard AI
            </div>
            <div className="text-xs text-slate-500">Smart Water Supply</div>
          </div>
        </button>
      </div>

      <nav aria-label="Primary Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                isActive
                  ? 'bg-sky-50 text-sky-800'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'alerts' && activeAlertCount > 0 && (
                <span
                  className={`font-mono tabular-nums text-xs font-semibold px-1.5 py-0.5 rounded ${
                    overallStatus === 'Critical'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {activeAlertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Telemetry Mode</span>
          <span className="font-medium text-slate-900">
            {dataSource === 'hardware' ? 'Live Hardware' : 'Demo Simulation'}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>System State</span>
          <span
            className={`font-semibold ${
              overallStatus === 'Critical'
                ? 'text-red-700'
                : overallStatus === 'Warning'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }`}
          >
            {overallStatus}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-3 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, scenario selector + 1 primary CTA on right */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="hidden sm:inline text-slate-500 whitespace-nowrap">
                Smart Water System
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {currentNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="global-scenario-select" className="sr-only">
              Select Simulation Scenario
            </label>
            <select
              id="global-scenario-select"
              value={scenario}
              onChange={(e) => onChangeScenario(e.target.value as ScenarioId)}
              disabled={dataSource === 'hardware'}
              className="hidden sm:block h-9 px-3 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:opacity-50"
            >
              {Object.entries(SCENARIO_CONFIGS).map(([id, cfg]) => (
                <option key={id} value={id}>
                  Scenario: {cfg.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onRunAI}
              disabled={isAnalyzingAI}
              className="h-9 px-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              <BrainCircuit className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAnalyzingAI ? 'Analyzing...' : 'Run AI Analysis'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
