/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Send, CheckCircle, ShieldAlert, Zap, Compass, RefreshCw, AlertCircle } from 'lucide-react';
import { RescueTeam, DisasterFeed } from '../types';

interface ActiveDispatchBoardProps {
  teams: RescueTeam[];
  selectedFeed: DisasterFeed | null;
  onDispatchTeam: (teamId: string) => void;
  onRecallTeam: (teamId: string) => void;
}

export default function ActiveDispatchBoard({
  teams,
  selectedFeed,
  onDispatchTeam,
  onRecallTeam,
}: ActiveDispatchBoardProps) {
  const isFeedAnalyzed = selectedFeed?.analyzed && selectedFeed?.analysis;

  const getTeamTypeLabel = (type: string) => {
    switch (type) {
      case 'K9_SEARCH': return 'K9 Search Squad';
      case 'HEAVY_RESCUE': return 'Heavy Breaker Squad';
      case 'MEDICAL_SUPPORT': return 'Paramedical Triage';
      case 'DRONE_RECON': return 'Thermal Recon Drone';
      case 'HAZMAT_TACTICAL': return 'Hazmat Fire/Gas Specialist';
      default: return 'Specialist Team';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'STANDBY':
        return <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded font-bold">STANDBY</span>;
      case 'DISPATCHED':
        return <span className="px-1.5 py-0.5 bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 rounded font-bold animate-pulse">EN ROUTE</span>;
      case 'ON_SITE':
        return <span className="px-1.5 py-0.5 bg-red-950/50 text-red-400 border border-red-500/30 rounded font-bold animate-bounce">ON SITE</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 rounded font-bold">STATIONED</span>;
    }
  };

  return (
    <div id="rescue-dispatch-board" className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-orange-500" />
          <span className="font-bold uppercase tracking-wider text-slate-200">Active Search & Rescue Squads</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase">{teams.filter(t => t.status !== 'STANDBY').length} Deployed</span>
      </div>

      {/* Target prompt instructions if no feed is focused */}
      {!selectedFeed ? (
        <div className="p-3 bg-orange-950/20 border-b border-slate-800/60 text-orange-400/80 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Select an analyzed feed node from the left panel to authorize squad mobilization.</span>
        </div>
      ) : !isFeedAnalyzed ? (
        <div className="p-3 bg-amber-950/20 border-b border-slate-800/60 text-amber-400/80 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>Active Feed #{selectedFeed.id.slice(0, 6)} has no mapped telemetry. Run Gemini AI analyzer to extract coordinates first.</span>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/20 border-b border-slate-800/60 text-emerald-400/90 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400">Locking Coordinates:</span>
            <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-300 px-1 py-0.5 rounded text-[9px] font-bold">GPS LOCKED</span>
          </div>
          <span className="text-slate-300 text-[11px] font-semibold truncate">Target: {selectedFeed.analysis?.title}</span>
          <span className="text-slate-500 text-[10px] truncate">
            LAT: {selectedFeed.analysis?.coordinates.latitude.toFixed(5)}°N | LNG: {selectedFeed.analysis?.coordinates.longitude.toFixed(5)}°W
          </span>
        </div>
      )}

      {/* Teams list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
        {teams.map((team) => {
          const isStandby = team.status === 'STANDBY';
          const isEnRoute = team.status === 'DISPATCHED';
          const isOnSite = team.status === 'ON_SITE';

          return (
            <div key={team.id} className="p-3 flex flex-col gap-2.5 hover:bg-slate-900/10 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{team.name}</span>
                    <span className="text-[10px] text-slate-500">[{getTeamTypeLabel(team.type)}]</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {team.type === 'K9_SEARCH' && '🐾 Acoustic sensors & scent localization'}
                    {team.type === 'HEAVY_RESCUE' && '🏗️ Hydraulic cutters & masonry breakers'}
                    {team.type === 'MEDICAL_SUPPORT' && '🚑 Trauma stabilization & triage'}
                    {team.type === 'DRONE_RECON' && '🛸 FLIR thermal mapping & gas alarms'}
                    {team.type === 'HAZMAT_TACTICAL' && '☣️ Toxic sensor arrays & voltage grounds'}
                  </div>
                </div>
                {getStatusBadge(team.status)}
              </div>

              {/* Status information & buttons */}
              <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded border border-slate-900 gap-4">
                {isStandby ? (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>Stationed at Base HQ</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isEnRoute ? 'bg-cyan-400 animate-ping' : 'bg-red-400'}`} />
                      <span className={isEnRoute ? 'text-cyan-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {isEnRoute ? `DEPLOYED - ETA: ${team.etaMinutes}m` : 'ENGAGED IN ACTIVE SEARCH'}
                      </span>
                    </div>
                    {team.location && (
                      <span className="text-slate-500 text-[9px]">
                        GPS: {team.location.latitude.toFixed(4)}°N, {team.location.longitude.toFixed(4)}°W
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Recall team button */}
                  {!isStandby && (
                    <button
                      onClick={() => onRecallTeam(team.id)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded text-slate-400 hover:text-slate-200 transition text-[10px] flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Recall</span>
                    </button>
                  )}

                  {/* Dispatch team button */}
                  {isStandby && (
                    <button
                      disabled={!isFeedAnalyzed}
                      onClick={() => onDispatchTeam(team.id)}
                      className={`px-3 py-1.5 rounded font-bold transition text-[10px] flex items-center gap-1 uppercase ${
                        isFeedAnalyzed
                          ? 'bg-orange-600 hover:bg-orange-500 text-slate-950 cursor-pointer shadow-sm shadow-orange-500/20'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mobilize</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
