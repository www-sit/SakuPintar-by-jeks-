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
import { Plus, X, Search, Settings, Wallet, Globe, Users, Loader2, Sparkles, LogOut, ChevronRight, LayoutDashboard, Receipt, Target, Bell, BellRing, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from './lib/utils';
import { useFirebase } from './components/FirebaseProvider';

import ReceiptScanner from './components/ReceiptScanner';
import { ScannedReceipt } from './services/geminiService';

export default function App() {
  const { 
    user, loading, family, transactions, personalTransactions, budgets, personalBudgets, 
    signIn, signOut, addTransaction, updateBudget, addFamilyMember, createFamily, joinFamily, resetPersonalData 
  } = useFirebase();

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
  const [newFamilyName, setNewFamilyName] = useState('');
  const [joinFamilyId, setJoinFamilyId] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState<string>('Makanan');
  const [customCategory, setCustomCategory] = useState('');
  const [newScope, setNewScope] = useState<'personal' | 'family'>('personal');

  const formatInputNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(digits));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputNumber(e.target.value);
    setDisplayAmount(formatted);
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

    // Reset and close
    setIsModalOpen(false);
    setNewTitle('');
    setDisplayAmount('');
    setCustomCategory('');
    setNewCategory('Makanan');
  };

  const handleScanComplete = async (data: ScannedReceipt) => {
    const scope = 'personal'; // Default scanned receipts to personal or ask? Let's keep personal for now.
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping bg-indigo-200 dark:bg-indigo-900/20 rounded-full scale-150 opacity-20" />
          <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl dark:shadow-none flex items-center justify-center text-indigo-600 dark:text-indigo-400 relative">
            <Wallet size={48} className="animate-pulse" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">SakuPintar</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse mt-1">Menyiapkan data keuanganmu...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
        <div className="w-full max-w-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-none p-12 space-y-12 relative overflow-hidden border border-white dark:border-slate-800"
          >
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 dark:shadow-none transform hover:rotate-12 transition-transform duration-500">
                <Wallet size={40} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                  SakuPintar <span className="block text-indigo-500 font-medium text-sm tracking-normal mt-1 italic">by jeks</span>
                </h1>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                  Smart Family Finance
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={signIn}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white h-16 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all active:scale-[0.98] group"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">Mulai dengan Google</span>
              </button>
              
              <div className="flex items-center gap-4 text-slate-100 dark:text-slate-800">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">Secure Sync</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          </motion.div>
          
          <p className="text-center mt-10 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
            Cloud Family Finance Platform
          </p>
        </div>
      </div>
    );
  }

  const EmptyState = ({ icon: Icon, title, desc, actionTab }: { icon: any, title: string, desc: string, actionTab?: string }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
      <div className="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
        <Icon size={40} />
      </div>
      <div className="max-w-xs space-y-2">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
      </div>
      {actionTab && (
        <button 
          onClick={() => setActiveTab(actionTab)}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          Siapkan Sekarang
        </button>
      )}
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen font-sans flex flex-col transition-colors duration-300",
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
    )}>
      {/* Top Header */}
      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 md:px-10 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
            <Wallet className="text-white w-5 h-5" />
          </div>
          <h1 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">
            SakuPintar <span className="text-indigo-500 font-medium text-xs ml-1 opacity-60">by jeks</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className="relative transition-all active:scale-95 hover:opacity-80"
            id="btn-profile-shortcut"
          >
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-md" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shadow-md border-2 border-white">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full pb-28 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                family={family || { id: '', name: 'Pribadi', members: [] }} 
                transactions={personalTransactions} 
                budgets={personalBudgets} 
                onAddClick={() => { setNewScope('personal'); setIsModalOpen(true); }}
                onScanClick={() => setIsScannerOpen(true)}
              />
            )}
            {activeTab === 'transactions' && (
              <TransactionList 
                transactions={personalTransactions} 
                onAddTransaction={() => { setNewScope('personal'); setIsModalOpen(true); }} 
                onScanClick={() => setIsScannerOpen(true)}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetPlan 
                budgets={budgets} 
                personalBudgets={personalBudgets}
                onUpdateBudget={updateBudget} 
                family={family}
              />
            )}
            {activeTab === 'family' && (
              <FamilyManagement 
                family={family} 
                transactions={transactions}
                budgets={budgets}
                onScanClick={() => setIsScannerOpen(true)}
                onAddMember={addFamilyMember}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsSection 
                user={user} 
                signOut={signOut} 
                resetPersonalData={resetPersonalData} 
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button (Mobile) */}
      {family && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-300 md:hidden z-40 transition-transform active:scale-95"
        >
          <Plus size={28} />
        </button>
      )}

      <AnimatePresence>
        {isScannerOpen && (
          <ReceiptScanner 
            onScanComplete={handleScanComplete}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
              
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Transaksi Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransactionSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Simpan Ke</label>
                    <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <button 
                        type="button"
                        onClick={() => setNewScope('personal')}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${newScope === 'personal' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 dark:text-slate-500"}`}
                      >
                        Pribadi
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewScope('family')}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${newScope === 'family' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 dark:text-slate-500"}`}
                      >
                        Keluarga
                      </button>
                    </div>
                  </div>

                  <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <button 
                      type="button"
                      onClick={() => setNewType('expense')}
                      className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${newType === 'expense' ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      Pengeluaran
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewType('income')}
                      className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${newType === 'income' ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Keterangan</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Misal: Belanja Kopi"
                      className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Jumlah (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500">Rp</span>
                      <input 
                        type="text" 
                        value={displayAmount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none font-bold text-xl text-indigo-600 dark:text-indigo-400 transition-all"
                      />
                    </div>
                  </div>

                  {newType === 'expense' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Pilih Kategori</label>
                        <div className="flex flex-wrap gap-2 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomCategory('Hutang');
                              setNewCategory('Hutang');
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              (customCategory === 'Hutang' || newCategory === 'Hutang')
                                ? "bg-rose-600 text-white shadow-lg shadow-rose-100 dark:shadow-none" 
                                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                            )}
                          >
                            Hutang
                          </button>
                          {(newScope === 'family' ? budgets : personalBudgets)
                            .filter(b => b.category !== 'Pemasukan' && b.category !== 'Hutang')
                            .map(b => (
                              <button
                                key={b.category}
                                type="button"
                                onClick={() => {
                                  setCustomCategory(b.category);
                                  setNewCategory(b.category);
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  (customCategory === b.category || newCategory === b.category)
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                                )}
                              >
                                {b.category}
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Kategori Lainnya</label>
                        <input 
                          type="text" 
                          value={customCategory}
                          onChange={(e) => {
                            setCustomCategory(e.target.value);
                            setNewCategory(e.target.value);
                          }}
                          placeholder="Ketik kategori baru..."
                          className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 py-5 rounded-3xl text-white font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Simpan Transaksi
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

function SettingsSection({ user, signOut, resetPersonalData, isDarkMode, setIsDarkMode }: { 
  user: any, 
  signOut: () => void, 
  resetPersonalData: () => void,
  isDarkMode: boolean,
  setIsDarkMode: (val: boolean) => void
}) {
  const checkNotifications = () => {
    if (!('Notification' in window)) {
      alert("Browser ini tidak mendukung notifikasi.");
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification("Test Berhasil!", {
        body: "Aplikasi SakuPintar Anda siap menerima peringatan anggaran.",
        icon: "/favicon.ico"
      });
    } else {
      Notification.requestPermission().then(p => {
        if (p === 'granted') {
          new Notification("Izin Diberikan!", { body: "Terima kasih telah mengaktifkan notifikasi." });
        } else {
          alert("Izin notifikasi ditolak. Anda tidak akan menerima peringatan anggaran.");
        }
      });
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-10">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-indigo-50/50 dark:text-indigo-900/10 group-hover:text-indigo-50 dark:group-hover:text-indigo-900/20 transition-colors pointer-events-none">
          <Bell size={80} />
        </div>
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <BellRing size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Sistem Peringatan</h3>
          </div>
          <div className="space-y-2 max-w-md">
            <p className="font-bold text-slate-700 dark:text-slate-200">Aktifkan Notifikasi Anggaran</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Dapatkan pemberitahuan otomatis di HP Anda saat pengeluaran mendekati 90% atau melewati limit anggaran.
            </p>
          </div>
          <button 
            onClick={checkNotifications}
            className="px-6 py-3 bg-indigo-600 text-white rounded-[20px] font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none flex items-center gap-2"
          >
            Aktifkan & Test Notifikasi
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Akun Cloud Saya</h3>
          <button 
            onClick={resetPersonalData}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
          >
            Reset Data Pribadi
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-24 h-24 rounded-[32px] object-cover shadow-lg border-4 border-white dark:border-slate-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-24 h-24 rounded-[32px] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl font-black shadow-lg">
                {user.displayName?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl border-4 border-white dark:border-slate-900">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-xl text-slate-800 dark:text-slate-100">{user.displayName}</h4>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm tracking-tight">{user.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest mt-2">
              <Globe size={11} />
              Verified Account
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings size={20} className="text-slate-400 dark:text-slate-500" />
            Preferensi
          </h3>
          <div className="space-y-2">
            <div 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-[24px] hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="font-bold text-slate-500 dark:text-slate-400 text-sm">Tema Tampilan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
                <div className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  isDarkMode ? "bg-indigo-600" : "bg-slate-200"
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    isDarkMode ? "left-6" : "left-1"
                  )} />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Bantuan Tampilan</p>
              <button 
                onClick={() => setIsDarkMode(false)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sun size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Kembalikan ke Tampilan Putih</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Ubah tema kembali ke Mode Terang (Default)</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
            <SettingsItem label="Bahasa" value="Bahasa Indonesia" icon={<div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">ID</div>} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sesi & Keamanan</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Data Anda tersinkronisasi otomatis dengan cloud setiap ada perubahan.</p>
          </div>
          <button 
            onClick={signOut}
            className="mt-8 w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 py-4 rounded-3xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Keluar Akun
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
        SakuPintar v1.2.0 • Data Cloud Active
      </p>
    </div>
  );
}

function SettingsItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-[24px] hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-bold text-slate-500 dark:text-slate-400 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{value}</span>
        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
      </div>
    </div>
  );
}
