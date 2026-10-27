import React, { useState, useEffect } from 'react';
import { CurrencyCode, Subscription } from './types/subscription';
import { INITIAL_SUBSCRIPTIONS } from './data/sampleSubscriptions';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { SubscriptionList } from './components/SubscriptionList';
import { CalendarView } from './components/CalendarView';
import { OptimizationHub } from './components/OptimizationHub';
import { SubscriptionModal } from './components/SubscriptionModal';
import { CancellationModal } from './components/CancellationModal';
import { ExportImportModal } from './components/ExportImportModal';
import { advanceBillingDate, daysUntil } from './utils/dateUtils';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'subvault_subscriptions_v3';
const CURRENCY_STORAGE_KEY = 'subvault_currency_v3';

export default function App() {
  // Subscriptions state initialized from localStorage or default sample suite
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored subscriptions', e);
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  // Base Currency state
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD'].includes(stored)) {
        return stored as CurrencyCode;
      }
    } catch (e) {
      console.error('Failed to parse stored currency', e);
    }
    return 'USD';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'calendar' | 'optimization'>('overview');

  // Status filter state for subscription list
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetSubscription, setCancelTargetSubscription] = useState<Subscription | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync subscriptions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (e) {
      console.error('Failed to write subscriptions to localStorage', e);
    }
  }, [subscriptions]);

  // Sync currency to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (e) {
      console.error('Failed to write currency to localStorage', e);
    }
  }, [currency]);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add or Edit subscription
  const handleSaveSubscription = (sub: Subscription) => {
    setSubscriptions(prev => {
      const existsIndex = prev.findIndex(item => item.id === sub.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = sub;
        showToast(`Updated ${sub.name}`);
        return updated;
      } else {
        showToast(`Added ${sub.name}`);
        return [sub, ...prev];
      }
    });
  };

  // Delete subscription
  const handleDeleteSubscription = (id: string) => {
    const subToDelete = subscriptions.find(s => s.id === id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    showToast(`Removed ${subToDelete?.name || 'subscription'}`);
  };

  // Toggle Pause/Resume
  const handleTogglePause = (id: string) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'paused' ? 'active' : 'paused';
          showToast(`${s.name} is now ${nextStatus}`);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  // Advance cycle (mark payment confirmed and advance date)
  const handleAdvanceCycle = (id: string) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextDate = advanceBillingDate(s.nextBillingDate, s.billingCycle);
          showToast(`Recorded charge for ${s.name}. Next date: ${nextDate}`);
          return { ...s, nextBillingDate: nextDate };
        }
        return s;
      })
    );
  };

  // Upgrade / Switch to Annual billing
  const handleUpgradeToAnnual = (subId: string, annualCost: number) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id === subId) {
          showToast(`Switched ${s.name} to Annual billing (${annualCost}/year)`);
          return {
            ...s,
            billingCycle: 'yearly',
            cost: annualCost,
            annualEquivalentSavings: undefined,
          };
        }
        return s;
      })
    );
  };

  // Mark as cancelled
  const handleConfirmCancel = (id: string) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id === id) {
          showToast(`Marked ${s.name} as cancelled`);
          return { ...s, status: 'cancelled', autoRenew: false };
        }
        return s;
      })
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (sub: Subscription) => {
    setSubscriptionToEdit(sub);
    setIsSubscriptionModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setSubscriptionToEdit(null);
    setIsSubscriptionModalOpen(true);
  };

  // Open Cancel Assistant Guide
  const handleOpenCancelGuide = (sub: Subscription) => {
    setCancelTargetSubscription(sub);
    setIsCancelModalOpen(true);
  };

  // Reset sample dataset
  const handleResetSampleData = () => {
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    showToast('Reset to original sample subscriptions');
  };

  // Clear all
  const handleClearAll = () => {
    setSubscriptions([]);
    showToast('Cleared all subscriptions');
  };

  // Import handler
  const handleImport = (newSubs: Subscription[]) => {
    setSubscriptions(newSubs);
    showToast(`Successfully imported ${newSubs.length} subscriptions`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAdd}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top KPI Metrics Strip */}
        <MetricCards
          subscriptions={subscriptions}
          currency={currency}
          onFilterTrials={() => {
            setActiveTab('subscriptions');
            setStatusFilter('trial');
          }}
          onFilterSoon={() => {
            setActiveTab('subscriptions');
            setStatusFilter('upcoming7');
          }}
        />

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Category and Payment Method Distribution */}
            <CategoryBreakdown subscriptions={subscriptions} currency={currency} />

            {/* Upcoming Renewals Timeline & Quick Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Active Subscription Ledger
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Sorted by soonest upcoming billing date.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="text-xs font-semibold text-neutral-900 hover:text-neutral-700 flex items-center gap-1"
                >
                  <span>View All & Filter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <SubscriptionList
                subscriptions={subscriptions}
                currency={currency}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteSubscription}
                onTogglePause={handleTogglePause}
                onAdvanceCycle={handleAdvanceCycle}
                onOpenCancelGuide={handleOpenCancelGuide}
                onAddNew={handleOpenAdd}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Full Subscription Directory */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Subscription Directory
              </h2>
              <p className="text-xs text-neutral-500">
                Filter by free trials, upcoming 7-day deadlines, categories, or paused services.
              </p>
            </div>

            <SubscriptionList
              subscriptions={subscriptions}
              currency={currency}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteSubscription}
              onTogglePause={handleTogglePause}
              onAdvanceCycle={handleAdvanceCycle}
              onOpenCancelGuide={handleOpenCancelGuide}
              onAddNew={handleOpenAdd}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
        )}

        {/* Tab 3: Renewal Calendar */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Renewal Calendar
              </h2>
              <p className="text-xs text-neutral-500">
                Monthly calendar showing scheduled charges and daily totals.
              </p>
            </div>

            <CalendarView
              subscriptions={subscriptions}
              currency={currency}
              onOpenCancelGuide={handleOpenCancelGuide}
            />
          </div>
        )}

        {/* Tab 4: Optimization & Spend Audit */}
        {activeTab === 'optimization' && (
          <div className="space-y-4">
            <OptimizationHub
              subscriptions={subscriptions}
              currency={currency}
              onOpenCancelGuide={handleOpenCancelGuide}
              onUpgradeToAnnual={handleUpgradeToAnnual}
              onTogglePause={handleTogglePause}
            />
          </div>
        )}
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-12 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">SubVault</span>
            <span aria-hidden="true">·</span>
            <span>Recurring Subscription Manager & Budget Tracker</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-600">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-neutral-900 transition-colors"
            >
              Export Spreadsheet (CSV)
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleResetSampleData}
              className="hover:text-neutral-900 transition-colors"
            >
              Restore Sample Data
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('optimization')}
              className="hover:text-neutral-900 transition-colors"
            >
              Savings & Trials
            </button>
          </div>
        </div>
      </footer>

      {/* Subscription Add / Edit Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setSubscriptionToEdit(null);
        }}
        onSave={handleSaveSubscription}
        subscriptionToEdit={subscriptionToEdit}
        defaultCurrency={currency}
      />

      {/* Cancellation Assistant Modal */}
      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancelTargetSubscription(null);
        }}
        subscription={cancelTargetSubscription}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Data Backup & Export / Import Modal */}
      <ExportImportModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        subscriptions={subscriptions}
        onImport={handleImport}
        onResetSampleData={handleResetSampleData}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
