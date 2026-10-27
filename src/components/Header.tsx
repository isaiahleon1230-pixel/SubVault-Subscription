import React from 'react';
import { Plus, Download, RefreshCw } from 'lucide-react';
import { CurrencyCode } from '../types/subscription';
import { CURRENCY_SYMBOLS } from '../utils/currencyUtils';

interface HeaderProps {
  activeTab: 'overview' | 'subscriptions' | 'calendar' | 'optimization';
  setActiveTab: (tab: 'overview' | 'subscriptions' | 'calendar' | 'optimization') => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenBackupModal,
  currency,
  onCurrencyChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className="text-left group"
            >
              <span className="text-xl font-bold tracking-tight text-neutral-900 group-hover:text-neutral-700 transition-colors whitespace-nowrap">
                SubVault
              </span>
            </button>
          </div>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'overview'
                  ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'subscriptions'
                  ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'calendar'
                  ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Renewal Calendar
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'optimization'
                  ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Savings & Trials
            </button>
          </nav>

          {/* Zone 3: Primary action + Utilities */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Currency selector */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 text-xs font-medium text-neutral-600">
              {(['USD', 'EUR', 'GBP', 'CAD'] as CurrencyCode[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => onCurrencyChange(cur)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    currency === cur
                      ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                      : 'hover:text-neutral-900'
                  }`}
                  title={`View costs in ${cur} (${CURRENCY_SYMBOLS[cur]})`}
                >
                  {cur}
                </button>
              ))}
            </div>

            {/* Backup / Export */}
            <button
              onClick={onOpenBackupModal}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Data Backup & Export/Import"
              aria-label="Backup and export options"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-200 px-2 py-2 bg-neutral-50 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1.5 rounded-md ${activeTab === 'overview' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-2.5 py-1.5 rounded-md ${activeTab === 'subscriptions' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'}`}
        >
          All Subs
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-2.5 py-1.5 rounded-md ${activeTab === 'calendar' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'}`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`px-2.5 py-1.5 rounded-md ${activeTab === 'optimization' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'}`}
        >
          Audit
        </button>
      </div>
    </header>
  );
};
