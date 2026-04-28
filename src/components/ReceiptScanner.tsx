import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, ScanText, ScanLine } from 'lucide-react';
import { scanReceipt, ScannedReceipt } from '@/src/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptScannerProps {
  onScanComplete: (data: ScannedReceipt) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await scanReceipt(base64, file.type);
        onScanComplete(result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-8 relative z-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ScanText size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">Scan Struk AI</h3>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Powered by Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 rounded-xl transition-colors">
            <X size={20} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse bg-emerald-100 dark:bg-emerald-900/20 rounded-full scale-150 opacity-20" />
              <div className="relative w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                <Loader2 size={48} className="text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <motion.div 
                animate={{ y: [0, 60, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 left-0 w-full h-0.5 bg-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Menganalisis Struk...</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Gemini sedang membaca rincian belanjamu.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="aspect-square rounded-3xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center space-y-5 group hover:border-emerald-300 transition-colors cursor-pointer relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]"
                 onClick={() => fileInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all relative">
                <Camera size={40} />
                <ScanLine size={18} className="absolute -top-2 -right-2 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="z-10">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">Foto & Scan Struk</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 leading-relaxed px-4">Ambil foto struk dari merchant mana pun untuk input otomatis.</p>
                <span className="inline-block bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-105">Pilih Gambar</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                capture="environment"
                className="hidden" 
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center gap-3">
                <X size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
            >
              <Upload size={20} />
              <span>Unggah Gambar</span>
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
          <div className="flex items-start gap-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl">
            <div className="mt-0.5 text-indigo-500 dark:text-indigo-400">
              <Sparkles size={16} />
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
              AI akan otomatis mengisi nama merchant, jumlah, kategori, dan tanggal dari foto struk yang kamu unggah.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
