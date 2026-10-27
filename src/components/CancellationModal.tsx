import React, { useState } from 'react';
import { Subscription } from '../types/subscription';
import { formatCurrency } from '../utils/currencyUtils';
import {
  X,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  Mail,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onConfirmCancel: (id: string) => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onConfirmCancel,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !subscription) return null;

  const cancellationUrl =
    subscription.cancellationUrl ||
    (subscription.websiteUrl ? `${subscription.websiteUrl}` : '');

  // Pre-formatted cancellation email
  const cancelEmailBody = `Hello ${subscription.name} Support Team,

I am writing to formally request the cancellation of my subscription for ${subscription.name} associated with my account email.

Please ensure that:
1. Auto-renewal is immediately disabled.
2. No further charges are processed against my payment method on file (${subscription.paymentMethod}).
3. Written confirmation of this cancellation is sent to my email.

Thank you,
Subscriber`;

  // Pre-formatted refund request email
  const refundEmailBody = `Hello ${subscription.name} Billing Support,

I noticed a recent renewal charge of ${formatCurrency(subscription.cost, subscription.currency)} on my statement for ${subscription.name}.

I intended to cancel prior to renewal and have not used the service during this billing cycle. I kindly request a cancellation and full refund of this recent charge back to my original payment method.

Thank you for your assistance and understanding,
Subscriber`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-neutral-800" />
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Cancel {subscription.name}
              </h3>
              <p className="text-xs text-neutral-500">
                Direct links, instructions, and dispute templates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Quick Stats banner */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div>
              <div className="text-neutral-500">Current Cost</div>
              <div className="text-sm font-bold text-neutral-900 font-mono" data-tabular>
                {formatCurrency(subscription.cost, subscription.currency)} / {subscription.billingCycle}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Next Scheduled Charge</div>
              <div className="text-sm font-semibold text-neutral-800 font-mono" data-tabular>
                {subscription.nextBillingDate}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Cancellation Friction</div>
              <div className="text-sm font-semibold capitalize text-neutral-800">
                {subscription.cancellationDifficulty || 'Easy'}
              </div>
            </div>
          </div>

          {/* Cancellation steps */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-1.5">Cancellation Steps</h4>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 leading-relaxed">
              {subscription.cancellationNotes || (
                <span>
                  Log in to your account settings at {subscription.name}, navigate to "Billing" or "Subscription", and click "Cancel Plan" or "Turn off auto-renew".
                </span>
              )}
            </div>
          </div>

          {/* Direct Link */}
          {cancellationUrl && (
            <div>
              <a
                href={cancellationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors shadow-xs"
              >
                <span>Open {subscription.name} Cancellation Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Pre-written Email Dispute / Cancel Templates */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <h4 className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-neutral-700" />
              <span>Need to Contact Support? Copy-Paste Templates</span>
            </h4>

            {/* Template 1: Cancel Request */}
            <div className="p-3 border border-neutral-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-800">1. Formal Cancellation Notice</span>
                <button
                  onClick={() => copyToClipboard(cancelEmailBody, 'cancel')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black"
                >
                  {copiedType === 'cancel' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono whitespace-pre-line bg-neutral-50 p-2 rounded border border-neutral-100">
                {cancelEmailBody}
              </p>
            </div>

            {/* Template 2: Refund Request for Accidental Charge */}
            <div className="p-3 border border-neutral-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-800">2. Accidental Renewal Refund Request</span>
                <button
                  onClick={() => copyToClipboard(refundEmailBody, 'refund')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black"
                >
                  {copiedType === 'refund' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono whitespace-pre-line bg-neutral-50 p-2 rounded border border-neutral-100">
                {refundEmailBody}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition-colors"
            >
              Keep Subscription
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmCancel(subscription.id);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              Mark as Cancelled in SubVault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
