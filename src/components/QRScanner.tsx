import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, ScanLine } from 'lucide-react';
import { motion } from 'motion/react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Just logs errors during active search, usually too noisy to show user
        // console.warn(errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-md p-8 relative z-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Camera size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Scan QR Code</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 rounded-xl transition-colors">
            <X size={20} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-black border-4 border-indigo-50 dark:border-indigo-900/20">
          <div id="qr-reader" className="w-full"></div>
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
            <div className="w-full h-full border-2 border-dashed border-indigo-400 opacity-60 rounded-xl flex items-center justify-center">
               <ScanLine size={48} className="text-white animate-pulse" />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
          Arahkan kamera ke QR Code keluarga teman atau keluarga Anda untuk bergabung secara otomatis.
        </p>

        {error && (
          <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl text-center">
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
}
