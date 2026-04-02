export type VaultSectionId = 'leasehold' | 'safety' | 'tenure' | 'utilities' | 'parking';

export interface VaultSection {
  id: VaultSectionId;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  fileName?: string;
}

export interface AppState {
  sections: VaultSection[];
  paymentStatus: 'unpaid' | 'paid';
}
