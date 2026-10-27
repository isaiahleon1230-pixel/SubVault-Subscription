import React from 'react';
import { CurrencyCode, Subscription } from '../types/subscription';
import { CATEGORIES } from '../data/presets';
import { toMonthlyCost } from '../utils/dateUtils';
import { convertCurrency, formatCurrency } from '../utils/currencyUtils';
import { CreditCard, PieChart, TrendingUp } from 'lucide-react';

interface CategoryBreakdownProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  subscriptions,
  currency,
}) => {
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');

  // Compute total monthly
  const totalMonthly = activeSubs.reduce((acc, sub) => {
    return acc + convertCurrency(toMonthlyCost(sub.cost, sub.billingCycle), sub.currency, currency);
  }, 0) || 1; // avoid / 0

  // Group by category
  const categoryTotals: Record<string, { total: number; count: number; name: string; color: string }> = {};

  activeSubs.forEach(sub => {
    const monthlyCost = convertCurrency(toMonthlyCost(sub.cost, sub.billingCycle), sub.currency, currency);
    const catInfo = CATEGORIES[sub.category] || { label: sub.category, color: '#64748B' };
    
    if (!categoryTotals[sub.category]) {
      categoryTotals[sub.category] = {
        total: 0,
        count: 0,
        name: catInfo.label,
        color: catInfo.color,
      };
    }
    categoryTotals[sub.category].total += monthlyCost;
    categoryTotals[sub.category].count += 1;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([key, data]) => ({
      key,
      ...data,
      percentage: (data.total / totalMonthly) * 100,
    }))
    .sort((a, b) => b.total - a.total);

  // Group by payment method
  const paymentMethodTotals: Record<string, { total: number; count: number }> = {};
  activeSubs.forEach(sub => {
    const monthlyCost = convertCurrency(toMonthlyCost(sub.cost, sub.billingCycle), sub.currency, currency);
    const method = sub.paymentMethod || 'Unassigned Card';
    if (!paymentMethodTotals[method]) {
      paymentMethodTotals[method] = { total: 0, count: 0 };
    }
    paymentMethodTotals[method].total += monthlyCost;
    paymentMethodTotals[method].count += 1;
  });

  const sortedPaymentMethods = Object.entries(paymentMethodTotals)
    .sort((a, b) => b[1].total - a[1].total);

  // 12-Month Outflow Simulation (next 12 calendar months based on actual billing schedules)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const next12Months = Array.from({ length: 12 }, (_, i) => {
    const m = (today.getMonth() + i) % 12;
    const y = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
    // Baseline monthly recurring + any yearly or quarterly renewals landing in this month
    let projectedSpend = 0;
    activeSubs.forEach(s => {
      const subInCur = convertCurrency(s.cost, s.currency, currency);
      if (s.billingCycle === 'monthly') {
        projectedSpend += subInCur;
      } else if (s.billingCycle === 'weekly') {
        projectedSpend += subInCur * 4.33;
      } else if (s.billingCycle === 'quarterly') {
        // Quarter landing month check
        const subMonth = new Date(s.nextBillingDate).getMonth();
        if ((m - subMonth + 12) % 3 === 0) {
          projectedSpend += subInCur;
        }
      } else if (s.billingCycle === 'yearly') {
        const subMonth = new Date(s.nextBillingDate).getMonth();
        if (m === subMonth) {
          projectedSpend += subInCur;
        }
      }
    });

    return {
      monthLabel: `${monthNames[m]} '${String(y).slice(2)}`,
      amount: projectedSpend,
    };
  });

  const maxMonthAmount = Math.max(...next12Months.map(m => m.amount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Category Spend Distribution */}
      <div className="lg:col-span-2 p-6 bg-white border border-neutral-200 rounded-xl shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-neutral-600" />
            <h2 className="text-sm font-semibold text-neutral-900">Spending by Category</h2>
          </div>
          <span className="text-xs text-neutral-500 font-mono" data-tabular>
            {sortedCategories.length} categories active
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="h-3 w-full bg-neutral-100 rounded-full flex overflow-hidden">
          {sortedCategories.map(cat => (
            <div
              key={cat.key}
              style={{
                width: `${Math.max(cat.percentage, 2)}%`,
                backgroundColor: cat.color,
              }}
              title={`${cat.name}: ${formatCurrency(cat.total, currency)} (${cat.percentage.toFixed(1)}%)`}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-90 cursor-pointer"
            />
          ))}
        </div>

        {/* Category List Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {sortedCategories.map(cat => (
            <div
              key={cat.key}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50/70 transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="font-medium text-neutral-800 truncate">{cat.name}</span>
                <span className="text-neutral-400">({cat.count})</span>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="font-semibold text-neutral-900 font-mono" data-tabular>
                  {formatCurrency(cat.total, currency)}/mo
                </div>
                <div className="text-[11px] text-neutral-400 font-mono" data-tabular>
                  {cat.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 12-Month Outflow Projection Bar Chart */}
        <div className="pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neutral-600" />
              <h3 className="text-xs font-semibold text-neutral-900">12-Month Forecast Outflow</h3>
            </div>
            <span className="text-xs text-neutral-500 font-mono" data-tabular>
              Includes annual & quarterly renewals
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 items-end h-28 pt-2">
            {next12Months.map((m, idx) => {
              const heightPct = Math.max((m.amount / maxMonthAmount) * 100, 10);
              return (
                <div key={idx} className="flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap transition-opacity z-10 font-mono">
                    {formatCurrency(m.amount, currency)}
                  </div>
                  <div className="w-full bg-neutral-100 rounded-t-sm overflow-hidden flex items-end h-20">
                    <div
                      className="w-full bg-neutral-800 group-hover:bg-neutral-600 transition-all rounded-t-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono truncate">{m.monthLabel.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-neutral-600" />
              <h2 className="text-sm font-semibold text-neutral-900">Payment Methods</h2>
            </div>
            <span className="text-xs text-neutral-500 font-mono" data-tabular>
              {sortedPaymentMethods.length} methods
            </span>
          </div>

          <p className="text-xs text-neutral-500 mb-4">
            Total recurring volume mapped to each card or billing account.
          </p>

          <div className="space-y-3">
            {sortedPaymentMethods.map(([method, data]) => {
              const pct = (data.total / totalMonthly) * 100;
              return (
                <div key={method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800 truncate pr-2">{method}</span>
                    <span className="font-mono text-neutral-900 font-semibold shrink-0" data-tabular>
                      {formatCurrency(data.total, currency)}/mo
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-400 text-right">
                    <span>{data.count} subscriptions</span>
                    <span className="mx-1.5">·</span>
                    <span className="font-mono" data-tabular>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          Tip: Auditing payment methods helps ensure corporate subscriptions aren’t billed to personal cards.
        </div>
      </div>
    </div>
  );
};
