/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DisasterFeed } from './types';

export const PRESET_FEEDS: Omit<DisasterFeed, 'id' | 'timestamp'>[] = [
  {
    source: 'DRONE_FEED',
    rawText: 'DRONE RECON OVER SECTOR 4: Multiple structural collapses of three-story concrete multi-family complex at 34.0536° N, -118.2429° W. Severe fire raging in the southern wing due to broken gas main. Thermal camera detects 4 high-heat signatures trapped in a crawlspace under heavy slab. Survival confidence index 92%. Active toxic fumes rising near power grid node.',
    analyzed: false,
  },
  {
    source: 'RADIO_TRANSCRIPT',
    rawText: 'FIRST RESPONDER AUDIO SQUAD 3: Arrived on scene at 34.0515° N, -118.2448° W. Massive water main burst leading to rapid flooding in the subterranean parking garage and basement storage rooms. Acoustic sensor captures faint, rhythmic tapping distress calls in Morse code: "... --- ... " (SOS) emanating from the elevator shaft. Rapid rise of water levels, urgent dewatering and extraction required. Estimate 2 victims trapped.',
    analyzed: false,
  },
  {
    source: 'CITIZEN_REPORTS',
    rawText: 'S.O.S. EMERGENCY CITIZEN CALL: My family is trapped in our collapsed storefront at 34.0551° N, -118.2412° W! The ceiling cave-in blocked the main door. There is a strong chemical gas smell leaking from the dry-cleaners next door, and sparking power wires are dangling in front of the exit. There are 3 of us here, please send help, we are losing consciousness!',
    analyzed: false,
  },
  {
    source: 'THERMAL_SCAN',
    rawText: 'THERMAL SPECTRAL SCAN FLIGHT T-12: Identified active human heat signatures at coordinates 34.0528° N, -118.2455° W. Target situated inside a collapsed metal hangar structure. Heavy structural metal beams blocking access. No active fire detected in the hangar, but immediate proximity of a high-voltage transformer spark risk threatens ignition. 1 individual localized in the western sector.',
    analyzed: false,
  },
  {
    source: 'SEISMIC_SENSOR',
    rawText: 'SEISMIC RESPONSE STATION 9B: Structural vibration telemetry anomaly at 34.0504° N, -118.2461° W. Heavy micro-seismic shifting indicates active post-collapse debris instability. High danger of secondary collapse of adjacent brick tower. Acoustic array captured intermittent voice distress calls at 40Hz frequencies. Urgently dispatch robotic listening probes.',
    analyzed: false,
  }
];
