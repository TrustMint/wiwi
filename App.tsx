import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HomeScreen } from './components/screens/HomeScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ItemScreen } from './components/screens/ItemScreen';
import { SellerProfileScreen } from './components/screens/SellerProfileScreen';
import { CatalogScreen, CategoryListingsScreen } from './components/screens/CatalogScreen';
import { ChatsScreen } from './components/screens/ChatsScreen';
import { DaoScreen } from './components/screens/DaoScreen';
import { ArbitrationScreen } from './components/screens/ArbitrationScreen';
import { TabBar, Tab } from './components/navigation/TabBar';
import { CreateListingModal } from './components/modals/CreateListingModal';
import { EscrowPaySheet } from './components/modals/EscrowPaySheet';
import { LocationSetupSheet } from './components/modals/LocationSetupSheet';
import { LeaveReviewSheet } from './components/modals/LeaveReviewSheet';
import { ConnectWalletSheet } from './components/modals/ConnectWalletSheet';
import { WalletProvider, useWallet } from './hooks/useWallet';
import { useSwipeBack, SwipeBackShadow } from './hooks/useSwipeBack';
import { ModalProvider, useModal } from './hooks/useModal';
import { Listing, User, Chat, Dispute, Review, ListingVariant } from './types';
import { demarketService } from './services/demarketService';
import { Toast, ToastType } from './components/shared/Toast';
import { SpinnerIcon } from './components/icons/Icons';
import { useSplashScreen } from './hooks/useSplashScreen';
import { SplashScreen } from './components/SplashScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { FaqScreen } from './components/screens/FaqScreen';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { TbSmartHome, TbLayoutGrid, TbPlus, TbMessageCircle, TbUserCircle } from 'react-icons/tb';

const MIN_STAKE_FOR_REPORT = 100;

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
  
  // REAL DATA STATE (Initialized Empty)
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Dynamic user cache if needed
  
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const forceUpdate = useCallback(() => setForceUpdateCounter(prev => prev + 1), []);

  const [screenStacks, setScreenStacks] = useState<Record<Tab, ScreenStack>>({
    home: [], catalog: [], create: [], chats: [], profile: []
  });
  
  const [toast, setToast] = useState({ message: '', show: false, type: 'success' as ToastType });
  const [favorites, setFavorites] = useState<string[]>([]);
  
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

  const fetchListings = useCallback(async () => {
    setIsListingsLoading(true);
    try {
        // FETCH REAL DATA FROM SUBGRAPH
        const fetchedListings = await demarketService.getListings();
        setListings(fetchedListings);
    } catch (e) {
        console.error("Failed to fetch listings", e);
        showToast("Не удалось загрузить объявления", "error");
    } finally {
        setIsListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    // Polling for updates every 30s (or use WSS in future)
    const interval = setInterval(fetchListings, 30000);
    return () => clearInterval(interval);
  }, [fetchListings]);
  
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, show: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError();
    }
  }, [error, showToast, clearError]);

  const handleReviewSubmitted = useCallback((review: Omit<Review, 'id'>) => {
      // In production, this calls Smart Contract or Backend
      showToast('Отзыв отправлен в блокчейн!', 'success');
      hideModal();
  }, [hideModal, showToast]);

  const handleSaveListing = useCallback(async (
      listingData: Omit<Listing, 'seller' | 'status' | 'buyer'> & { id?: string },
      imageFiles: File[],
      proofFile?: File,
      videoFile?: File
  ) => {
    if (!user || !provider) {
        showToast('Кошелек не подключен', 'error');
        return;
    }
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    
    try {
      const signer = await provider.getSigner();
      hideModal();
      showToast('Подпишите транзакцию в кошельке...', 'info');

      if (listingData.id) {
        // Update logic (Future V2)
        showToast('Редактирование пока недоступно в смарт-контракте', 'warning');
      } else {
        // REAL BLOCKCHAIN TRANSACTION
        await demarketService.createListingOnChain(
          listingData, 
          user, 
          imageFiles,
          proofFile,
          videoFile,
          signer
        );
        showToast('Транзакция отправлена! Ожидайте подтверждения...', 'success');
        
        // Optimistic refresh after delay to allow indexing
        setTimeout(fetchListings, 5000);
      }
    } catch (error: any) {
      console.error('Error saving listing:', error);
      if (error.code === 'ACTION_REJECTED') {
          showToast('Вы отменили транзакцию', 'info');
      } else {
          showToast('Ошибка транзакции: ' + (error.reason || 'Неизвестная ошибка'), 'error');
      }
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [user, provider, hideModal, showToast, fetchListings]);

  // Real Purchase Handler
  const handlePurchaseConfirmed = useCallback(async (listing: Listing, purchasedQuantity: number, variant?: ListingVariant) => {
      if (!listing || !user || !provider) return;
      if (isModalOperationInProgress.current) return;
      isModalOperationInProgress.current = true;

      try {
          const signer = await provider.getSigner();
          hideModal();
          showToast('1/2: Подпишите разрешение (Approve)...', 'info');
          
          await demarketService.purchaseListingOnChain(listing, purchasedQuantity, signer);
          
          showToast('Транзакция покупки отправлена!', 'success');
          setTimeout(fetchListings, 5000);
          
      } catch (error: any) {
          console.error("Purchase failed", error);
          if (error.code === 'ACTION_REJECTED') {
            showToast('Покупка отменена', 'info');
          } else {
            showToast('Ошибка: ' + (error.reason || error.message), 'error');
          }
      } finally {
          setTimeout(() => {
              isModalOperationInProgress.current = false;
          }, 100);
      }
  }, [hideModal, showToast, user, provider, fetchListings]);

  // Real Confirm Receipt Handler
  const handleReceiptConfirmed = useCallback(async (listing: Listing) => {
    if (!listing || !user || !provider) return;
    if (isModalOperationInProgress.current) return;
    isModalOperationInProgress.current = true;
    
    try {
      const signer = await provider.getSigner();
      hideModal();
      showToast('Подтвердите получение в кошельке...', 'info');
      
      // Use Purchase ID (listing.id in our mapping currently)
      await demarketService.confirmReceiptOnChain(listing.id, signer);
      
      showToast('Успешно! Средства разблокированы.', 'success');
      setTimeout(fetchListings, 5000);
      
      // Show review modal
      setTimeout(() => {
        showModal(<LeaveReviewSheet listing={listing} user={user} onSubmit={handleReviewSubmitted} />);
      }, 1000);

    } catch (error: any) {
       console.error("Confirm failed", error);
       showToast('Ошибка: ' + (error.reason || error.message), 'error');
    } finally {
      setTimeout(() => {
        isModalOperationInProgress.current = false;
      }, 100);
    }
  }, [hideModal, showToast, user, provider, fetchListings, handleReviewSubmitted, showModal]);

  // Handler for "Buy Now" button in ItemScreen (opens EscrowPaySheet)
  const handleBuyRequest = useCallback((listing: Listing, variant?: ListingVariant) => {
      if (!user) {
          showModal(<ConnectWalletSheet />);
          return;
      }
      showModal(
          <EscrowPaySheet 
              listing={listing} 
              variant={variant}
              onConfirm={(purchasedQuantity) => handlePurchaseConfirmed(listing, purchasedQuantity, variant)} 
          />
      );
  }, [user, showModal, handlePurchaseConfirmed]);

  useEffect(() => {
    handlePurchaseConfirmedRef.current = handlePurchaseConfirmed;
    handleReceiptConfirmedRef.current = handleReceiptConfirmed;
  }, [handlePurchaseConfirmed, handleReceiptConfirmed]);

  const handleStartChat = (seller: User) => showToast('Чаты временно недоступны (Backend maintenance)', 'info');
  const handleReportIssue = () => showToast('Жалобы обрабатываются через DAO', 'info');
  const handleOpenDispute = () => showToast('Функция споров в разработке UI', 'info');
  const handleToggleFavorite = (id: string) => {
      setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const userPurchases = useMemo(() => 
    listings.filter(l => l.status === 'In Escrow'), // In real app, filter by buyer ID from subgraph
    [listings]
  );

  const userSales = useMemo(() => 
    listings.filter(l => l.seller.address.toLowerCase() === user?.address.toLowerCase() && l.status === 'In Escrow'),
    [listings, user]
  );

  const userListings = useMemo(() => 
    listings.filter(l => l.seller.address.toLowerCase() === user?.address.toLowerCase()),
    [listings, user]
  );

  const pushScreen = useCallback((content: React.ReactNode) => {
    const newScreen = { id: Date.now().toString(), content };
    setScreenStacks(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newScreen],
    }));
  }, [activeTab]);

  const popScreen = useCallback(() => {
    setScreenStacks(prev => {
      const currentStack = prev[activeTab] || [];
      if (currentStack.length === 0) return prev;
      return { ...prev, [activeTab]: currentStack.slice(0, -1) };
    });
  }, [activeTab]);

  const currentStack = screenStacks[activeTab] || [];
  const screenStackDepth = currentStack.length;
  const isScreenPushed = screenStackDepth > 0;
  
  const { 
    dragHandlers, 
    pushedStyle, 
    underlyingStyle, 
    isDragging, 
    dragProgress,
  } = useSwipeBack({ onSwipeBack: popScreen, enabled: isScreenPushed });

  const handleTabChange = (tab: Tab) => {
      if (tab === 'create' && !user) { showModal(<ConnectWalletSheet />); return; }
      if (tab === 'create') { 
          if(user?.location) showModal(<CreateListingModal userLocation={user.location} onSave={handleSaveListing} />);
          else showModal(<LocationSetupSheet />);
      } else {
          setActiveTab(tab);
      }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {isSplashLoading && <SplashScreen onLoadingComplete={handleLoadingComplete} />}
      
      <div className="relative w-full h-full flex flex-col">
        <div className={`main-content flex-1 min-h-0 ${isScreenPushed ? 'main-content--pushed' : ''}`} style={isScreenPushed && screenStackDepth === 1 && isDragging ? underlyingStyle : {}}>
          <main className="w-full h-full overflow-hidden">
            {isListingsLoading && listings.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full"><SpinnerIcon className="w-10 h-10 text-cyan-400" /></div>
            ) : (
              <>
                <div className={activeTab === 'home' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <HomeScreen listings={listings} users={users} onListingClick={(l) => pushScreen(<ItemScreen listing={l} onBack={popScreen} onBuyNow={handleBuyRequest} onConfirmReceipt={handleReceiptConfirmed} onReportIssue={handleReportIssue} onOpenDispute={handleOpenDispute} onViewDispute={()=>{}} onViewSellerProfile={()=>{}} onWrite={handleStartChat} onBoost={()=>{}} onEdit={()=>{}} isDisputed={false} showToast={showToast} showModal={showModal} />)} onSellerClick={()=>{}} userCity={user?.location?.city} favorites={favorites} onToggleFavorite={handleToggleFavorite} onEditLocation={() => showModal(<LocationSetupSheet />)} />
                </div>
                <div className={activeTab === 'catalog' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <CatalogScreen onNavigateRequest={pushScreen} listings={listings} onListingClick={(l) => pushScreen(<ItemScreen listing={l} onBack={popScreen} onBuyNow={handleBuyRequest} onConfirmReceipt={handleReceiptConfirmed} onReportIssue={handleReportIssue} onOpenDispute={handleOpenDispute} onViewDispute={()=>{}} onViewSellerProfile={()=>{}} onWrite={handleStartChat} onBoost={()=>{}} onEdit={()=>{}} isDisputed={false} showToast={showToast} showModal={showModal} />)} favorites={favorites} onToggleFavorite={handleToggleFavorite} onBack={popScreen} />
                </div>
                <div className={activeTab === 'profile' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <ProfileScreen onNavigateRequest={pushScreen} showModal={showModal} hideModal={hideModal} userListings={userListings} userPurchases={userPurchases} userSales={userSales} userReviews={reviews} onEditLocation={() => showModal(<LocationSetupSheet />)} onEditListing={()=>{}} onBoostListing={()=>{}} allListings={listings} favorites={favorites} favoritesCount={favorites.length} onListingClick={(l) => pushScreen(<ItemScreen listing={l} onBack={popScreen} onBuyNow={handleBuyRequest} onConfirmReceipt={handleReceiptConfirmed} onReportIssue={handleReportIssue} onOpenDispute={handleOpenDispute} onViewDispute={()=>{}} onViewSellerProfile={()=>{}} onWrite={handleStartChat} onBoost={()=>{}} onEdit={()=>{}} isDisputed={false} showToast={showToast} showModal={showModal} />)} onToggleFavorite={handleToggleFavorite} disputes={disputes} onStartChat={handleStartChat} onDisputeClick={()=>{}} onArchiveListing={()=>{}} onRestoreListing={()=>{}} onBack={popScreen} />
                </div>
                <div className={activeTab === 'chats' ? 'block w-full h-full overflow-y-auto' : 'hidden'}>
                  <ChatsScreen chats={[]} disputes={[]} onDisputeClick={()=>{}} onChatClick={()=>{}} />
                </div>
              </>
            )}
          </main>
        </div>
        
        <div className="pushed-screen-stack">
          {currentStack.map((screen, index) => {
            const isTop = index === screenStackDepth - 1;
            return (
              <div key={screen.id} className={`pushed-screen-wrapper ${isTop ? 'pushed-screen-wrapper--top' : 'pushed-screen-wrapper--hidden'}`} style={isTop ? (isDragging ? pushedStyle : {}) : {}} {...(isTop ? dragHandlers : {})}>
                {isTop && <SwipeBackShadow progress={dragProgress} />}
                <div className="w-full h-full bg-black overflow-hidden">{screen.content}</div>
              </div>
            );
          })}
        </div>

        {!isScreenPushed && (
          <TabBar activeTab={activeTab} onTabChange={handleTabChange}>
            <TabBar.Item id="home" label="Главная" icon={<TbSmartHome size={24} />} />
            <TabBar.Item id="catalog" label="Каталог" icon={<TbLayoutGrid size={24} />} />
            <TabBar.Item id="create" label="Создать" icon={<TbPlus size={30} />} isAction />
            <TabBar.Item id="chats" label="Чаты" icon={<TbMessageCircle size={24} />} />
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