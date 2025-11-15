import { BrowserProvider } from 'ethers';

// FIX: Removed an incorrect import of the 'User' type from './hooks/useWallet', which was causing a circular dependency. The `User` interface is defined in this file.
export interface User {
  id: string;
  username: string;
  address: string;
  avatar: string;
  rating: number; // 0-100%
  reviews: number;
  memberSince: number;
  location?: {
    country: string;
    city: string;
  };
  dmtBalance: number;
  stake: number;
  lockedStake: number;
  badges: Badge[];
  unlockedBadges?: string[]; // ID of badges earned but not yet minted
}

export interface Review {
  id: string;
  listingId: string;
  rating: number; // 0-100
  comment: string;
  createdAt: string; // ISO
  buyerUsername: string;
  buyerAvatar: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: 'first-purchase' | 'first-sale' | 'top-seller' | 'veteran' |
          'profile-pro' | 'communicator' | 'trusted-seller' | 'power-buyer' | 'collector' |
          'specialist' | 'community-member' | 'arbitrator' | 'tycoon' | 'reputation-master' |
          'dao-legislator' | 'market-maker' | 'centurion' | 'og' | 'evangelist';
    condition: string; // Text description of how to earn it
    perks: string[]; // List of benefits this badge provides
}


export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'USDC' | 'USDT';
  images: string[];
  category: string;
  condition: 'New' | 'Used';
  seller: User;
  status: 'Available' | 'In Escrow' | 'Sold' | 'Archived';
  createdAt: string; // ISO 8601 date string
  location: string;
  quantity: number;
  buyer?: User;
  boostedUntil?: string; // ISO date string
  tags?: string[];
  ipfsCid?: string; // Ссылка на контент в IPFS
  
  // NEW FIELDS
  brand?: string;
  model?: string;
  isNegotiable?: boolean;
  videoUrl?: string;
  proofOfPurchaseCid?: string;
  attributes?: Record<string, string | number>;
  serviceDetails?: {
    duration: number;
    unit: 'hour' | 'day' | 'project';
    locationType: 'remote' | 'on_site';
  };
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'them';
  status: MessageStatus;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
  pinned?: boolean;
}

export interface Purchase {
  id:string;
  listing: Listing;
  status: 'In Escrow' | 'Completed' | 'Disputed';
}

export interface Dispute {
  id: string;
  listing: Listing;
  status: 'negotiation' | 'review' | 'decision';
  lastMessage: string;
  timestamp: string; // Using simple string like "15:06" for mock
  unread: number;
  messages: (Message & { senderType?: 'arbitrator' | 'user' })[];
  createdAt?: string; // ISO 8601 date string
}

export interface Vote {
  voterUsername: string;
  voterAvatar: string;
  choice: 'for' | 'against';
  power: number;
  timestamp: string; // ISO
}

export interface DAOProposal {
  id: string;
  title: string;
  description: string;
  proposer: string; // username
  status: 'active' | 'passed' | 'failed' | 'executed';
  votesFor: number;
  votesAgainst: number;
  startDate: string; // ISO
  endDate: string; // ISO
  quorum: number; // Percentage required
  votes: Vote[];
}

export interface Evidence {
  id: string;
  uploader: 'buyer' | 'seller';
  type: 'image' | 'document' | 'text';
  url?: string; // for images/docs
  content?: string; // for text evidence
  timestamp: string; // ISO
  description: string;
}

export interface ArbitrationVote {
    arbitratorAddress: string;
    decision: 'buyer' | 'seller';
    comment: string;
    timestamp: string; // ISO
}

export interface ArbitrationCase {
  id: string;
  dispute: Dispute;
  status: 'voting' | 'resolved';
  evidence: Evidence[];
  votesForBuyer: number;
  votesForSeller: number;
  arbitrators: string[]; // usernames
  votes: ArbitrationVote[];
  deadline: string; // ISO
  resolution?: {
      winner: 'buyer' | 'seller';
      reason: string;
  };
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string; // in ETH
  timestamp: number; // in milliseconds
  blockNumber?: number;
  asset?: string;
}

// --- New types for the refactored useWallet hook ---

export type ConnectionType = 'eoa' | 'sca';

export type TokenSymbol = 'USDC' | 'USDT' | 'DMT';

export type TokenBalances = Record<TokenSymbol, string>;

export interface LoadingStates {
    balances: boolean;
    transactions: boolean;
    connection: boolean;
    staking: boolean;
}

export interface WalletState {
    isConnected: boolean;
    user: User | null;
    provider: BrowserProvider | null;
    isLoading: boolean; // Alias for loading.connection
    walletAvailable: boolean;
    connectionType: ConnectionType | null;
    badgeToMint: Badge | null;
    error: string | null;

    // Balances
    nativeBalance: string;
    tokenBalances: TokenBalances;
    isBalanceLoading: boolean;
    totalBalanceUSD: number;

    // Transactions
    transactions: Transaction[];
    isHistoryLoading: boolean;

    // Methods
    connectWallet: () => Promise<void>;
    connectWithSocial: (provider: 'google' | 'apple') => Promise<void>;
    disconnectWallet: () => void;
    updateUserLocation: (location: { country: string; city: string; }) => void;
    handleStake: (amount: number) => void;
    handleUnstake: (amount: number) => void;
    lockStake: (amount: number) => void;
    unlockStake: (amount: number) => void;
    spendDmt: (amount: number) => void;
    awardBadge: (badge: Badge) => void;
    confirmMintedBadge: () => void;
    cancelBadgeMint: () => void;
    mintUnlockedBadge: (badge: Badge) => void;
    clearError: () => void;
    refetchBalances: () => Promise<void>;
    refetchTransactions: () => Promise<void>;
}