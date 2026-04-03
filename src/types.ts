export type VaultSectionId = 
  | 'team' 
  | 'forms' 
  | 'money' 
  | 'safety' 
  | 'handoff'
  | 'ta6'
  | 'ta7'
  | 'ta10'
  | 'sc_accounts'
  | 'sc_budget'
  | 'fra'
  | 'insurance'
  | 'bsa'
  | 'solicitor_forms'
  | 'ground_rent_receipt'
  | 'reserve_fund_confirmation'
  | 'asbestos_survey'
  | 'eicr'
  | 'headlease'
  | 'management_articles'
  | 'transfer_fees';

export interface VaultSection {
  id: VaultSectionId;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  fileName?: string;
}

export type PropertyStatus = 'Active' | 'Sold';

export interface PropertyProfile {
  id: string;
  address: string;
  status: PropertyStatus;
  teamInfo?: {
    groundLeaseHolder: string;
    managementCompany: string;
    managingAgent: string;
  };
  financialInfo?: {
    reserveFundAmount: string;
  };
  vaultProgress: Partial<Record<VaultSectionId, boolean>>;
  vaultFiles: Record<string, any>;
  aiVerification: Record<string, any>;
  solicitorInfo?: {
    name: string;
    email: string;
    sentAt?: string;
    shareId?: string;
  };
  paymentStatus: 'unpaid' | 'paid';
  hasPaid: boolean;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: string;
}

export interface AppState {
  sections: VaultSection[];
  paymentStatus: 'unpaid' | 'paid';
  user: UserProfile | null;
  loading: boolean;
}
