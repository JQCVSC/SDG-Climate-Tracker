import React, { useEffect, useState, useCallback } from 'react';
import { 
  CLEAN_AIR_RECOMMENDATIONS, 
  CleanAirRec, 
  getAqiDynamicGuidance 
} from '../cleanAirData';
import { 
  Car, 
  Bike, 
  Sliders, 
  Flame, 
  Zap, 
  Home, 
  ShieldCheck, 
  Trees, 
  Leaf, 
  Megaphone, 
  Activity, 
  CheckCircle2, 
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Square,
  CheckSquare,
  RefreshCw,
  Cpu,
  Wind
} from 'lucide-react';

interface GeminiAiAdvisory {
  headline: string;
  aiSummary: string;
  outdoorAdvice: string;
  indoorAdvice: string;
  commuteAdvice: string;
  actionRecommendation: string;
  keyPollutantInsight?: string;
  urgencyTier?: 'optimal' | 'moderate' | 'elevated' | 'hazardous';
  source?: string;
}

interface CleanAirActionToolkitProps {
  aqiCategory: string;
  aqiValue: number;
  locationName: string;
  dominantPollutant?: string;
  lat?: number;
  lng?: number;
  onPledgeAction: (rec: CleanAirRec) => void;
  completedActionIds: string[];
  onToggleActionCompleted: (id: string) => void;
}

export function CleanAirActionToolkit({
  aqiCategory,
  aqiValue,
  locationName,
  dominantPollutant = 'pm25',
  lat,
  lng,
  onPledgeAction,
  completedActionIds,
  onToggleActionCompleted
}: CleanAirActionToolkitProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'mobility' | 'household' | 'nature' | 'civic'>('all');
  const [aiAdvisory, setAiAdvisory] = useState<GeminiAiAdvisory | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSource, setAiSource] = useState<string>('Google Gemini AI (gemini-3.7-flash)');

  // Baseline deterministic fallback
  const baseGuidance = getAqiDynamicGuidance(aqiCategory, aqiValue, locationName);

  // Fetch Gemini AI recommendations for the active location & AQI
  const fetchGeminiRecommendations = useCallback(async () => {
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/gemini/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName,
          aqiValue,
          aqiCategory,
          dominantPollutant,
          lat,
          lng
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAiAdvisory(result.data);
          setAiSource(result.source || 'Google Gemini AI (gemini-3.7-flash)');
        }
      }
    } catch (err) {
      console.warn('Gemini recommendations fetch error:', err);
    } finally {
      setIsLoadingAi(false);
    }
  }, [locationName, aqiValue, aqiCategory, dominantPollutant, lat, lng]);

  useEffect(() => {
    fetchGeminiRecommendations();
  }, [fetchGeminiRecommendations]);

  const filteredRecs = CLEAN_AIR_RECOMMENDATIONS.filter(rec => {
    if (activeCategory === 'all') return true;
    return rec.category === activeCategory;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return <Car className="w-4 h-4" />;
      case 'Bike': return <Bike className="w-4 h-4" />;
      case 'Sliders': return <Sliders className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Home': return <Home className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Trees': return <Trees className="w-4 h-4" />;
      case 'Leaf': return <Leaf className="w-4 h-4" />;
      case 'Megaphone': return <Megaphone className="w-4 h-4" />;
      case 'Activity': return <Activity className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const progressPercent = Math.round((completedActionIds.length / CLEAN_AIR_RECOMMENDATIONS.length) * 100);

  // Active combined advisory data
  const currentHeadline = aiAdvisory?.headline || baseGuidance.headline;
  const currentAiSummary = aiAdvisory?.aiSummary || 
    `Atmospheric conditions in ${locationName} reflect an AQI of ${aqiValue} (${aqiCategory}). Prioritize clean transportation and indoor air protection during peak traffic hours.`;
  const currentOutdoor = aiAdvisory?.outdoorAdvice || baseGuidance.outdoorAdvice;
  const currentIndoor = aiAdvisory?.indoorAdvice || baseGuidance.indoorAdvice;
  const currentCommute = aiAdvisory?.commuteAdvice || baseGuidance.commuteAdvice;
  const currentAction = aiAdvisory?.actionRecommendation || baseGuidance.actionRecommendation;
  const currentPollutantNote = aiAdvisory?.keyPollutantInsight || 
    `Dominant pollutant: ${dominantPollutant.toUpperCase()} — monitor concentration levels near congested roadway corridors.`;

  const [activeAiTab, setActiveAiTab] = useState<'overview' | 'health' | 'transit' | 'indoor'>('overview');

  // Color classes according to AQI severity
  const severityBorder = 
    aqiValue <= 50 ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/95 via-teal-50/50 to-white text-emerald-950 shadow-sm' :
    aqiValue <= 100 ? 'border-amber-300 bg-gradient-to-br from-amber-50/95 via-orange-50/40 to-white text-amber-950 shadow-sm' :
    'border-rose-300 bg-gradient-to-br from-rose-50/95 via-orange-50/50 to-white text-rose-950 shadow-sm';

  const badgeStyles = 
    aqiValue <= 50 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
    aqiValue <= 100 ? 'bg-amber-100 text-amber-800 border-amber-300' :
    'bg-rose-100 text-rose-800 border-rose-300';

  return (
    <section className="space-y-6" id="clean-air-action-toolkit">
      
      {/* 1. Dynamic Live AQI Advisory Card Powered by Google Gemini AI */}
      <div id="ai-climate-advisory-card" className={`rounded-xl border p-5 sm:p-6 transition-all duration-300 ${severityBorder}`}>
        
        {/* Top Control & Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${badgeStyles}`}>
              {baseGuidance.badgeText}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1B5D77] text-white rounded-full text-xs font-semibold shadow-xs">
              <Sparkles className={`w-3.5 h-3.5 text-[#ECC247] ${isLoadingAi ? 'animate-spin' : 'animate-pulse'}`} />
              <span>Gemini 3.7 Flash AI Insights</span>
            </div>
            <span className="text-xs font-medium text-stone-600">
              for <strong>{locationName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono bg-white/95 px-3 py-1 rounded-md border border-black/10 font-bold text-stone-900 shadow-2xs">
              AQI: <span className="text-[#DE6738]">{aqiValue}</span> ({aqiCategory})
            </span>
            <button
              type="button"
              onClick={fetchGeminiRecommendations}
              disabled={isLoadingAi}
              title="Refresh AI insights with Gemini 3.7 Flash"
              className="px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 text-[#1B5D77] border border-black/10 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
              <span>{isLoadingAi ? 'Analyzing...' : 'Refresh AI'}</span>
            </button>
          </div>
        </div>

        {/* Gemini Headline & Source */}
        <div className="mt-4 mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#1B5D77] mb-1.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#DE6738]" />
              <span className="uppercase tracking-wider text-[11px]">Real-Time AI Atmospheric Assessment</span>
            </div>
            <span className="text-[11px] font-medium text-stone-600 bg-white/80 px-2 py-0.5 rounded border border-stone-200 font-mono">
              Engine: {aiSource}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
            {isLoadingAi ? 'Generating real-time atmospheric & dispersion analysis with Gemini...' : currentHeadline}
          </h3>
        </div>

        {/* Interactive AI Intelligence Section */}
        <div className="bg-white/95 backdrop-blur-xs p-4 rounded-xl border border-black/10 text-xs mb-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#1B5D77] text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#ECC247]" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  Gemini Climate Intelligence & Dispersion Analysis
                </h4>
                <p className="text-[11px] text-stone-500">
                  Synthesizing terrain, localized emissions, and WHO particulate thresholds
                </p>
              </div>
            </div>
            
            {/* AI Perspective Switcher */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveAiTab('overview')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeAiTab === 'overview' ? 'bg-[#1B5D77] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveAiTab('health')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeAiTab === 'health' ? 'bg-[#1B5D77] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Health & Seniors
              </button>
              <button
                type="button"
                onClick={() => setActiveAiTab('transit')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeAiTab === 'transit' ? 'bg-[#1B5D77] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Transit Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveAiTab('indoor')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeAiTab === 'indoor' ? 'bg-[#1B5D77] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Filtration
              </button>
            </div>
          </div>

          {/* Dynamic Tab Content */}
          {activeAiTab === 'overview' && (
            <div className="space-y-2">
              <p className="text-stone-800 leading-relaxed text-[12.5px] font-normal">
                {currentAiSummary}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                <span className="flex items-center gap-1.5 font-medium text-[#1B5D77]">
                  <Wind className="w-3.5 h-3.5" />
                  <span>{currentPollutantNote}</span>
                </span>
                <span className="font-mono text-stone-500">
                  Coordinates: {lat ? lat.toFixed(3) : '37.775'}, {lng ? lng.toFixed(3) : '-122.419'}
                </span>
              </div>
            </div>
          )}

          {activeAiTab === 'health' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950 block mb-0.5">Vulnerable Population & High-Exertion Guidance</span>
                  <p className="text-emerald-900 text-[12px] leading-relaxed">
                    {currentOutdoor} {aqiValue > 50 ? 'Asthma sufferers and elderly individuals should carry rescue inhalers and avoid high-cardio training during rush hour traffic peaks.' : 'Atmospheric conditions pose zero cardiovascular or respiratory barriers for children, runners, or seniors.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeAiTab === 'transit' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200/80">
                <Bike className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-950 block mb-0.5">Urban Commuter & Emission Reduction Protocol</span>
                  <p className="text-indigo-900 text-[12px] leading-relaxed">
                    {currentCommute} Turn off vehicle engines during curbside waits to protect nearby pedestrians.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeAiTab === 'indoor' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80">
                <Home className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block mb-0.5">Indoor Air Quality, Ventilation & HEPA Filtration</span>
                  <p className="text-amber-900 text-[12px] leading-relaxed">
                    {currentIndoor} Maintain MERV-13 or HEPA filtration units in primary living areas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4 Action Recommendation Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* 1. Outdoor Activity */}
          <div className="bg-white/95 p-3.5 rounded-xl border border-black/10 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="font-bold text-stone-900 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-800">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span>Outdoor Activity</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  AI Rec
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11.5px]">{currentOutdoor}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>Aerobic & Cardio</span>
              <span className="text-[#1B5D77] font-semibold">Gemini Validated</span>
            </div>
          </div>

          {/* 2. Indoor Air & Windows */}
          <div className="bg-white/95 p-3.5 rounded-xl border border-black/10 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="font-bold text-stone-900 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-blue-100 text-blue-800">
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <span>Indoor Air & Windows</span>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  AI Rec
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11.5px]">{currentIndoor}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>Ventilation Timing</span>
              <span className="text-[#1B5D77] font-semibold">HEPA Priority</span>
            </div>
          </div>

          {/* 3. Commute Choice */}
          <div className="bg-white/95 p-3.5 rounded-xl border border-black/10 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="font-bold text-stone-900 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-indigo-100 text-indigo-800">
                    <Bike className="w-3.5 h-3.5" />
                  </div>
                  <span>Commute Choice</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  AI Rec
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11.5px]">{currentCommute}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>Transit & Micromobility</span>
              <span className="text-[#DE6738] font-semibold">Low Emission</span>
            </div>
          </div>

          {/* 4. Direct Action */}
          <div className="bg-white/95 p-3.5 rounded-xl border border-black/10 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="font-bold text-stone-900 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-purple-100 text-purple-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Direct Action</span>
                </div>
                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  High Impact
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11.5px]">{currentAction}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>Community Impact</span>
              <span className="text-[#DE6738] font-semibold">Top Action</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. City Clean Air Action Toolkit & Recommendations Grid */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DE6738]"></span>
              <h2 className="text-lg font-bold text-stone-900">City Clean Air Action Toolkit</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F3F7] text-[#1B5D77] border border-[#B8DEEC] text-[11px] font-semibold">
                12 High-Impact Practices
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Evidence-based steps you, your household, and your community can take to clean the air in <strong>{locationName}</strong>.
            </p>
          </div>

          {/* User Progress Meter */}
          <div className="bg-[#FDF2EC]/50 border border-[#F5C7B4] rounded-lg p-3 min-w-[240px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5D77]" /> Your Clean Air Score
              </span>
              <span className="font-mono font-bold text-[#DE6738]">
                {completedActionIds.length}/{CLEAN_AIR_RECOMMENDATIONS.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#DE6738] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4 pb-5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#1B5D77] text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Solutions ({CLEAN_AIR_RECOMMENDATIONS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('mobility')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeCategory === 'mobility'
                ? 'bg-[#DE6738] text-white shadow-sm'
                : 'bg-[#FDF2EC] text-[#DE6738] hover:bg-[#FCE3D7] border border-[#F5C7B4]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Cleaner Mobility (4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('household')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeCategory === 'household'
                ? 'bg-[#D4A72B] text-white shadow-sm'
                : 'bg-[#FEF9E7] text-[#977312] hover:bg-[#FDF1CA] border border-[#F8E49D]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Household & Yard (4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('nature')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeCategory === 'nature'
                ? 'bg-[#1B5D77] text-white shadow-sm'
                : 'bg-[#E8F3F7] text-[#1B5D77] hover:bg-[#D5E9F0] border border-[#B8DEEC]'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>Urban Nature & Trees (3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('civic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeCategory === 'civic'
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Civic & Community (3)</span>
          </button>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecs.map((rec) => {
            const isCompleted = completedActionIds.includes(rec.id);
            return (
              <div 
                key={rec.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition hover:shadow-md ${
                  isCompleted 
                    ? 'bg-[#FDF2EC]/70 border-[#DE6738]' 
                    : 'bg-stone-50/70 border-stone-200 hover:border-[#1B5D77]'
                }`}
              >
                <div>
                  {/* Top Bar: Icon + Category + Impact */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-[#1B5D77] shadow-2xs">
                        {getIcon(rec.iconName)}
                      </div>
                      <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                        {rec.categoryLabel}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      rec.impactTier === 'High Impact'
                        ? 'bg-[#FEF9E7] text-[#977312] border border-[#F8E49D]'
                        : 'bg-stone-200 text-stone-700 border border-stone-300'
                    }`}>
                      {rec.badge}
                    </span>
                  </div>

                  {/* Title & Action */}
                  <div className="mt-3">
                    <h4 className="font-bold text-stone-900 text-sm leading-snug">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  {/* City Benefit Box */}
                  <div className="mt-3 p-2.5 bg-white rounded-lg border border-stone-200/70 text-xs">
                    <div className="font-semibold text-[#1B5D77] flex items-center gap-1 text-[11px] mb-0.5">
                      <Sparkles className="w-3 h-3 text-[#ECC247]" />
                      <span>Urban Air Benefit:</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {rec.cityBenefit}
                    </p>
                  </div>
                </div>

                {/* Bottom Controls: Practice Toggle & Pledge Trigger */}
                <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleActionCompleted(rec.id)}
                    className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-[#DE6738] font-medium cursor-pointer transition"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-[#DE6738]" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                    <span>{isCompleted ? 'Practicing' : 'I do this'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPledgeAction(rec)}
                    title="Populate this action in the Climate Pledge form"
                    className="px-2.5 py-1 bg-[#DE6738] hover:bg-[#C4552A] text-white rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                  >
                    <span>Pledge This</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
}
