import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, Badge, Transaction, TokenSymbol, TokenBalances, LoadingStates, ConnectionType, WalletState } from '../types';
import { BrowserProvider, ethers } from 'ethers';
import { Alchemy, Network, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// --- Configuration ---
const config = {
  ALCHEMY_API_KEY: process.env.REACT_APP_ALCHEMY_API_KEY || "cUUNnCPecup2BTfsBYy--",
  NETWORK: Network.ARB_MAINNET,
  CHAIN_ID: 42161n,
  TOKENS: {
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DMT: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  } as const
};
const alchemy = new Alchemy({ apiKey: config.ALCHEMY_API_KEY, network: config.NETWORK });


// --- WaaS Simulation ---
const simulateWaaSLogin = async (socialProvider: 'google' | 'apple'): Promise<{ address: string, email: string }> => {
    console.log(`Simulating login with ${socialProvider}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const email = socialProvider === 'google' ? 'user.from.google@email.com' : 'user.from.apple@email.com';
    const privateKey = ethers.id(email);
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    console.log(`Simulated WaaS: Generated Smart Contract Account (SCA) address ${address} for ${email}`);
    return { address, email };
};

// --- Sub-hooks for better separation of concerns ---

const useBalances = (address: string | null) => {
  const [state, setState] = useState({
    nativeBalance: '0.0',
    tokenBalances: { USDC: '0', USDT: '0', DMT: '0' } as TokenBalances,
    totalBalanceUSD: 0,
    isLoading: true,
  });

  const calculateTotalBalance = useCallback((ethBalance: string, tokenBals: TokenBalances) => {
    const ETH_PRICE_USD = 3500; // Mock price
    const DMT_PRICE_USD = 0.85; // Mock price
    
    const ethValue = parseFloat(ethBalance) * ETH_PRICE_USD;
    const usdcValue = parseFloat(tokenBals.USDC);
    const usdtValue = parseFloat(tokenBals.USDT);
    const dmtValue = parseFloat(tokenBals.DMT) * DMT_PRICE_USD;
    
    return ethValue + usdcValue + usdtValue + dmtValue;
  }, []);

  const fetchBalances = useCallback(async (userAddress: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const [balanceWei, tokenBalancesResult] = await Promise.all([
        alchemy.core.getBalance(userAddress),
        alchemy.core.getTokenBalances(userAddress, Object.values(config.TOKENS))
      ]);

      const ethBalance = ethers.formatEther(balanceWei.toString());
      const newBalances: TokenBalances = { USDC: '0', USDT: '0', DMT: '0' };
      const symbolMap = Object.entries(config.TOKENS).reduce((acc, [symbol, address]) => 
        ({...acc, [address.toLowerCase()]: symbol as TokenSymbol}), {} as Record<string, TokenSymbol>);
      
      tokenBalancesResult.tokenBalances.forEach(token => {
        const symbol = symbolMap[token.contractAddress.toLowerCase()];
        if (symbol && token.tokenBalance) {
          const decimals = symbol === 'USDC' || symbol === 'USDT' ? 6 : 18;
          newBalances[symbol] = ethers.formatUnits(token.tokenBalance, decimals);
        }
      });

      const totalUSD = calculateTotalBalance(ethBalance, newBalances);
      
      setState({
        nativeBalance: ethBalance,
        tokenBalances: newBalances,
        totalBalanceUSD: totalUSD,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [calculateTotalBalance]);

  return { ...state, fetchBalances };
};

const useTransactions = (address: string | null) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = useCallback(async (userAddress: string) => {
        setIsLoading(true);
        try {
            const [sentTxs, receivedTxs] = await Promise.all([
                alchemy.core.getAssetTransfers({
                    fromAddress: userAddress,
                    category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
                    maxCount: 50,
                    order: SortingOrder.DESCENDING,
                    withMetadata: true,
                }),
                alchemy.core.getAssetTransfers({
                    toAddress: userAddress,
                    category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
                    maxCount: 50,
                    order: SortingOrder.DESCENDING,
                    withMetadata: true,
                })
            ]);
            const allTransfers = [...sentTxs.transfers, ...receivedTxs.transfers];
            const uniqueTransfers = Array.from(new Map(allTransfers.map(tx => [tx.uniqueId, tx])).values());
            uniqueTransfers.sort((a, b) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16));

            const formatted: Transaction[] = uniqueTransfers.slice(0, 100).map((tx) => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to ?? 'N/A',
                value: tx.value?.toString() ?? '0',
                asset: tx.asset ?? 'ETH',
                timestamp: new Date(tx.metadata.blockTimestamp).getTime(),
                blockNumber: parseInt(tx.blockNum, 16),
            }));
            setTransactions(formatted);
        } catch (error) {
            console.error("Failed to fetch transaction history:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { transactions, isLoading, fetchTransactions };
};


// --- Main Wallet Provider ---
const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badgeToMint, setBadgeToMint] = useState<Badge | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({ connection: false, balances: false, transactions: false, staking: false });

  const walletAvailable = !!window.ethereum;
  
  const balances = useBalances(user?.address || null);
  const transactions = useTransactions(user?.address || null);
  
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const setLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
    if (isMounted.current) setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const disconnectWallet = useCallback(() => {
    setUser(null);
    setProvider(null);
    setConnectionType(null);
    setError(null);
    setBadgeToMint(null);
  }, []);

  const switchToArbitrum = async () => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xA4B1' }] });
    } catch (switchError: any) {
      if (switchError.code === 4902) setError('Пожалуйста, добавьте сеть Arbitrum в ваш кошелек');
      throw switchError;
    }
  };

  const createUserObject = (address: string, type: ConnectionType, email?: string): User => ({
    id: `user-${address}`,
    address,
    username: type === 'sca' ? email! : `0x${address.substring(2, 5)}...${address.substring(address.length - 3)}`,
    avatar: `https://i.pravatar.cc/150?u=${address}`,
    rating: type === 'eoa' ? 98 : 100,
    reviews: type === 'eoa' ? 15 : 0,
    memberSince: new Date().getFullYear(),
    location: undefined,
    dmtBalance: type === 'eoa' ? 1000 : 500,
    stake: type === 'eoa' ? 250 : 0,
    lockedStake: type === 'eoa' ? 50 : 0,
    badges: [],
    unlockedBadges: [],
  });

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
      
      setProvider(new BrowserProvider(window.ethereum, 'any')); // re-init after switch
      const connectedUser = createUserObject(address, 'eoa');
      setUser(connectedUser);
      setConnectionType('eoa');
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(err instanceof Error ? err.message : 'Не удалось подключить кошелек');
      disconnectWallet();
    } finally {
      setLoadingState('connection', false);
    }
  }, [walletAvailable, disconnectWallet, setLoadingState]);
  
  const connectWithSocial = useCallback(async (socialProvider: 'google' | 'apple') => {
    setLoadingState('connection', true);
    setError(null);
    try {
        const { address, email } = await simulateWaaSLogin(socialProvider);
        const scaUser = createUserObject(address, 'sca', email);
        setUser(scaUser);
        setConnectionType('sca');
        setProvider(null);
    } catch (err) {
        console.error("Failed to connect with social account:", err);
        setError('Не удалось войти через соцсети');
        disconnectWallet();
    } finally {
        setLoadingState('connection', false);
    }
  }, [disconnectWallet, setLoadingState]);

  useEffect(() => {
    if (user?.address) {
      balances.fetchBalances(user.address);
      transactions.fetchTransactions(user.address);
    }
  }, [user?.address]);

  // --- State management logic (staking, badges, etc.) ---
  const handleStake = useCallback((amount: number) => {
    setUser(u => u && amount > 0 && amount <= u.dmtBalance ? { ...u, stake: u.stake + amount, dmtBalance: u.dmtBalance - amount } : u);
  }, []);
  const handleUnstake = useCallback((amount: number) => {
    setUser(u => u && amount > 0 && amount <= (u.stake - u.lockedStake) ? { ...u, stake: u.stake - amount, dmtBalance: u.dmtBalance + amount } : u);
  }, []);
  const lockStake = useCallback((amount: number) => {
    setUser(u => u && (u.stake - u.lockedStake) >= amount ? { ...u, lockedStake: u.lockedStake + amount } : u);
  }, []);
  const unlockStake = useCallback((amount: number) => {
    setUser(u => u && u.lockedStake >= amount ? { ...u, lockedStake: u.lockedStake - amount } : u);
  }, []);
  const spendDmt = useCallback((amount: number) => {
    setUser(u => u && amount > 0 && amount <= u.dmtBalance ? { ...u, dmtBalance: u.dmtBalance - amount } : u);
  }, []);
  const updateUserLocation = useCallback((location: { country: string; city: string; }) => {
    setUser(u => u ? { ...u, location } : null);
  }, []);
  const awardBadge = useCallback((badge: Badge) => {
    setUser(u => {
      if (!u || u.badges.some(b => b.id === badge.id) || u.unlockedBadges?.includes(badge.id)) return u;
      setBadgeToMint(badge);
      return { ...u, unlockedBadges: [...(u.unlockedBadges || []), badge.id] };
    });
  }, []);
  const confirmMintedBadge = useCallback(() => {
    if (!badgeToMint) return setError('Нет баджа для минтинга');
    if (parseFloat(balances.tokenBalances.USDC) < 1) return setError('Недостаточно USDC для минтинга');
    
    // This is a simulation, in reality a transaction would be sent
    spendDmt(1); // Assuming 1 DMT cost, though sheet says 1 USDC
    setUser(u => {
      if (!u) return null;
      const newUnlocked = (u.unlockedBadges || []).filter(id => id !== badgeToMint.id);
      if (u.badges.some(b => b.id === badgeToMint.id)) return { ...u, unlockedBadges: newUnlocked };
      return { ...u, badges: [...u.badges, badgeToMint], unlockedBadges: newUnlocked };
    });
    setBadgeToMint(null);
  }, [badgeToMint, balances.tokenBalances, spendDmt]);


  const value: WalletState = {
    isConnected: !!user,
    user,
    provider,
    isLoading: loading.connection,
    walletAvailable,
    connectionType,
    badgeToMint,
    error,
    nativeBalance: balances.nativeBalance,
    tokenBalances: balances.tokenBalances,
    isBalanceLoading: balances.isLoading,
    totalBalanceUSD: balances.totalBalanceUSD,
    transactions: transactions.transactions,
    isHistoryLoading: transactions.isLoading,
    connectWallet,
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
    refetchBalances: () => user ? balances.fetchBalances(user.address) : Promise.resolve(),
    refetchTransactions: () => user ? transactions.fetchTransactions(user.address) : Promise.resolve(),
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