/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import BudgetPlan from './components/BudgetPlan';
import FamilyManagement from './components/FamilyManagement';
import { Transaction, Budget, Category, Family } from './types';
import { Plus, X, Search, Settings, Wallet, Globe, Users, Loader2, Sparkles, LogOut, ChevronRight, LayoutDashboard, Receipt, Target, Bell, BellRing, Sun, Moon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from './lib/utils';
import { useFirebase } from './components/FirebaseProvider';

import ReceiptScanner from './components/ReceiptScanner';
import { ScannedReceipt } from './services/geminiService';

export default function App() {
  const { 
    user, loading: firebaseLoading, family, transactions, personalTransactions, budgets, personalBudgets, 
    signIn, signOut, addTransaction, updateBudget, addFamilyMember, createFamily, joinFamily, resetPersonalData 
  } = useFirebase();

  // Mencegah stuck loading selamanya di APK
  const [forceStopLoading, setForceStopLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (firebaseLoading) setForceStopLoading(true);
    }, 8000); // Jika 8 detik data belum muncul, paksa buka UI
    return () => clearTimeout(timer);
  }, [firebaseLoading]);

  const loading = firebaseLoading && !forceStopLoading;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [customCategory, setCustomCategory] = useState('');
  const [newScope, setNewScope] = useState<'personal' | 'family'>('personal');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) { setDisplayAmount(''); return; }
    setDisplayAmount(new Intl.NumberFormat('id-ID').format(parseInt(val)));
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(displayAmount.replace(/\D/g, ''));
    if (!newTitle || isNaN(numericAmount) || numericAmount <= 0) return;
    const finalCategory = newType === 'income' ? 'Pemasukan' : (customCategory || 'Lainnya');

    await addTransaction({
      id: Date.now().toString(),
      title: newTitle,
      amount: numericAmount,
      type: newType,
      category: finalCategory,
      userName: user?.displayName || 'User',
      userId: user?.uid || '',
      date: new Date().toISOString().split('T')[0],
      scope: newScope
    }, newScope);

    setIsModalOpen(false);
    setNewTitle('');
    setDisplayAmount('');
    setCustomCategory('');
  };

  const handleScanComplete = async (data: ScannedReceipt) => {
    const scope = 'personal';
    await addTransaction({
      id: Date.now().toString(),
      title: data.title,
      amount: data.amount,
      type: 'expense',
      category: data.category,
      userName: user?.displayName || 'User',
      userId: user?.uid || '',
      date: data.date || new Date().toISOString().split('T')[0],
      scope: scope
    }, scope);
    setIsScannerOpen(false);
  };

  // 1. TAMPILAN LOADING (Warna diubah agar terlihat prosesnya)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center text-white animate-bounce shadow-2xl">
          <Wallet size={40} />
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-800 dark:text-slate-100">SakuPintar</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 animate-pulse font-medium">Menyinkronkan data keuangan...</p>
      </div>
    );
  }

  // 2. TAMPILAN LOGIN (Jika user belum login)
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-8">
          <div className="w-24 h-24 bg-indigo-600 rounded-[35px] flex items-center justify-center text-white mx-auto shadow-2xl rotate-3">
            <Wallet size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">SakuPintar</h1>
            <p className="text-slate-500 mt-2 font-medium">Smart Family Finance by jeks</p>
          </div>
          <button onClick={signIn} className="w-full bg-slate-900 dark:bg-indigo-600 text-white h-16 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
            <span className="text-lg">Mulai dengan Google</span>
          </button>
          {forceStopLoading && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-xs font-bold text-left border border-amber-200">
              <AlertCircle size={20} />
              Koneksi lambat. Gunakan Google Login untuk melanjutkan.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // 3. TAMPILAN UTAMA APLIKASI
  return (
    <div className={cn("min-h-screen font-sans flex flex-col transition-colors duration-300", isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Wallet className="text-white w-5 h-5" /></div>
          <h1 className="font-black text-xl tracking-tight text-slate-800 dark:text-white">SakuPintar</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
          </button>
          <button onClick={() => setActiveTab('settings')} className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-sm">
            {user.photoURL ? <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" /> : <div className="bg-indigo-500 w-full h-full flex items-center justify-center text-white font-bold">{user.displayName?.charAt(0)}</div>}
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full pb-28">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'dashboard' && <Dashboard family={family || { id: '', name: 'Pribadi', members: [] }} transactions={personalTransactions} budgets={personalBudgets} onAddClick={() => { setNewScope('personal'); setIsModalOpen(true); }} onScanClick={() => setIsScannerOpen(true)} />}
              {activeTab === 'transactions' && <TransactionList transactions={personalTransactions} onAddTransaction={() => { setNewScope('personal'); setIsModalOpen(true); }} onScanClick={() => setIsScannerOpen(true)} />}
              {activeTab === 'budget' && <BudgetPlan budgets={budgets} personalBudgets={personalBudgets} onUpdateBudget={updateBudget} family={family} />}
              {activeTab === 'family' && <FamilyManagement family={family} transactions={transactions} budgets={budgets} onScanClick={() => setIsScannerOpen(true)} onAddMember={addFamilyMember} />}
              {activeTab === 'settings' && <SettingsSection user={user} signOut={signOut} resetPersonalData={resetPersonalData} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Action Button */}
      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl md:hidden z-40 active:scale-90 transition-transform"><Plus size={28} /></button>

      {/* Scanner & Modal */}
      <AnimatePresence>{isScannerOpen && <ReceiptScanner onScanComplete={handleScanComplete} onClose={() => setIsScannerOpen(false)} />}</AnimatePresence>
      
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-[35px] w-full max-w-md p-8 relative z-10 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Transaksi Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTransactionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keterangan</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Misal: Beli Pulsa" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-indigo-500 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                  <input type="text" value={displayAmount} onChange={handleAmountChange} placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-indigo-600 text-xl" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 py-5 rounded-2xl text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors">Simpan Transaksi</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsSection({ user, signOut, resetPersonalData, isDarkMode, setIsDarkMode }: any) {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
        <div className="relative">
          {user.photoURL ? <img src={user.photoURL} className="w-20 h-20 rounded-3xl object-cover border-2 border-indigo-100" referrerPolicy="no-referrer" /> : <div className="w-20 h-20 bg-indigo-500 rounded-3xl" />}
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white" />
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-800 dark:text-white">{user.displayName}</h4>
          <p className="text-slate-500 text-sm font-medium">{user.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <button onClick={resetPersonalData} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm text-left hover:bg-slate-50">Reset Data Pribadi</button>
        <button onClick={signOut} className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 py-5 rounded-[25px] font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
          <LogOut size={20} /> Keluar Akun
        </button>
      </div>
      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">SakuPintar v1.2.0 • Build Success</p>
    </div>
  );
}
