import { Subscription } from '../types/subscription';

export function exportToJSON(subscriptions: Subscription[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(subscriptions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `subvault_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCSV(subscriptions: Subscription[]) {
  const headers = [
    'Name',
    'Category',
    'Cost',
    'Currency',
    'Billing Cycle',
    'Next Billing Date',
    'Status',
    'Payment Method',
    'Auto Renew',
    'Notes',
    'Tags',
  ];

  const rows = subscriptions.map(sub => [
    `"${sub.name.replace(/"/g, '""')}"`,
    `"${sub.category}"`,
    sub.cost.toFixed(2),
    sub.currency,
    sub.billingCycle,
    sub.nextBillingDate,
    sub.status,
    `"${sub.paymentMethod.replace(/"/g, '""')}"`,
    sub.autoRenew ? 'Yes' : 'No',
    `"${(sub.notes || '').replace(/"/g, '""')}"`,
    `"${sub.tags.join(', ')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute('download', `subvault_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseSubscriptionsJSON(jsonString: string): Subscription[] | null {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) return null;

    // Basic schema validation
    const valid = data.every(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.cost === 'number');
    if (!valid) return null;
    return data as Subscription[];
  } catch {
    return null;
  }
}
