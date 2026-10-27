import React, { useState, useEffect } from 'react';
import {
  Subscription,
  CategoryKey,
  BillingCycle,
  CurrencyCode,
  SubscriptionStatus,
} from '../types/subscription';
import { POPULAR_PRESETS, CATEGORIES } from '../data/presets';
import { toISODate } from '../utils/dateUtils';
import { X, BookmarkCheck, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  subscriptionToEdit?: Subscription | null;
  defaultCurrency: CurrencyCode;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subscriptionToEdit,
  defaultCurrency,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryKey>('productivity');
  const [cost, setCost] = useState<string>('9.99');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState<string>('');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [trialEndDate, setTrialEndDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Visa ···· 4242');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cancellationUrl, setCancellationUrl] = useState('');
  const [cancellationNotes, setCancellationNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(3);
  const [color, setColor] = useState('#2563EB');

  // Populate form on edit or reset on create
  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name);
      setCategory(subscriptionToEdit.category);
      setCost(String(subscriptionToEdit.cost));
      setCurrency(subscriptionToEdit.currency);
      setBillingCycle(subscriptionToEdit.billingCycle);
      setNextBillingDate(subscriptionToEdit.nextBillingDate);
      setStatus(subscriptionToEdit.status);
      setTrialEndDate(subscriptionToEdit.trialEndDate || '');
      setPaymentMethod(subscriptionToEdit.paymentMethod || 'Visa ···· 4242');
      setWebsiteUrl(subscriptionToEdit.websiteUrl || '');
      setCancellationUrl(subscriptionToEdit.cancellationUrl || '');
      setCancellationNotes(subscriptionToEdit.cancellationNotes || '');
      setNotes(subscriptionToEdit.notes || '');
      setTagsInput(subscriptionToEdit.tags.join(', '));
      setReminderDaysBefore(subscriptionToEdit.reminderDaysBefore ?? 3);
      setColor(subscriptionToEdit.color || '#2563EB');
    } else {
      setName('');
      setCategory('productivity');
      setCost('9.99');
      setCurrency(defaultCurrency);
      setBillingCycle('monthly');
      // Default to next month from today
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      setNextBillingDate(toISODate(defaultDate));
      setStatus('active');
      setTrialEndDate('');
      setPaymentMethod('Visa ···· 4242');
      setWebsiteUrl('');
      setCancellationUrl('');
      setCancellationNotes('');
      setNotes('');
      setTagsInput('');
      setReminderDaysBefore(3);
      setColor('#2563EB');
    }
  }, [subscriptionToEdit, defaultCurrency, isOpen]);

  // Handle preset quick-pick
  const handleSelectPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setCost(String(preset.defaultCost));
    setBillingCycle(preset.defaultBillingCycle);
    setWebsiteUrl(preset.websiteUrl);
    setCancellationUrl(preset.cancellationUrl);
    setCancellationNotes(preset.cancellationNotes);
    setTagsInput(preset.tags.join(', '));
    setColor(preset.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedCost = parseFloat(cost) || 0;
    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const subscription: Subscription = {
      id: subscriptionToEdit ? subscriptionToEdit.id : `sub-${Date.now()}`,
      name: name.trim(),
      category,
      cost: parsedCost,
      currency,
      billingCycle,
      nextBillingDate: nextBillingDate || toISODate(new Date()),
      status,
      trialEndDate: status === 'trial' ? trialEndDate : undefined,
      paymentMethod: paymentMethod.trim() || 'Credit Card',
      autoRenew: true,
      websiteUrl: websiteUrl.trim() || undefined,
      cancellationUrl: cancellationUrl.trim() || undefined,
      cancellationDifficulty: subscriptionToEdit?.cancellationDifficulty || 'easy',
      cancellationNotes: cancellationNotes.trim() || undefined,
      notes: notes.trim() || undefined,
      tags,
      reminderDaysBefore,
      remindMe: true,
      color,
      annualEquivalentSavings: subscriptionToEdit?.annualEquivalentSavings,
    };

    onSave(subscription);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {subscriptionToEdit ? 'Edit Subscription' : 'Add New Subscription'}
            </h3>
            <p className="text-xs text-neutral-500">
              Keep your recurring payments, renewal reminders, and cancellation links organized.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick presets (only shown when creating a new subscription) */}
          {!subscriptionToEdit && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 mb-2">
                <BookmarkCheck className="w-3.5 h-3.5 text-neutral-900" />
                <span>Select from Common Services</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                {POPULAR_PRESETS.slice(0, 8).map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-neutral-200/70 text-neutral-800 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Service Name */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-neutral-700">Service Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Netflix, Spotify, Amazon Prime"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as CategoryKey)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                {Object.entries(CATEGORIES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly (Annual)</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Cost & Currency */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Cost</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as CurrencyCode)}
                  className="w-24 px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>

            {/* Next Renewal Date */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Next Billing Date *</label>
              <input
                type="date"
                required
                value={nextBillingDate}
                onChange={e => setNextBillingDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Subscription Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="active">Active</option>
                <option value="trial">Free Trial</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Payment Method</label>
              <input
                type="text"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                placeholder="e.g. Visa ···· 4242, PayPal, Apple Pay"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Conditional Trial Expiration Date */}
            {status === 'trial' && (
              <div className="sm:col-span-2 space-y-1 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <label className="font-semibold text-amber-900">
                  Trial End Date (When auto-charge will occur)
                </label>
                <input
                  type="date"
                  value={trialEndDate}
                  onChange={e => setTrialEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-neutral-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Cancellation URL */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Cancellation URL</label>
              <input
                type="url"
                value={cancellationUrl}
                onChange={e => setCancellationUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Brand Color */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Color Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded border border-neutral-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono"
                />
              </div>
            </div>

            {/* Cancellation Guide Notes */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-neutral-700">Cancellation Instructions</label>
              <input
                type="text"
                value={cancellationNotes}
                onChange={e => setCancellationNotes(e.target.value)}
                placeholder="e.g. Settings > Account > Cancel Plan. Requires 2 confirmations."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Tags & General Notes */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-neutral-700">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="work, streaming, shared, tax-deductible"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-neutral-700">Private Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Shared with team; review renewal in Q4."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              {subscriptionToEdit ? 'Save Changes' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
