import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, RotateCcw, AlertTriangle, Radio, Navigation, CheckCircle2 } from 'lucide-react';
import { RoadDamageReport } from '../types/damage';

interface SurveySimulationModeProps {
  onDamageDetected: (report: RoadDamageReport) => void;
  onVehiclePositionChange: (pos: { lat: number; lng: number; heading: number } | null) => void;
}

interface SimulatedWaypoint {
  lat: number;
  lng: number;
  street: string;
  speedMph: number;
  hazard?: {
    type: string;
    severity: 'Critical' | 'High' | 'Medium';
    summary: string;
    image: string;
    repairCost: number;
  };
}

const SURVEY_ROUTE: SimulatedWaypoint[] = [
  { lat: 37.7885, lng: -122.3942, street: 'Harrison St & 1st St', speedMph: 24 },
  { lat: 37.7850, lng: -122.3920, street: 'Harrison St & 3rd St', speedMph: 28 },
  {
    lat: 37.7812,
    lng: -122.3905,
    street: 'The Embarcadero SOMA Corridor',
    speedMph: 31,
    hazard: {
      type: 'Pothole',
      severity: 'Critical',
      summary: 'Deep circular pothole cavity with exposed subbase in right bus wheelpath.',
      image: '/src/assets/images/road_damage_deep_pothole_1792838438726.jpg',
      repairCost: 480,
    },
  },
  { lat: 37.7760, lng: -122.3890, street: '3rd St Bridge Crossing', speedMph: 25 },
  { lat: 37.7700, lng: -122.3885, street: 'Mission Bay Boulevard South', speedMph: 29 },
  {
    lat: 37.7651,
    lng: -122.3892,
    street: 'Industrial Way & Bayfront Connector',
    speedMph: 26,
    hazard: {
      type: 'Alligator Cracking',
      severity: 'High',
      summary: 'Widespread structural fatigue cracking across commercial truck lane.',
      image: '/src/assets/images/road_damage_alligator_cracking_1792838439213.jpg',
      repairCost: 1450,
    },
  },
  { lat: 37.7580, lng: -122.4010, street: 'Cesar Chavez Arterial', speedMph: 35 },
  {
    lat: 37.7490,
    lng: -122.4285,
    street: 'Foothill Ridge Highway Milepost 14.2',
    speedMph: 42,
    hazard: {
      type: 'Longitudinal Cracking',
      severity: 'High',
      summary: 'Centerline joint separation fissure running parallel to median.',
      image: '/src/assets/images/road_damage_longitudinal_crack_1792838440171.jpg',
      repairCost: 720,
    },
  },
  { lat: 37.7400, lng: -122.4410, street: 'Glen Canyon Scenic Highway', speedMph: 30 },
  {
    lat: 37.7312,
    lng: -122.4510,
    street: 'Skyline Ridge Parkway',
    speedMph: 27,
    hazard: {
      type: 'Shoulder Drop-off',
      severity: 'Critical',
      summary: 'Severe road shoulder washout and edge drop-off adjacent to downhill slope.',
      image: '/src/assets/images/road_damage_shoulder_dropoff_1792838440719.jpg',
      repairCost: 3200,
    },
  },
];

export const SurveySimulationMode: React.FC<SurveySimulationModeProps> = ({
  onDamageDetected,
  onVehiclePositionChange,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [detectedEvents, setDetectedEvents] = useState<
    Array<{ id: string; time: string; street: string; type: string; severity: string }>
  >([]);

  const triggeredSet = useRef<Set<number>>(new Set());

  const currentWaypoint = SURVEY_ROUTE[currentIndex] || SURVEY_ROUTE[0];

  useEffect(() => {
    if (!isRunning) {
      onVehiclePositionChange(null);
      return;
    }

    onVehiclePositionChange({
      lat: currentWaypoint.lat,
      lng: currentWaypoint.lng,
      heading: 180,
    });

    const intervalTime = 3000 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % SURVEY_ROUTE.length;
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isRunning, currentIndex, playbackSpeed]);

  // Check for hazards at this waypoint
  useEffect(() => {
    if (!isRunning) return;
    if (triggeredSet.current.has(currentIndex)) return;

    const wp = SURVEY_ROUTE[currentIndex];
    if (wp && wp.hazard) {
      triggeredSet.current.add(currentIndex);

      const eventItem = {
        id: `EVT-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        street: wp.street,
        type: wp.hazard.type,
        severity: wp.hazard.severity,
      };

      setDetectedEvents((prev) => [eventItem, ...prev.slice(0, 9)]);

      const simulatedReport: RoadDamageReport = {
        id: `RPT-SURVEY-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        imageUrl: wp.hazard.image,
        locationAddress: wp.street,
        lat: wp.lat,
        lng: wp.lng,
        reportedBy: 'Municipal Mobile Survey Vehicle 04',
        status: 'AI_Verified',
        summary: wp.hazard.summary,
        primaryDefectType: wp.hazard.type,
        overallSeverity: wp.hazard.severity,
        hazardRating: wp.hazard.severity === 'Critical' ? 9 : 7,
        pciDeductionScore: wp.hazard.severity === 'Critical' ? 36.0 : 25.0,
        estimatedDimensions: {
          widthCm: 70,
          lengthCm: 80,
          depthCategory: wp.hazard.severity === 'Critical' ? 'Severe (>5 cm)' : 'Moderate (2.5-5 cm)',
          estimatedAreaSqM: 0.56,
        },
        detectedDefects: [
          {
            id: `det-${Date.now()}`,
            label: `${wp.hazard.type} Defect Zone`,
            confidence: 0.95,
            box2d: [350, 200, 850, 800],
            severity: wp.hazard.severity,
            description: wp.hazard.summary,
          },
        ],
        rootCause: 'Continuous vehicular load stress with subbase degradation.',
        recommendedRepair: {
          method: 'Targeted hot-mix asphalt surface patch and edge compaction',
          materials: 'HMA Type A Dense Grade (approx 0.5 tons)',
          estimatedCostUsd: wp.hazard.repairCost,
          laborHours: 4.0,
          equipment: ['Asphalt hotbox', 'Vibratory tamper', 'Traffic signs'],
          responseSla: wp.hazard.severity === 'Critical' ? '24-Hour Emergency Dispatch' : '72-Hour Priority',
        },
        safetyAdvisory: {
          vehicleRisk: 'Potential tire impact / alignment disruption',
          twoWheelerRisk: 'Hazardous depression for bicycles',
          trafficControlRequired: true,
        },
      };

      onDamageDetected(simulatedReport);
    }
  }, [currentIndex, isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    triggeredSet.current.clear();
    setDetectedEvents([]);
    onVehiclePositionChange(null);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-2xl backdrop-blur-xl space-y-5">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Mobile Road Survey Vehicle (Live Feed)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Automated roof-mounted optical cameras scanning asphalt continuously at speed
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isRunning
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Survey</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Road Run</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 4 : 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono border border-neutral-700 transition-colors"
            title="Adjust simulation speed"
          >
            <FastForward className="w-3.5 h-3.5 text-neutral-400" />
            <span>{playbackSpeed}x</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            title="Reset route"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Dashcam View + Telemetry Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dashcam & Reticle View */}
        <div className="lg:col-span-7 relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
          <img
            src="/src/assets/images/road_survey_vehicle_hero_1792838441237.jpg"
            alt="Survey Vehicle Dashcam Feed"
            className="w-full h-full object-cover brightness-75"
          />

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 bg-neutral-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>REC // ROAD_CAM_01</span>
              </div>
              <div>SCAN FREQUENCY: 60 FPS</div>
              <div className="tabular-nums">
                LAT: {currentWaypoint.lat.toFixed(4)} LNG: {currentWaypoint.lng.toFixed(4)}
              </div>
            </div>

            {/* Center target scanning crosshair */}
            <div className="flex items-center justify-center">
              <div className="w-32 h-32 border border-sky-400/40 rounded-lg relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-sky-400" />
                <div className="absolute -top-3 text-[9px] font-mono text-sky-400 bg-neutral-950/80 px-1 rounded">
                  LIDAR SURFACE PROBE
                </div>
              </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[240px]">{currentWaypoint.street}</span>
              </div>
              <div className="tabular-nums font-semibold text-amber-400">
                {isRunning ? `${currentWaypoint.speedMph} MPH` : 'IDLE 0 MPH'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Detected Hazards Log */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 uppercase tracking-wider pb-2 border-b border-neutral-800">
              <span>Real-Time Detection Stream</span>
              <span className="text-[11px] font-mono text-neutral-500">
                WP {currentIndex + 1} / {SURVEY_ROUTE.length}
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-[220px] overflow-y-auto pr-1">
              {detectedEvents.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  {isRunning ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <span>Scanning corridor pavement...</span>
                    </div>
                  ) : (
                    <span>Click "Start Road Run" to drive and auto-detect road distress.</span>
                  )}
                </div>
              ) : (
                detectedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <AlertTriangle
                          className={`w-3.5 h-3.5 ${
                            evt.severity === 'Critical' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        />
                        <span>{evt.type}</span>
                        <span className="text-[10px] text-neutral-400">· {evt.time}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate max-w-[180px]">
                        {evt.street}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        evt.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-GIS Pinning Active</span>
            </span>
            <span className="font-mono text-neutral-500">Fleet ID: SV-04</span>
          </div>
        </div>
      </div>
    </div>
  );
};
