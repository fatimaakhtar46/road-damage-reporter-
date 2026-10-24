import React, { useState, useEffect } from 'react';
import { RoadDamageReport, SeverityLevel } from './types/damage';
import { INITIAL_ROAD_REPORTS } from './data/mockReports';
import { RoadDamageMap } from './components/RoadDamageMap';
import { RoadScannerPanel } from './components/RoadScannerPanel';
import { ReportInspectorView } from './components/ReportInspectorView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SurveySimulationMode } from './components/SurveySimulationMode';
import {
  MapPin,
  Camera,
  FileText,
  Truck,
  BarChart3,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

type TabView = 'map' | 'scanner' | 'reports' | 'workorders' | 'analytics' | 'simulation';

export default function App() {
  const [reports, setReports] = useState<RoadDamageReport[]>(() => {
    const saved = localStorage.getItem('road_damage_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved reports:', e);
      }
    }
    return INITIAL_ROAD_REPORTS;
  });

  const [activeTab, setActiveTab] = useState<TabView>('map');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerPresetIndex, setScannerPresetIndex] = useState<number | undefined>(undefined);
  const [vehiclePosition, setVehiclePosition] = useState<{ lat: number; lng: number; heading: number } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('road_damage_reports', JSON.stringify(reports));
  }, [reports]);

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const handleCreateReport = (newReport: RoadDamageReport) => {
    setReports((prev) => [newReport, ...prev]);
    setSelectedReportId(newReport.id);
    setIsScannerOpen(false);
    setActiveTab('reports');
  };

  const handleUpdateReport = (updated: RoadDamageReport) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleOpenScannerWithPreset = (index: number) => {
    setScannerPresetIndex(index);
    setIsScannerOpen(true);
    setActiveTab('scanner');
  };

  const filteredReports = reports.filter((report) => {
    const matchesSeverity = severityFilter === 'All' || report.overallSeverity === severityFilter;
    const matchesSearch =
      searchQuery === '' ||
      report.primaryDefectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.locationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const activeWorkOrdersCount = reports.filter(
    (r) => r.status === 'Dispatched' || r.status === 'In_Progress'
  ).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Contract: 3 zones, single line */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 border-b border-neutral-800/90 bg-neutral-950/85 backdrop-blur-xl">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-black text-base shadow-sm">
            RD
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            Road Damage Reporter
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'map' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            GIS Hazard Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'scanner' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            AI Scanner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'reports' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Distress Inspections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workorders')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'workorders' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Municipal Work Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'analytics' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            PCI Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'simulation' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Survey Drive Mode
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('scanner');
              setIsScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-black bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 shadow-sm active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Road Damage</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Workspace Toolbar: Search, Filters, and Tab Indicators */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-neutral-900/60 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search street, defect type, or ticket ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Interactive Filter Tabs (functional segmented controls per frontend constitution) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  severityFilter === sev
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {sev === 'All' ? 'All Severities' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: GIS Hazard Map & Quick List */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Map */}
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Municipal GIS Heat & Distress Distribution Layer</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{filteredReports.length} Active Pins</span>
                  </div>
                </div>

                <RoadDamageMap
                  reports={filteredReports}
                  selectedReportId={selectedReportId}
                  onSelectReport={(rep) => {
                    setSelectedReportId(rep.id);
                  }}
                  activeFilterSeverity={severityFilter}
                  vehicleLocation={vehiclePosition}
                  className="w-full h-[520px]"
                />
              </div>

              {/* Right Column: Selected Damage Quick Card & Pavement Registry */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {selectedReport ? (
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <div>
                        <span className="text-[11px] font-mono text-neutral-400 block">
                          {selectedReport.id}
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {selectedReport.primaryDefectType}
                        </h3>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          selectedReport.overallSeverity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : selectedReport.overallSeverity === 'High'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {selectedReport.overallSeverity}
                      </span>
                    </div>

                    <div className="aspect-[16/10] w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                      <img
                        src={selectedReport.imageUrl}
                        alt={selectedReport.primaryDefectType}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="text-xs text-neutral-400 line-clamp-2">
                      {selectedReport.summary}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                        <span className="text-neutral-500 block text-[10px]">Hazard Rating</span>
                        <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                          {selectedReport.hazardRating} / 10
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                        <span className="text-neutral-500 block text-[10px]">Est. Cost</span>
                        <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                          ${selectedReport.recommendedRepair.estimatedCostUsd}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Full Civil Engineering Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 text-center text-xs text-neutral-500">
                    Select a pin on the map to inspect defect metrics.
                  </div>
                )}

                {/* Quick List Strip */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Priority Road Hazards ({filteredReports.length})
                  </div>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {filteredReports.slice(0, 5).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReportId(r.id)}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between border ${
                          selectedReportId === r.id
                            ? 'bg-amber-500/10 border-amber-500/40 text-neutral-100'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-white block truncate">
                            {r.primaryDefectType}
                          </span>
                          <span className="text-[10px] text-neutral-500 block truncate">
                            {r.locationAddress}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-amber-400 tabular-nums shrink-0">
                          {r.hazardRating}/10
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Scanner & Camera Capture */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <RoadScannerPanel
              onReportCreated={handleCreateReport}
              initialPresetIndex={scannerPresetIndex}
            />
          </div>
        )}

        {/* Tab 3: Detailed Technical Distress Inspector */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {selectedReport ? (
              <ReportInspectorView
                report={selectedReport}
                onUpdateReport={handleUpdateReport}
              />
            ) : (
              <div className="p-12 text-center text-neutral-500 rounded-2xl border border-neutral-800">
                No report selected. Choose one from the map or scan a new pothole.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Municipal Work Orders & Dispatch */}
        {activeTab === 'workorders' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-sky-400" />
                    <span>Municipal Asphalt Maintenance Dispatch Console</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Field crew allocations, traffic management plans, and work-order progression
                  </p>
                </div>
                <div className="text-xs font-mono text-neutral-300">
                  <span>Active Dispatches: </span>
                  <span className="font-bold text-sky-400">{activeWorkOrdersCount}</span>
                </div>
              </div>

              {/* Work Order Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {reports
                  .filter((r) => r.workOrder || r.status !== 'Reported')
                  .map((report) => (
                    <div
                      key={report.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-sky-400">
                            {report.workOrder?.workOrderId || 'PENDING DISPATCH'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              report.status === 'Resolved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : report.status === 'In_Progress'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">
                          {report.primaryDefectType} Repair
                        </h4>
                        <div className="text-xs text-neutral-400 line-clamp-1">
                          {report.locationAddress}
                        </div>

                        {report.workOrder ? (
                          <div className="text-[11px] text-neutral-400 space-y-1 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60">
                            <div>
                              <strong className="text-neutral-300">Crew:</strong>{' '}
                              {report.workOrder.assignedCrew}
                            </div>
                            <div>
                              <strong className="text-neutral-300">Lead:</strong>{' '}
                              {report.workOrder.crewLead}
                            </div>
                            <div>
                              <strong className="text-neutral-300">Scheduled:</strong>{' '}
                              <span className="text-amber-400">{report.workOrder.scheduledDate}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-500 italic py-2">
                            Awaiting supervisor dispatch approval.
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                        <span className="font-mono text-emerald-400 tabular-nums">
                          ${report.recommendedRepair.estimatedCostUsd}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReportId(report.id);
                            setActiveTab('reports');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs"
                        >
                          View Work Order
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: PCI Analytics & Network Health */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            reports={reports}
            onSelectReport={(r) => {
              setSelectedReportId(r.id);
              setActiveTab('reports');
            }}
          />
        )}

        {/* Tab 6: Survey Vehicle Simulation */}
        {activeTab === 'simulation' && (
          <SurveySimulationMode
            onDamageDetected={handleCreateReport}
            onVehiclePositionChange={setVehiclePosition}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 px-6 py-4 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>Road Damage Reporter</span>
          <span aria-hidden="true">·</span>
          <span>ASTM D6433 Pavement Distress Standards</span>
          <span aria-hidden="true">·</span>
          <span>Powered by Gemini 3.8 Flash Vision</span>
        </div>
        <div className="text-neutral-500 font-mono text-[11px]">
          {reports.length} Road Assets Monitored
        </div>
      </footer>
    </div>
  );
}
