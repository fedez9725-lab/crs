/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, RefreshCcw, Save, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TagItem {
  id: string;
  name: string;
  initial: number;
  current: number;
}

const INITIAL_TAGS: TagItem[] = [
  { id: '1', name: 'NLAPNX', initial: 300, current: 300 },
  { id: '2', name: 'BEBRUX', initial: 250, current: 250 },
  { id: '3', name: 'LUFDLX', initial: 150, current: 150 },
  { id: '4', name: 'MIX LUFDLX', initial: 200, current: 200 },
  { id: '5', name: 'CZPRGX', initial: 200, current: 200 },
  { id: '6', name: 'SKBTSX', initial: 100, current: 100 },
  { id: '7', name: 'PLWAWA', initial: 150, current: 150 },
  { id: '8', name: 'SEMMAX', initial: 100, current: 100 },
  { id: '9', name: 'GBCVTX', initial: 400, current: 400 },
];

const REORDER_THRESHOLD = 0.2; // 20% of initial stock

export default function App() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<{ date: string; usage: Record<string, number> }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTags = localStorage.getItem('cronos_tags');
    const savedHistory = localStorage.getItem('cronos_history');
    
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    } else {
      setTags(INITIAL_TAGS);
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cronos_tags', JSON.stringify(tags));
      localStorage.setItem('cronos_history', JSON.stringify(history));
    }
  }, [tags, history, isLoaded]);

  const handleUsageChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setUsage(prev => ({ ...prev, [id]: numValue }));
  };

  const submitUsage = () => {
    const usageValues = Object.values(usage) as number[];
    const hasUsage = usageValues.some(v => v > 0);
    if (!hasUsage) return;

    const newTags = tags.map(tag => ({
      ...tag,
      current: Math.max(0, tag.current - (usage[tag.id] || 0))
    }));

    const newHistoryEntry = {
      date: new Date().toLocaleString(),
      usage: { ...usage }
    };

    setTags(newTags);
    setHistory(prev => [newHistoryEntry, ...prev].slice(0, 10)); // Keep last 10 days
    setUsage({});
    alert('Utilizzo registrato con successo!');
  };

  const resetInventory = () => {
    if (confirm('Sei sicuro di voler resettare l\'inventario ai valori iniziali?')) {
      setTags(INITIAL_TAGS);
      setHistory([]);
      setUsage({});
    }
  };

  const generateEmail = () => {
    const lowStock = tags.filter(t => t.current <= t.initial * REORDER_THRESHOLD);
    const date = new Date().toLocaleDateString();
    
    let body = `Report Inventario Cartellini Cronos - ${date}\n\n`;
    body += `STATO ATTUALE:\n`;
    tags.forEach(tag => {
      const status = tag.current <= tag.initial * REORDER_THRESHOLD ? '⚠️ RIORDINARE' : '✅ OK';
      body += `${tag.name}: ${tag.current} / ${tag.initial} (${status})\n`;
    });

    if (lowStock.length > 0) {
      body += `\nATTENZIONE: I seguenti cartellini sono in esaurimento:\n`;
      lowStock.forEach(tag => {
        body += `- ${tag.name} (Rimanenti: ${tag.current})\n`;
      });
    }

    const mailtoLink = `mailto:?subject=Report Inventario Cronos ${date}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight italic font-serif">Cronos Inventory</h1>
          <p className="text-sm text-[#1A1A1A]/50 mt-1 uppercase tracking-widest">Gestione Cartellini Giornaliera</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={generateEmail}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-full hover:bg-[#F27D26] transition-colors duration-300 text-sm font-medium uppercase tracking-wider"
          >
            <Mail size={16} />
            Genera Report Email
          </button>
          <button 
            onClick={resetInventory}
            className="p-3 border border-[#1A1A1A]/20 rounded-full hover:bg-[#1A1A1A]/5 transition-colors duration-300"
            title="Reset Inventario"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif italic">Stato Magazzino</h2>
            <div className="flex gap-4 text-xs uppercase tracking-widest font-semibold opacity-50">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> In Stock</span>
              <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-orange-500" /> Riordinare</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tags.map((tag) => {
              const isLow = tag.current <= tag.initial * REORDER_THRESHOLD;
              const percentage = (tag.current / tag.initial) * 100;
              
              return (
                <motion.div 
                  key={tag.id}
                  layout
                  className={`p-6 border ${isLow ? 'border-orange-200 bg-orange-50/30' : 'border-[#1A1A1A]/10 bg-white'} rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium tracking-tight">{tag.name}</h3>
                      <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest mt-0.5">Codice Cartellino</p>
                    </div>
                    {isLow ? (
                      <AlertTriangle className="text-orange-500" size={20} />
                    ) : (
                      <CheckCircle2 className="text-green-500" size={20} />
                    )}
                  </div>

                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-light tracking-tighter">
                      {tag.current} <span className="text-sm opacity-30">/ {tag.initial}</span>
                    </span>
                    <span className={`text-xs font-bold ${isLow ? 'text-orange-600' : 'text-[#1A1A1A]/40'}`}>
                      {Math.round(percentage)}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full ${isLow ? 'bg-orange-500' : 'bg-[#1A1A1A]'}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Daily Input Panel */}
        <div className="space-y-8">
          <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl p-8 sticky top-8">
            <h2 className="text-2xl font-serif italic mb-6">Fine Giornata</h2>
            <p className="text-sm text-[#1A1A1A]/60 mb-8 leading-relaxed">
              Inserisci la quantità di cartellini utilizzati oggi per aggiornare l'inventario.
            </p>

            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between gap-4 p-3 hover:bg-[#1A1A1A]/5 rounded-xl transition-colors">
                  <span className="text-sm font-medium">{tag.name}</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={usage[tag.id] || ''}
                    onChange={(e) => handleUsageChange(tag.id, e.target.value)}
                    className="w-20 px-3 py-2 border border-[#1A1A1A]/10 rounded-lg text-right text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={submitUsage}
              className="w-full py-4 bg-[#F27D26] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#D96A1B] transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#F27D26]/20"
            >
              <Save size={18} />
              Salva Utilizzo
            </button>

            {/* Recent History */}
            {history.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#1A1A1A]/10">
                <h3 className="text-xs uppercase tracking-widest font-bold opacity-30 mb-4 flex items-center gap-2">
                  <History size={12} />
                  Cronologia Recente
                </h3>
                <div className="space-y-3">
                  {history.map((entry, idx) => (
                    <div key={idx} className="text-[10px] flex justify-between items-center opacity-60">
                      <span>{entry.date}</span>
                      <span className="font-mono">
                        {(Object.values(entry.usage) as number[]).reduce((a, b) => a + b, 0)} totali
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(26, 26, 26, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(26, 26, 26, 0.2);
        }
      `}</style>
    </div>
  );
}
