export type VaultSectionId = 
  | 'team' 
  | 'forms' 
  | 'money' 
  | 'safety' 
  | 'handoff'
  | 'ta6'
  | 'ta7'
  | 'ta10'
  | 'lpe1'
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
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postcode?: string;
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
    practiceName?: string;
    phone?: string;
    address?: string;
    sentAt?: string;
    shareId?: string;
  };
  paymentStatus: 'pending' | 'paid';
  hasPaid: boolean;
  ta6Data?: {
    boundaries: string;
    disputes: {
      hasDisputes: boolean;
      details: string;
    };
    planning: {
      hasPlanning: boolean;
      details: string;
    };
    guarantees: string[];
    evidence?: Record<string, string>;
    environmental?: {
      flooding: { hasFlooding: boolean; details: string };
      radon: { hasRadon: boolean; details: string };
      knotweed: 'yes' | 'no' | 'not_known';
    };
    services?: {
      heating: { hasHeating: boolean; type: string };
      boiler: { isServiced: boolean };
      electrical: { isTested: boolean };
    };
    notices?: {
      neighbourNotices: { hasNotices: boolean; details: string };
      nearbyProposals: { hasProposals: boolean; details: string };
    };
    planningControl?: {
      listedBuilding: 'yes' | 'no' | 'not_known';
      conservationArea: 'yes' | 'no' | 'not_known';
      treeOrders: { hasOrders: boolean };
      extensions: { hasExtensions: boolean };
    };
    rights?: {
      sharedAccess: { hasAccess: boolean; details: string };
      publicRightsOfWay: { hasRights: boolean; details: string };
      chancelRepair: 'yes' | 'no' | 'not_known';
      minesAndMinerals: 'yes' | 'no' | 'not_known';
    };
    parking?: {
      arrangements: string;
      controlledZone: { isRequired: boolean };
    };
    drainage?: {
      mainsConnected: boolean;
      offMains?: {
        type: string;
        lastServiced: string;
        isShared: boolean;
      };
    };
    utilities?: {
      waterConnected: boolean;
      electricityConnected: boolean;
      gasConnected: boolean;
      broadbandProvider: string;
    };
    insurance?: {
      abnormalPremiums: { hasAbnormal: boolean; details: string };
      refusedInsurance: { hasRefused: boolean; details: string };
    };
    occupiers?: {
      vacantPossession: boolean;
      otherOccupiers: { hasOccupiers: boolean; consentDetails: string };
    };
    transaction?: {
      movingDateRequirements: { hasRequirements: boolean; details: string };
      clearMortgages: 'yes' | 'no' | 'not_known';
    };
  };
  lpe1Data?: any;
  ta7Data?: {
    propertyAndRent: {
      propertyType: 'flat' | 'shared_ownership' | 'long_leasehold_house' | '';
      paysRent: {
        hasRent: boolean;
        amount: string;
        frequency: string;
      };
    };
    maintenance: {
      contributesToCost: boolean;
      expensiveWorks: { hasWorks: boolean; details: string };
      arrears: { hasArrears: boolean; details: string };
    };
    buildingSafety: {
      remediationWorks: { hasProposed: boolean; details: string };
      hasLeaseholderDeed: boolean;
      hasLandlordCertificate: boolean;
    };
    documents: {
      hasLease: boolean;
      hasShareCertificate: boolean;
    };
    consents: {
      hasAlterations: { hasAlterations: boolean; details: string };
      hasRefusedConsent: { hasRefused: boolean; details: string };
    };
    enfranchisement: {
      actionTaken: 'yes' | 'no' | 'not_known';
      details: string;
    };
    evidence?: Record<string, string>;
  };
  ta10Data?: {
    basicFittings?: Record<string, {
      status: 'Included' | 'Excluded' | 'None' | '';
      price?: string;
      comments?: string;
    }>;
    kitchen?: {
      items: Record<string, {
        status: 'Included' | 'Excluded' | 'None' | '';
        price?: string;
        comments?: string;
      }>;
      anyFitted: boolean;
    };
    bathrooms?: Record<string, {
      status: 'Included' | 'Excluded' | 'None' | '';
      price?: string;
      comments?: string;
    }>;
    carpets?: Record<string, {
      status: 'Included' | 'Excluded' | 'None' | '';
      price?: string;
      comments?: string;
    }>;
    curtains?: Record<string, {
      status: 'Included' | 'Excluded' | 'None' | '';
      price?: string;
      comments?: string;
    }>;
    lightFittings?: Record<string, {
      status: 'Included' | 'Excluded' | 'None' | '';
      price?: string;
      comments?: string;
    }>;
    outdoorArea?: Record<string, {
      status: 'Included' | 'Excluded' | 'None' | '';
      price?: string;
      comments?: string;
    }>;
  };
  uprn?: string;
  epc_rating?: string;
  total_floor_area?: number;
  property_metadata?: any;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  role?: 'admin' | 'user' | 'client';
}

export interface AppState {
  sections: VaultSection[];
  paymentStatus: 'pending' | 'paid';
  user: UserProfile | null;
  loading: boolean;
}
