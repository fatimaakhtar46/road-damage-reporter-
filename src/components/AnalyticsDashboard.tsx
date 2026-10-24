import React from 'react';
import { RoadDamageReport } from '../types/damage';
import {
  BarChart3,
  TrendingDown,
  AlertOctagon,
  Clock,
  DollarSign,
  Download,
  CheckCircle,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  reports: RoadDamageReport[];
  onSelectReport: (report: RoadDamageReport) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  reports,
  onSelectReport,
}) => {
  const totalReports = reports.length;
  const criticalCount = reports.filter((r) => r.overallSeverity === 'Critical').length;
  const highCount = reports.filter((r) => r.overallSeverity === 'High').length;
  const mediumCount = reports.filter((r) => r.overallSeverity === 'Medium').length;
  const lowCount = reports.filter((r) => r.overallSeverity === 'Low').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const totalRepairCost = reports.reduce((acc, curr) => {
    if (curr.status === 'Resolved') return acc;
    return acc + (curr.recommendedRepair?.estimatedCostUsd || 0);
  }, 0);

  // Calculate Average Pavement Condition Index (PCI) starting from 100 base
  const totalDeduct = reports.reduce((acc, curr) => acc + (curr.pciDeductionScore || 0), 0);
  const avgDeduct = totalReports > 0 ? totalDeduct / totalReports : 0;
  const networkPciScore = Math.max(10, Math.min(100, Math.round(100 - avgDeduct)));

  // Categorize defects
  const defectCounts: Record<string, number> = {};
  reports.forEach((r) => {
    defectCounts[r.primaryDefectType] = (defectCounts[r.primaryDefectType] || 0) + 1;
  });

  const handleExportCSV = () => {
    const headers = [
      'Report ID',
      'Timestamp',
      'Defect Type',
      'Severity',
      'Hazard Rating',
      'Status',
      'Location',
      'Latitude',
      'Longitude',
      'Est Cost USD',
      'Repair Method',
      'Work Order ID',
    ];

    const rows = reports.map((r) => [
      r.id,
      r.timestamp,
      `"${r.primaryDefectType}"`,
      r.overallSeverity,
      r.hazardRating,
      r.status,
      `"${r.locationAddress.replace(/"/g, '""')}"`,
      r.lat,
      r.lng,
      r.recommendedRepair.estimatedCostUsd,
      `"${r.recommendedRepair.method.replace(/"/g, '""')}"`,
      r.workOrder ? r.workOrder.workOrderId : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `road_damage_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(reports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `road_damage_records_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with PCI Score & High-level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Network PCI Score Gauge */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Network PCI Health</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-extrabold font-mono tabular-nums ${
                networkPciScore >= 80
                  ? 'text-emerald-400'
                  : networkPciScore >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {networkPciScore}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            {networkPciScore >= 80
              ? 'Good Pavement Condition'
              : networkPciScore >= 60
              ? 'Fair Condition (Maintenance Required)'
              : 'Poor / Structural Deterioration'}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                networkPciScore >= 80
                  ? 'bg-emerald-500'
                  : networkPciScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${networkPciScore}%` }}
            />
          </div>
        </div>

        {/* Critical Hazards KPI */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Critical Road Hazards</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-rose-400 tabular-nums">
              {criticalCount}
            </span>
            <span className="text-xs text-neutral-500">active sites</span>
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            Immediate dispatch SLA (tire & rim danger)
          </div>
        </div>

        {/* Estimated Backlog Budget */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Est. Repair Backlog</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-emerald-400 tabular-nums">
              ${totalRepairCost.toLocaleString()}
            </span>
            <span className="text-xs text-neutral-500">USD</span>
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            For {totalReports - resolvedCount} outstanding road repairs
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Resolved Repairs</span>
            <CheckCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-sky-400 tabular-nums">
              {resolvedCount}
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              / {totalReports} total
            </span>
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            {totalReports > 0
              ? `${Math.round((resolvedCount / totalReports) * 100)}% repair completion rate`
              : '0% completed'}
          </div>
        </div>
      </div>

      {/* Breakdown Section: Left Defect Distribution / Right Export & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Defect Distribution Chart & Severity Bars */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Pavement Distress Distribution</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(defectCounts).map(([type, count]) => {
              const pct = totalReports > 0 ? (count / totalReports) * 100 : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-200">{type}</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Severity Distribution
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                  {criticalCount}
                </div>
                <div className="text-[10px] text-rose-300 font-medium">Critical</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                  {highCount}
                </div>
                <div className="text-[10px] text-amber-300 font-medium">High</div>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-lg font-bold font-mono text-orange-400 tabular-nums">
                  {mediumCount}
                </div>
                <div className="text-[10px] text-orange-300 font-medium">Medium</div>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                  {lowCount}
                </div>
                <div className="text-[10px] text-sky-300 font-medium">Low</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Municipal Export & Dispatch Reports */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Municipal Export & GIS Synchronization</span>
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Export standardized road distress datasets for integration with Department of Transportation GIS software (ArcGIS, QGIS) and City Works work-order dispatch systems.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold">Export GIS Damage Manifest (CSV)</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {totalReports} records
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Export Full AI Inspection Payload (JSON)</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  Complete telemetry
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800 text-xs text-neutral-400 space-y-1">
            <div className="font-semibold text-neutral-300">
              ASTM D6433 Compliance Note
            </div>
            <p className="text-[11px] leading-relaxed">
              All deduct points adhere to the Standard Practice for Roads and Parking Lots Pavement Condition Index Surveys.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Inspection Log Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-bold text-white mb-3">
          Road Distress Log Registry
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Ticket ID</th>
                <th className="py-2.5 px-3">Defect Type</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Hazard</th>
                <th className="py-2.5 px-3 text-right">Est. Cost</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                  onClick={() => onSelectReport(report)}
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-amber-400">
                    {report.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {report.primaryDefectType}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400 truncate max-w-[200px]">
                    {report.locationAddress}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        report.overallSeverity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : report.overallSeverity === 'High'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {report.overallSeverity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right tabular-nums text-neutral-200">
                    {report.hazardRating}/10
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right tabular-nums text-emerald-400">
                    ${report.recommendedRepair.estimatedCostUsd}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                    {report.status.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReport(report);
                      }}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
