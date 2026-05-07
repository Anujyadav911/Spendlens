"use client";

import { useState, useEffect } from "react";
import { X, Search, Clock, Signal, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { createPortal } from "react-dom";

type Tool = {
  id: string;
  display_name: string;
  provider: string;
  billing_type: "token" | "seat";
  price_input: number;
  price_monthly: number;
  last_synced_at: string;
  mcpd?: number;
};

const formatTokenPrice = (price: number) => {
  if (price === 0) return "Free";
  if (price < 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

const getProviderAvatar = (provider: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 ring-blue-50', 
    'bg-purple-100 text-purple-700 ring-purple-50', 
    'bg-emerald-100 text-emerald-700 ring-emerald-50', 
    'bg-orange-100 text-orange-700 ring-orange-50', 
    'bg-rose-100 text-rose-700 ring-rose-50'
  ];
  let hash = 0;
  for (let i = 0; i < provider.length; i++) hash = provider.charCodeAt(i) + ((hash << 5) - hash);
  const colorClass = colors[Math.abs(hash) % colors.length];
  const initial = provider.charAt(0).toUpperCase();
  
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ${colorClass}`}>
      {initial}
    </div>
  );
};

const containerAnim = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function PricingDrawer({ 
  isOpen, 
  onClose,
  onSelectTool 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSelectTool?: (tool: Tool) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  const handleSelect = (tool: Tool) => {
    setCopiedId(tool.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (onSelectTool) onSelectTool(tool);
  };

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-gray-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-[999] w-full sm:w-[540px] md:w-[45%] lg:w-[40%] bg-white shadow-2xl flex flex-col font-sans"
          >
            {/* Sticky Header with Blur */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600 ring-1 ring-blue-100">
                    <Signal size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Market Rates</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Live API & SaaS pricing</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 pb-5">
                <div className="relative flex items-center w-full h-11 rounded-xl border border-gray-200 bg-gray-50/50 shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <div className="grid place-items-center h-full w-12 text-gray-400">
                    <Search size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    className="peer h-full w-full outline-none text-[15px] font-medium text-gray-900 bg-transparent placeholder-gray-400"
                    type="text"
                    placeholder="Search tools, models, or providers..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-t border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="col-span-6">Tool & Provider</div>
                <div className="col-span-6 text-right pr-8">Current Rate</div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-white relative">
              {loading && results.length === 0 ? (
                <div className="flex justify-center items-center h-40 text-gray-400">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : results.length > 0 ? (
                <motion.ul 
                  variants={containerAnim} 
                  initial="hidden" 
                  animate="show"
                  className="divide-y divide-gray-100"
                >
                  {results.map((tool) => (
                    <motion.li 
                      variants={itemAnim}
                      key={tool.id} 
                      className="group grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50 transition-all duration-200 cursor-pointer relative"
                      onClick={() => handleSelect(tool)}
                    >
                      {/* Avatar & Info */}
                      <div className="col-span-6 flex items-center gap-3 pr-2">
                        {getProviderAvatar(tool.provider)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[15px] text-gray-900 truncate" title={tool.display_name}>
                              {tool.display_name}
                            </h4>
                            {tool.billing_type === 'seat' ? (
                              <span className="shrink-0 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold">
                                SaaS
                              </span>
                            ) : (
                              <span className="shrink-0 bg-purple-50 border border-purple-100 text-purple-700 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold">
                                API
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-gray-500 font-medium mt-0.5 truncate" title={tool.provider}>
                            {tool.provider}
                          </p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="col-span-6 flex justify-end items-center gap-4">
                        <div className="text-right font-mono">
                          {tool.billing_type === 'seat' ? (
                            <div className="flex items-baseline justify-end gap-1.5">
                              <span className="text-base font-bold text-gray-900 tracking-tight">${tool.price_monthly.toFixed(2)}</span>
                              <span className="text-[11px] text-gray-400 font-sans font-medium uppercase tracking-wide">/ mo</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-sans font-bold uppercase tracking-wider bg-gray-100 px-1.5 rounded">In</span>
                                <span className="text-[13px] font-semibold text-gray-800 tracking-tight">{formatTokenPrice(tool.price_input)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-sans font-bold uppercase tracking-wider bg-gray-100 px-1.5 rounded">Out</span>
                                <span className="text-[13px] font-semibold text-gray-800 tracking-tight">{formatTokenPrice(tool.price_output)}</span>
                              </div>
                              {tool.mcpd !== undefined && tool.mcpd > 0 && (
                                <div className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                                  Est. ${tool.mcpd.toFixed(2)} / mo (MCPD)
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Interactive Hover Action */}
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all text-blue-600">
                          {copiedId === tool.id ? <Check size={14} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Search size={24} />
                  </div>
                  <p className="text-[15px] font-semibold text-gray-900">No models found</p>
                  <p className="text-sm text-gray-500 mt-1">Try searching for "Claude" or "GPT"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {lastSynced && (
              <div className="px-6 py-4 bg-white border-t border-gray-100 text-[11px] font-semibold text-gray-400 flex items-center justify-center gap-2">
                <Clock size={14} />
                MARKET RATES LAST VERIFIED: {lastSynced.toUpperCase()}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
