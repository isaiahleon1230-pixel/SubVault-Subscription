import React from 'react';
import { CurrencyCode, Subscription } from '../types/subscription';
import { CATEGORIES } from '../data/presets';
import { convertCurrency, formatCurrency } from '../utils/currencyUtils';
import { toMonthlyCost, daysUntil } from '../utils/dateUtils';
import {
  AlertTriangle,
  ShieldAlert,
  Percent,
  Clock,
  Layers,
} from 'lucide-react';

interface OptimizationHubProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onOpenCancelGuide: (sub: Subscription) => void;
  onUpgradeToAnnual: (subId: string, annualCost: number) => void;
  onTogglePause: (subId: string) => void;
}

export const OptimizationHub: React.FC<OptimizationHubProps> = ({
  subscriptions,
  currency,
  onOpenCancelGuide,
  onUpgradeToAnnual,
  onTogglePause,
}) => {
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');

  // 1. Detect Category Overlaps (e.g. 2+ streaming services, 2+ cloud storage)
  const categoryGroups: Record<string, Subscription[]> = {};
  activeSubs.forEach(s => {
    if (!categoryGroups[s.category]) categoryGroups[s.category] = [];
    categoryGroups[s.category].push(s);
  });

  const overlapCategories = Object.entries(categoryGroups).filter(([_, list]) => list.length >= 2);

  // 2. Annual Discount Opportunities
  const annualOpportunities = activeSubs.filter(
    s => s.billingCycle === 'monthly' && (s.annualEquivalentSavings || 0) > 0
  );

  const totalAnnualArbitrage = annualOpportunities.reduce((acc, s) => {
    return acc + convertCurrency(s.annualEquivalentSavings || 0, s.currency, currency);
  }, 0);

  // 3. Active Free Trials
  const trialSubs = subscriptions.filter(s => s.status === 'trial');

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-neutral-700" />
              <span>Subscription Budget Planning</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mt-1">
              Savings & Free Trials
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
              Track upcoming trial expiration deadlines, discover available annual billing discounts, and review duplicate category subscriptions.
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-right shrink-0">
            <div className="text-xs text-neutral-500">Available Annual Discounts</div>
            <div className="text-2xl font-bold text-neutral-900 font-mono" data-tabular>
              {formatCurrency(totalAnnualArbitrage, currency)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">by switching eligible plans to yearly</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Free Trial Deadline Alerts */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-neutral-900">Active Free Trials</h3>
              </div>
              <span className="text-xs font-mono text-neutral-500" data-tabular>
                {trialSubs.length} active trials
              </span>
            </div>

            <p className="text-xs text-neutral-500 mb-4">
              Review trials scheduled to auto-renew into paid subscriptions:
            </p>

            {trialSubs.length === 0 ? (
              <div className="p-6 bg-neutral-50 rounded-lg text-center text-xs text-neutral-500">
                No active trials currently logged.
              </div>
            ) : (
              <div className="space-y-3">
                {trialSubs.map(sub => {
                  const days = daysUntil(sub.trialEndDate || sub.nextBillingDate);
                  const isExpiringImminent = days <= 3;
                  return (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-lg border text-xs space-y-2 ${
                        isExpiringImminent
                          ? 'border-amber-300 bg-amber-50/60'
                          : 'border-neutral-200 bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="font-semibold text-neutral-900">{sub.name}</span>
                        </div>
                        <span className="font-bold text-neutral-900 font-mono" data-tabular>
                          Will bill {formatCurrency(sub.cost, sub.currency)}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-neutral-600 text-[11px]">
                        <span>
                          {days === 0
                            ? 'Renews TODAY'
                            : days === 1
                            ? 'Renews Tomorrow'
                            : `Renews in ${days} days`}
                        </span>
                        <span className="font-mono">{sub.trialEndDate || sub.nextBillingDate}</span>
                      </div>

                      {sub.notes && (
                        <p className="text-[11px] text-neutral-500 italic">"{sub.notes}"</p>
                      )}

                      <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">
                          Cancel difficulty: <strong className="capitalize">{sub.cancellationDifficulty || 'easy'}</strong>
                        </span>
                        <button
                          onClick={() => onOpenCancelGuide(sub)}
                          className="font-medium text-neutral-900 hover:text-black underline underline-offset-2"
                        >
                          Cancellation guide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
            Note: Most services allow cancelling before the deadline without losing remaining trial days.
          </div>
        </div>

        {/* Section 2: Annual Plan Discounts */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">Annual Plan Discounts</h3>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-medium" data-tabular>
                Save {formatCurrency(totalAnnualArbitrage, currency)}/yr
              </span>
            </div>

            <p className="text-xs text-neutral-500 mb-4">
              Subscriptions you keep long-term that offer standard discounts when billed annually:
            </p>

            {annualOpportunities.length === 0 ? (
              <div className="p-6 bg-neutral-50 rounded-lg text-center text-xs text-neutral-500">
                All long-term subscriptions are already on annual billing or do not list annual discounts.
              </div>
            ) : (
              <div className="space-y-3">
                {annualOpportunities.map(sub => {
                  const annualSavingsInCur = convertCurrency(
                    sub.annualEquivalentSavings || 0,
                    sub.currency,
                    currency
                  );
                  return (
                    <div
                      key={sub.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-xs space-y-2 bg-neutral-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="font-semibold text-neutral-900">{sub.name}</span>
                        </div>
                        <span className="font-bold text-emerald-700 font-mono" data-tabular>
                          Save {formatCurrency(annualSavingsInCur, currency)}/yr
                        </span>
                      </div>

                      <div className="text-neutral-500 text-[11px] flex items-center justify-between">
                        <span>Currently {formatCurrency(sub.cost, sub.currency)}/month</span>
                        <span>~15-20% discount on yearly plan</span>
                      </div>

                      <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">Billed to {sub.paymentMethod}</span>
                        <button
                          onClick={() => {
                            const estimatedAnnualCost = Math.round(sub.cost * 10 * 100) / 100;
                            onUpgradeToAnnual(sub.id, estimatedAnnualCost);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
                        >
                          Switch to Annual
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
            Clicking "Switch to Annual" updates the billing cycle and calculates the reduced yearly rate.
          </div>
        </div>
      </div>

      {/* Section 3: Subscriptions in Same Category */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900">
              Multiple Subscriptions in Same Category ({overlapCategories.length} Categories)
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono" data-tabular>
            Category Overview
          </span>
        </div>

        <p className="text-xs text-neutral-500 mb-4">
          Services sharing a category. Review whether you actively use all of them concurrently:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overlapCategories.map(([catKey, list]) => {
            const catInfo = CATEGORIES[catKey as keyof typeof CATEGORIES] || {
              label: catKey,
              color: '#64748B',
            };
            const catMonthlySum = list.reduce(
              (acc, s) => acc + convertCurrency(toMonthlyCost(s.cost, s.billingCycle), s.currency, currency),
              0
            );

            return (
              <div
                key={catKey}
                className="p-4 border border-neutral-200 rounded-xl space-y-3 bg-neutral-50/30"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    <span className="font-bold text-sm text-neutral-900">{catInfo.label}</span>
                  </div>
                  <span className="font-bold text-xs text-neutral-900 font-mono" data-tabular>
                    Combined: {formatCurrency(catMonthlySum, currency)}/mo
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {list.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md bg-white border border-neutral-100"
                    >
                      <span className="font-medium text-neutral-800">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-700" data-tabular>
                          {formatCurrency(item.cost, item.currency)}
                        </span>
                        <button
                          onClick={() => onTogglePause(item.id)}
                          className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
                        >
                          {item.status === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
