"use client";

import { useState, useEffect } from "react";
import { Search, Clock } from "lucide-react";

type Tool = {
  id: string;
  display_name: string;
  provider: string;
  billing_type: "token" | "seat";
  price_input: number;
  price_output: number;
  price_monthly: number;
  last_synced_at: string;
};

const formatTokenPrice = (price: number) => {
  if (price === 0) return "Free";
  if (price < 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

export default function PricingSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const fetchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tools/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
          if (data.results.length > 0) {
            const date = new Date(data.results[0].last_synced_at);
            setLastSynced(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
          }
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(fetchTimeout);
  }, [query]);

  return (
    <div className="relative w-full max-w-2xl mx-auto font-sans z-50">
      <div className="relative flex items-center w-full h-14 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <div className="grid place-items-center h-full w-14 text-gray-400">
          <Search size={20} />
        </div>
        <input
          className="peer h-full w-full outline-none text-base text-gray-800 bg-transparent placeholder-gray-400"
          type="text"
          id="search"
          placeholder="Search AI models or tools (e.g., Claude, Cursor)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <div className="grid place-items-center h-full w-14 text-gray-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {results.length > 0 && query.trim() && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <ul className="max-h-[400px] overflow-y-auto">
            {results.map((tool) => (
              <li key={tool.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-default">
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                    {tool.display_name}
                    {tool.billing_type === 'seat' && (
                      <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold">
                        SaaS
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{tool.provider}</p>
                </div>
                
                <div className="text-right">
                  {tool.billing_type === 'seat' ? (
                    <div className="text-[15px] font-bold text-gray-900">
                      ${tool.price_monthly.toFixed(2)} <span className="text-xs font-normal text-gray-500">/ month</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[13px] font-semibold text-gray-900">
                        <span className="text-gray-400 font-normal mr-1.5 text-xs">In:</span>
                        {formatTokenPrice(tool.price_input)} 
                        <span className="text-gray-400 font-normal ml-1 text-xs">/ 1M</span>
                      </div>
                      <div className="text-[13px] font-semibold text-gray-900">
                        <span className="text-gray-400 font-normal mr-1.5 text-xs">Out:</span>
                        {formatTokenPrice(tool.price_output)} 
                        <span className="text-gray-400 font-normal ml-1 text-xs">/ 1M</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {lastSynced && (
            <div className="bg-gray-50 p-3 text-[11px] font-medium text-gray-400 flex items-center justify-center gap-1.5 border-t border-gray-100">
              <Clock size={12} />
              Prices updated {lastSynced}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
