import React, { useState } from 'react';
import { BoundingBoxDefect, SeverityLevel } from '../types/damage';
import { Eye, EyeOff, Maximize2, ShieldAlert } from 'lucide-react';

interface DamageImageOverlayProps {
  imageUrl: string;
  defects: BoundingBoxDefect[];
  activeDefectId?: string | null;
  onHoverDefect?: (defectId: string | null) => void;
  onClickDefect?: (defect: BoundingBoxDefect) => void;
  severity?: SeverityLevel;
  className?: string;
}

export const DamageImageOverlay: React.FC<DamageImageOverlayProps> = ({
  imageUrl,
  defects,
  activeDefectId,
  onHoverDefect,
  onClickDefect,
  severity = 'High',
  className = '',
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getBorderColor = (sev: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return 'border-rose-500 bg-rose-500/15 text-rose-300';
      case 'High':
        return 'border-amber-500 bg-amber-500/15 text-amber-300';
      case 'Medium':
        return 'border-orange-500 bg-orange-500/15 text-orange-300';
      case 'Low':
      default:
        return 'border-sky-500 bg-sky-500/15 text-sky-300';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl bg-neutral-950/95 p-4 flex flex-col' : className
      }`}
    >
      {/* Top overlay toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900/85 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-neutral-200 border border-neutral-700/60 shadow">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{defects.length} Defect Zones Detected</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className="flex items-center gap-1 rounded-md bg-neutral-900/85 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors shadow"
          >
            {showBoxes ? <EyeOff className="w-3.5 h-3.5 text-neutral-400" /> : <Eye className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{showBoxes ? 'Hide Overlays' : 'Show Overlays'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border backdrop-blur-md transition-colors shadow ${
              showGrid
                ? 'bg-amber-500 text-black border-amber-400 font-semibold'
                : 'bg-neutral-900/85 text-neutral-300 border-neutral-700/60 hover:text-white'
            }`}
          >
            <span>Scale Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-md bg-neutral-900/85 backdrop-blur-md p-1.5 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors shadow"
            title="Toggle fullscreen zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main image container */}
      <div className="relative w-full h-full flex items-center justify-center bg-neutral-950 overflow-hidden">
        <img
          src={imageUrl}
          alt="Road pavement distress survey inspection"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none transition-all duration-300"
        />

        {/* Optional 10cm Engineering Measurement Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(245, 158, 11, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(245, 158, 11, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
        )}

        {/* Bounding box overlays */}
        {showBoxes &&
          defects.map((defect) => {
            const [ymin, xmin, ymax, xmax] = defect.box2d;
            const top = (ymin / 1000) * 100;
            const left = (xmin / 1000) * 100;
            const width = ((xmax - xmin) / 1000) * 100;
            const height = ((ymax - ymin) / 1000) * 100;
            const isHovered = activeDefectId === defect.id;
            const colorClasses = getBorderColor(defect.severity);

            return (
              <div
                key={defect.id}
                onMouseEnter={() => onHoverDefect && onHoverDefect(defect.id)}
                onMouseLeave={() => onHoverDefect && onHoverDefect(null)}
                onClick={() => onClickDefect && onClickDefect(defect)}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
                className={`absolute z-10 cursor-pointer rounded-lg border-2 transition-all duration-150 ${colorClasses} ${
                  isHovered ? 'ring-4 ring-amber-400/60 scale-[1.01] shadow-2xl' : 'hover:ring-2 hover:ring-amber-400/40'
                }`}
              >
                {/* Floating Tag */}
                <div
                  className={`absolute -top-7 left-0 flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-md ${
                    defect.severity === 'Critical'
                      ? 'bg-rose-600 text-white'
                      : defect.severity === 'High'
                      ? 'bg-amber-600 text-white'
                      : 'bg-neutral-800 text-neutral-200'
                  }`}
                >
                  <span className="truncate max-w-[160px]">{defect.label}</span>
                  <span className="text-[10px] opacity-80 tabular-nums">
                    {Math.round(defect.confidence * 100)}%
                  </span>
                </div>

                {/* Corner Crosshairs */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-white/90" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-white/90" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-white/90" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-white/90" />
              </div>
            );
          })}
      </div>

      {/* Bottom status strip */}
      <div className="px-3 py-2 bg-neutral-900/90 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span>AI Vision Detection Engine</span>
          <span aria-hidden="true">·</span>
          <span>ASTM D6433 Pavement Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Scale: 1:10 Ground Survey</span>
        </div>
      </div>
    </div>
  );
};
