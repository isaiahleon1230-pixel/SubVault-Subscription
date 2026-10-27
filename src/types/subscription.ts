export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'weekly';

export type SubscriptionStatus = 'active' | 'trial' | 'paused' | 'cancelled';

export type CategoryKey = 
  | 'entertainment' 
  | 'software' 
  | 'productivity' 
  | 'health_fitness' 
  | 'utilities' 
  | 'cloud_storage' 
  | 'news_reading' 
  | 'other';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY' | 'AUD';

export type CancellationDifficulty = 'easy' | 'medium' | 'hard';

export interface Subscription {
  id: string;
  name: string;
  category: CategoryKey;
  cost: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  nextBillingDate: string; // ISO string: YYYY-MM-DD
  startDate?: string;
  status: SubscriptionStatus;
  paymentMethod: string;
  trialEndDate?: string; // YYYY-MM-DD if status === 'trial'
  autoRenew: boolean;
  websiteUrl?: string;
  cancellationUrl?: string;
  cancellationDifficulty?: CancellationDifficulty;
  cancellationNotes?: string;
  notes?: string;
  tags: string[];
  reminderDaysBefore: number;
  remindMe: boolean;
  color: string; // Hex color for visual distinction
  annualEquivalentSavings?: number; // Estimated savings if converted from monthly to yearly
  lastUsageDate?: string;
}

export interface PresetSubscription {
  name: string;
  category: CategoryKey;
  defaultCost: number;
  defaultBillingCycle: BillingCycle;
  color: string;
  websiteUrl: string;
  cancellationUrl: string;
  cancellationDifficulty: CancellationDifficulty;
  cancellationNotes: string;
  tags: string[];
  annualSavingsTip?: string;
}

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  color: string;
}
