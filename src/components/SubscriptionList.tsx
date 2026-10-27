import React, { useState, useMemo } from 'react';
import {
  CurrencyCode,
  Subscription,
  CategoryKey,
  SubscriptionStatus,
} from '../types/subscription';
import { CATEGORIES } from '../data/presets';
import {
  formatRelativeDate,
  formatFullDate,
  daysUntil,
  toMonthlyCost,
  advanceBillingDate,
} from '../utils/dateUtils';
import { convertCurrency, formatCurrency } from '../utils/currencyUtils';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  Play,
  Pause,
  RotateCw,
  Edit2,
  Trash2,
  List,
  LayoutGrid,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onTogglePause: (id: string) => void;
  onAdvanceCycle: (id: string) => void;
  onOpenCancelGuide: (subscription: Subscription) => void;
  onAddNew: () => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  currency,
  onEdit,
  onDelete,
  onTogglePause,
  onAdvanceCycle,
  onOpenCancelGuide,
  onAddNew,
  statusFilter,
  setStatusFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'renewal' | 'cost_desc' | 'cost_asc' | 'name'>('renewal');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Filter & sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Status filter
        if (statusFilter === 'active' && sub.status !== 'active') return false;
        if (statusFilter === 'trial' && sub.status !== 'trial') return false;
        if (statusFilter === 'paused' && sub.status !== 'paused') return false;
        if (statusFilter === 'upcoming7') {
          const days = daysUntil(sub.nextBillingDate);
          if (days < 0 || days > 7) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && sub.category !== selectedCategory) return false;

        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = sub.name.toLowerCase().includes(q);
          const matchMethod = sub.paymentMethod.toLowerCase().includes(q);
          const matchTags = sub.tags.some((t) => t.toLowerCase().includes(q));
          const matchNotes = (sub.notes || '').toLowerCase().includes(q);
          if (!matchName && !matchMethod && !matchTags && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'renewal') {
          const daysA = daysUntil(a.nextBillingDate);
          const daysB = daysUntil(b.nextBillingDate);
          return daysA - daysB;
        }
        if (sortBy === 'cost_desc') {
          const costA = convertCurrency(toMonthlyCost(a.cost, a.billingCycle), a.currency, currency);
          const costB = convertCurrency(toMonthlyCost(b.cost, b.billingCycle), b.currency, currency);
          return costB - costA;
        }
        if (sortBy === 'cost_asc') {
          const costA = convertCurrency(toMonthlyCost(a.cost, a.billingCycle), a.currency, currency);
          const costB = convertCurrency(toMonthlyCost(b.cost, b.billingCycle), b.currency, currency);
          return costA - costB;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subscriptions, statusFilter, selectedCategory, searchQuery, sortBy, currency]);

  return (
    <div className="space-y-4">
      {/* Search, Filter Bar & Controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-4">
        {/* Top row: Search input + View toggles + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriptions, cards, tags..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right controls: Category filter, Sort, View Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/60 border border-neutral-200 rounded-lg text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORIES).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/60 border border-neutral-200 rounded-lg text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
            >
              <option value="renewal">Sort: Next Renewal</option>
              <option value="cost_desc">Sort: Highest Cost</option>
              <option value="cost_asc">Sort: Lowest Cost</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-neutral-600">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'
                }`}
                title="Table View"
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:text-neutral-900'
                }`}
                title="Grid Cards View"
                aria-label="Grid cards view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Subscriptions', count: subscriptions.length },
            { id: 'active', label: 'Active', count: subscriptions.filter((s) => s.status === 'active').length },
            { id: 'trial', label: 'Free Trials', count: subscriptions.filter((s) => s.status === 'trial').length },
            {
              id: 'upcoming7',
              label: 'Due in 7 Days',
              count: subscriptions.filter((s) => {
                const d = daysUntil(s.nextBillingDate);
                return d >= 0 && d <= 7 && s.status !== 'paused';
              }).length,
            },
            { id: 'paused', label: 'Paused', count: subscriptions.filter((s) => s.status === 'paused').length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === item.id
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'bg-neutral-100 hover:bg-neutral-200/70 text-neutral-600'
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-[11px] ${statusFilter === item.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Listing View */}
      {filteredSubscriptions.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white border border-neutral-200 rounded-xl space-y-3">
          <Calendar className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-900">No subscriptions match your filter</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing active filters, or adding a new recurring subscription.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={onAddNew}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Add Subscription
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-medium">
                  <th className="py-3 px-4">Service & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Next Renewal</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Normalized</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSubscriptions.map((sub) => {
                  const days = daysUntil(sub.nextBillingDate);
                  const isTrial = sub.status === 'trial';
                  const isPaused = sub.status === 'paused';
                  const monthlyNorm = convertCurrency(toMonthlyCost(sub.cost, sub.billingCycle), sub.currency, currency);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Name & Metadata */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: sub.color || '#2563EB' }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-900 truncate">{sub.name}</span>
                              {sub.websiteUrl && (
                                <a
                                  href={sub.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neutral-400 hover:text-neutral-700 inline-flex"
                                  title={`Open ${sub.name}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {/* Unboxed Metadata */}
                            <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1.5 truncate">
                              {isTrial ? (
                                <span className="text-amber-700 font-medium">Free Trial</span>
                              ) : isPaused ? (
                                <span className="text-neutral-500 italic">Paused</span>
                              ) : (
                                <span className="text-neutral-600">Active</span>
                              )}
                              {sub.tags.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="truncate">{sub.tags.slice(0, 2).join(', ')}</span>
                                </>
                              )}
                              {sub.annualEquivalentSavings && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 font-medium">
                                    Annual saves ${sub.annualEquivalentSavings}/yr
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600">
                        {CATEGORIES[sub.category]?.label || sub.category}
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-3 px-4 whitespace-nowrap capitalize text-neutral-600">
                        {sub.billingCycle}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 font-mono text-[11px]">
                        {sub.paymentMethod}
                      </td>

                      {/* Next Renewal */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`font-medium ${
                              isPaused
                                ? 'text-neutral-400'
                                : days <= 2
                                ? 'text-amber-700 font-semibold'
                                : days <= 7
                                ? 'text-neutral-900'
                                : 'text-neutral-700'
                            }`}
                          >
                            {isPaused ? 'On Hold' : formatRelativeDate(sub.nextBillingDate)}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono" data-tabular>
                            {formatFullDate(sub.nextBillingDate)}
                          </span>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-neutral-900 font-mono" data-tabular>
                          {formatCurrency(sub.cost, sub.currency)}
                        </div>
                        <div className="text-[10px] text-neutral-400 capitalize">
                          per {sub.billingCycle.replace('ly', '')}
                        </div>
                      </td>

                      {/* Normalized Monthly */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="text-neutral-700 font-mono font-medium" data-tabular>
                          {formatCurrency(monthlyNorm, currency)}
                        </div>
                        <div className="text-[10px] text-neutral-400">/month</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === sub.id ? null : sub.id)}
                            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
                            aria-label="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === sub.id && (
                            <div className="absolute right-0 top-7 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 z-20 text-left text-xs">
                              <button
                                onClick={() => {
                                  onAdvanceCycle(sub.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                              >
                                <RotateCw className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Advance 1 Cycle</span>
                              </button>

                              <button
                                onClick={() => {
                                  onTogglePause(sub.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                              >
                                {sub.status === 'paused' ? (
                                  <>
                                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Resume Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Pause Subscription</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  onOpenCancelGuide(sub);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cancel Guide</span>
                              </button>

                              <div className="my-1 border-t border-neutral-100" />

                              <button
                                onClick={() => {
                                  onEdit(sub);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Edit Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  onDelete(sub.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => {
            const days = daysUntil(sub.nextBillingDate);
            const isTrial = sub.status === 'trial';
            const isPaused = sub.status === 'paused';
            const monthlyNorm = convertCurrency(toMonthlyCost(sub.cost, sub.billingCycle), sub.currency, currency);

            return (
              <div
                key={sub.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-colors"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || '#2563EB' }}
                        aria-hidden="true"
                      />
                      <h4 className="font-semibold text-neutral-900 truncate text-sm">{sub.name}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {sub.websiteUrl && (
                        <a
                          href={sub.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
                          title="Open website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
                    <span>{CATEGORIES[sub.category]?.label || sub.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{sub.billingCycle}</span>
                    {isTrial && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 font-medium">Free Trial</span>
                      </>
                    )}
                    {isPaused && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-500 italic">Paused</span>
                      </>
                    )}
                  </div>

                  {/* Pricing details */}
                  <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-neutral-100">
                    <div>
                      <div className="text-xs text-neutral-500">Plan Rate</div>
                      <div className="text-lg font-bold text-neutral-900 font-mono" data-tabular>
                        {formatCurrency(sub.cost, sub.currency)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">Monthly Avg</div>
                      <div className="text-sm font-semibold text-neutral-700 font-mono" data-tabular>
                        {formatCurrency(monthlyNorm, currency)}/mo
                      </div>
                    </div>
                  </div>

                  {/* Renewal timing */}
                  <div className="mt-3 p-2.5 bg-neutral-50 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Next Charge</span>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${
                          days <= 2 ? 'text-amber-700' : 'text-neutral-900'
                        }`}
                      >
                        {isPaused ? 'On Hold' : formatRelativeDate(sub.nextBillingDate)}
                      </span>
                      <span className="text-[11px] text-neutral-400 ml-1.5 font-mono" data-tabular>
                        ({formatFullDate(sub.nextBillingDate)})
                      </span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
                    <span>Payment:</span>
                    <span className="font-mono text-neutral-700">{sub.paymentMethod}</span>
                  </div>

                  {sub.notes && (
                    <p className="mt-2 text-xs text-neutral-500 line-clamp-2 italic">
                      "{sub.notes}"
                    </p>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenCancelGuide(sub)}
                    className="text-xs text-neutral-600 hover:text-neutral-900 font-medium inline-flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Cancel Guide</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(sub)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                      title="Edit"
                      aria-label={`Edit ${sub.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(sub.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete"
                      aria-label={`Delete ${sub.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
