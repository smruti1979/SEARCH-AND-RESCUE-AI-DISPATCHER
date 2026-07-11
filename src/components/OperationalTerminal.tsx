/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, AlertOctagon, Heart, CheckSquare, Sparkles, Volume2 } from 'lucide-react';
import { OperationalLog, DisasterFeed, RescueTeam } from '../types';

interface OperationalTerminalProps {
  logs: OperationalLog[];
  feeds: DisasterFeed[];
  teams: RescueTeam[];
  selectedFeed: DisasterFeed | null;
  onClearLogs: () => void;
}

export default function OperationalTerminal({
  logs,
  feeds,
  teams,
  selectedFeed,
  onClearLogs,
}: OperationalTerminalProps) {
  const [isPlayingBeacon, setIsPlayingBeacon] = useState(false);
  const [morsePulse, setMorsePulse] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // SOS Morse Code Audio Synthesizer Beep
  const playMorseSOS = () => {
    if (isPlayingBeacon) {
      setIsPlayingBeacon(false);
      return;
    }

    setIsPlayingBeacon(true);

    // Audio Context lazy instantiation
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    const playBeep = (duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime); // high pitch tactical beep
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + duration - 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // SOS Pattern: . . .   - - -   . . .
    // Dot = 150ms, Dash = 400ms, Gap = 150ms
    const dot = 0.12;
    const dash = 0.35;
    const gap = 0.15;

    let time = 0.1;

    // S: . . .
    for (let i = 0; i < 3; i++) {
      playBeep(dot, time);
      time += dot + gap;
    }
    
    // Gap between letters
    time += 0.2;

    // O: - - -
    for (let i = 0; i < 3; i++) {
      playBeep(dash, time);
      time += dash + gap;
    }

    // Gap between letters
    time += 0.2;

    // S: . . .
    for (let i = 0; i < 3; i++) {
      playBeep(dot, time);
      time += dot + gap;
    }

    // Trigger visual flash
    let flashInterval = setInterval(() => {
      setMorsePulse((p) => !p);
    }, 200);

    setTimeout(() => {
      clearInterval(flashInterval);
      setMorsePulse(false);
      setIsPlayingBeacon(false);
      ctx.close();
    }, time * 1000 + 500);
  };

  // Compute operational statistics
  const totalFeeds = feeds.length;
  const analyzedFeeds = feeds.filter((f) => f.analyzed).length;
  const activeDangerZones = feeds.filter((f) => f.analyzed && f.analysis?.extractionPriority === 'IMMEDIATE').length;
  const activeSquads = teams.filter((t) => t.status !== 'STANDBY').length;
  
  // Total estimated victims
  const totalEstimatedTrapped = feeds.reduce((acc, f) => {
    if (f.analyzed && f.analysis) {
      return acc + (f.analysis.victimCountEstimate || 0);
    }
    return acc;
  }, 0);

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'ALERT': return 'text-red-500 font-bold';
      case 'WARNING': return 'text-orange-400 font-semibold';
      case 'SUCCESS': return 'text-emerald-400 font-semibold';
      default: return 'text-slate-400';
    }
  };

  return (
    <div id="tactical-terminal-panel" className="flex flex-col lg:flex-row h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
      
      {/* LEFT COLUMN: Operations Tracker Stats & Audio Beacons */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between bg-slate-950">
        <div className="p-3 space-y-3">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operational Analytics</div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 uppercase">Intel Feeds</span>
              <span className="text-sm font-bold text-slate-200">{analyzedFeeds} <span className="text-[10px] font-normal text-slate-500">/ {totalFeeds}</span></span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 uppercase">Active Squads</span>
              <span className="text-sm font-bold text-cyan-400">{activeSquads} <span className="text-[10px] font-normal text-slate-500">/ {teams.length}</span></span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 uppercase">Critical Zones</span>
              <span className={`text-sm font-bold ${activeDangerZones > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>{activeDangerZones}</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 uppercase">Trapped Est.</span>
              <span className={`text-sm font-bold ${totalEstimatedTrapped > 0 ? 'text-orange-400' : 'text-slate-400'}`}>{totalEstimatedTrapped}</span>
            </div>
          </div>

          {/* SOS Morse Signal Decoder Board */}
          <div className="bg-slate-900/20 border border-slate-900 p-3 rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 uppercase">Audio Beacon Tuner</span>
              <span className={`w-2 h-2 rounded-full ${morsePulse ? 'bg-red-500 scale-125 shadow-lg shadow-red-500' : 'bg-slate-800'} transition-all`} />
            </div>

            <div className="bg-slate-950 p-2 border border-slate-900 rounded flex flex-col gap-1 text-[10px] leading-normal">
              <span className="text-slate-400">Distress Code Signature:</span>
              <span className="text-orange-400 font-bold tracking-widest">
                {selectedFeed?.analysis?.morseCodeSignal && selectedFeed.analysis.morseCodeSignal !== 'N/A' 
                  ? selectedFeed.analysis.morseCodeSignal 
                  : '... --- ... (SOS Fallback)'}
              </span>
              <span className="text-[9px] text-slate-600">Click speaker to synthesize acoustic signal.</span>
            </div>

            <button
              onClick={playMorseSOS}
              className={`w-full py-1.5 rounded flex items-center justify-center gap-1.5 transition uppercase font-bold text-[10px] border ${
                isPlayingBeacon 
                  ? 'bg-red-950/40 border-red-500/40 text-red-400' 
                  : 'bg-orange-600 hover:bg-orange-500 border-transparent text-slate-950'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingBeacon ? 'animate-bounce' : ''}`} />
              <span>{isPlayingBeacon ? 'Broadcasting Beacon...' : 'Synthesize SOS'}</span>
            </button>
          </div>
        </div>

        {/* Core Capabilities Footer */}
        <div className="p-3 border-t border-slate-900 hidden lg:block">
          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-semibold">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span>Structured Gemini 3.5 Parser</span>
          </div>
          <p className="text-[10px] text-slate-600 leading-normal mt-1">
            Standardizing unstructured tactical transcripts instantly to isolate life indicators and coordinates.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Terminal Commands & Live Feed Logs */}
      <div className="flex-1 flex flex-col h-64 lg:h-auto min-h-0 bg-slate-950">
        {/* Terminal Tab Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-300 uppercase tracking-wide">Dispatcher Console Logs</span>
          </div>
          <button
            onClick={onClearLogs}
            className="px-2 py-0.5 rounded border border-slate-800 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 transition"
          >
            Clear Console
          </button>
        </div>

        {/* Live log rows */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-950/80 space-y-1.5 font-mono select-text leading-relaxed">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-[11px] font-medium leading-relaxed">
              <span className="text-slate-600 select-none flex-shrink-0">[{log.timestamp}]</span>
              <span className={`flex-shrink-0 uppercase text-[9px] px-1 py-0.5 rounded border select-none ${
                log.type === 'ALERT' ? 'bg-red-950/40 border-red-500/30 text-red-500 font-extrabold' :
                log.type === 'WARNING' ? 'bg-orange-950/40 border-orange-500/30 text-orange-400' :
                log.type === 'SUCCESS' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' :
                'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {log.type}
              </span>
              <span className={`break-words ${getLogTypeColor(log.type)}`}>{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

    </div>
  );
}
