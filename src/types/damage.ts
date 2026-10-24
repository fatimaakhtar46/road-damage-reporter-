export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type ReportStatus = 'Reported' | 'AI_Verified' | 'Dispatched' | 'In_Progress' | 'Resolved';

export interface BoundingBoxDefect {
  id: string;
  label: string;
  confidence: number;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] scaled 0..1000
  severity: SeverityLevel;
  description: string;
}

export interface EstimatedDimensions {
  widthCm: number;
  lengthCm: number;
  depthCategory: 'Shallow (<2.5 cm)' | 'Moderate (2.5-5 cm)' | 'Severe (>5 cm)' | string;
  estimatedAreaSqM: number;
}

export interface RecommendedRepair {
  method: string;
  materials: string;
  estimatedCostUsd: number;
  laborHours: number;
  equipment: string[];
  responseSla: string;
}

export interface SafetyAdvisory {
  vehicleRisk: string;
  twoWheelerRisk: string;
  trafficControlRequired: boolean;
}

export interface WorkOrder {
  workOrderId: string;
  department: string;
  assignedCrew: string;
  crewLead: string;
  scheduledDate: string;
  trafficManagementPlan: string;
  materialRequisition: string[];
  equipmentRequired: string[];
  estimatedDurationHours: number;
  safetyPrecautions: string[];
  dispatchNotes: string;
  dispatchedAt: string;
}

export interface RoadDamageReport {
  id: string;
  timestamp: string;
  imageUrl: string;
  locationAddress: string;
  lat: number;
  lng: number;
  reportedBy: string;
  status: ReportStatus;
  summary: string;
  primaryDefectType: string;
  overallSeverity: SeverityLevel;
  hazardRating: number; // 1-10
  pciDeductionScore: number; // ASTM D6433 deduct
  estimatedDimensions: EstimatedDimensions;
  detectedDefects: BoundingBoxDefect[];
  rootCause: string;
  recommendedRepair: RecommendedRepair;
  safetyAdvisory: SafetyAdvisory;
  workOrder?: WorkOrder;
  resolutionPhoto?: string;
  resolutionNotes?: string;
}

export interface SurveyWaypoint {
  id: string;
  lat: number;
  lng: number;
  streetName: string;
  speedMph: number;
  detectedDamage?: RoadDamageReport;
}
