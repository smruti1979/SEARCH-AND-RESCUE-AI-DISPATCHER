/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AnalysisResult {
  title: string;
  summary: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  signsOfLife: {
    detected: boolean;
    description: string;
    confidence: number; // 0 to 100
  };
  hazards: Array<{
    type: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  extractionPriority: 'IMMEDIATE' | 'HIGH' | 'STANDBY';
  proximityThreats: Array<{
    name: string;
    distanceMeters: number;
    hazardLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  dispatchRecommendation: string;
  morseCodeSignal: string;
  victimCountEstimate: number;
}

export interface DisasterFeed {
  id: string;
  timestamp: string;
  source: 'DRONE_FEED' | 'SEISMIC_SENSOR' | 'CITIZEN_REPORTS' | 'THERMAL_SCAN' | 'SATELLITE' | 'RADIO_TRANSCRIPT';
  rawText: string;
  analyzed: boolean;
  analysis?: AnalysisResult;
}

export interface RescueTeam {
  id: string;
  name: string;
  type: 'K9_SEARCH' | 'HEAVY_RESCUE' | 'MEDICAL_SUPPORT' | 'DRONE_RECON' | 'HAZMAT_TACTICAL';
  status: 'STANDBY' | 'DISPATCHED' | 'ON_SITE' | 'RETURNED';
  location?: {
    latitude: number;
    longitude: number;
  };
  etaMinutes?: number;
}

export interface OperationalLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  message: string;
}
