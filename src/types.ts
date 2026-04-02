export type VaultSectionId = 'leasehold' | 'safety' | 'tenure' | 'utilities' | 'parking';

export interface VaultSection {
  id: VaultSectionId;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  fileName?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  vaultProgress: Record<VaultSectionId, boolean>;
  vaultFiles: Record<VaultSectionId, { url: string; fileName: string } | null>;
  aiVerification: Record<VaultSectionId, { status: 'pending' | 'verified' | 'failed'; message?: string } | null>;
  solicitorInfo?: {
    name: string;
    email: string;
    sentAt?: string;
  };
  paymentStatus: 'unpaid' | 'paid';
  hasPaid: boolean;
  createdAt?: string;
}

export interface AppState {
  sections: VaultSection[];
  paymentStatus: 'unpaid' | 'paid';
  user: UserProfile | null;
  loading: boolean;
}
