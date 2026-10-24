import React, { useState } from 'react';
import {
  RoadDamageReport,
  ReportStatus,
  WorkOrder,
  BoundingBoxDefect,
} from '../types/damage';
import { DamageImageOverlay } from './DamageImageOverlay';
import {
  ShieldAlert,
  Wrench,
  Clock,
  DollarSign,
  AlertTriangle,
  FileText,
  Volume2,
  VolumeX,
  Truck,
  CheckCircle,
  Share2,
  ExternalLink,
  Layers,
  HardHat,
  ChevronRight,
} from 'lucide-react';

interface ReportInspectorViewProps {
  report: RoadDamageReport;
  onUpdateReport: (updated: RoadDamageReport) => void;
  onClose?: () => void;
}

export const ReportInspectorView: React.FC<ReportInspectorViewProps> = ({
  report,
  onUpdateReport,
  onClose,
}) => {
  const [activeDefectId, setActiveDefectId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [resolutionNoteInput, setResolutionNoteInput] = useState<string>(
    report.resolutionNotes || ''
  );
  const [showResolutionForm, setShowResolutionForm] = useState<boolean>(false);

  // Read out hazard summary with Web Speech API
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const speechText = `Road damage alert. ${report.primaryDefectType} detected at ${report.locationAddress}. Severity is ${report.overallSeverity}, with a hazard rating of ${report.hazardRating} out of 10. Recommended repair: ${report.recommendedRepair.method}. Estimated cost is $${report.recommendedRepair.estimatedCostUsd}. Response window is ${report.recommendedRepair.responseSla}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Generate official municipal work order
  const handleDispatchWorkOrder = async () => {
    try {
      setIsDispatching(true);
      const res = await fetch('/api/generate-work-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });

      if (!res.ok) throw new Error('Failed to generate work order');
      const workOrderData = await res.json();

      const newWorkOrder: WorkOrder = {
        ...workOrderData,
        dispatchedAt: new Date().toISOString(),
      };

      const updatedReport: RoadDamageReport = {
        ...report,
        status: 'Dispatched',
        workOrder: newWorkOrder,
      };

      onUpdateReport(updatedReport);
    } catch (err) {
      console.error('Work order generation error:', err);
      // Fallback local work order creation
      const fallbackWO: WorkOrder = {
        workOrderId: `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Department of Public Works - Pavement Maintenance',
        assignedCrew: 'Rapid Asphalt Patch Squad 4',
        crewLead: 'Supervisor Sarah Jenkins',
        scheduledDate: 'Tomorrow (Early Morning 06:30)',
        trafficManagementPlan: 'Single-lane taper closure with lighted arrow board',
        materialRequisition: [report.recommendedRepair.materials],
        equipmentRequired: report.recommendedRepair.equipment,
        estimatedDurationHours: report.recommendedRepair.laborHours,
        safetyPrecautions: ['ANSI Class 3 safety apparel', 'Intersection flagger'],
        dispatchNotes: 'Inspect adjacent pavement joints for micro-fractures.',
        dispatchedAt: new Date().toISOString(),
      };

      onUpdateReport({
        ...report,
        status: 'Dispatched',
        workOrder: fallbackWO,
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleUpdateStatus = (newStatus: ReportStatus) => {
    onUpdateReport({
      ...report,
      status: newStatus,
      resolutionNotes: resolutionNoteInput || report.resolutionNotes,
    });
    setShowResolutionForm(false);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Medium':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
      default:
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    }
  };

  const getStatusBadge = (st: ReportStatus) => {
    switch (st) {
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'In_Progress':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      case 'Dispatched':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'AI_Verified':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
      default:
        return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-neutral-400">
              <span className="font-mono font-semibold text-neutral-300">
                {report.id}
              </span>
              <span aria-hidden="true">·</span>
              <span>{report.locationAddress}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {new Date(report.timestamp).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{report.primaryDefectType} Inspection</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getSeverityBadge(
                  report.overallSeverity
                )}`}
              >
                {report.overallSeverity} Severity
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadge(
                  report.status
                )}`}
              >
                {report.status.replace('_', ' ')}
              </span>
            </h1>
          </div>

          {/* Quick Audio & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                isSpeaking
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
              title="Listen to audio briefing"
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
              <span>{isSpeaking ? 'Mute Briefing' : 'Audio Briefing'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const reportText = `ROAD DAMAGE REPORT [${report.id}]\nType: ${report.primaryDefectType}\nSeverity: ${report.overallSeverity} (${report.hazardRating}/10)\nLocation: ${report.locationAddress}\nEst. Cost: $${report.recommendedRepair.estimatedCostUsd}\nRepair: ${report.recommendedRepair.method}`;
                navigator.clipboard.writeText(reportText);
                alert('Report text copied to clipboard for field crews!');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-300 border border-neutral-700 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left image & bounding boxes / Right technical specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Overlay & Detected Defect Chips */}
        <div className="lg:col-span-7 space-y-4">
          <DamageImageOverlay
            imageUrl={report.imageUrl}
            defects={report.detectedDefects}
            activeDefectId={activeDefectId}
            onHoverDefect={setActiveDefectId}
            severity={report.overallSeverity}
            className="w-full h-[400px]"
          />

          {/* Detected Defects List */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Identified Distress Polygons & Bounding Boxes</span>
              <span className="font-mono text-neutral-500">
                {report.detectedDefects.length} zones
              </span>
            </h3>

            <div className="space-y-2">
              {report.detectedDefects.map((def) => (
                <div
                  key={def.id}
                  onMouseEnter={() => setActiveDefectId(def.id)}
                  onMouseLeave={() => setActiveDefectId(null)}
                  className={`flex items-start justify-between p-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                    activeDefectId === def.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-neutral-200'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {def.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${getSeverityBadge(
                          def.severity
                        )}`}
                      >
                        {def.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {def.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-mono text-neutral-300 font-semibold tabular-nums">
                      {Math.round(def.confidence * 100)}%
                    </span>
                    <div className="text-[10px] text-neutral-500">Confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Root Cause Card */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs">
            <div className="font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Civil Engineering Root Cause Analysis</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">{report.rootCause}</p>
          </div>
        </div>

        {/* Right Column: Engineering Telemetry & Municipal Work Orders */}
        <div className="lg:col-span-5 space-y-4">
          {/* Engineering Metrics Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5">
              <div className="text-xs text-neutral-400 mb-1">Hazard Rating</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                  {report.hazardRating}
                </span>
                <span className="text-xs text-neutral-500 font-mono">/ 10</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                {report.hazardRating >= 8
                  ? 'Severe accident/tire risk'
                  : 'Moderate vehicle wear'}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5">
              <div className="text-xs text-neutral-400 mb-1">ASTM PCI Deduct</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                  -{report.pciDeductionScore.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-500 font-mono">pts</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                ASTM D6433 Pavement Index
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5">
              <div className="text-xs text-neutral-400 mb-1">Est. Dimensions</div>
              <div className="text-sm font-semibold font-mono text-neutral-200 tabular-nums">
                {report.estimatedDimensions.widthCm}cm ×{' '}
                {report.estimatedDimensions.lengthCm}cm
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                Depth: {report.estimatedDimensions.depthCategory}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5">
              <div className="text-xs text-neutral-400 mb-1">Defect Surface Area</div>
              <div className="text-sm font-semibold font-mono text-neutral-200 tabular-nums">
                {report.estimatedDimensions.estimatedAreaSqM.toFixed(2)} m²
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                ≈ {(report.estimatedDimensions.estimatedAreaSqM * 10.764).toFixed(1)} sq ft
              </div>
            </div>
          </div>

          {/* Recommended Repair Specification */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Municipal Repair Plan</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                Est. ${report.recommendedRepair.estimatedCostUsd} USD
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-neutral-500 block">Method:</span>
                <span className="font-medium text-neutral-200">
                  {report.recommendedRepair.method}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Specified Materials:</span>
                <span className="text-neutral-300 font-mono text-[11px]">
                  {report.recommendedRepair.materials}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-neutral-400">
                  Labor: <strong>{report.recommendedRepair.laborHours} crew hours</strong>
                </span>
                <span className="text-amber-400 font-medium">
                  {report.recommendedRepair.responseSla}
                </span>
              </div>
            </div>

            {/* Equipment Tag List */}
            <div>
              <span className="text-[11px] text-neutral-500 block mb-1">
                Required Equipment:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {report.recommendedRepair.equipment.map((eq, i) => (
                  <span
                    key={i}
                    className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 border border-neutral-700/60"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Safety Advisory Card */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 text-xs space-y-2">
            <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Public Safety & Transit Impact</span>
            </div>
            <div className="space-y-1 text-neutral-400 text-[11px]">
              <div>
                <strong className="text-neutral-300">Vehicle Risk:</strong>{' '}
                {report.safetyAdvisory.vehicleRisk}
              </div>
              <div>
                <strong className="text-neutral-300">Two-Wheelers:</strong>{' '}
                {report.safetyAdvisory.twoWheelerRisk}
              </div>
              <div>
                <strong className="text-neutral-300">Traffic Management:</strong>{' '}
                {report.safetyAdvisory.trafficControlRequired
                  ? 'Mandatory lane closure & safety buffer required'
                  : 'Standard shoulder maintenance buffer'}
              </div>
            </div>
          </div>

          {/* Work Order / Crew Dispatch Console */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Municipal Dispatch Order</span>
              </h3>
              {report.workOrder && (
                <span className="font-mono text-xs text-sky-400 font-semibold">
                  {report.workOrder.workOrderId}
                </span>
              )}
            </div>

            {report.workOrder ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block">Assigned Crew:</span>
                    <span className="font-semibold text-neutral-200">
                      {report.workOrder.assignedCrew}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Crew Supervisor:</span>
                    <span className="text-neutral-200">
                      {report.workOrder.crewLead}
                    </span>
                  </div>
                </div>

                <div className="text-[11px]">
                  <span className="text-neutral-500 block">Scheduled Window:</span>
                  <span className="text-amber-300 font-mono">
                    {report.workOrder.scheduledDate}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <strong className="text-neutral-300 block mb-0.5">
                    Traffic Control Plan:
                  </strong>
                  {report.workOrder.trafficManagementPlan}
                </div>

                {report.status !== 'Resolved' && (
                  <div className="pt-2 flex items-center gap-2">
                    {report.status === 'Dispatched' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('In_Progress')}
                        className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                      >
                        Set In Progress
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowResolutionForm(!showResolutionForm)}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve & Close Ticket</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">
                  No work order issued yet. Generate an automated ticket with crew assignments, material manifests, and traffic routing via Gemini.
                </p>
                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={handleDispatchWorkOrder}
                  className="w-full py-2.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {isDispatching
                      ? 'Generating Work Order...'
                      : 'Dispatch Municipal Repair Crew'}
                  </span>
                </button>
              </div>
            )}

            {/* Resolution Form if opened */}
            {showResolutionForm && (
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <label className="text-xs font-medium text-neutral-300 block">
                  Field Completion Notes:
                </label>
                <textarea
                  value={resolutionNoteInput}
                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                  placeholder="e.g., Completed full depth patch with 0.4 tons HMA; road reopened to traffic."
                  rows={2}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Resolved')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
                  >
                    Confirm Resolution
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResolutionForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {report.status === 'Resolved' && report.resolutionNotes && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                <strong className="block text-emerald-200 mb-0.5">
                  Resolution Log:
                </strong>
                {report.resolutionNotes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
