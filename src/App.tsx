/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, RefreshCcw, Save, AlertTriangle, CheckCircle2, History, LayoutDashboard, Box, Truck, Copy, X } from 'lucide-react';
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
  const [ipcCaricati, setIpcCaricati] = useState<number>(0);
  const [overallInventory, setOverallInventory] = useState({
    primoCorso: 0,
    prodottoImport: 0,
    vuoti: 0
  });
  const [giacenze, setGiacenze] = useState({
    noDataEntry: 0,
    noDispacciato: 0,
    disguidi: 0,
    mxp: 0,
    linate: 0,
    francia: 0,
    germania: 0
  });
  const [history, setHistory] = useState<{ date: string; usage: Record<string, number>; ipcCaricati: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'cartellini' | 'complessivo' | 'giacenze'>('cartellini');
  const [isLoaded, setIsLoaded] = useState(false);
  const [reportContent, setReportContent] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    const savedTags = localStorage.getItem('sda_tags');
    const savedHistory = localStorage.getItem('sda_history');
    const savedOverall = localStorage.getItem('sda_overall');
    const savedGiacenze = localStorage.getItem('sda_giacenze');
    const savedIpcCaricati = localStorage.getItem('sda_ipc_caricati');
    
    if (savedTags) setTags(JSON.parse(savedTags));
    else setTags(INITIAL_TAGS);

    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedOverall) setOverallInventory(JSON.parse(savedOverall));
    if (savedGiacenze) setGiacenze(JSON.parse(savedGiacenze));
    if (savedIpcCaricati) setIpcCaricati(parseInt(savedIpcCaricati) || 0);
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sda_tags', JSON.stringify(tags));
      localStorage.setItem('sda_history', JSON.stringify(history));
      localStorage.setItem('sda_overall', JSON.stringify(overallInventory));
      localStorage.setItem('sda_giacenze', JSON.stringify(giacenze));
      localStorage.setItem('sda_ipc_caricati', ipcCaricati.toString());
    }
  }, [tags, history, overallInventory, giacenze, ipcCaricati, isLoaded]);

  const handleUsageChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setUsage(prev => ({ ...prev, [id]: numValue }));
  };

  const submitUsage = () => {
    const usageValues = Object.values(usage) as number[];
    const hasUsage = usageValues.some(v => v > 0) || ipcCaricati > 0;
    if (!hasUsage) return;

    const newTags = tags.map(tag => ({
      ...tag,
      current: Math.max(0, tag.current - (usage[tag.id] || 0))
    }));

    const newHistoryEntry = {
      date: new Date().toLocaleString(),
      usage: { ...usage },
      ipcCaricati: ipcCaricati
    };

    setTags(newTags);
    setHistory(prev => [newHistoryEntry, ...prev].slice(0, 10));
    setUsage({});
    setIpcCaricati(0);
    alert('Utilizzo registrato con successo!');
  };

  const resetInventory = () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati?')) {
      setTags(INITIAL_TAGS);
      setHistory([]);
      setUsage({});
      setIpcCaricati(0);
      setOverallInventory({ primoCorso: 0, prodottoImport: 0, vuoti: 0 });
      setGiacenze({
        noDataEntry: 0,
        noDispacciato: 0,
        disguidi: 0,
        mxp: 0,
        linate: 0,
        francia: 0,
        germania: 0
      });
    }
  };

  const generateEmail = () => {
    const date = new Date().toLocaleDateString();
    let body = `Report Inventario SDA - ${date}\n\n`;

    if (activeTab === 'cartellini') {
      const lowStock = tags.filter(t => t.current <= t.initial * REORDER_THRESHOLD);
      body += `--- GESTIONE CARTELLINI ---\n`;
      body += `Numero IPC Caricati: ${ipcCaricati}\n\n`;
      body += `STATO ATTUALE CARTELLINI:\n`;
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
    } else if (activeTab === 'complessivo') {
      body += `--- INVENTARIO COMPLESSIVO ---\n`;
      body += `Numero IPC Caricati: ${ipcCaricati}\n\n`;
      body += `Numero IPC Primo Corso pronti a partire: ${overallInventory.primoCorso}\n`;
      body += `IPC SDA con prodotto Import: ${overallInventory.prodottoImport}\n`;
      body += `IPC Vuoti: ${overallInventory.vuoti}\n`;
    } else {
      body += `--- GIACENZE MERCE / BANCALI ---\n`;
      body += `Numero IPC Caricati: ${ipcCaricati}\n\n`;
      body += `Numero di bancali non passati al data entry: ${giacenze.noDataEntry}\n`;
      body += `Numero di gabbie di prodotto non dispacciato: ${giacenze.noDispacciato}\n`;
      body += `Numero bancali disguidi: ${giacenze.disguidi}\n`;
      body += `Numero di bancali in giacenza non partiti prodotto per MXP: ${giacenze.mxp}\n`;
      body += `Numero di bancali in giacenza non partiti prodotto per LINATE: ${giacenze.linate}\n`;
      body += `Numero di bancali in giacenza non partiti prodotto per FRANCIA: ${giacenze.francia}\n`;
      body += `Numero di bancali in giacenza non partiti prodotto per GERMANIA: ${giacenze.germania}\n`;
    }

    let subject = `Report SDA ${date}`;
    if (activeTab === 'cartellini') subject = `Report Giornaliero SDA ${date}`;
    else if (activeTab === 'complessivo') subject = `Inventario Complessivo SDA ${date}`;
    else subject = `Giacenze Merce SDA ${date}`;

    setReportContent({ subject, body });

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiato negli appunti!');
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#0077B6] w-16 h-16 flex items-center justify-center rounded-lg shadow-sm">
              <span className="text-white font-bold text-2xl tracking-tighter">SDA</span>
            </div>
            <div>
              <h1 className="text-3xl font-light tracking-tight italic font-serif">GTW</h1>
              <p className="text-sm text-[#1A1A1A]/50 mt-0.5 uppercase tracking-widest">Sistema di Monitoraggio Logistico</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={generateEmail}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-full hover:bg-[#F27D26] transition-colors duration-300 text-sm font-medium uppercase tracking-wider"
          >
            <Mail size={16} />
            Genera Email {activeTab === 'cartellini' ? 'Report' : activeTab === 'complessivo' ? 'Inventario' : 'Giacenze'}
          </button>
          <button 
            onClick={resetInventory}
            className="p-3 border border-[#1A1A1A]/20 rounded-full hover:bg-[#1A1A1A]/5 transition-colors duration-300"
            title="Reset Totale"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
        <div className="flex gap-8 border-b border-[#1A1A1A]/5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('cartellini')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'cartellini' ? 'text-[#F27D26]' : 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]'}`}
          >
            <span className="flex items-center gap-2"><LayoutDashboard size={16} /> Cartellini</span>
            {activeTab === 'cartellini' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
          </button>
          <button 
            onClick={() => setActiveTab('complessivo')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'complessivo' ? 'text-[#F27D26]' : 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]'}`}
          >
            <span className="flex items-center gap-2"><Box size={16} /> Complessivo</span>
            {activeTab === 'complessivo' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
          </button>
          <button 
            onClick={() => setActiveTab('giacenze')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'giacenze' ? 'text-[#F27D26]' : 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]'}`}
          >
            <span className="flex items-center gap-2"><Truck size={16} /> Giacenze Merce</span>
            {activeTab === 'giacenze' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F27D26]" />}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12">
        <AnimatePresence mode="wait">
          {activeTab === 'cartellini' && (
            <motion.div 
              key="cartellini"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif italic">Stato Magazzino Cartellini</h2>
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
                      <motion.div key={tag.id} layout className={`p-6 border ${isLow ? 'border-orange-200 bg-orange-50/30' : 'border-[#1A1A1A]/10 bg-white'} rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium tracking-tight">{tag.name}</h3>
                            <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest mt-0.5">Codice Cartellino</p>
                          </div>
                          {isLow ? <AlertTriangle className="text-orange-500" size={20} /> : <CheckCircle2 className="text-green-500" size={20} />}
                        </div>
                        <div className="flex items-end justify-between mb-2">
                          <span className="text-3xl font-light tracking-tighter">
                            {tag.current} <span className="text-sm opacity-30">/ {tag.initial}</span>
                          </span>
                          <span className={`text-xs font-bold ${isLow ? 'text-orange-600' : 'text-[#1A1A1A]/40'}`}>{Math.round(percentage)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full ${isLow ? 'bg-orange-500' : 'bg-[#1A1A1A]'}`} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl p-8 sticky top-8">
                  <h2 className="text-2xl font-serif italic mb-6">Fine Giornata</h2>
                  <div className="mb-8 p-4 bg-[#1A1A1A]/5 rounded-2xl">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50 mb-2">Numero IPC Caricati</label>
                    <input type="number" min="0" value={ipcCaricati || ''} onChange={(e) => setIpcCaricati(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl text-lg font-medium focus:outline-none focus:border-[#F27D26] transition-colors" placeholder="0" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/30 mb-4">Cartellini Utilizzati</p>
                  <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between gap-4 p-2 hover:bg-[#1A1A1A]/5 rounded-xl transition-colors">
                        <span className="text-sm font-medium">{tag.name}</span>
                        <input type="number" min="0" placeholder="0" value={usage[tag.id] || ''} onChange={(e) => handleUsageChange(tag.id, e.target.value)} className="w-16 px-2 py-1.5 border border-[#1A1A1A]/10 rounded-lg text-right text-sm focus:outline-none focus:border-[#F27D26] transition-colors" />
                      </div>
                    ))}
                  </div>
                  <button onClick={submitUsage} className="w-full py-4 bg-[#F27D26] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#D96A1B] transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#F27D26]/20">
                    <Save size={18} /> Salva Utilizzo
                  </button>
                  {history.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-[#1A1A1A]/10">
                      <h3 className="text-xs uppercase tracking-widest font-bold opacity-30 mb-4 flex items-center gap-2"><History size={12} /> Cronologia Recente</h3>
                      <div className="space-y-3">
                        {history.map((entry, idx) => (
                          <div key={idx} className="text-[10px] flex justify-between items-center opacity-60">
                            <span>{entry.date}</span>
                            <span className="font-mono">IPC: {entry.ipcCaricati} | Tags: {(Object.values(entry.usage) as number[]).reduce((a, b) => a + b, 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'complessivo' && (
            <motion.div 
              key="complessivo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl p-12 shadow-sm">
                <h2 className="text-3xl font-serif italic mb-8">Inventario Complessivo</h2>
                <div className="space-y-8">
                  {[
                    { label: 'Numero IPC Primo Corso pronti a partire', key: 'primoCorso' },
                    { label: 'IPC SDA con prodotto Import', key: 'prodottoImport' },
                    { label: 'IPC Vuoti', key: 'vuoti' }
                  ].map((field) => (
                    <div key={field.key} className="group">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-3 group-focus-within:text-[#F27D26] transition-colors">{field.label}</label>
                      <input type="number" min="0" value={(overallInventory as any)[field.key] || ''} onChange={(e) => setOverallInventory(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))} className="w-full px-6 py-4 bg-[#1A1A1A]/5 border border-transparent rounded-2xl text-xl font-light focus:outline-none focus:bg-white focus:border-[#F27D26] transition-all" placeholder="0" />
                    </div>
                  ))}
                </div>
                <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={() => alert('Dati salvati correttamente!')}
                    className="px-8 py-5 border border-[#1A1A1A]/20 text-[#1A1A1A] rounded-full font-bold uppercase tracking-widest hover:bg-[#1A1A1A]/5 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <Save size={20} /> Salva Dati
                  </button>
                  <button onClick={generateEmail} className="px-12 py-5 bg-[#1A1A1A] text-white rounded-full font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-[#1A1A1A]/20">
                    <Mail size={20} /> Invia Report Complessivo
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'giacenze' && (
            <motion.div 
              key="giacenze"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl p-12 shadow-sm">
                <h2 className="text-3xl font-serif italic mb-8">Giacenze Merce / Bancali</h2>
                <div className="space-y-6">
                  {[
                    { label: 'Bancali non passati al data entry', key: 'noDataEntry' },
                    { label: 'Gabbie di prodotto non dispacciato', key: 'noDispacciato' },
                    { label: 'Bancali disguidi', key: 'disguidi' },
                    { label: 'Giacenza non partiti per MXP', key: 'mxp' },
                    { label: 'Giacenza non partiti per LINATE', key: 'linate' },
                    { label: 'Giacenza non partiti per FRANCIA', key: 'francia' },
                    { label: 'Giacenza non partiti per GERMANIA', key: 'germania' }
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-[#1A1A1A]/5 rounded-2xl transition-colors">
                      <label className="text-sm font-medium text-[#1A1A1A]/70">{field.label}</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={(giacenze as any)[field.key] || ''} 
                        onChange={(e) => setGiacenze(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))} 
                        className="w-full md:w-32 px-4 py-2 bg-white border border-[#1A1A1A]/10 rounded-xl text-right font-medium focus:outline-none focus:border-[#F27D26] transition-all" 
                        placeholder="0" 
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={() => alert('Giacenze salvate correttamente!')}
                    className="px-8 py-5 border border-[#1A1A1A]/20 text-[#1A1A1A] rounded-full font-bold uppercase tracking-widest hover:bg-[#1A1A1A]/5 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <Save size={20} /> Salva Giacenze
                  </button>
                  <button onClick={generateEmail} className="px-12 py-5 bg-[#1A1A1A] text-white rounded-full font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-[#1A1A1A]/20">
                    <Mail size={20} /> Invia Report Giacenze
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {reportContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A1A1A]/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-[#1A1A1A]/10 flex justify-between items-center">
                <h3 className="text-xl font-serif italic">Report Generato</h3>
                <button onClick={() => setReportContent(null)} className="p-2 hover:bg-[#1A1A1A]/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-2">Oggetto Email</p>
                  <div className="p-4 bg-[#1A1A1A]/5 rounded-xl text-sm font-medium flex justify-between items-center gap-4">
                    <span className="truncate">{reportContent.subject}</span>
                    <button onClick={() => copyToClipboard(reportContent.subject)} className="shrink-0 p-2 hover:bg-[#1A1A1A]/10 rounded-lg transition-colors text-[#F27D26]" title="Copia Oggetto">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-2">Corpo Email</p>
                  <div className="relative">
                    <pre className="p-6 bg-[#1A1A1A]/5 rounded-2xl text-sm font-sans whitespace-pre-wrap leading-relaxed">
                      {reportContent.body}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(reportContent.body)} 
                      className="absolute top-4 right-4 p-3 bg-white border border-[#1A1A1A]/10 rounded-xl shadow-sm hover:shadow-md transition-all text-[#F27D26]"
                      title="Copia Tutto il Testo"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-[#1A1A1A]/5 flex justify-end gap-4">
                <button 
                  onClick={() => setReportContent(null)}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
                >
                  Chiudi
                </button>
                <button 
                  onClick={() => {
                    const mailtoLink = `mailto:?subject=${encodeURIComponent(reportContent.subject)}&body=${encodeURIComponent(reportContent.body)}`;
                    window.location.href = mailtoLink;
                  }}
                  className="px-8 py-3 bg-[#F27D26] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#D96A1B] transition-colors shadow-lg shadow-[#F27D26]/20"
                >
                  Apri Client Email
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(26, 26, 26, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(26, 26, 26, 0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
