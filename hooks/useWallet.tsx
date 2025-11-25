
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, Badge, Transaction, TokenSymbol, TokenBalances, LoadingStates, ConnectionType, WalletState } from '../types';
import { BrowserProvider, ethers } from 'ethers';
import { Alchemy, Network, Utils, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { arbitrumSepolia } from '@reown/appkit/networks';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Helper to safely access environment variables in both Browser (Vite) and Node environments
const getEnv = (key: string, defaultValue: string): string => {
  // 1. Try Vite (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors
  }

  // 2. Try Node.js (process.env) - SAFE CHECK
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key] as string;
    }
  } catch (e) {
    // Ignore errors
  }

  return defaultValue;
};

// --- AppKit Configuration ---
// 1. Get projectId
const projectId = '3a8170812b534d0ff9d794f19a901d64'; // Public ID for demo

// 2. Create a metadata object
const metadata = {
  name: 'DeMarket',
  description: 'A decentralized P2P marketplace for the CIS region',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://demarket.app', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 3. Create the AppKit instance
// We wrap this in a condition to prevent server-side rendering crashes if any
if (typeof window !== 'undefined') {
    try {
        createAppKit({
          adapters: [new EthersAdapter()],
          networks: [arbitrumSepolia],
          metadata,
          projectId,
          features: {
            analytics: true 
          }
        });
    } catch (e) {
        console.error("Failed to initialize AppKit:", e);
    }
}

// --- Configuration ---
export const config = {
  NETWORK_NAME: 'arbitrumSepolia',
  ETHERS_NETWORK: 'arbitrum-sepolia',
  ALCHEMY_NETWORK: Network.ARB_SEPOLIA,
  CHAIN_ID: 421614n,
  TOKENS: {
    USDC: getEnv('VITE_CONTRACT_USDC', '0x3FF0b82143f39C0a3239baB0db6bdE88315698A7'), 
    USDT: getEnv('VITE_CONTRACT_USDT', '0xdCb4D1EfdcFf9b7A25fCfa13F6a60f95c647B5C9'), 
    DMT: getEnv('VITE_CONTRACT_DMT', '0xc545322af3c4E01B72430f05b98e233fAbeD75d7'),
  } as const,
  MARKETPLACE_ADDRESS: getEnv('VITE_CONTRACT_MARKETPLACE', '0x3611ec20174fFa7B168Ee1FFb674AC1cdC8b250b')
};

const alchemy = new Alchemy({
    apiKey: "demo", 
    network: config.ALCHEMY_NETWORK,
});

const publicArbitrumProvider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const STORAGE_KEY = 'demarket_session_v1';

interface StoredSession {
    address: string;
    connectionType: ConnectionType;
    location?: { country: string; region?: string; city: string };
    email?: string;
}

const simulateWaaSLogin = async (socialProvider: 'google' | 'apple'): Promise<{ address: string, email: string }> => {
    console.log(`Simulating login with ${socialProvider}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const email = socialProvider === 'google' ? 'user.from.google@email.com' : 'user.from.apple@email.com';
    const privateKey = ethers.id(email);
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    return { address, email };
};

export const getReputationTier = (rating: number, reviews: number): 'none' | 'bronze' | 'silver' | 'gold' => {
    if (reviews >= 50 && rating >= 98) return 'gold';
    if (reviews >= 20 && rating >= 95) return 'silver';
    if (reviews >= 5 && rating >= 90) return 'bronze';
    return 'none';
};

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badgeToMint, setBadgeToMint] = useState<Badge | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({ connection: true, balances: false, transactions: false, staking: false });
  
  const [nativeBalance, setNativeBalance] = useState('0.0');
  const [tokenBalances, setTokenBalances] = useState<TokenBalances>({ USDC: '0', USDT: '0', DMT: '0' });
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // AppKit Hooks
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const walletAvailable = typeof window !== 'undefined' && !!window.ethereum;
  const isMounted = useRef(true);

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  const setLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
    if (isMounted.current) setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const createUserObject = useCallback((address: string, type: ConnectionType, email?: string, location?: { country: string; region?: string; city: string }): User => {
    const rating = type === 'eoa' ? 98 : 100;
    const reviews = type === 'eoa' ? 15 : 0;
    const reputationTier = getReputationTier(rating, reviews);
    const formattedUsername = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

    return {
        id: `user-${address}`,
        address,
        username: formattedUsername,
        avatar: `https://i.pravatar.cc/150?u=${address}`,
        rating,
        reviews,
        memberSince: new Date().getFullYear(),
        location: location,
        dmtBalance: type === 'eoa' ? 1000 : 500,
        stake: type === 'eoa' ? 250 : 0,
        lockedStake: type === 'eoa' ? 50 : 0,
        badges: [],
        unlockedBadges: [],
        reputationTier,
        createdAt: new Date().toISOString(),
        firstDealAt: new Date().toISOString(),
        goodReviewsCount: type === 'eoa' ? 15 : 0,
        badReviewsCount: 0,
        avgPaymentTime: 0,
        avgTransferTime: 0,
    };
  }, []);

  // --- Sync AppKit State with Local State ---
  useEffect(() => {
    const syncAppKit = async () => {
      if (isAppKitConnected && appKitAddress && walletProvider) {
        try {
          const ethersProvider = new BrowserProvider(walletProvider as any, 'any');
          setProvider(ethersProvider);
          
          let restoredLocation;
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
             try {
                 const session = JSON.parse(stored);
                 if (session.address.toLowerCase() === appKitAddress.toLowerCase()) {
                     restoredLocation = session.location;
                 }
             } catch (e) {}
          }

          const connectedUser = createUserObject(appKitAddress, 'eoa', undefined, restoredLocation);
          setUser(connectedUser);
          setConnectionType('eoa');
          saveSession(connectedUser, 'eoa');
          setLoadingState('connection', false);
        } catch (e) {
          console.error("Error syncing AppKit state:", e);
        }
      }
    };
    syncAppKit();
  }, [isAppKitConnected, appKitAddress, walletProvider, createUserObject]);

  useEffect(() => {
      const restoreSession = async () => {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
              try {
                  const session: StoredSession = JSON.parse(stored);
                  if (isAppKitConnected) return; // AppKit handles restoration

                  if (session.connectionType === 'eoa' && window.ethereum) {
                      const browserProvider = new BrowserProvider(window.ethereum, 'any');
                      const accounts = await browserProvider.listAccounts();
                      if (accounts.length > 0 && accounts[0].address.toLowerCase() === session.address.toLowerCase()) {
                          setProvider(browserProvider);
                          const restoredUser = createUserObject(session.address, 'eoa', undefined, session.location);
                          setUser(restoredUser);
                          setConnectionType('eoa');
                      }
                  } else if (session.connectionType === 'sca') {
                      const restoredUser = createUserObject(session.address, 'sca', session.email, session.location);
                      setUser(restoredUser);
                      setConnectionType('sca');
                  }
              } catch (e) {
                  localStorage.removeItem(STORAGE_KEY);
              }
          }
          setLoadingState('connection', false);
      };

      restoreSession();
  }, [createUserObject, setLoadingState, isAppKitConnected]);

  const saveSession = useCallback((user: User, type: ConnectionType, email?: string) => {
      const session: StoredSession = {
          address: user.address,
          connectionType: type,
          location: user.location,
          email
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const disconnectWallet = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setProvider(null);
    setConnectionType(null);
    setError(null);
    setBadgeToMint(null);
    setNativeBalance('0.0');
    setTokenBalances({ USDC: '0', USDT: '0', DMT: '0' });
    setTotalBalanceUSD(0);
    setTransactions([]);
    
    try {
        const { disconnect } = useAppKit();
        await disconnect(); 
    } catch(e) {
        // ignore
    }
  }, []);

  const fetchBalances = useCallback(async (userAddress: string) => {
    setIsBalanceLoading(true);
    try {
        let ethBalance = '0.0';
        try {
            const ethBalanceWei = await publicArbitrumProvider.getBalance(userAddress);
            ethBalance = ethers.formatEther(ethBalanceWei);
        } catch (e) { }

        const newBalances: TokenBalances = { USDC: '0', USDT: '0', DMT: '0' };
        const ETH_PRICE_USD = 3500;
        const DMT_PRICE_USD = 0.85;
        let totalUSD = parseFloat(ethBalance) * ETH_PRICE_USD;

        for (const tokenSymbol of Object.keys(config.TOKENS) as TokenSymbol[]) {
            try {
                const tokenAddress = config.TOKENS[tokenSymbol];
                if (!tokenAddress || tokenAddress === '0x...') continue; 
                
                const contract = new ethers.Contract(tokenAddress, ERC20_ABI, publicArbitrumProvider);
                const [balance, decimals] = await Promise.all([contract.balanceOf(userAddress), contract.decimals()]);
                const formattedBalance = ethers.formatUnits(balance, decimals);
                newBalances[tokenSymbol] = formattedBalance;
                if (tokenSymbol === 'USDC' || tokenSymbol === 'USDT') totalUSD += parseFloat(formattedBalance);
                else if (tokenSymbol === 'DMT') totalUSD += parseFloat(formattedBalance) * DMT_PRICE_USD;
            } catch (tokenErr) { }
        }
        
        if (isMounted.current) {
            setNativeBalance(ethBalance);
            setTokenBalances(newBalances);
            setTotalBalanceUSD(totalUSD);
        }
    } catch (err) { console.error("Error fetching balances:", err); } 
    finally { if (isMounted.current) setIsBalanceLoading(false); }
  }, []);

  const fetchTransactions = useCallback(async (userAddress: string) => {
    setIsHistoryLoading(true);
    try {
        const commonConfig = {
            category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
            maxCount: 25,
            order: SortingOrder.DESCENDING,
            withMetadata: true as const,
        };
        const [fromTransfers, toTransfers] = await Promise.all([
            alchemy.core.getAssetTransfers({ fromAddress: userAddress, ...commonConfig }).catch(() => ({ transfers: [] })),
            alchemy.core.getAssetTransfers({ toAddress: userAddress, ...commonConfig }).catch(() => ({ transfers: [] }))
        ]);
        const allTransfers = [...fromTransfers.transfers, ...toTransfers.transfers];
        const uniqueTransfers = Array.from(new Map(allTransfers.map(tx => [tx.uniqueId, tx])).values());
        uniqueTransfers.sort((a, b) => new Date(b.metadata.blockTimestamp).getTime() - new Date(a.metadata.blockTimestamp).getTime());
        
        const formattedTxs: Transaction[] = uniqueTransfers.slice(0, 50).map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value != null ? Utils.formatUnits(BigInt(tx.rawContract.value ?? 0), tx.rawContract.decimal ?? 'ether') : '0',
            timestamp: new Date(tx.metadata.blockTimestamp).getTime(),
            blockNumber: tx.blockNum ? parseInt(tx.blockNum, 16) : undefined,
            asset: tx.asset || 'ETH',
        }));

        if (isMounted.current) setTransactions(formattedTxs);
    } catch (err) { if (isMounted.current) setTransactions([]); } 
    finally { if (isMounted.current) setIsHistoryLoading(false); }
  }, []);

  const switchToArbitrum = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x66eee' }] }); 
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0x66eee',
                chainName: 'Arbitrum Sepolia',
                rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.arbiscan.io'],
            }],
        });
      } else { throw switchError; }
    }
  };

  const connectWallet = useCallback(async () => {
    if (!walletAvailable) return setError('MetaMask или совместимый кошелек не найден');
    setLoadingState('connection', true);
    setError(null);
    try {
      const browserProvider = new BrowserProvider(window.ethereum, 'any');
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();
      if (network.chainId !== config.CHAIN_ID) await switchToArbitrum();
      
      const newProvider = new BrowserProvider(window.ethereum, 'any');
      setProvider(newProvider);
      const connectedUser = createUserObject(address, 'eoa');
      setUser(connectedUser);
      setConnectionType('eoa');
      saveSession(connectedUser, 'eoa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подключить кошелек');
      disconnectWallet();
    } finally { setLoadingState('connection', false); }
  }, [walletAvailable, disconnectWallet, setLoadingState, createUserObject, saveSession]);
  
  const connectWalletConnect = useCallback(async () => {
      setLoadingState('connection', true);
      try {
          await open(); 
      } catch (err) {
          console.error("WalletConnect open error:", err);
          setLoadingState('connection', false);
      }
  }, [open]);

  const connectWithSocial = useCallback(async (socialProvider: 'google' | 'apple') => {
    setLoadingState('connection', true);
    setError(null);
    try {
        const { address, email } = await simulateWaaSLogin(socialProvider);
        const scaUser = createUserObject(address, 'sca', email);
        setUser(scaUser);
        setConnectionType('sca');
        setProvider(null);
        saveSession(scaUser, 'sca', email);
    } catch (err) {
        setError('Не удалось войти через соцсети');
        disconnectWallet();
    } finally { setLoadingState('connection', false); }
  }, [disconnectWallet, setLoadingState, createUserObject, saveSession]);
  
  const updateUserReputation = useCallback((rating: number, reviews: number) => {
    setUser(u => {
        if (!u) return null;
        const newTier = getReputationTier(rating, reviews);
        if (u.rating === rating && u.reviews === reviews && u.reputationTier === newTier) return u;
        return { ...u, rating, reviews, reputationTier: newTier };
    });
  }, []);

  useEffect(() => {
    if (user?.address) {
      fetchBalances(user.address);
      fetchTransactions(user.address);
    }
  }, [user?.address, fetchBalances, fetchTransactions]);

  const handleStake = useCallback((amount: number) => {
    if (!user || amount <= 0 || amount > user.dmtBalance) return;
    setUser(u => u ? { ...u, stake: u.stake + amount, dmtBalance: u.dmtBalance - amount } : u);
    setTokenBalances(prev => ({ ...prev, DMT: (parseFloat(prev.DMT) - amount).toFixed(6) }));
    const DMT_PRICE_USD = 0.85;
    setTotalBalanceUSD(prev => prev - (amount * DMT_PRICE_USD));
  }, [user]);

  const handleUnstake = useCallback((amount: number) => {
    if (!user || amount <= 0 || amount > (user.stake - user.lockedStake)) return;
    setUser(u => u ? { ...u, stake: u.stake - amount, dmtBalance: u.dmtBalance + amount } : u);
    setTokenBalances(prev => ({ ...prev, DMT: (parseFloat(prev.DMT) + amount).toFixed(6) }));
    const DMT_PRICE_USD = 0.85;
    setTotalBalanceUSD(prev => prev + (amount * DMT_PRICE_USD));
  }, [user]);

  const lockStake = useCallback((amount: number) => {
    if (!user || (user.stake - user.lockedStake) < amount) return;
    setUser(u => u ? { ...u, lockedStake: u.lockedStake + amount } : u);
  }, [user]);

  const unlockStake = useCallback((amount: number) => {
    if (!user || user.lockedStake < amount) return;
    setUser(u => u ? { ...u, lockedStake: u.lockedStake - amount } : u);
  }, [user]);

  const spendDmt = useCallback((amount: number) => {
    if (!user || amount <= 0 || amount > user.dmtBalance) return;
    setUser(u => u ? { ...u, dmtBalance: u.dmtBalance - amount } : u);
    setTokenBalances(prev => ({ ...prev, DMT: (parseFloat(prev.DMT) - amount).toFixed(6) }));
    const DMT_PRICE_USD = 0.85;
    setTotalBalanceUSD(prev => prev - (amount * DMT_PRICE_USD));
  }, [user]);

  const updateUserLocation = useCallback((location: { country: string; region?: string; city: string; }) => {
    setUser(u => {
        if(!u) return null;
        const updatedUser = { ...u, location };
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const session = JSON.parse(stored);
                session.location = location;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            } catch (e) { }
        }
        return updatedUser;
    });
  }, []);

  const awardBadge = useCallback((badge: Badge) => {
    setUser(u => {
      if (!u || u.badges.some(b => b.id === badge.id) || u.unlockedBadges?.includes(badge.id)) return u;
      return { ...u, unlockedBadges: [...(u.unlockedBadges || []), badge.id] };
    });
  }, []);

  const confirmMintedBadge = useCallback(() => {
    if (!badgeToMint) { setError('Нет баджа для минтинга'); return; }
    if (parseFloat(tokenBalances.USDC) < 1) { setError('Недостаточно USDC для минтинга'); return; }

    setTokenBalances(prev => ({ ...prev, USDC: (parseFloat(prev.USDC) - 1).toFixed(6) }));
    setTotalBalanceUSD(prev => prev - 1);

    setUser(u => {
        if (!u) return null;
        const newUnlocked = (u.unlockedBadges || []).filter(id => id !== badgeToMint.id);
        if (u.badges.some(b => b.id === badgeToMint.id)) return { ...u, unlockedBadges: newUnlocked };
        return { ...u, badges: [...u.badges, badgeToMint], unlockedBadges: newUnlocked };
    });
    setBadgeToMint(null);
  }, [badgeToMint, tokenBalances]);

  const value: WalletState = {
    isConnected: !!user,
    user,
    provider,
    isLoading: loading.connection,
    walletAvailable,
    connectionType,
    badgeToMint,
    error,
    nativeBalance,
    tokenBalances,
    isBalanceLoading,
    totalBalanceUSD,
    transactions,
    isHistoryLoading,
    connectWallet,
    connectWalletConnect,
    connectWithSocial,
    disconnectWallet,
    updateUserLocation,
    handleStake,
    handleUnstake,
    lockStake,
    unlockStake,
    spendDmt,
    awardBadge,
    confirmMintedBadge,
    cancelBadgeMint: () => setBadgeToMint(null),
    mintUnlockedBadge: (badge) => setBadgeToMint(badge),
    clearError,
    refetchBalances: () => user ? fetchBalances(user.address) : Promise.resolve(),
    refetchTransactions: () => user ? fetchTransactions(user.address) : Promise.resolve(),
    updateUserReputation,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletState => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};