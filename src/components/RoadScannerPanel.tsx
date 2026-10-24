import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, MapPin, Sparkles, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { RoadDamageReport } from '../types/damage';
import { PRESET_DETECTION_SAMPLES } from '../data/mockReports';

interface RoadScannerPanelProps {
  onReportCreated: (newReport: RoadDamageReport) => void;
  onClose?: () => void;
  initialPresetIndex?: number;
}

export const RoadScannerPanel: React.FC<RoadScannerPanelProps> = ({
  onReportCreated,
  onClose,
  initialPresetIndex,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('450 Harrison Street, San Francisco, CA');
  const [lat, setLat] = useState<number>(37.7885);
  const [lng, setLng] = useState<number>(-122.3942);
  const [roadType, setRoadType] = useState<string>('Urban Arterial (High Traffic)');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (initialPresetIndex !== undefined && PRESET_DETECTION_SAMPLES[initialPresetIndex]) {
      const preset = PRESET_DETECTION_SAMPLES[initialPresetIndex];
      setSelectedImage(preset.imageUrl);
      setAddress(preset.defaultLocation);
      setLat(preset.lat);
      setLng(preset.lng);
    }
  }, [initialPresetIndex]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage('Could not open camera. Please verify permissions or upload a photo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = (preset: (typeof PRESET_DETECTION_SAMPLES)[0]) => {
    stopCamera();
    setSelectedImage(preset.imageUrl);
    setAddress(preset.defaultLocation);
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(parseFloat(position.coords.latitude.toFixed(5)));
          setLng(parseFloat(position.coords.longitude.toFixed(5)));
          setAddress(`GPS Pinned Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setErrorMessage('Could not retrieve GPS coordinates. Using manual coordinates.');
        }
      );
    }
  };

  // Run AI analysis
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage('Please select or capture an image of road damage first.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      setAnalysisStep('Pre-processing pavement image & surface texture...');

      // Convert image to base64 if it is a local URL path
      let base64Payload = selectedImage;
      if (selectedImage.startsWith('/src/assets/images/')) {
        setAnalysisStep('Loading high-resolution pavement inspection asset...');
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        base64Payload = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      setAnalysisStep('Scanning distress fissures & calculating ASTM D6433 PCI deduction...');

      const apiRes = await fetch('/api/analyze-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Payload,
          mimeType: 'image/jpeg',
          roadContext: `${roadType} at ${address}`,
        }),
      });

      if (!apiRes.ok) {
        const errJson = await apiRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server error while analyzing damage');
      }

      setAnalysisStep('Generating repair specifications & municipal response plan...');
      const analysisData = await apiRes.json();

      const newReport: RoadDamageReport = {
        id: `RPT-2026-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        imageUrl: selectedImage,
        locationAddress: address,
        lat,
        lng,
        reportedBy: 'Citizen Pothole Patrol (Live Scan)',
        status: 'AI_Verified',
        summary: analysisData.summary || 'Road surface distress verified via Gemini AI computer vision.',
        primaryDefectType: analysisData.primaryDefectType || 'Pothole',
        overallSeverity: analysisData.overallSeverity || 'High',
        hazardRating: analysisData.hazardRating || 7,
        pciDeductionScore: analysisData.pciDeductionScore || 25,
        estimatedDimensions: analysisData.estimatedDimensions || {
          widthCm: 50,
          lengthCm: 50,
          depthCategory: 'Moderate (2.5-5 cm)',
          estimatedAreaSqM: 0.25,
        },
        detectedDefects: analysisData.detectedDefects || [],
        rootCause: analysisData.rootCause || 'Environmental fatigue and repetitive vehicular axle load stress.',
        recommendedRepair: analysisData.recommendedRepair || {
          method: 'Hot-mix asphalt patch',
          materials: 'HMA Type B',
          estimatedCostUsd: 450,
          laborHours: 3,
          equipment: ['Tamper', 'Asphalt hotbox'],
          responseSla: '48-Hour Standard',
        },
        safetyAdvisory: analysisData.safetyAdvisory || {
          vehicleRisk: 'Tire rim damage risk',
          twoWheelerRisk: 'Severe hazard for bikes/scooters',
          trafficControlRequired: true,
        },
      };

      onReportCreated(newReport);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>AI Road Damage Scanner</span>
            <span className="text-xs font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              Gemini 3.8 Flash Vision
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time pothole, alligator crack, and structural pavement distress diagnostics
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Scanner Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Image preview & Capture */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-center">
            {isCameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected road damage"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500">
                <Camera className="w-12 h-12 mb-2 text-neutral-600 stroke-1" />
                <p className="text-sm font-medium text-neutral-300">No Image Captured Yet</p>
                <p className="text-xs text-neutral-500 max-w-xs mt-1">
                  Take a photo with your device camera, upload a roadway photo, or click a preset sample below.
                </p>
              </div>
            )}

            {/* In-Frame Live Camera Controls */}
            {isCameraActive && (
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  className="px-5 py-2 rounded-full bg-amber-500 text-black font-semibold text-xs shadow-lg hover:bg-amber-400 transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Inspection Frame</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-full bg-neutral-900/90 text-white font-medium text-xs border border-neutral-700 hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Capture Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-xs font-medium text-white transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Open Device Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white"
              >
                <span>Close Camera</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2 text-xs font-medium text-white transition-colors"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Upload Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {selectedImage && (
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="ml-auto text-xs text-neutral-400 hover:text-white"
              >
                Clear Photo
              </button>
            )}
          </div>

          {/* 1-Click Preset Samples */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Or Test Instant Real-World Road Samples:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_DETECTION_SAMPLES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`group relative overflow-hidden rounded-lg border p-1 text-left transition-all ${
                    selectedImage === preset.imageUrl
                      ? 'border-amber-500 ring-2 ring-amber-500/30 bg-neutral-800'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded mb-1.5">
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-200 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    {preset.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Submit */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Location / Street Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 450 Harrison Street, San Francisco, CA"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Use Current Device GPS Coordinates</span>
            </button>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Roadway Classification
              </label>
              <select
                value={roadType}
                onChange={(e) => setRoadType(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Urban Arterial (High Traffic)">Urban Arterial (High Traffic / Transit Bus)</option>
                <option value="State Highway / Expressway">State Highway / Expressway (High Speed)</option>
                <option value="Residential Collector">Residential Collector / School Zone</option>
                <option value="Industrial Corridor">Industrial Corridor (Heavy Freight Axles)</option>
                <option value="Rural Mountain Road">Rural Parkway / Mountain Pass</option>
              </select>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-xs text-neutral-400 space-y-1.5">
              <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automated Diagnostics Pipeline</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Gemini 3.8 Flash detects pavement geometry, depth classes, multi-point alligator fissures, ASTM D6433 deduction scores, repair specifications, and safety hazards in under 3 seconds.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-neutral-800">
            <button
              type="button"
              disabled={!selectedImage || isAnalyzing}
              onClick={handleAnalyze}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                !selectedImage || isAnalyzing
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
                  <span>{analysisStep || 'Analyzing Pavement Geometry...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Structural Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
