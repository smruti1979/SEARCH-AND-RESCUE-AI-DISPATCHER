/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Radio, AlertTriangle, Cpu, Plus, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { DisasterFeed } from '../types';

interface FeedListProps {
  feeds: DisasterFeed[];
  selectedFeedId: string | null;
  onSelectFeed: (id: string) => void;
  onAnalyzeFeed: (id: string) => void;
  onAddCustomFeed: (text: string, source: any) => void;
  onLoadPreset: (index: number) => void;
  presets: Omit<DisasterFeed, 'id' | 'timestamp'>[];
  analyzingIds: string[];
}

export default function FeedList({
  feeds,
  selectedFeedId,
  onSelectFeed,
  onAnalyzeFeed,
  onAddCustomFeed,
  onLoadPreset,
  presets,
  analyzingIds,
}: FeedListProps) {
  const [customText, setCustomText] = useState('');
  const [customSource, setCustomSource] = useState<'CITIZEN_REPORTS' | 'DRONE_FEED' | 'RADIO_TRANSCRIPT' | 'SATELLITE'>('CITIZEN_REPORTS');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onAddCustomFeed(customText, customSource);
    setCustomText('');
    setShowForm(false);
  };

  const getSourceLabel = (src: string) => {
    switch (src) {
      case 'DRONE_FEED': return 'DRONE RECON';
      case 'RADIO_TRANSCRIPT': return 'RADIO COMM';
      case 'CITIZEN_REPORTS': return 'SOS CITIZEN';
      case 'THERMAL_SCAN': return 'THERMAL FLIGHT';
      case 'SEISMIC_SENSOR': return 'SEISMIC ANOMALY';
      default: return 'INTEL FEED';
    }
  };

  const getSourceColor = (src: string) => {
    switch (src) {
      case 'DRONE_FEED': return 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30';
      case 'RADIO_TRANSCRIPT': return 'bg-purple-950/40 text-purple-400 border-purple-500/30';
      case 'CITIZEN_REPORTS': return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
      case 'THERMAL_SCAN': return 'bg-red-950/40 text-red-400 border-red-500/30';
      default: return 'bg-amber-950/40 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div id="disaster-feed-list" className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
      {/* Title block */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-slate-200">Disaster Intel Feeds</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-0.5 rounded border border-orange-500/40 text-orange-400 hover:bg-orange-950/30 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Inject Feed</span>
        </button>
      </div>

      {/* Preset injection buttons quickbar */}
      {!showForm && (
        <div className="flex items-center gap-2 p-2 overflow-x-auto border-b border-slate-800 bg-slate-900/30 scrollbar-none">
          <span className="text-[10px] text-slate-500 uppercase whitespace-nowrap">Load Preset:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onLoadPreset(idx)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-slate-200 transition text-[10px] whitespace-nowrap"
            >
              {getSourceLabel(preset.source)}
            </button>
          ))}
        </div>
      )}

      {/* Manual Feed Inject Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-3 border-b border-slate-800 bg-slate-900/40 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-orange-400">Tactical Intel Ingest Form</span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">DATA LINK SOURCE</label>
            <select
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 p-1.5 rounded focus:outline-none focus:border-orange-500"
            >
              <option value="CITIZEN_REPORTS">Citizen SOS Report</option>
              <option value="DRONE_FEED">Drone Surveillance Relay</option>
              <option value="RADIO_TRANSCRIPT">Radio Dispatch Intercept</option>
              <option value="SATELLITE">Satellite Visual Intel</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">INTEL FEED CONTENT / SPEECH TRANSLATION</label>
            <textarea
              required
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter raw disaster description, including any coordinates, signs of life, fires, collapses, or flood updates..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 p-1.5 rounded focus:outline-none focus:border-orange-500 placeholder-slate-700 leading-relaxed text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold rounded uppercase transition text-center"
          >
            Transmit Intel Message
          </button>
        </form>
      )}

      {/* Feed List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
        {feeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center p-4">
            <AlertTriangle className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
            <div>No active feeds in dispatcher queue.</div>
            <div className="mt-1 text-[10px]">Load presets or inject a custom feed above to begin.</div>
          </div>
        ) : (
          feeds.map((feed) => {
            const isSelected = feed.id === selectedFeedId;
            const isAnalyzing = analyzingIds.includes(feed.id);

            return (
              <div
                key={feed.id}
                onClick={() => onSelectFeed(feed.id)}
                className={`relative p-3 cursor-pointer transition-all border-l-2 ${
                  isSelected
                    ? 'bg-slate-900/60 border-l-orange-500'
                    : 'hover:bg-slate-900/20 border-l-transparent'
                }`}
              >
                {/* Meta Row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSourceColor(feed.source)}`}>
                      {getSourceLabel(feed.source)}
                    </span>
                    <span className="text-[10px] text-slate-600">{feed.timestamp}</span>
                  </div>

                  {feed.analyzed && feed.analysis ? (
                    <div className="flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className={`font-bold uppercase ${
                        feed.analysis.extractionPriority === 'IMMEDIATE'
                          ? 'text-red-500'
                          : feed.analysis.extractionPriority === 'HIGH'
                          ? 'text-orange-500'
                          : 'text-amber-500'
                      }`}>
                        {feed.analysis.extractionPriority}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500">Unanalyzed</div>
                  )}
                </div>

                {/* Raw Body preview */}
                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-2.5">
                  {feed.rawText}
                </p>

                {/* Analysis Action / Loading state */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-slate-600">ID: #{feed.id.slice(0, 8)}</span>

                  {isAnalyzing ? (
                    <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[10px]">
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                      <span className="animate-pulse">GEMINI DISPATCH ENGINE PARSING...</span>
                    </div>
                  ) : !feed.analyzed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeFeed(feed.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold rounded text-[10px] transition group shadow shadow-orange-500/20"
                    >
                      <Sparkles className="w-3 h-3 group-hover:scale-110" />
                      <span>Analyze with Gemini</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>Telemetry mapped</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
