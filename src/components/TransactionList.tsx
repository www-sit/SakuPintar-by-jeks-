import React from 'react';
import { Search, Plus, Filter, ShoppingBag, Utensils, Train, Heart, CreditCard, Gift, MoreHorizontal, Camera, ScanLine, Sparkles, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { Transaction, Category } from '@/src/types';
import { motion } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onScanClick: () => void;
}

const DEFAULT_ICON = <MoreHorizontal size={18} />;
const DEFAULT_COLOR = 'bg-slate-100 text-slate-600';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Makanan': <Utensils size={18} />,
  'Transportasi': <Train size={18} />,
  'Hiburan': <Gift size={18} />,
  'Belanja': <ShoppingBag size={18} />,
  'Tagihan': <CreditCard size={18} />,
  'Kesehatan': <Heart size={18} />,
  'Hutang': <AlertCircle size={18} />,
  'Lainnya': <MoreHorizontal size={18} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan': 'bg-orange-100 text-orange-600',
  'Transportasi': 'bg-blue-100 text-blue-600',
  'Hiburan': 'bg-purple-100 text-purple-600',
  'Belanja': 'bg-pink-100 text-pink-600',
  'Tagihan': 'bg-indigo-100 text-indigo-600',
  'Kesehatan': 'bg-emerald-100 text-emerald-600',
  'Hutang': 'bg-rose-100 text-rose-600',
  'Lainnya': 'bg-slate-100 text-slate-600',
};

export default function TransactionList({ transactions, onAddTransaction, onScanClick }: TransactionListProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Riwayat Transaksi</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Kelola semua pemasukan dan pengeluaranmu.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onScanClick}
            className="flex-1 md:flex-none bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all border border-emerald-100 dark:border-emerald-800/50"
          >
            <div className="relative">
              <Camera size={18} />
              <ScanLine size={10} className="absolute -top-1 -right-1 text-emerald-600" />
            </div>
            <span className="text-sm">Scan Struk</span>
          </button>
          <button 
            onClick={onAddTransaction}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <Plus size={20} />
            <span className="text-sm">Tambah</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 px-1">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            className="w-full pl-14 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all font-bold text-sm shadow-sm text-slate-700 dark:text-slate-200"
          />
        </div>
        <button className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-5 rounded-2xl text-slate-600 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold shadow-sm">
          <Filter size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-10 transition-all">
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {transactions.length > 0 ? (
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction, idx) => (
              <motion.div 
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                    CATEGORY_COLORS[transaction.category] || DEFAULT_COLOR,
                    "dark:bg-slate-800 dark:text-slate-300"
                  )}>
                    {CATEGORY_ICONS[transaction.category] || DEFAULT_ICON}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{transaction.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                      <span className="text-indigo-500 dark:text-indigo-400">{transaction.userName}</span>
                      <span className="opacity-30">•</span>
                      <span>{transaction.category}</span>
                      <span className="opacity-30">•</span>
                      <span>{new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-sm",
                    transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </p>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                    transaction.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                  )}>
                    {transaction.type}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Search size={24} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-widest leading-none">Belum ada transaksi.</p>
              <button 
                onClick={onAddTransaction}
                className="mt-4 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
              >
                Tambah transaksi pertama
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
