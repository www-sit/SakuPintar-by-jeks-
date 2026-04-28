import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Camera, ScanLine, Sparkles, Plus, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import { Transaction, Budget, Family } from '@/src/types';
import { motion } from 'motion/react';
import { useFirebase } from './FirebaseProvider';
import { MonthPicker } from './MonthPicker';

interface DashboardProps {
  family: Family;
  transactions: Transaction[];
  budgets: Budget[];
  onAddClick: () => void;
  onScanClick: () => void;
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#94a3b8'];

export default function Dashboard({ family, transactions, budgets, onAddClick, onScanClick }: DashboardProps) {
  const { activeMonth, setActiveMonth } = useFirebase();
  const monthTransactions = transactions.filter(t => t.date.startsWith(activeMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const totalDebt = budgets
    .filter(b => b.category !== 'Pemasukan')
    .reduce((acc, b) => acc + Math.max(0, b.spent - b.limit), 0);

  const categoryData = budgets.map((b, i) => ({
    name: b.category,
    value: b.spent,
    color: COLORS[i % COLORS.length]
  }));

  const [y, m] = activeMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthDays = [...Array(daysInMonth)].map((_, i) => {
    return new Date(y, m - 1, i + 1).toISOString().split('T')[0];
  });

  const chartData = monthDays.map(date => {
    const dayTransactions = transactions.filter(t => t.date === date);
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const dayExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    
    return {
      name: new Date(date).getDate().toString(),
      income: dayIncome,
      expense: dayExpense
    };
  });

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {transactions[0] ? transactions[0].title : 'Ringkasan Keuangan'}
            </h1>
            <div className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 text-[9px] font-black uppercase tracking-tighter">
              Personal Mode
            </div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-[0.2em]">Data Keuangan Anda</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <MonthPicker activeMonth={activeMonth} setActiveMonth={setActiveMonth} />
          <div className="flex items-center gap-3">
            <button 
              onClick={onScanClick}
              className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-4 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95 transition-all border border-slate-100 dark:border-slate-700"
              title="Scan Struk AI"
            >
              <ScanLine size={20} />
            </button>
            <button 
              onClick={onAddClick}
              className="bg-indigo-600 text-white px-5 py-4 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={20} />
              <span className="hidden md:inline text-xs">Tambah Transaksi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none"
        >
          <p className="text-indigo-100 text-sm font-medium mb-1">Total Saldo</p>
          <h3 className="text-3xl font-bold">{formatCurrency(balance)}</h3>
          <div className="mt-4 flex items-center gap-1 text-indigo-100 text-xs">
            <TrendingUp size={14} />
            <span>Update Real-time</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-rose-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-200 dark:shadow-none"
        >
          <p className="text-rose-100 text-sm font-medium mb-1">Jumlah Hutang</p>
          <h3 className="text-3xl font-bold">{formatCurrency(totalDebt)}</h3>
          <div className="mt-4 flex items-center gap-1 text-rose-100 text-xs">
            <TrendingUp size={14} className="rotate-180" />
            <span>Berdasarkan defisit anggaran</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pemasukan</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalIncome)}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Pengeluaran</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalExpense)}</h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col"
        >
          <div className="flex justify-between items-center mb-10">
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">Tren Bulanan</h4>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Pemasukan vs Pengeluaran (30 Hari)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Masuk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Keluar</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: tickColor, fontSize: 11, fontWeight: 700 }}
                  interval={4}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: tickColor, fontSize: 11, fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    backgroundColor: tooltipBg,
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#f43f5e" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col"
        >
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 text-lg">Distribusi Pengeluaran</h4>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                      backgroundColor: tooltipBg 
                    }}
                    itemStyle={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3 px-2 overflow-y-auto max-h-[250px]">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate max-w-[80px]">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
