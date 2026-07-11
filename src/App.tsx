/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Compass, AlertTriangle, ShieldAlert, Wifi, Flame, Droplet, Skull, HelpCircle, Activity, RotateCcw } from 'lucide-react';
import { DisasterFeed, RescueTeam, OperationalLog, AnalysisResult } from './types';
import { PRESET_FEEDS } from './presets';
import TacticalMap from './components/TacticalMap';
import FeedList from './components/FeedList';
import ActiveDispatchBoard from './components/ActiveDispatchBoard';
import OperationalTerminal from './components/OperationalTerminal';

const BASE_LAT = 34.0522;
const BASE_LNG = -118.2437;

const INITIAL_SQUADS: RescueTeam[] = [
  {
    id: 'squad-k9',
    name: 'K9 ALPHA',
    type: 'K9_SEARCH',
    status: 'STANDBY',
    location: { latitude: BASE_LAT, longitude: BASE_LNG },
    etaMinutes: 0,
  },
  {
    id: 'squad-heavy',
    name: 'HEAVY BRAVO',
    type: 'HEAVY_RESCUE',
    status: 'STANDBY',
    location: { latitude: BASE_LAT, longitude: BASE_LNG },
    etaMinutes: 0,
  },
  {
    id: 'squad-medic',
    name: 'MEDIC CHARLIE',
    type: 'MEDICAL_SUPPORT',
    status: 'STANDBY',
    location: { latitude: BASE_LAT, longitude: BASE_LNG },
    etaMinutes: 0,
  },
  {
    id: 'squad-recon',
    name: 'RECON DELTA',
    type: 'DRONE_RECON',
    status: 'STANDBY',
    location: { latitude: BASE_LAT, longitude: BASE_LNG },
    etaMinutes: 0,
  },
  {
    id: 'squad-hazmat',
    name: 'HAZMAT ECHO',
    type: 'HAZMAT_TACTICAL',
    status: 'STANDBY',
    location: { latitude: BASE_LAT, longitude: BASE_LNG },
    etaMinutes: 0,
  }
];

export default function App() {
  const [feeds, setFeeds] = useState<DisasterFeed[]>(() => {
    const saved = localStorage.getItem('sar_feeds');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(() => {
    const saved = localStorage.getItem('sar_selected_feed_id');
    return saved || null;
  });

  const [teams, setTeams] = useState<RescueTeam[]>(() => {
    const saved = localStorage.getItem('sar_teams');
    return saved ? JSON.parse(saved) : INITIAL_SQUADS;
  });

  const [logs, setLogs] = useState<OperationalLog[]>(() => {
    const saved = localStorage.getItem('sar_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'log-boot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: 'Tactical SAR Engine initialized. Mainframe link online.',
      },
      {
        id: 'log-gps',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `Center Coordinate locked at ${BASE_LAT}°N, ${BASE_LNG}°W (Central Sector).`,
      },
    ];
  });

  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);

  // Persistent storage synchronizer
  useEffect(() => {
    localStorage.setItem('sar_feeds', JSON.stringify(feeds));
  }, [feeds]);

  useEffect(() => {
    if (selectedFeedId) {
      localStorage.setItem('sar_selected_feed_id', selectedFeedId);
    } else {
      localStorage.removeItem('sar_selected_feed_id');
    }
  }, [selectedFeedId]);

  useEffect(() => {
    localStorage.setItem('sar_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('sar_logs', JSON.stringify(logs));
  }, [logs]);

  // Dynamic coordinates animation/interpolation loop for en-route rescue squads
  useEffect(() => {
    const interval = setInterval(() => {
      setTeams((prevTeams) => {
        let changed = false;
        const nextTeams = prevTeams.map((team) => {
          if (team.status === 'DISPATCHED' && team.location && team.id) {
            // Find current target feed
            const targetFeed = feeds.find((f) => f.id === selectedFeedId);
            if (targetFeed?.analysis) {
              const targetLat = targetFeed.analysis.coordinates.latitude;
              const targetLng = targetFeed.analysis.coordinates.longitude;

              const latDiff = targetLat - team.location.latitude;
              const lngDiff = targetLng - team.location.longitude;

              // Step size
              const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

              if (dist < 0.0003) {
                // Arrived
                changed = true;
                addLog(
                  'SUCCESS',
                  `[SQUAD MOVEMENT] ${team.name} has arrived at ground zero: "${targetFeed.analysis.title}". Starting deployment checklist.`
                );
                return {
                  ...team,
                  status: 'ON_SITE',
                  etaMinutes: 0,
                  location: { latitude: targetLat, longitude: targetLng },
                };
              } else {
                // Step 30% closer
                changed = true;
                const nextLat = team.location.latitude + latDiff * 0.35;
                const nextLng = team.location.longitude + lngDiff * 0.35;
                return {
                  ...team,
                  location: { latitude: nextLat, longitude: nextLng },
                  etaMinutes: Math.max(1, (team.etaMinutes || 2) - 1),
                };
              }
            }
          }
          return team;
        });

        return changed ? nextTeams : prevTeams;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [feeds, selectedFeedId]);

  const addLog = (type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS', message: string) => {
    const newLog: OperationalLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // 1. Trigger server-side AI feed analyzer
  const handleAnalyzeFeed = async (feedId: string) => {
    const targetFeed = feeds.find((f) => f.id === feedId);
    if (!targetFeed) return;

    setAnalyzingIds((prev) => [...prev, feedId]);
    addLog('INFO', `Analyzing raw text data from ${targetFeed.source} via Gemini Dispatch Engine...`);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: targetFeed.rawText,
          source: targetFeed.source,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const parsed: AnalysisResult & { _isFallback?: boolean; _apiError?: string } = await response.json();

      setFeeds((prevFeeds) =>
        prevFeeds.map((f) => {
          if (f.id === feedId) {
            return {
              ...f,
              analyzed: true,
              analysis: {
                title: parsed.title,
                summary: parsed.summary,
                coordinates: parsed.coordinates,
                signsOfLife: parsed.signsOfLife,
                hazards: parsed.hazards,
                extractionPriority: parsed.extractionPriority,
                proximityThreats: parsed.proximityThreats,
                dispatchRecommendation: parsed.dispatchRecommendation,
                morseCodeSignal: parsed.morseCodeSignal,
                victimCountEstimate: parsed.victimCountEstimate,
              },
            };
          }
          return f;
        })
      );

      if (parsed._isFallback) {
        addLog(
          'WARNING',
          `Gemini analyzer completed in simulator fallback mode: parsed "${parsed.title}" containing ${parsed.victimCountEstimate} estimated survivors.`
        );
      } else {
        addLog(
          'SUCCESS',
          `[GEMINI ANALYSIS] Complete. Extracted critical coordinates: [${parsed.coordinates.latitude.toFixed(4)}°N, ${parsed.coordinates.longitude.toFixed(4)}°W]. Threat Priority: ${parsed.extractionPriority}.`
        );
      }

      // If survival signal is found
      if (parsed.signsOfLife.detected) {
        addLog(
          'ALERT',
          `[DISTRESS DETECTED] Signs of life verified! Confidence score: ${parsed.signsOfLife.confidence}%. ${parsed.signsOfLife.description}`
        );
      }

    } catch (err: any) {
      addLog('ALERT', `Critical error parsing feed #${feedId.slice(0, 8)}: ${err?.message || 'Server timeout'}`);
    } finally {
      setAnalyzingIds((prev) => prev.filter((id) => id !== feedId));
    }
  };

  // 2. Dispatch a rescue squad
  const handleDispatchTeam = (teamId: string) => {
    const currentFeed = feeds.find((f) => f.id === selectedFeedId);
    if (!currentFeed || !currentFeed.analysis) return;

    setTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team.id === teamId) {
          addLog(
            'WARNING',
            `[MOBILIZATION] ${team.name} dispatched to coordinate [${currentFeed.analysis?.coordinates.latitude.toFixed(4)}°N, ${currentFeed.analysis?.coordinates.longitude.toFixed(4)}°W] with urgency priority.`
          );
          return {
            ...team,
            status: 'DISPATCHED',
            etaMinutes: Math.floor(Math.random() * 4) + 3, // mock simulated ETA
          };
        }
        return team;
      })
    );
  };

  // 3. Recall a rescue squad
  const handleRecallTeam = (teamId: string) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team.id === teamId) {
          addLog('INFO', `[RECALL] ${team.name} instructed to disengage and return to Base HQ.`);
          return {
            ...team,
            status: 'STANDBY',
            location: { latitude: BASE_LAT, longitude: BASE_LNG },
            etaMinutes: 0,
          };
        }
        return team;
      })
    );
  };

  // 4. Inject preset feed
  const handleLoadPreset = (index: number) => {
    const preset = PRESET_FEEDS[index];
    const newFeed: DisasterFeed = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      source: preset.source as any,
      rawText: preset.rawText,
      analyzed: false,
    };
    setFeeds((prev) => [newFeed, ...prev]);
    setSelectedFeedId(newFeed.id);
    addLog('INFO', `Data link connection established: injected raw feed from ${preset.source}`);
  };

  // 5. Ingest custom feed
  const handleAddCustomFeed = (text: string, source: any) => {
    const newFeed: DisasterFeed = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      source,
      rawText: text,
      analyzed: false,
    };
    setFeeds((prev) => [newFeed, ...prev]);
    setSelectedFeedId(newFeed.id);
    addLog('INFO', `Inbound packet telemetry registered manually. Link node active.`);
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: 'log-clear',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: 'Terminal buffer cleared. Standard operations logs active.',
      },
    ]);
  };

  // 6. Full tactical reset — wipes feeds, squads, logs, and persisted storage
  const handleFullReset = () => {
    if (!window.confirm('Confirm full tactical reset? This will clear all feeds, squad positions, and logs.')) {
      return;
    }

    localStorage.removeItem('sar_feeds');
    localStorage.removeItem('sar_selected_feed_id');
    localStorage.removeItem('sar_teams');
    localStorage.removeItem('sar_logs');

    setFeeds([]);
    setSelectedFeedId(null);
    setTeams(INITIAL_SQUADS);
    setAnalyzingIds([]);
    setLogs([
      {
        id: 'log-reset',
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: 'Tactical SAR Engine reset. All feeds, squads, and logs cleared. Standing by.',
      },
    ]);
  };

  const activeSelectedFeed = feeds.find((f) => f.id === selectedFeedId) || null;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-mono flex flex-col antialiased">
      
      {/* 1. Tactical Command Header */}
      <header className="flex-shrink-0 bg-slate-950/80 border-b border-slate-900 py-3.5 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-orange-950/40 border border-orange-500/50 shadow-md shadow-orange-500/10">
            <Compass className="w-5 h-5 text-orange-500 animate-spin duration-10000" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-widest text-slate-100 uppercase">
              Elite Search & Rescue <span className="text-orange-500">AI Dispatcher</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              FEMA Tactical Command Matrix // Joint Operations Cockpit
            </p>
          </div>
        </div>

        {/* Dispatch status meters */}
        <div className="flex flex-wrap items-center gap-3.5 md:gap-5 text-[10px]">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-900 px-2.5 py-1 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-bold uppercase tracking-wide">SYSTEM: OPTIMAL</span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-900 px-2.5 py-1 rounded text-slate-400">
            <span>SQUADS ACTIVE:</span>
            <span className="text-cyan-400 font-bold">{teams.filter(t => t.status !== 'STANDBY').length}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-900 px-2.5 py-1 rounded text-slate-400">
            <span>ACTIVE INCIDENTS:</span>
            <span className="text-orange-500 font-bold">{feeds.length}</span>
          </div>

          <button
            type="button"
            onClick={handleFullReset}
            title="Clear all feeds, squads, and logs"
            className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 hover:border-red-500/70 px-2.5 py-1 rounded text-red-400 font-bold uppercase tracking-wide transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Disaster feeds ledger (4 cols) */}
        <section className="lg:col-span-4 h-[500px] lg:h-auto min-h-0">
          <FeedList
            feeds={feeds}
            selectedFeedId={selectedFeedId}
            onSelectFeed={setSelectedFeedId}
            onAnalyzeFeed={handleAnalyzeFeed}
            onAddCustomFeed={handleAddCustomFeed}
            onLoadPreset={handleLoadPreset}
            presets={PRESET_FEEDS}
            analyzingIds={analyzingIds}
          />
        </section>

        {/* CENTER COLUMN: Radar map grid & logs (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4 h-[700px] lg:h-auto min-h-0">
          <div className="flex-1 min-h-0">
            <TacticalMap
              feeds={feeds}
              teams={teams}
              selectedFeedId={selectedFeedId}
              onSelectFeed={setSelectedFeedId}
              centerLat={BASE_LAT}
              centerLng={BASE_LNG}
            />
          </div>
          <div className="h-72 lg:h-80 flex-shrink-0 min-h-0">
            <OperationalTerminal
              logs={logs}
              feeds={feeds}
              teams={teams}
              selectedFeed={activeSelectedFeed}
              onClearLogs={handleClearLogs}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: Squad status and Dispatch tools (3 cols) */}
        <section className="lg:col-span-3 h-[500px] lg:h-auto min-h-0">
          <ActiveDispatchBoard
            teams={teams}
            selectedFeed={activeSelectedFeed}
            onDispatchTeam={handleDispatchTeam}
            onRecallTeam={handleRecallTeam}
          />
        </section>

      </main>

    </div>
  );
}
