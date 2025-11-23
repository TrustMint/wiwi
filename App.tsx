
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen, MyListingsScreen, MyPurchasesScreen, MySalesScreen, MyReputationScreen, WalletScreen, AboutScreen, SettingsScreen } from './components/screens/ProfileScreen';
import { ItemScreen } from './components/screens/ItemScreen';
import { SellerProfileScreen } from './components/screens/SellerProfileScreen';
import { CatalogScreen, CategoryListingsScreen } from './components/screens/CatalogScreen';
import { ChatsScreen } from './components/screens/ChatsScreen';
import { ChatDetailScreen } from './components/screens/ChatDetailScreen';
import { DisputeScreen } from './components/screens/DisputeScreen';
import { DaoScreen } from './components/screens/DaoScreen';
import { ArbitrationScreen } from './components/screens/ArbitrationScreen';
import { TabBar, Tab } from './components/navigation/TabBar';
import { CreateListingModal } from './components/modals/CreateListingModal';
import { EscrowPaySheet } from './components/modals/EscrowPaySheet';
import { ConfirmReceiptSheet } from './components/modals/ConfirmReceiptSheet';
import { ReportIssueSheet } from './components/modals/ReportIssueSheet';
import { DisputeSheet } from './components/modals/DisputeSheet';
import { ConnectWalletSheet } from './components/modals/ConnectWalletSheet';
import { LocationSetupSheet } from './components/modals/LocationSetupSheet';
import { BoostListingSheet } from './components/modals/BoostListingSheet';
import { LeaveReviewSheet } from './components/modals/LeaveReviewSheet';
import { MintBadgeSheet } from './components/modals/MintBadgeSheet';
import { WalletProvider, useWallet, getReputationTier } from './hooks/useWallet';
import { useSwipeBack, SwipeBackShadow } from './hooks/useSwipeBack';
import { ModalProvider, useModal } from './hooks/useModal';
import { Listing, User, Chat, Dispute, Review, Badge, ListingVariant } from './types';
import { demarketService } from './services/demarketService';
import { Toast, ToastType } from './components/shared/Toast';
import { SpinnerIcon, XCircleIcon, SearchIcon } from './components/icons/Icons';
import { useSplashScreen } from './hooks/useSplashScreen';
import { SplashScreen } from './components/SplashScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { FaqScreen } from './components/screens/FaqScreen';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { TbSmartHome, TbLayoutGrid, TbPlus, TbMessageCircle, TbUserCircle } from 'react-icons/tb';
import { GlassPanel } from './components/shared/GlassPanel';

const MIN_STAKE_FOR_REPORT = 100;

// Helper to translate technical errors to friendly Russian messages
const getFriendlyErrorMessage = (error: any): string => {
    if (error?.code === 'ACTION_REJECTED' || error?.message?.includes('user rejected')) {
        return 'Пользователь отменил транзакцию';
    }
    if (error?.message?.includes('insufficient funds')) {
        return 'Недостаточно средств для транзакции';
    }
    return error?.message || 'Произошла неизвестная ошибка';
};

type ScreenStack = { id: string, content: React.ReactNode }[];

// Define types for pending actions
type PendingAction = 
  | { type: 'buy', listing: Listing, variant?: ListingVariant }
  | { type: 'chat', seller: User }
  | { type: 'create_listing' }
  | { type: 'favorite', listingId: string }
  | { type: 'report', listing: Listing }
  | { type: 'open_dispute', listing: Listing }
  | { type: 'confirm_receipt', listing: Listing };

const AppContent: React.FC = () => {
  const { isConnected, isLoading, user, lockStake, spendDmt, awardBadge, badgeToMint, confirmMintedBadge, cancelBadgeMint, error, clearError, updateUserReputation, provider } = useWallet();
  const { showModal, hideModal, isModalOpen } = useModal();
  const { isLoading: isSplashLoading, handleLoadingComplete } = useSplashScreen();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  // REAL DATA STATE
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [chats, setChats] = useState<Chat[]>([]); // Real chats need implementation via XMTP or similar
  
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const forceUpdate = useCallback(() => setForceUpdateCounter(prev => prev + 1), []);

  const [screenStacks, setScreenStacks] = useState<Record<Tab, ScreenStack>>({
    home: [], catalog: [], create: [], chats: [], profile: []
  });
  
  const [activeListingForModal, setActiveListingForModal] = useState<Listing | null>(null);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
  const [listingToReview, setListingToReview] = useState<Listing | null>(null);
  const [toast, setToast] = useState({ message: '', show: false, type: 'success' as ToastType });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [listingToBoost, setListingToBoost] = useState<Listing | null>(null);
  
  // State for Pending Actions (The "Intention" Pattern)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  const isModalOperationInProgress = useRef(false);
  const hasHandledDeepLink = useRef(false);
  
  // State to hold data fetched during Splash Screen
  const [preloadedDeepLinkListing, setPreloadedDeepLinkListing] = useState<Listing | null>(null);
  const [isDeepLinkFetching, setIsDeepLinkFetching] = useState(false);

  // --- Circular Refs ---
  const handlePurchaseConfirmedRef = useRef<(listing: Listing, purchasedQuantity: number, variant?: ListingVariant) => Promise<void>>(async () => {});
  const handleReceiptConfirmedRef = useRef<(listing: Listing) => Promise<void>>(async () => {});

  const fetchListings = useCallback(async (silent = false) => {
    if (!silent) {
        setIsListingsLoading(true);
    }
    try {
        // Fetch ALL listings (active, sold, escrow) to populate history properly
        // Also fetch ALL reviews to populate seller profiles
        const [fetchedListings, fetchedReviews] = await Promise.all([
            demarketService.getListings(),
            demarketService.getReviews()
        ]);

        setListings(fetchedListings);
        setReviews(fetchedReviews);
        
        // Extract unique sellers from listings
        const uniqueSellers = new Map<string, User>();
        fetchedListings.forEach(l => {
            if (!uniqueSellers.has(l.seller.address)) {
                uniqueSellers.set(l.seller.address, l.seller);
            }
        });
        setUsers(Array.from(uniqueSellers.values()));

    } catch (e) {
        console.error("Failed to fetch data", e);
    } finally {
        if (!silent) {
            setIsListingsLoading(false);
        }
    }
  }, []);

  useEffect(() => {
    fetchListings(false); // Initial load with spinner
    const interval = setInterval(() => fetchListings(true), 30000); // Background poll (silent mode)
    return () => clearInterval(interval);
  }, [fetchListings]);
  
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, show: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000); 
  }, []);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError();
    }
  }, [error, showToast, clearError]);

  useEffect(() => {
    if (!isModalOpen && !isModalOperationInProgress.current) {
      setActiveListingForModal(null);
      setListingToEdit(null);
      setListingToReview(null);
      setListingToBoost(null);
      if (badgeToMint) {
        cancelBadgeMint();
      }
    }
  }, [isModalOpen, cancelBadgeMint, badgeToMint]);


  const handleArchiveListing = useCallback((listingId: string) => {
      showToast('Для архивации используйте отмену в профиле продавца.', 'info');
  }, [showToast]);

  const handleRestoreListing = useCallback((listingId: string) => {
      showToast('Функция восстановления скоро будет доступна.', 'info');
  }, [showToast]);

  const pushScreen = useCallback((content: React.ReactNode) => {
    const newScreen = { id: Date.now().toString(), content };
    setScreenStacks(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newScreen],
    }));
    setTimeout(forceUpdate, 10);
  }, [activeTab, forceUpdate]);

  const popScreen = useCallback(() => {
    setScreenStacks(prev => {
      const currentStack = prev[activeTab] || [];
      if (currentStack.length === 0) return prev;
      const newStack = currentStack.slice(0, -1);
       if (newStack.length === 0 && window.location.search.includes('cid=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
      }
      return { ...prev, [activeTab]: newStack };
    });
    setTimeout(forceUpdate, 10);
  }, [activeTab, forceUpdate]);
  
  const currentStack = screenStacks[activeTab] || [];
  const screenStackDepth = currentStack.length;
  const isScreenPushed = screenStackDepth > 0;
  
  const { 
    dragHandlers, 
    pushedStyle, 
    underlyingStyle, 
    isDragging, 
    dragProgress,
  } = useSwipeBack({ onSwipeBack: popScreen, enabled: isScreenPushed, swipeThreshold: 0.4 });
  
  // --- HANDLERS ---

  const handleSaveListing = useCallback(async (
      listingData: Omit<Listing, 'seller' | 'status' | 'buyer'> & { id?: string },
      imageFiles: File[],
      proofFile?: File,
      videoFile?: File
  ) => {
    if (!user || !provider) {
        showToast('Пожалуйста, подключите кошелек', 'error');
        return;
    }
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    
    try {
      const signer = await provider.getSigner();
      
      if (listingData.id) {
        // UPDATE LOGIC 
        showToast('Редактирование пока недоступно в бета-версии смарт-контракта.', 'warning');
      } else {
        // CREATE LOGIC
        hideModal();
        showToast('Загрузка медиа в IPFS и создание транзакции...', 'info');
        
        await demarketService.createListingOnChain(
          listingData, 
          user, 
          imageFiles,
          proofFile,
          videoFile,
          signer
        );
        
        showToast('Транзакция отправлена! Объявление появится в списке через минуту.', 'success');
        // Optimistically refresh after a delay
        setTimeout(() => fetchListings(true), 5000);
        setTimeout(() => fetchListings(true), 15000); 
      }
    } catch (error: any) {
      console.error('Error saving listing:', error);
      const errMsg = getFriendlyErrorMessage(error);
      showToast(errMsg, 'error');
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [user, provider, hideModal, showToast, fetchListings]);

  const handleReviewSubmitted = useCallback((review: Omit<Review, 'id'>) => {
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    
    try {
      hideModal();
      showToast('Отзывы скоро будут доступны on-chain!', 'info');
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [hideModal, showToast]);

  const handleReportConfirmed = useCallback(() => {
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    try {
      hideModal();
      showToast('Жалоба отправлена в DAO.', 'success');
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [hideModal, showToast]);

  const handleDisputeInitiated = useCallback((listing: Listing) => {
    if (!listing) return;
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    try {
      hideModal();
      showToast('Спор открыт. Арбитр уведомлен.', 'warning');
      
      setTimeout(() => {
        const newDispute: Dispute = {
          id: `dispute-${Date.now()}`,
          listing: listing,
          status: 'negotiation',
          createdAt: new Date().toISOString(),
          lastMessage: 'Открыт период переговоров...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 1,
          messages: [{ id: `msg-${Date.now()}`, text: 'Спор был инициирован. Начался 1-часовой период для переговоров.', senderType: 'arbitrator', sender: 'them', status: 'sent', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
        };
        setDisputes(prev => [newDispute, ...prev]);
        pushScreen(<DisputeScreen dispute={newDispute} onBack={popScreen} />);
      }, 350);
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [hideModal, pushScreen, popScreen, showToast]);

  const handleBoostConfirmed = useCallback((listingId: string, cost: number, durationDays: number) => {
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    try {
      spendDmt(cost);
      setListings(prev => {
        const updatedListings = prev.map(l => {
          if (l.id === listingId) {
            const boostedUntil = new Date();
            boostedUntil.setDate(boostedUntil.getDate() + durationDays);
            return { ...l, boostedUntil: boostedUntil.toISOString() };
          }
          return l;
        });
        return updatedListings;
      });
      hideModal();
      showToast(`Объявление успешно продвигается на ${durationDays} дней!`);
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [spendDmt, hideModal, showToast]);

  const handleMintBadge = useCallback(async () => {
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    try {
      showToast('🚀 Минтинг NFT-баджа...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      confirmMintedBadge();
      hideModal();
      showToast('✨ Бадж успешно добавлен в ваш профиль!');
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [showToast, confirmMintedBadge, hideModal]);

  // --- ACTION HANDLERS ---

  const handleBuyNow = useCallback((listing: Listing, variant?: ListingVariant) => {
    if (!isConnected) {
        setPendingAction({ type: 'buy', listing, variant });
        showModal(<ConnectWalletSheet />);
        return;
    }
    if (!user?.location) {
        setPendingAction({ type: 'buy', listing, variant });
        showModal(<LocationSetupSheet />);
        return;
    }
    
    setActiveListingForModal(listing);
    showModal(<EscrowPaySheet listing={listing} variant={variant} onConfirm={(purchasedQuantity) => handlePurchaseConfirmedRef.current(listing, purchasedQuantity, variant)} />);
  }, [showModal, isConnected, user]);

  const handleConfirmReceipt = useCallback((listing: Listing) => {
    if (!isConnected) {
        setPendingAction({ type: 'confirm_receipt', listing });
        showModal(<ConnectWalletSheet />);
        return;
    }
    
    setActiveListingForModal(listing);
    showModal(<ConfirmReceiptSheet listing={listing} onConfirm={() => handleReceiptConfirmedRef.current(listing)} />);
  }, [showModal, isConnected]);

  const handleReportIssue = useCallback((listing: Listing) => {
    if (!isConnected) {
        setPendingAction({ type: 'report', listing });
        showModal(<ConnectWalletSheet />);
        return;
    }
    
    if (!user || user.stake < MIN_STAKE_FOR_REPORT) {
      showToast(`Необходимо внести стейк (мин. ${MIN_STAKE_FOR_REPORT} $DMT) для подачи жалоб.`, 'warning');
      return;
    }
    
    setActiveListingForModal(listing);
    showModal(<ReportIssueSheet listing={listing} onConfirm={handleReportConfirmed} />);
  }, [showToast, showModal, handleReportConfirmed, isConnected, user]);
  
  const handleOpenDispute = useCallback((listing: Listing) => {
    if (!isConnected) {
        setPendingAction({ type: 'open_dispute', listing });
        showModal(<ConnectWalletSheet />);
        return;
    }

    setActiveListingForModal(listing);
    showModal(<DisputeSheet listing={listing} onConfirm={() => handleDisputeInitiated(listing)} />);
  }, [showModal, handleDisputeInitiated, isConnected]);

  const handleStartChat = useCallback((seller: User) => {
    if (!isConnected) {
        setPendingAction({ type: 'chat', seller });
        showModal(<ConnectWalletSheet />);
        return;
    }
    
    // In production, verify real chat ID or create new one via XMTP
    let chat: Chat = {
      id: `chat-${Date.now()}`, 
      user: seller, 
      lastMessage: 'Начните разговор...', 
      timestamp: '', 
      unread: 0, 
      messages: []
    };
    
    pushScreen(<ChatDetailScreen chat={chat} onBack={popScreen} />);
  }, [pushScreen, popScreen, showModal, isConnected]);
  
  const handleToggleFavorite = useCallback((listingId: string) => {
    if (!isConnected) {
        setPendingAction({ type: 'favorite', listingId });
        showModal(<ConnectWalletSheet />);
        return;
    }
    setFavorites(prev => {
      const newFavorites = prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId];
      setTimeout(forceUpdate, 10);
      return newFavorites;
    });
  }, [showModal, forceUpdate, isConnected]);

  const handleSelectListingToEdit = useCallback((listing: Listing) => {
    if (!user?.location) return;
    setListingToEdit(listing);
    showModal(<CreateListingModal userLocation={user.location} onSave={handleSaveListing} listingToEdit={listing} />);
  }, [showModal, handleSaveListing, user]);

  // --- HELPER HANDLERS ---

  const handleListingClick = useCallback((listing: Listing) => {
    const isDisputed = disputes.some(d => d.listing.id === listing.id);
    
    pushScreen(
      <ItemScreen 
        listing={listing} 
        onBack={popScreen}
        onBuyNow={handleBuyNow} 
        onWrite={handleStartChat}
        onConfirmReceipt={handleConfirmReceipt}
        onReportIssue={handleReportIssue}
        onOpenDispute={handleOpenDispute}
        onViewDispute={() => handleViewDispute(listing.id)}
        onViewSellerProfile={handleViewSellerProfile}
        onBoost={() => showModal(<BoostListingSheet listing={listing} onConfirm={handleBoostConfirmed} />)}
        onEdit={handleSelectListingToEdit}
        isDisputed={isDisputed}
        showToast={showToast}
        showModal={showModal}
      />
    );
  }, [disputes, popScreen, handleBuyNow, handleStartChat, handleConfirmReceipt, handleReportIssue, handleOpenDispute, pushScreen, showToast, showModal, handleBoostConfirmed, handleSelectListingToEdit]);

  const handleViewSellerProfile = useCallback((seller: User) => {
    pushScreen(
      <SellerProfileScreen 
        seller={seller}
        allListings={listings}
        allReviews={reviews}
        onBack={popScreen}
        onListingClick={(listing) => handleListingClick(listing)}
        onToggleFavorite={handleToggleFavorite}
        favorites={favorites}
      />
    );
  }, [listings, reviews, pushScreen, popScreen, favorites, handleListingClick, handleToggleFavorite]);

  const handleViewDispute = useCallback((listingId: string) => {
    const disputeToView = disputes.find(d => d.listing.id === listingId);
    if (disputeToView) {
      pushScreen(<DisputeScreen dispute={disputeToView} onBack={popScreen} />);
    }
  }, [pushScreen, popScreen, disputes]);

  // --- CIRCULAR LOGIC HANDLERS (Blockchain Interaction) ---

  const handleReceiptConfirmed = useCallback(async (listing: Listing) => {
    if (!listing || !user || !provider) return;
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    
    try {
      hideModal();
      showToast('Подписание транзакции подтверждения...', 'info');
      const signer = await provider.getSigner();
      
      await demarketService.confirmReceiptOnChain(listing.id, signer);
      
      setDisputes(prev => prev.filter(d => d.listing.id !== listing.id));
      setListingToReview(listing);

      showToast('Транзакция отправлена! Сделка завершена.', 'success');
      setTimeout(() => fetchListings(true), 5000);

      setTimeout(() => {
        showModal(<LeaveReviewSheet listing={listing} user={user} onSubmit={handleReviewSubmitted} />);
      }, 1000);
      
    } catch(err: any) {
        console.error(err);
        showToast(getFriendlyErrorMessage(err), 'error');
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [hideModal, showModal, showToast, handleReviewSubmitted, user, provider, fetchListings]);

  const handlePurchaseConfirmed = useCallback(async (listing: Listing, purchasedQuantity: number, variant?: ListingVariant) => {
      if (!listing || !user || !provider) return;
      if (isModalOperationInProgress.current) return;
      isModalOperationInProgress.current = true;

      try {
          hideModal();
          showToast('Инициализация покупки в блокчейне...', 'info');
          
          const signer = await provider.getSigner();
          await demarketService.purchaseListingOnChain(listing, purchasedQuantity, signer);
          
          showToast('Покупка совершена! Средства в Escrow.', 'success');
          
          // Refresh data (silent mode true to avoid spinner)
          setTimeout(() => fetchListings(true), 5000);
          setTimeout(() => fetchListings(true), 15000);
      } catch (err: any) {
          console.error("Purchase failed", err);
          const msg = getFriendlyErrorMessage(err);
          showToast(msg, 'error');
      } finally {
          setTimeout(() => {
              isModalOperationInProgress.current = false;
          }, 100);
      }
  }, [hideModal, showToast, provider, fetchListings, user]);

  // --- UPDATE REFS for Circular Handlers ---
  useEffect(() => {
    handlePurchaseConfirmedRef.current = handlePurchaseConfirmed;
    handleReceiptConfirmedRef.current = handleReceiptConfirmed;
  }, [handlePurchaseConfirmed, handleReceiptConfirmed]);

  // --- STACK REFRESH LOGIC ---
  useEffect(() => {
      setScreenStacks(prevStacks => {
          const nextStacks = { ...prevStacks };
          let changed = false;

          const updateScreen = (screen: ScreenStack[number]) => {
               if (React.isValidElement(screen.content)) {
                   const element = screen.content as React.ReactElement<any>;
                   const newContent = React.cloneElement(element, {
                       user,
                       listings,
                       favorites,
                       disputes,
                       onToggleFavorite: handleToggleFavorite,
                       onBuyNow: handleBuyNow,
                       onWrite: handleStartChat,
                       onConfirmReceipt: handleConfirmReceipt,
                       onReportIssue: handleReportIssue,
                       onOpenDispute: handleOpenDispute,
                       ...(element.props.listing && { 
                            listing: listings.find((l: Listing) => l.id === element.props.listing.id) || element.props.listing 
                       })
                   });
                   return { ...screen, content: newContent };
               }
               return screen;
          };

          for (const tab of Object.keys(nextStacks) as Tab[]) {
              if (nextStacks[tab].length > 0) {
                  const updatedStack = nextStacks[tab].map(updateScreen);
                  nextStacks[tab] = updatedStack;
                  changed = true;
              }
          }
          return changed ? nextStacks : prevStacks;
      });
  }, [user, listings, favorites, disputes, handleToggleFavorite, handleBuyNow, handleStartChat, handleConfirmReceipt, handleReportIssue, handleOpenDispute]);

  // --- EFFECT: AUTO-EXECUTE PENDING ACTIONS ---
  useEffect(() => {
      if (isConnected && pendingAction) {
          if (!user?.location) {
             showModal(<LocationSetupSheet />);
             return;
          }
          
          const action = pendingAction;
          setPendingAction(null); 

          switch (action.type) {
              case 'buy':
                  setActiveListingForModal(action.listing);
                  showModal(<EscrowPaySheet listing={action.listing} variant={action.variant} onConfirm={(qty) => handlePurchaseConfirmed(action.listing, qty, action.variant)} />);
                  break;
              case 'chat':
                  handleStartChat(action.seller);
                  hideModal();
                  break;
              case 'create_listing':
                  showModal(<CreateListingModal userLocation={user.location} onSave={handleSaveListing} />);
                  break;
              case 'favorite':
                  handleToggleFavorite(action.listingId);
                  hideModal();
                  break;
              case 'report':
                  handleReportIssue(action.listing);
                  break;
              case 'open_dispute':
                  setActiveListingForModal(action.listing);
                  showModal(<DisputeSheet listing={action.listing} onConfirm={() => handleDisputeInitiated(action.listing)} />);
                  break;
              case 'confirm_receipt':
                   setActiveListingForModal(action.listing);
                   showModal(<ConfirmReceiptSheet listing={action.listing} onConfirm={() => handleReceiptConfirmed(action.listing)} />);
                   break;
          }
      }
  }, [isConnected, user, pendingAction, handleStartChat, handlePurchaseConfirmed, handleReportIssue, handleDisputeInitiated, handleReceiptConfirmed, handleSaveListing, showModal, hideModal, handleToggleFavorite]);

  const handleDisputeClick = useCallback((dispute: Dispute) => {
    pushScreen(<DisputeScreen dispute={dispute} onBack={popScreen} />);
  }, [pushScreen, popScreen]);

  // 🚀 PARALLEL FETCHING
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('cid');
    if (cid && !hasHandledDeepLink.current) {
        setIsDeepLinkFetching(true);
        demarketService.importListingFromIpfs(cid)
            .then(listing => {
                if (listing) {
                    setPreloadedDeepLinkListing(listing);
                }
            })
            .catch(err => console.error("Background IPFS fetch failed:", err))
            .finally(() => setIsDeepLinkFetching(false));
    }
  }, []);

  // 🚀 INSTANT OPEN
  useEffect(() => {
    if (!isSplashLoading && !isDeepLinkFetching && !hasHandledDeepLink.current) {
        if (preloadedDeepLinkListing) {
            hasHandledDeepLink.current = true;
            handleListingClick(preloadedDeepLinkListing);
        } else {
            const params = new URLSearchParams(window.location.search);
            const listingId = params.get('listing');
            
            if (listingId) {
                hasHandledDeepLink.current = true;
                demarketService.getListingById(listingId).then(listing => {
                    if (listing) handleListingClick(listing);
                    else window.history.replaceState({}, document.title, window.location.pathname);
                });
            }
        }
    }
  }, [isSplashLoading, isDeepLinkFetching, preloadedDeepLinkListing, handleListingClick]);


  useEffect(() => {
    if (isConnected && !user?.location) {
      showModal(<LocationSetupSheet />);
    }
  }, [isConnected, user, showModal]);
  
  const handleOpenBoostSheetFromProfile = (listing: Listing) => {
    setListingToBoost(listing);
    setActiveListingForModal(listing);
    showModal(<BoostListingSheet listing={listing} onConfirm={handleBoostConfirmed} />);
  };

  useEffect(() => {
    if (badgeToMint) {
      showModal(<MintBadgeSheet onMint={handleMintBadge} badge={badgeToMint} />);
    }
  }, [badgeToMint, showModal, handleMintBadge]);

  const handleNavigateRequest = useCallback((screen: React.ReactNode) => {
    pushScreen(screen);
  }, [pushScreen]);
  
  // Derived State for Profile View - Re-calculates when listings change
  const userPurchases = useMemo(() => 
    listings.filter(l => l.buyer?.address.toLowerCase() === user?.address.toLowerCase()), 
    [listings, user, forceUpdateCounter]
  );

  const userSales = useMemo(() => 
    listings.filter(l => 
      l.seller.address.toLowerCase() === user?.address.toLowerCase() && 
      (l.status === 'In Escrow' || l.status === 'Sold')
    ), 
    [listings, user, forceUpdateCounter]
  );

  const userListings = useMemo(() => 
    listings.filter(l => l.seller.address.toLowerCase() === user?.address.toLowerCase()), 
    [listings, user, forceUpdateCounter]
  );

  const userReviews = useMemo(() => 
    reviews.filter(r => listings.find(l => l.id === r.listingId)?.seller.address.toLowerCase() === user?.address.toLowerCase()), 
    [reviews, listings, user, forceUpdateCounter]
  );

  const handleTabChange = (tab: Tab) => {
    if (!isConnected) {
      if (tab === 'create' || tab === 'chats' || tab === 'profile' || tab === 'catalog') {
        if (tab === 'create') setPendingAction({ type: 'create_listing' });
        showModal(<ConnectWalletSheet />);
        return;
      }
    } else if (!user?.location) {
      if (tab === 'create') setPendingAction({ type: 'create_listing' });
      showModal(<LocationSetupSheet />);
      return;
    }

    if (tab === 'create') {
      if(user.location){
        showModal(<CreateListingModal userLocation={user.location} onSave={handleSaveListing} listingToEdit={listingToEdit} />);
      }
    } else if (tab === activeTab) {
      if (screenStacks[tab].length > 0) {
        setScreenStacks(prev => ({ ...prev, [tab]: [] }));
        setTimeout(forceUpdate, 10);
      }
    } else {
      setActiveTab(tab);
    }
  };
  
  const totalUnreadCount = useMemo(() => {
    const unreadChats = 0;
    const unreadDisputes = disputes.reduce((sum, dispute) => sum + dispute.unread, 0);
    return unreadChats + unreadDisputes;
  }, [disputes]);

  const isAppActuallyLoading = isSplashLoading;

  const handleCancelDeepLinkSearch = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsDeepLinkFetching(false);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {isAppActuallyLoading && <SplashScreen onLoadingComplete={handleLoadingComplete} />}
      
      {isDeepLinkFetching && !isSplashLoading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="flex flex-col items-center space-y-5 p-8 rounded-3xl bg-gray-900/80 border border-white/10 shadow-2xl max-w-xs w-full">
             <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
                <SpinnerIcon className="w-12 h-12 text-cyan-400 relative z-10" />
             </div>
             <div className="text-center space-y-2">
               <h3 className="text-xl font-bold text-white">Поиск объявления...</h3>
               <p className="text-sm text-gray-400 leading-relaxed">
                 Загружаем данные из IPFS и блокчейна
               </p>
             </div>
             <button 
                onClick={handleCancelDeepLinkSearch}
                className="mt-2 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10"
             >
                Отмена
             </button>
          </div>
        </div>
      )}
      
      <div className="relative w-full h-full flex flex-col">
        <div 
          className={`main-content flex-1 min-h-0 ${isScreenPushed ? 'main-content--pushed' : ''}`} 
          style={isScreenPushed && screenStackDepth === 1 && isDragging ? underlyingStyle : {}}
        >
          <main className="w-full h-full overflow-hidden">
            {isListingsLoading ? (
              <div className="flex items-center justify-center w-full h-full"><SpinnerIcon className="w-10 h-10 text-cyan-400" /></div>
            ) : (
              <>
                <div className={activeTab === 'home' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <HomeScreen 
                    listings={listings} 
                    users={users}
                    onListingClick={handleListingClick} 
                    onSellerClick={handleViewSellerProfile}
                    userCity={user?.location?.city} 
                    favorites={favorites} 
                    onToggleFavorite={handleToggleFavorite} 
                    onEditLocation={() => showModal(<LocationSetupSheet />)} 
                  />
                </div>
                <div className={activeTab === 'catalog' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <CatalogScreen onNavigateRequest={handleNavigateRequest} listings={listings} onListingClick={handleListingClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} onBack={popScreen} />
                </div>
                <div className={activeTab === 'profile' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <ProfileScreen 
                    onNavigateRequest={handleNavigateRequest} 
                    showModal={showModal} 
                    hideModal={hideModal} 
                    userListings={userListings} 
                    userPurchases={userPurchases} 
                    userSales={userSales} 
                    userReviews={userReviews} 
                    onEditLocation={() => showModal(<LocationSetupSheet />)} 
                    onEditListing={handleSelectListingToEdit} 
                    onBoostListing={handleOpenBoostSheetFromProfile} 
                    allListings={listings} 
                    favorites={favorites} 
                    favoritesCount={favorites.length}
                    onListingClick={handleListingClick} 
                    onToggleFavorite={handleToggleFavorite} 
                    disputes={disputes} 
                    onStartChat={handleStartChat} 
                    onDisputeClick={handleDisputeClick} 
                    onArchiveListing={handleArchiveListing} 
                    onRestoreListing={handleRestoreListing} 
                    onBack={popScreen}
                  />
                </div>
                <div className={activeTab === 'chats' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <ChatsScreen chats={chats} disputes={disputes} onDisputeClick={handleDisputeClick} onChatClick={(chat) => pushScreen(<ChatDetailScreen chat={chat} onBack={popScreen} />)} />
                </div>
              </>
            )}
          </main>
        </div>
        
        <div className="pushed-screen-stack">
          {currentStack.map((screen, index) => {
            const isTop = index === screenStackDepth - 1;
            const isSecond = index === screenStackDepth - 2;
            let screenClass = 'pushed-screen-wrapper';
            
            if (isTop) {
              screenClass += ' pushed-screen-wrapper--top';
              if (isDragging) screenClass += ' pushed-screen-wrapper--dragging';
            } else if (isSecond) {
              screenClass += ' pushed-screen-wrapper--second';
            } else {
              screenClass += ' pushed-screen-wrapper--hidden';
            }

            let style: React.CSSProperties = {};
            
            if (isTop) {
              style = isDragging ? pushedStyle : {};
            } else if (isSecond && isDragging) {
              style = underlyingStyle;
            }

            return (
              <div 
                key={screen.id}
                className={screenClass}
                style={style}
                {...(isTop ? dragHandlers : {})}
              >
                {isTop && <SwipeBackShadow progress={dragProgress} />}
                <div className="w-full h-full bg-black overflow-hidden">
                  {screen.content}
                </div>
              </div>
            );
          })}
        </div>

        {!isScreenPushed && (
          <TabBar activeTab={activeTab} onTabChange={handleTabChange}>
            <TabBar.Item id="home" label="Главная" icon={<TbSmartHome size={24} />} />
            <TabBar.Item id="catalog" label="Каталог" icon={<TbLayoutGrid size={24} />} />
            <TabBar.Item id="create" label="Создать" icon={<TbPlus size={30} />} isAction />
            <TabBar.Item id="chats" label="Чаты" icon={<TbMessageCircle size={24} />} badge={totalUnreadCount > 0 ? totalUnreadCount : undefined} />
            <TabBar.Item id="profile" label="Профиль" icon={<TbUserCircle size={24} />} />
          </TabBar>
        )}
        
        <Toast message={toast.message} type={toast.type} show={toast.show} />
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <WalletProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </WalletProvider>
  </ErrorBoundary>
);

export default App;
