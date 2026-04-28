import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, User, Info, ArrowDownRight, ArrowUpRight, Wallet, Target, Sparkles, Bell, ReceiptText, PieChart as PieChartIcon, Lightbulb, TrendingUp, Activity, CheckCircle2, X, Plus, Globe, QrCode, ScanLine, LayoutGrid } from 'lucide-react';
import { Family, FamilyMember, Transaction, Budget, Category } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '@/src/lib/utils';
import { useFirebase } from './FirebaseProvider';
import { QRCodeCanvas } from 'qrcode.react';
import QRScanner from './QRScanner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { analyzeFamilyFinances, FamilyInsight } from '@/src/services/geminiService';
import { MonthPicker } from './MonthPicker';

interface FamilyManagementProps {
  family: Family;
  transactions: Transaction[];
  budgets: Budget[];
  onScanClick: () => void;
  onAddMember: (name: string, role: string) => void;
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#94a3b8'];

export default function FamilyManagement({ family, transactions, budgets, onScanClick, onAddMember }: FamilyManagementProps) {
  const { createFamily, joinFamily, leaveFamily, activeMonth, setActiveMonth, resetFamilyData } = useFirebase();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [joinFamilyId, setJoinFamilyId] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isQRShowOpen, setIsQRShowOpen] = useState(false);

  const handleQRJoin = (id: string) => {
    setJoinFamilyId(id);
    joinFamily(id);
    setIsQRScannerOpen(false);
  };

  if (!family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm"
        >
          <Users size={48} />
        </motion.div>
        
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Siapkan Keluarga</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Anda belum bergabung dengan grup keluarga manapun. Mulai kelola keuangan bersama sekarang.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Plus size={24} />
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest leading-none">Buat Grup Baru</h3>
              <input 
                type="text" 
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Nama Keluarga"
                className="w-full px-5 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 font-bold text-slate-700 dark:text-slate-200 transition-all text-center placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
              />
              <button 
                onClick={() => createFamily(newFamilyName)}
                disabled={!newFamilyName}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Buat Sekarang
              </button>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
          >
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Globe size={24} />
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest leading-none">Bergabung</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={joinFamilyId}
                  onChange={(e) => setJoinFamilyId(e.target.value)}
                  placeholder="ID Keluarga"
                  className="flex-1 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 font-bold text-slate-700 dark:text-slate-200 transition-all text-center placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                />
                <button 
                  onClick={() => setIsQRScannerOpen(true)}
                  className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm"
                  title="Scan QR untuk Gabung"
                >
                  <ScanLine size={20} />
                </button>
              </div>
              <button 
                onClick={() => joinFamily(joinFamilyId)}
                disabled={!joinFamilyId}
                className="w-full bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all disabled:opacity-50 border border-transparent shadow-lg dark:shadow-none font-bold"
              >
                Gabung
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim(), newMemberRole);
      setNewMemberName('');
      setNewMemberRole('member');
      setIsAddModalOpen(false);
    }
  };

  const familyTransactions = transactions
    .filter(t => t.date.startsWith(activeMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFamilyIncome = familyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalFamilyExpense = familyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalFamilyBudget = budgets.reduce((acc, b) => acc + b.limit, 0);
  const remainingBudget = totalFamilyBudget - totalFamilyExpense;
  const totalFamilyDebt = budgets
    .filter(b => b.category !== 'Pemasukan')
    .reduce((acc, b) => acc + Math.max(0, b.spent - b.limit), 0);
  const budgetUsagePercent = totalFamilyBudget > 0 ? (totalFamilyExpense / totalFamilyBudget) * 100 : 0;

  // Analysis for text description
  const mostExpensiveCategory = budgets.sort((a, b) => b.spent - a.spent)[0];
  const isOverBudget = totalFamilyExpense > totalFamilyBudget;

  const memberContributions = family.members.map(member => {
    const memberExpense = familyTransactions
      .filter(t => t.type === 'expense' && t.userName === member.name)
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      ...member,
      totalSpent: memberExpense,
      percentage: totalFamilyExpense > 0 ? (memberExpense / totalFamilyExpense) * 100 : 0
    };
  });

  const pieData = budgets.map((b, i) => ({
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
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-800 dark:text-slate-100 tracking-tight">Keuangan Keluarga</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
            <LayoutGrid size={14} className="text-indigo-500 dark:text-indigo-400" />
            Pantau & kelola ekonomi bersama {family.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <MonthPicker activeMonth={activeMonth} setActiveMonth={setActiveMonth} />
          <div className="flex flex-1 md:flex-none gap-3">
            <button 
              onClick={() => setIsQRShowOpen(true)}
              className="flex-1 md:flex-none bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-6 py-4 rounded-[24px] flex items-center justify-center gap-2 font-bold shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all"
            >
              <QrCode size={20} />
              <span className="hidden md:inline">Invite</span>
            </button>
            <button 
              onClick={onScanClick}
              className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-4 rounded-[24px] flex items-center justify-center gap-2 font-bold shadow-xl shadow-emerald-100 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles size={20} />
              <span>Scan AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Financial Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Pemasukan</p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFamilyIncome)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Input Kolektif Bulan Ini</div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Pengeluaran</p>
            <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalFamilyExpense)}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full overflow-hidden">
              <div 
                className={cn("h-full", isOverBudget ? "bg-rose-500" : "bg-rose-300")} 
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }} 
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{budgetUsagePercent.toFixed(0)}%</span>
          </div>
        </div>

        <div className={cn(
          "p-8 rounded-[40px] border shadow-xl flex flex-col justify-between transition-all",
          remainingBudget < 0 
            ? "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 shadow-rose-100/50 dark:shadow-none" 
            : "bg-indigo-600 border-indigo-500 shadow-indigo-100 dark:shadow-none text-white"
        )}>
          <div>
            <p className={cn(
              "text-xs font-bold uppercase tracking-widest mb-1",
              remainingBudget < 0 ? "text-rose-500 dark:text-rose-400" : "text-indigo-100"
            )}>Sisa Anggaran Tersedia</p>
            <h3 className={cn(
              "text-4xl font-bold",
              remainingBudget < 0 ? "text-rose-600 dark:text-rose-300" : "text-white"
            )}>{formatCurrency(remainingBudget)}</h3>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 dark:border-slate-100/10">
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest mb-1",
              remainingBudget < 0 ? "text-rose-400 dark:text-rose-500" : "text-indigo-200"
            )}>Jumlah Hutang Total</p>
            <p className={cn(
                "text-xl font-bold",
                remainingBudget < 0 ? "text-rose-700 dark:text-rose-200" : "text-white"
            )}>{formatCurrency(totalFamilyDebt)}</p>
          </div>
        </div>
      </div>

      {/* Trend Chart Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col"
      >
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
            <h4 className="font-black text-slate-800 dark:text-slate-100 text-xl tracking-tight">Tren Keuangan Keluarga</h4>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">30 Hari Terakhir</p>
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
        <div className="flex-1 w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFamilyIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFamilyExpense" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorFamilyIncome)" 
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#f43f5e" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorFamilyExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Collective Financial Health Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Alokasi Anggaran</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[240px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={`cell-family-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      backgroundColor: tooltipBg,
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }}
                    itemStyle={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 px-2 overflow-y-auto max-h-[240px]">
              {pieData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate max-w-[100px]">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Family Needs & Budget Health */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">

          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Target size={20} className="text-indigo-500 dark:text-indigo-400" />
              Status Anggaran Kategori
            </h3>
          </div>
          
          <div className="space-y-5">
            {budgets.map((budget) => (
              <div key={budget.category} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{budget.category}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Limit: {formatCurrency(budget.limit)}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-bold",
                    budget.spent > budget.limit ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
                  )}>
                    {formatCurrency(budget.spent)}
                  </span>
                </div>
                <div className="h-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
                    className={cn(
                      "h-full rounded-full",
                      budget.spent > budget.limit ? "bg-rose-500" : "bg-indigo-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Profiles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users size={20} className="text-indigo-500 dark:text-indigo-400" />
            Anggota Keluarga
          </h3>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <UserPlus size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {memberContributions.map((member, i) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4",
                member.role === 'admin' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
              )}>
                {member.name.charAt(0)}
              </div>
              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{member.name}</h5>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 mb-4">{member.role === 'admin' ? 'Kepala' : 'Anggota'}</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Bulan Ini</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">{formatCurrency(member.totalSpent)}</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 dark:text-slate-500">Porsi</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{member.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${member.percentage}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Family Transactions List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ReceiptText size={20} className="text-indigo-500 dark:text-indigo-400" />
            Riwayat Transaksi Keluarga
          </h3>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all">
            {familyTransactions.length} Transaksi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {familyTransactions.length > 0 ? (
              familyTransactions.slice(0, 10).map((t, i) => (
                <div key={t.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-between border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                      t.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                    )}>
                      {t.category.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{t.title}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{t.userName}</span>
                        <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">{t.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-black text-sm",
                      t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-0.5 transition-all">{t.category}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600 shadow-sm transition-all">
                  <ReceiptText size={32} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-medium tracking-tight">Belum ada transaksi keluarga bulan ini.</p>
              </div>
            )}
            {familyTransactions.length > 10 && (
              <div className="p-4 text-center">
                <button className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                  Lihat Semua Transaksi Keluarga
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
            <Shield size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Manajemen Keluarga</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-1 mb-6">
              <p className="font-bold text-slate-800">Keluar Keluarga</p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Hapus akses Anda ke grup ini. Data Anda akan tetap tersimpan namun Anda tidak bisa mengaksesnya.</p>
            </div>
            <button 
              onClick={leaveFamily}
              className="w-full px-8 py-4 bg-white text-slate-600 rounded-[22px] font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 border border-slate-100 flex items-center justify-center gap-2"
            >
              <X size={18} />
              Keluar
            </button>
          </div>

          {(family.members.find(m => m.id === useFirebase().user?.uid)?.role === 'admin') && (
            <div className="bg-rose-50/30 p-8 rounded-[40px] border border-rose-100 shadow-sm flex flex-col justify-between">
              <div className="space-y-1 mb-6">
                <p className="font-bold text-rose-800">Reset Data Keluarga</p>
                <p className="text-sm text-rose-600/70 font-medium leading-relaxed">Admin: Hapus seluruh riwayat transaksi keluarga bulan ini untuk memulai dari awal.</p>
              </div>
              <button 
                onClick={resetFamilyData}
                className="w-full px-8 py-4 bg-rose-600 text-white rounded-[22px] font-bold text-sm hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-200 flex items-center justify-center gap-3"
              >
                <TrendingUp size={18} className="rotate-180" />
                <span>Reset Transaksi Keluarga</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isQRScannerOpen && (
          <QRScanner 
            onScanSuccess={handleQRJoin}
            onClose={() => setIsQRScannerOpen(false)}
          />
        )}

        {isQRShowOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsQRShowOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-10 relative z-10 shadow-2xl text-center border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">QR Code Keluarga</h3>
                <button onClick={() => setIsQRShowOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                  <X size={20} className="text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-200 p-8 rounded-[32px] inline-block mb-8 border border-slate-100 dark:border-slate-300">
                <QRCodeCanvas 
                  value={family.id} 
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID Keluarga</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 py-2 px-4 rounded-xl inline-block">{family.id}</p>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
                  Mintalah anggota keluarga lain untuk men-scan kode ini dari menu "Keluarga" {'>'} "Bergabung" untuk masuk ke grup <strong>{family.name}</strong>.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
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
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Tambah Anggota</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:border-slate-700 rounded-xl group transition-all">
                  <X size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Anggota</label>
                  <input 
                    type="text" 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="Contoh: Budi"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Peran Keluarga</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setNewMemberRole('admin')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                        newMemberRole === 'admin' ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                      )}
                    >
                      <Shield size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Kepala</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewMemberRole('member')}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                        newMemberRole === 'member' ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                      )}
                    >
                      <User size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Anggota</span>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 py-5 rounded-3xl text-white font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Users size={20} />
                  <span>Tambahkan Anggota</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

