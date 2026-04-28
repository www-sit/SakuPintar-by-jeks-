import React, { useState } from 'react';
import { Target, TrendingUp, AlertCircle, Edit2, X, AlertTriangle, Save, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { Budget } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector 
} from 'recharts';

interface BudgetPlanProps {
  budgets: Budget[];
  personalBudgets: Budget[];
  family: any | null;
  onUpdateBudget: (oldCategory: string, newCategory: string, newLimit: number, scope: 'personal' | 'family') => void;
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#94a3b8', '#0ea5e9'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // Adjust distance logic for mobile
  const isMobile = window.innerWidth < 768;
  const labelDistance = isMobile ? 12 : 18;
  const connectorLength = isMobile ? 8 : 15;

  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + labelDistance) * cos;
  const my = cy + (outerRadius + labelDistance) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * connectorLength;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <g>
      <text 
        x={cx} 
        y={cy} 
        dy={8} 
        textAnchor="middle" 
        fill={textColor} 
        className="text-base md:text-xl font-bold"
      >
        {payload.category.length > 10 && isMobile ? `${payload.category.substring(0, 8)}..` : payload.category}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill={textColor} className="text-[10px] md:text-xs font-bold">
        {formatCurrency(value)}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={14} textAnchor={textAnchor} fill={labelColor} className="text-[9px] md:text-[10px] font-bold">
        {`(${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

export default function BudgetPlan({ budgets, personalBudgets, family, onUpdateBudget }: BudgetPlanProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [activeScope, setActiveScope] = useState<'personal' | 'family'>('personal');

  const currentBudgets = activeScope === 'family' ? budgets : personalBudgets;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudget(budget);
    setNewLabel(budget.category);
    setNewLimit(budget.limit.toString());
  };

  const handleSave = () => {
    if (editingBudget && newLabel && newLimit) {
      onUpdateBudget(editingBudget.category, newLabel, parseInt(newLimit.replace(/\D/g, '')), activeScope);
      setEditingBudget(null);
    }
  };

  const totalBudget = currentBudgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = currentBudgets.reduce((acc, b) => acc + b.spent, 0);
  const totalBalance = totalBudget - totalSpent;
  const isDeficit = totalBalance < 0;
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Anggaran {activeScope === 'family' ? 'Keluarga' : 'Pribadi'}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Visualisasi dan kelola rencana keuanganmu.</p>
          
          {/* Scope Toggle */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl mt-4 w-fit border border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => { setActiveScope('personal'); setActiveIndex(0); }}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                activeScope === 'personal' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              Pribadi
            </button>
            <button 
              onClick={() => { setActiveScope('family'); setActiveIndex(0); }}
              disabled={!family}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                activeScope === 'family' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-700" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
                !family && "opacity-50 cursor-not-allowed"
              )}
            >
              Keluarga
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", isDeficit ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400")}>
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {isDeficit ? "Total Hutang" : "Total Anggaran"}
            </p>
            <p className={cn(
              "text-base font-black mt-1",
              isDeficit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-12 rounded-[40px] md:rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col lg:flex-row items-center gap-8 md:gap-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full -mr-32 -mt-32 blur-3xl invisible md:visible" />
        
        <div className="h-[300px] md:h-[350px] w-full lg:w-1/2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={currentBudgets.length > 0 ? currentBudgets : [{ category: 'Belum ada data', limit: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={6}
                dataKey="limit"
                onMouseEnter={onPieEnter}
                animationBegin={0}
                animationDuration={1500}
                stroke="none"
              >
                {currentBudgets.length > 0 ? currentBudgets.map((entry, index) => (
                  <Cell 
                    key={`cell-budget-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 transition-opacity outline-none"
                  />
                )) : <Cell fill="#f1f5f9" />}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-100 dark:shadow-none">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Alokasi Anggaran {activeScope === 'family' ? 'Keluarga' : 'Pribadi'}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {currentBudgets.length > 0 ? currentBudgets.map((budget, i) => (
              <motion.div 
                key={budget.category}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group",
                  activeIndex === i 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 shadow-md" 
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[100px]">{budget.category}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{totalBudget > 0 ? ((budget.limit / totalBudget) * 100).toFixed(0) : 0}% Porsi</p>
                  </div>
                </div>
                <ChevronRight size={16} className={cn("transition-all", activeIndex === i ? "text-indigo-600 dark:text-indigo-400 translate-x-1" : "text-slate-300 dark:text-slate-600")} />
              </motion.div>
            )) : (
              <p className="text-slate-400 dark:text-slate-500 text-sm italic py-8 text-center sm:col-span-2">Belum ada kategori anggaran yang dibuat.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentBudgets.map((budget, i) => {
          const isPemasukan = budget.category === 'Pemasukan';
          const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
          const isNearLimit = !isPemasukan && percentage > 85;
          const isOverLimit = !isPemasukan && budget.spent > budget.limit;

          return (
            <motion.div 
              key={budget.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white dark:bg-slate-900 p-6 rounded-[36px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-none transition-all space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{budget.category}</h4>
                  {!isPemasukan && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest leading-tight">
                      {budget.limit - budget.spent < 0 ? 'Defisit' : 'Sisa'}: {formatCurrency(Math.abs(budget.limit - budget.spent))}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => handleEditClick(budget)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{formatCurrency(budget.spent)}</span>
                  {!isPemasukan && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Target: {formatCurrency(budget.limit)}</span>}
                </div>
                {!isPemasukan && (
                  <div className="h-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverLimit ? "bg-rose-500" : isNearLimit ? "bg-amber-500" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {!isPemasukan ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <TrendingUp size={14} className={isNearLimit ? "text-rose-500" : "text-emerald-500"} />
                    <span>{percentage.toFixed(0)}% terpakai</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <TrendingUp size={14} />
                    <span>Total Pemasukan</span>
                  </div>
                )}
                {isNearLimit && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest",
                    isOverLimit ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                  )}>
                    <AlertCircle size={10} />
                    <span>{isOverLimit ? 'Limit!' : 'Waspada'}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingBudget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
               onClick={() => setEditingBudget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
              
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Edit2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Edit Anggaran</h3>
                </div>
                <button onClick={() => setEditingBudget(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 rounded-xl group transition-all">
                  <X size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Kategori</label>
                  <input 
                    type="text" 
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="Contoh: Biaya Sewa"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Limit Anggaran (Rp)</label>
                  <input 
                    type="text" 
                    value={editingBudget?.category === 'Pemasukan' ? 'Tanpa Limit' : newLimit.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                    onChange={(e) => {
                      if (editingBudget?.category !== 'Pemasukan') {
                        setNewLimit(e.target.value.replace(/\D/g, ''));
                      }
                    }}
                    disabled={editingBudget?.category === 'Pemasukan'}
                    className={cn(
                      "w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none font-bold text-xl transition-all",
                      editingBudget?.category === 'Pemasukan' ? "text-slate-400 dark:text-slate-500 cursor-not-allowed" : "text-indigo-600 dark:text-indigo-400"
                    )}
                    placeholder="0"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-3xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-4">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={18} />
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tighter">
                    Mengubah nama kategori akan menyesuaikan semua data transaksi terkait untuk menjaga sinkronisasi.
                  </p>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full bg-indigo-600 py-5 rounded-3xl text-white font-bold text-lg shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Save size={20} />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
