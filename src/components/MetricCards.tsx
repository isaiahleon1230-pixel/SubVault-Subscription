import React from 'react';
import { CurrencyCode, Subscription } from '../types/subscription';
import { toMonthlyCost, toAnnualCost, daysUntil } from '../utils/dateUtils';
import { convertCurrency, formatCurrency } from '../utils/currencyUtils';
import { AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';

interface MetricCardsProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onFilterTrials: () => void;
  onFilterSoon: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  subscriptions,
  currency,
  onFilterTrials,
  onFilterSoon,
}) => {
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');
  const trialSubs = subscriptions.filter(s => s.status === 'trial');
  const pausedSubs = subscriptions.filter(s => s.status === 'paused');

  // Compute total monthly recurring in selected currency
  const totalMonthly = activeSubs.reduce((acc, sub) => {
    const monthlyCost = toMonthlyCost(sub.cost, sub.billingCycle);
    const inTargetCurrency = convertCurrency(monthlyCost, sub.currency, currency);
    return acc + inTargetCurrency;
  }, 0);

  // Compute total annual recurring in selected currency
  const totalAnnual = activeSubs.reduce((acc, sub) => {
    const annualCost = toAnnualCost(sub.cost, sub.billingCycle);
    const inTargetCurrency = convertCurrency(annualCost, sub.currency, currency);
    return acc + inTargetCurrency;
  }, 0);

  // Calculate upcoming 30-day outflow
  const upcoming30DayTotal = activeSubs.reduce((acc, sub) => {
    const days = daysUntil(sub.nextBillingDate);
    if (days >= 0 && days <= 30) {
      const inTarget = convertCurrency(sub.cost, sub.currency, currency);
      return acc + inTarget;
    }
    return acc;
  }, 0);

  // Urgent trials ending within 7 days
  const urgentTrials = trialSubs.filter(sub => {
    const targetDate = sub.trialEndDate || sub.nextBillingDate;
    const days = daysUntil(targetDate);
    return days >= 0 && days <= 7;
  });

  // Upcoming renewals within 48 hours
  const renewalsSoon = activeSubs.filter(sub => {
    const days = daysUntil(sub.nextBillingDate);
    return days >= 0 && days <= 2;
  });

  return (
    <div className="space-y-4">
      {/* Urgent Warning Alerts (Free trial traps & immediate renewals) */}
      {(urgentTrials.length > 0 || renewalsSoon.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {urgentTrials.length > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-semibold">Free Trial Alert:</span>{' '}
                  <span>
                    {urgentTrials.map(t => `${t.name} (renews in ${daysUntil(t.trialEndDate || t.nextBillingDate)}d)`).join(', ')}
                  </span>
                </div>
              </div>
              <button
                onClick={onFilterTrials}
                className="font-medium text-amber-900 hover:text-amber-950 underline underline-offset-2 shrink-0 ml-2"
              >
                Review trial
              </button>
            </div>
          )}

          {renewalsSoon.length > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-neutral-700 shrink-0" />
                <div>
                  <span className="font-semibold">Immediate Renewals:</span>{' '}
                  <span>
                    {renewalsSoon.map(s => `${s.name} (${daysUntil(s.nextBillingDate) === 0 ? 'Today' : `${daysUntil(s.nextBillingDate)}d`})`).join(', ')}
                  </span>
                </div>
              </div>
              <button
                onClick={onFilterSoon}
                className="font-medium text-neutral-900 hover:text-black underline underline-offset-2 shrink-0 ml-2"
              >
                View dates
              </button>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Outflow */}
        <div className="p-5 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-neutral-500 mb-1">
            Monthly Recurring (MRC)
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 font-mono" data-tabular>
            {formatCurrency(totalMonthly, currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
            <span>Normalized monthly spend</span>
            <span aria-hidden="true">·</span>
            <span>{activeSubs.length} services</span>
          </div>
        </div>

        {/* Card 2: Annual Projected Outflow */}
        <div className="p-5 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-neutral-500 mb-1">
            Annual Commitment (ARC)
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 font-mono" data-tabular>
            {formatCurrency(totalAnnual, currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
            <span>Avg {formatCurrency(totalAnnual / 365, currency)} / day</span>
            <span aria-hidden="true">·</span>
            <span>Full year projection</span>
          </div>
        </div>

        {/* Card 3: Next 30-Day Outflow */}
        <div className="p-5 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-neutral-500 mb-1">
            30-Day Upcoming Cash Flow
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 font-mono" data-tabular>
            {formatCurrency(upcoming30DayTotal, currency)}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
            <span>Charges scheduled this month</span>
          </div>
        </div>

        {/* Card 4: Active Services & Breakdown */}
        <div className="p-5 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-neutral-500 mb-1">
            Tracked Subscriptions
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 font-mono" data-tabular>
            {subscriptions.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
            <span>{activeSubs.length} active</span>
            <span aria-hidden="true">·</span>
            <span className={trialSubs.length > 0 ? 'text-amber-700 font-medium' : ''}>
              {trialSubs.length} trials
            </span>
            <span aria-hidden="true">·</span>
            <span>{pausedSubs.length} paused</span>
          </div>
        </div>
      </div>
    </div>
  );
};
