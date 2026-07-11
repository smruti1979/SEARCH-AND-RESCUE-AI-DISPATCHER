/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Compass, Crosshair, MapPin, Radio, Activity, ShieldAlert, Zap } from 'lucide-react';
import { DisasterFeed, RescueTeam } from '../types';

interface TacticalMapProps {
  feeds: DisasterFeed[];
  teams: RescueTeam[];
  selectedFeedId: string | null;
  onSelectFeed: (id: string) => void;
  centerLat: number;
  centerLng: number;
}

export default function TacticalMap({
  feeds,
  teams,
  selectedFeedId,
  onSelectFeed,
  centerLat,
  centerLng,
}: TacticalMapProps) {
  const [sweepAngle, setSweepAngle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Radar sweep animation
  useEffect(() => {
    const updateSweep = () => {
      setSweepAngle((prev) => (prev + 1.2) % 360);
      requestRef.current = requestAnimationFrame(updateSweep);
    };
    requestRef.current = requestAnimationFrame(updateSweep);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Map scale parameters (convert lat/lng to percent coordinates)
  // Center is approx (centerLat, centerLng)
  // Scale is roughly how much 0.001 degree maps to percentage
  const getCoordinates = (lat: number, lng: number) => {
    const latDiff = lat - centerLat;
    const lngDiff = lng - centerLng;

    // Zoom factor: fits about 0.01 degree range in 100% of container
    const x = 50 + lngDiff * 8000; // 0.005 deg diff = 40% offset
    const y = 50 - latDiff * 8000; // inverted Y

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const getPriorityColor = (priority?: 'IMMEDIATE' | 'HIGH' | 'STANDBY') => {
    switch (priority) {
      case 'IMMEDIATE':
        return 'text-red-500 fill-red-500 bg-red-950/40 border-red-500/50';
      case 'HIGH':
        return 'text-orange-500 fill-orange-500 bg-orange-950/40 border-orange-500/50';
      default:
        return 'text-amber-500 fill-amber-500 bg-amber-950/40 border-amber-500/50';
    }
  };

  return (
    <div id="tactical-radar-map" className="relative flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs select-none">
      {/* Header telemetry bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
          </span>
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Tactical Grid</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span>CENTER: {centerLat.toFixed(4)}°N / {centerLng.toFixed(4)}°W</span>
          <span className="hidden sm:inline">SWEEP: ACTIVE</span>
        </div>
      </div>

      {/* Main Map Container */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.4)_0%,rgba(2,6,23,1)_95%)] overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #0e1726 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        {/* Radar Sweep Animation SVG Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full">
            {/* Concentric grid circles */}
            <circle cx="50%" cy="50%" r="10%" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#334155" strokeWidth="1" />
            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#334155" strokeWidth="1" />
            
            {/* Crosshair lines */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="1" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1e293b" strokeWidth="1" />

            {/* Sweep line */}
            <line
              x1="50%"
              y1="50%"
              x2={`${50 + 50 * Math.cos((sweepAngle * Math.PI) / 180)}%`}
              y2={`${50 + 50 * Math.sin((sweepAngle * Math.PI) / 180)}%`}
              stroke="rgba(249, 115, 22, 0.4)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Dynamic Scale & Legend Overlay */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 bg-slate-900/80 border border-slate-800/80 p-2 rounded text-[10px] text-slate-400 backdrop-blur-md z-10 max-w-[150px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>Critical Distress Beacons</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded" />
            <span>Active Hazard Zones</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-cyan-400 border border-cyan-300" />
            <span>Dispatched Rescuers</span>
          </div>
        </div>

        {/* Active Grid Overlay Coordinates */}
        <div className="absolute top-2 left-2 text-[9px] text-slate-600 space-y-0.5">
          <div>LAT COORD LIMIT: {(centerLat + 0.008).toFixed(4)}°N</div>
          <div>LNG COORD LIMIT: {(centerLng - 0.008).toFixed(4)}°W</div>
        </div>

        {/* DISASTER FEED MARKERS */}
        {feeds.map((feed) => {
          if (!feed.analyzed || !feed.analysis) return null;
          const { x, y } = getCoordinates(feed.analysis.coordinates.latitude, feed.analysis.coordinates.longitude);
          const isSelected = feed.id === selectedFeedId;
          const priority = feed.analysis.extractionPriority;
          const priorityColor = getPriorityColor(priority);

          return (
            <button
              key={feed.id}
              onClick={() => onSelectFeed(feed.id)}
              className="absolute group z-20 focus:outline-none cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Pulsing hazard area boundary */}
              <div
                className={`absolute w-12 h-12 rounded-full border border-dashed animate-ping duration-1000 -inset-4 opacity-30 ${
                  priority === 'IMMEDIATE' ? 'border-red-500' : priority === 'HIGH' ? 'border-orange-500' : 'border-amber-500'
                }`}
              />

              {/* Core blinking beacon */}
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                isSelected ? 'scale-125 border-orange-400 bg-orange-950/60 ring-2 ring-orange-500/50' : priorityColor
              }`}>
                {priority === 'IMMEDIATE' ? (
                  <ShieldAlert className="w-4 h-4 animate-pulse text-red-500" />
                ) : (
                  <Activity className="w-4 h-4 text-orange-400" />
                )}

                {/* Distress coordinate mini label */}
                <span className="absolute -top-6 whitespace-nowrap bg-slate-900/90 text-[9px] text-slate-300 px-1 border border-slate-700 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {feed.analysis.title} (V:{feed.analysis.victimCountEstimate})
                </span>
              </div>
            </button>
          );
        })}

        {/* RESCUE TEAM MARKERS */}
        {teams.map((team) => {
          if (!team.location) return null;
          const { x, y } = getCoordinates(team.location.latitude, team.location.longitude);
          const isDispatched = team.status === 'DISPATCHED' || team.status === 'ON_SITE';

          return (
            <div
              key={team.id}
              className={`absolute z-30 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="flex flex-col items-center">
                {/* Team Locator Pin */}
                <div className={`flex items-center justify-center p-1 rounded bg-slate-900 border ${
                  isDispatched ? 'border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-500/20' : 'border-slate-600 text-slate-500'
                }`}>
                  <Radio className={`w-3.5 h-3.5 ${isDispatched ? 'animate-bounce' : ''}`} />
                </div>
                {/* Micro Label */}
                <span className="mt-1 px-1 py-0.5 bg-slate-900/95 text-[8px] border border-slate-800 text-slate-300 rounded whitespace-nowrap">
                  {team.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target focus readout card */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        {selectedFeedId ? (
          (() => {
            const currentFeed = feeds.find((f) => f.id === selectedFeedId);
            if (!currentFeed || !currentFeed.analysis) {
              return <div className="text-slate-500 text-center py-1">Parsing selected feed payload...</div>;
            }
            const info = currentFeed.analysis;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Active Target</div>
                  <div className="text-orange-400 font-bold truncate text-[11px]">{info.title}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Target Coordinates</div>
                  <div className="text-slate-200 text-[11px]">
                    {info.coordinates.latitude.toFixed(5)}°N, {info.coordinates.longitude.toFixed(5)}°W
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Extraction Urgency</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      info.extractionPriority === 'IMMEDIATE' ? 'bg-red-500' : 'bg-orange-500'
                    }`} />
                    <span className={info.extractionPriority === 'IMMEDIATE' ? 'text-red-400 font-bold' : 'text-orange-400'}>
                      {info.extractionPriority}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Survivor Sign</div>
                  <div className="text-cyan-400 text-[11px] truncate" title={info.signsOfLife.description}>
                    {info.signsOfLife.detected ? `DETECTED (${info.signsOfLife.confidence}%)` : 'NONE'}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-slate-500 text-center py-1.5 flex items-center justify-center gap-2">
            <Compass className="w-4 h-4 animate-spin duration-3000" />
            <span>Select active disaster feed node to initialize focus lock</span>
          </div>
        )}
      </div>
    </div>
  );
}
