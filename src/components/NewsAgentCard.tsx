import React, { useState } from 'react';
import { Newspaper, Search, AlertTriangle, CheckCircle2, ExternalLink, Sparkles, Loader2 } from 'lucide-react';

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  snippet: string;
  timestamp: string;
}

interface NewsAgentData {
  incidentDetected: boolean;
  incidentHeadline: string;
  incidentSummary: string;
  newsArticles: NewsArticle[];
  atmosphericLink: string;
}

interface NewsAgentCardProps {
  locationName: string;
  aqiValue: number;
  dominantPollutant: string;
}

export const NewsAgentCard: React.FC<NewsAgentCardProps> = ({
  locationName,
  aqiValue,
  dominantPollutant,
}) => {
  const [loading, setLoading] = useState(false);
  const [newsData, setNewsData] = useState<NewsAgentData | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchNewsAndIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/news-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName,
          aqiValue,
          dominantPollutant,
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setNewsData(result.data);
        setDataSource(result.source || 'Google Gemini AI + Google Search Grounding');
      } else {
        setError('Failed to retrieve news agent findings. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to the News & Incident Agent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-900 via-[#1B5D77] to-slate-900 text-white rounded-xl border border-sky-800 p-5 sm:p-6 shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold">
            <Newspaper className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-white">Live AI News & Incident Grounding Agent</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-300" /> Google Search Grounded
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Detects industrial fires, chemical leaks, wildfires, and localized air pollution reports linked to <span className="font-semibold text-white">{locationName}</span> (AQI: {aqiValue})
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={fetchNewsAndIncidents}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Scanning News & Incidents...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-slate-950" />
              <span>Scan Local News & Incidents</span>
            </>
          )}
        </button>
      </div>

      {/* Results Container */}
      <div className="mt-4 space-y-3">
        {!newsData && !loading && !error && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Agent ready. Click <strong>&quot;Scan Local News & Incidents&quot;</strong> to query real-time reports and smoke events for this region.</span>
            </div>
            <span className="text-slate-400 text-[11px] font-mono">Gemini 3.7 + Search Grounding</span>
          </div>
        )}

        {loading && (
          <div className="p-8 text-center bg-white/5 rounded-lg border border-white/10 text-slate-300 text-xs space-y-3">
            <div className="inline-block w-7 h-7 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium">Searching live web reports, industrial incident logs, and air pollution alerts for <strong>{locationName}</strong>...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {newsData && !loading && (
          <div className="p-4 rounded-lg bg-white/10 border border-white/15 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {newsData.incidentDetected ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-300" /> Incident / Smoke Event Detected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Normal Atmospheric Activity
                  </span>
                )}
                <h4 className="font-bold text-sm text-white">{newsData.incidentHeadline}</h4>
              </div>
              <span className="text-[10px] text-slate-300 font-mono bg-black/20 px-2.5 py-1 rounded border border-white/10">
                {dataSource}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">{newsData.incidentSummary}</p>

            <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-800/60 text-xs text-sky-100">
              <span className="font-bold text-sky-300 block mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" /> Atmospheric Link to AQI ({aqiValue}):
              </span>
              <p className="text-slate-200 text-[11.5px] leading-relaxed">{newsData.atmosphericLink}</p>
            </div>

            {newsData.newsArticles && newsData.newsArticles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                <span className="font-bold text-xs text-slate-300 block">Related News & Incident Reports:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {newsData.newsArticles.map((art, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-sky-400/40 transition text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sky-300 truncate">{art.source || 'News Source'}</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{art.timestamp || 'Recent'}</span>
                      </div>
                      <h5 className="font-bold text-white text-xs leading-snug">{art.title}</h5>
                      <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{art.snippet}</p>
                      {art.url && art.url !== 'https://airquality.example.gov' && (
                        <a 
                          href={art.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] text-sky-400 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                        >
                          <span>Read full report</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
