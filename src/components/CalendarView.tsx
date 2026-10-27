import React, { useState } from 'react';
import { CurrencyCode, Subscription } from '../types/subscription';
import { convertCurrency, formatCurrency } from '../utils/currencyUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { CATEGORIES } from '../data/presets';

interface CalendarViewProps {
  subscriptions: Subscription[];
  currency: CurrencyCode;
  onOpenCancelGuide: (sub: Subscription) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  subscriptions,
  currency,
  onOpenCancelGuide,
}) => {
  // Calendar month state
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to late Oct / Nov 2026 based on sample data
    return new Date(2026, 9, 27); // Oct 2026
  });

  const [selectedDay, setSelectedDay] = useState<number | null>(29); // Pre-select renewal day

  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 27));
    setSelectedDay(27);
  };

  // Map subscriptions to dates in this month
  // A subscription renews in this month if:
  // 1) its nextBillingDate is exactly in this month & year
  // 2) or if it's monthly and recurs on that day of month
  const dayRenewalsMap: Record<number, Subscription[]> = {};

  activeSubs.forEach(sub => {
    if (!sub.nextBillingDate) return;
    const [subY, subM, subD] = sub.nextBillingDate.split('-').map(Number);
    
    // Exact month match
    if (subY === year && subM - 1 === month) {
      if (!dayRenewalsMap[subD]) dayRenewalsMap[subD] = [];
      dayRenewalsMap[subD].push(sub);
    } 
    // Or if recurring monthly and date has recurrences projected in future months
    else if (sub.billingCycle === 'monthly') {
      const subDate = new Date(subY, subM - 1, subD);
      const targetDate = new Date(year, month, subD);
      // If target month is on or after start date
      if (targetDate >= subDate) {
        // Clamp to days in month (e.g. 31st on a 30-day month)
        const validDay = Math.min(subD, daysInMonth);
        if (!dayRenewalsMap[validDay]) dayRenewalsMap[validDay] = [];
        // Avoid duplicate insertion
        if (!dayRenewalsMap[validDay].some(s => s.id === sub.id)) {
          dayRenewalsMap[validDay].push(sub);
        }
      }
    }
  });

  // Calculate monthly total for this displayed calendar month
  const totalBilledInMonth = Object.values(dayRenewalsMap).flat().reduce((acc, s) => {
    return acc + convertCurrency(s.cost, s.currency, currency);
  }, 0);

  // Selected day items
  const selectedDayItems = selectedDay ? (dayRenewalsMap[selectedDay] || []) : [];
  const selectedDayTotal = selectedDayItems.reduce((acc, s) => {
    return acc + convertCurrency(s.cost, s.currency, currency);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-neutral-600" />
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              {monthNames[month]} {year}
            </h2>
            <div className="text-xs text-neutral-500 font-mono" data-tabular>
              Estimated outflow this month: {formatCurrency(totalBilledInMonth, currency)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Current Date
          </button>
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-md transition-colors"
              title="Previous Month"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-md transition-colors"
              title="Next Month"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Calendar on Left (2/3), Day Inspector on Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center text-xs font-semibold text-neutral-500 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100 bg-neutral-100/30">
            {/* Prev month days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[85px] sm:min-h-[105px] p-1.5 bg-neutral-50/50 text-neutral-300 text-xs"
                >
                  <span className="font-mono">{dayNum}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const renewals = dayRenewalsMap[dayNum] || [];
              const isSelected = selectedDay === dayNum;
              const isToday = year === 2026 && month === 9 && dayNum === 27; // Oct 27, 2026
              const daySum = renewals.reduce((sum, s) => sum + convertCurrency(s.cost, s.currency, currency), 0);

              return (
                <div
                  key={`cur-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 bg-white cursor-pointer transition-colors relative flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-neutral-900 z-10' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium rounded-sm px-1 ${
                        isToday
                          ? 'bg-neutral-900 text-white font-bold'
                          : isSelected
                          ? 'text-neutral-900 font-bold'
                          : 'text-neutral-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {renewals.length > 0 && (
                      <span className="text-[10px] font-semibold text-neutral-800 font-mono" data-tabular>
                        {formatCurrency(daySum, currency, 0)}
                      </span>
                    )}
                  </div>

                  {/* Renewals markers */}
                  <div className="mt-1 space-y-1">
                    {renewals.slice(0, 2).map((sub) => (
                      <div
                        key={sub.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded text-neutral-800 font-medium flex items-center gap-1 border border-neutral-100"
                        style={{ backgroundColor: `${sub.color}15` }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="truncate">{sub.name}</span>
                      </div>
                    ))}
                    {renewals.length > 2 && (
                      <div className="text-[9px] text-neutral-500 font-mono pl-1">
                        +{renewals.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Next month padding to complete 7-col grid */}
            {Array.from({
              length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7,
            }).map((_, i) => (
              <div
                key={`next-${i}`}
                className="min-h-[85px] sm:min-h-[105px] p-1.5 bg-neutral-50/50 text-neutral-300 text-xs"
              >
                <span className="font-mono">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Inspector */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-100 pb-3 mb-4">
              <div className="text-xs text-neutral-500">Selected Date</div>
              <h3 className="text-base font-bold text-neutral-900">
                {selectedDay
                  ? `${monthNames[month]} ${selectedDay}, ${year}`
                  : 'Select a day on the calendar'}
              </h3>
              {selectedDay && (
                <div className="text-xs text-neutral-600 mt-1 flex items-center gap-1.5">
                  <span className="font-mono font-medium" data-tabular>
                    {selectedDayItems.length} renewal{selectedDayItems.length === 1 ? '' : 's'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-bold text-neutral-900" data-tabular>
                    Total: {formatCurrency(selectedDayTotal, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* List of renewals on selected date */}
            {selectedDayItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No subscription renewals scheduled on this date.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayItems.map((sub) => {
                  const inSelectedCur = convertCurrency(sub.cost, sub.currency, currency);
                  return (
                    <div
                      key={sub.id}
                      className="p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="font-semibold text-neutral-900 truncate">
                            {sub.name}
                          </span>
                        </div>
                        <span className="font-bold text-neutral-900 font-mono shrink-0" data-tabular>
                          {formatCurrency(inSelectedCur, currency)}
                        </span>
                      </div>

                      <div className="text-neutral-500 text-[11px] flex items-center justify-between">
                        <span>{CATEGORIES[sub.category]?.label}</span>
                        <span className="font-mono">{sub.paymentMethod}</span>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                        {sub.status === 'trial' ? (
                          <span className="text-amber-700 font-semibold text-[11px]">
                            Free Trial Renewal
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[11px] capitalize">
                            {sub.billingCycle} charge
                          </span>
                        )}

                        <button
                          onClick={() => onOpenCancelGuide(sub)}
                          className="text-[11px] text-neutral-700 hover:text-black font-medium underline underline-offset-2"
                        >
                          Cancel instructions
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
            Calendar projection shows expected billing cycle dates based on your recurrence frequencies.
          </div>
        </div>
      </div>
    </div>
  );
};
