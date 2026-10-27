import { BillingCycle, Subscription } from '../types/subscription';

/**
 * Normalizes any date to YYYY-MM-DD
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates days remaining from today (or reference date) until target date.
 * Returns negative if target date has passed.
 */
export function daysUntil(targetDateStr: string, fromDateStr?: string): number {
  if (!targetDateStr) return 0;
  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const target = new Date(tY, tM - 1, tD);
  
  let from: Date;
  if (fromDateStr) {
    const [fY, fM, fD] = fromDateStr.split('-').map(Number);
    from = new Date(fY, fM - 1, fD);
  } else {
    const now = new Date();
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const diffTime = target.getTime() - from.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns formatted friendly relative date:
 * "Today", "Tomorrow", "In 3 days", "Oct 31, 2026", "Overdue by 2 days"
 */
export function formatRelativeDate(targetDateStr: string): string {
  const days = daysUntil(targetDateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1 && days <= 7) return `In ${days} days`;
  if (days < 0) return `${Math.abs(days)}d ago`;

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a date string as "Oct 28, 2026"
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Computes monthly normalized cost
 */
export function toMonthlyCost(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return (cost * 52) / 12;
    case 'monthly':
      return cost;
    case 'quarterly':
      return cost / 3;
    case 'yearly':
      return cost / 12;
    default:
      return cost;
  }
}

/**
 * Computes annual normalized cost
 */
export function toAnnualCost(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return cost * 52;
    case 'monthly':
      return cost * 12;
    case 'quarterly':
      return cost * 4;
    case 'yearly':
      return cost;
    default:
      return cost * 12;
  }
}

/**
 * Advances the billing date by one cycle
 */
export function advanceBillingDate(currentDateStr: string, cycle: BillingCycle): string {
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  switch (cycle) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return toISODate(date);
}

/**
 * Generates an array of upcoming renewal occurrences in the next N days
 */
export function getUpcomingTimeline(
  subscriptions: Subscription[],
  horizonDays: number = 30
): Array<{
  subscription: Subscription;
  date: string;
  daysAway: number;
  cost: number;
  isTrial: boolean;
}> {
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');
  const results: Array<{
    subscription: Subscription;
    date: string;
    daysAway: number;
    cost: number;
    isTrial: boolean;
  }> = [];

  for (const sub of activeSubs) {
    const days = daysUntil(sub.nextBillingDate);
    if (days >= 0 && days <= horizonDays) {
      results.push({
        subscription: sub,
        date: sub.nextBillingDate,
        daysAway: days,
        cost: sub.cost,
        isTrial: sub.status === 'trial',
      });
    }
  }

  return results.sort((a, b) => a.daysAway - b.daysAway);
}
