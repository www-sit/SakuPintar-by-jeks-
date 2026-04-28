import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface MonthPickerProps {
  activeMonth: string;
  setActiveMonth: (month: string) => void;
}

export function MonthPicker({ activeMonth, setActiveMonth }: MonthPickerProps) {
  const [year, month] = activeMonth.split('-').map(Number);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = activeMonth === currentMonthStr;
  
  const handlePrev = () => {
    const prevDate = new Date(year, month - 2, 1);
    setActiveMonth(prevDate.toISOString().slice(0, 7));
  };
  
  const handleNext = () => {
    const nextDate = new Date(year, month, 1);
    setActiveMonth(nextDate.toISOString().slice(0, 7));
  };

  const handleReset = () => {
    setActiveMonth(currentMonthStr);
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
        <button 
          onClick={handlePrev}
          className="p-3 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-indigo-600"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-3 px-4 min-w-[160px] justify-center">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isCurrentMonth ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
          )}>
            <Calendar size={16} />
          </div>
          <span className="font-bold text-slate-700 text-sm">{monthName}</span>
        </div>

        <button 
          onClick={handleNext}
          className="p-3 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-indigo-600"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {!isCurrentMonth && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleReset}
          className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95"
        >
          Bulan Ini
        </motion.button>
      )}
    </div>
  );
}
