import React from 'react';
import { LayoutDashboard, ReceiptText, Wallet, Settings, Users } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ReceiptText },
    { id: 'budget', label: 'Anggaran', icon: Wallet },
    { id: 'family', label: 'Keluarga', icon: Users },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:flex-col md:px-4 md:py-8">
      <ul className="flex justify-between items-center md:flex-col md:items-stretch md:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id} className="md:w-full">
              <button
                id={`nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1 md:flex-row md:gap-3 md:px-4 md:py-3 md:rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-indigo-600 md:bg-indigo-50 dark:md:bg-indigo-900/20" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 md:hover:bg-white dark:md:hover:bg-slate-800"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive ? "scale-110" : "")} />
                <span className="text-[10px] font-medium md:text-sm">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
