

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HomeScreen } from './components/screens/HomeScreen';
// FIX: Corrected import paths for FavoritesScreen and FaqScreen. They are now imported from their own files, not from ProfileScreen. Also removed other unused screen imports.
// FIX: WalletScreen and SettingsScreen are now correctly defined and exported from ProfileScreen.tsx.
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
import { PlusCircleIcon, UserCircleIcon, TelegramIcon, HomeIcon, Squares2X2Icon } from './components/icons/Icons';
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
import { WalletProvider, useWallet } from './hooks/useWallet';
import { useSwipeBack, SwipeBackShadow, SwipeProgressIndicator } from './hooks/useSwipeBack';
import { ModalProvider, useModal } from './hooks/useModal';
import { Listing, User, Chat, Dispute, Review, Badge } from './types';
import { mockChats, mockDisputes, mockReviews } from './services/mockData';
import { demarketService } from './services/demarketService';
import { Toast, ToastType } from './components/shared/Toast';
import { SpinnerIcon } from './components/icons/Icons';
import { useSplashScreen } from './hooks/useSplashScreen';
import { SplashScreen } from './components/SplashScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { FaqScreen } from './components/screens/FaqScreen';

const MIN_STAKE_FOR_REPORT = 100;

type ScreenStack = { id: string, content: React.ReactNode }[];

const AppContent: React.FC = () => {
  const { isConnected, isLoading, user, lockStake, spendDmt, awardBadge, badgeToMint, confirmMintedBadge, cancelBadgeMint, error, clearError } = useWallet();
  const { showModal, hideModal, isModalOpen } = useModal();
  const { isLoading: isAppLoading, handleLoadingComplete } = useSplashScreen();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  // --- New Unified Screen Navigation State (Stack-based per tab) ---
  const [screenStacks, setScreenStacks] = useState<Record<Tab, ScreenStack>>({
    home: [], catalog: [], create: [], chats: [], profile: []
  });
  
  // State for which listing is active for modals (Pay, Report, etc.)
  const [activeListingForModal, setActiveListingForModal] = useState<Listing | null>(null);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);
  const [listingToReview, setListingToReview] = useState<Listing | null>(null);
  const [toast, setToast] = useState({ message: '', show: false, type: 'success' as ToastType });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [listingToBoost, setListingToBoost] = useState<Listing | null>(null);
  
  const fetchListings = useCallback(async () => {
    setIsListingsLoading(true);
    const fetchedListings = await demarketService.getListings();
    setListings(fetchedListings);
    setIsListingsLoading(false);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);
  
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, show: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  // NEW: Global error handler for wallet-related issues
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError(); // Clear error after showing it
    }
  }, [error, showToast, clearError]);


  // NEW: Effect for cleaning up state when any modal is closed.
  useEffect(() => {
    if (!isModalOpen) {
      setActiveListingForModal(null);
      setListingToEdit(null);
      setListingToReview(null);
      setListingToBoost(null);
      // Cancel badge minting if the modal was closed without confirming
      if (badgeToMint) {
        cancelBadgeMint();
      }
    }
  }, [isModalOpen, cancelBadgeMint, badgeToMint]);


  const handleArchiveListing = useCallback((listingId: string) => {
      setListings(prevListings =>
          prevListings.map(l =>
              l.id === listingId ? { ...l, status: 'Archived' } : l
          )
      );
      showToast('Объявление перемещено в архив.', 'info');
  }, [showToast]);

  const handleRestoreListing = useCallback((listingId: string) => {
      setListings(prevListings =>
          prevListings.map(l =>
              l.id === listingId ? { ...l, status: 'Available' } : l
          )
      );
      showToast('Объявление восстановлено.', 'success');
  }, [showToast]);

  // --- Unified Per-Tab Pushed Screen Navigation Logic ---
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
      const newStack = currentStack.slice(0, -1);
       if (newStack.length === 0 && window.location.search.includes('listing=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
      }
      return { ...prev, [activeTab]: newStack };
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
  } = useSwipeBack({ onSwipeBack: popScreen, enabled: isScreenPushed, swipeThreshold: 0.4 });
  
  const handleSaveListing = async (listingData: Omit<Listing, 'seller' | 'status' | 'buyer'> & { id?: string }) => {
    if (!user) return;
    hideModal();
    if (listingData.id) {
      await demarketService.updateListing(listingData as Omit<Listing, 'seller' | 'status' | 'buyer'> & { id: string });
      showToast('Объявление успешно обновлено!');
    } else {
      await demarketService.createListing(listingData, user);
      showToast('Объявление успешно создано!');
    }
    await fetchListings();
  };
  
  const handlePurchaseConfirmed = (listing: Listing, purchasedQuantity: number) => {
    if (!listing || !user) return;
    hideModal();
    
    const updatedListings = listings.map(l => {
        if (l.id === listing.id) {
            return { 
                ...l, 
                quantity: l.quantity - purchasedQuantity,
                status: 'In Escrow' as const,
                buyer: user,
            };
        }
        return l;
    });
    setListings(updatedListings);

    const updatedSelectedListing = updatedListings.find(l => l.id === listing.id);
    if (updatedSelectedListing) {
      setActiveListingForModal(updatedSelectedListing);
      
      setScreenStacks(prev => {
        const newStack = [...(prev[activeTab] || [])];
        if (newStack.length > 0) {
            const viewDisputeHandler = () => {
                const disputeToView = disputes.find(d => d.listing.id === updatedSelectedListing.id);
                if (disputeToView) {
                  pushScreen(<DisputeScreen dispute={disputeToView} onBack={popScreen} />);
                }
            };
            newStack[newStack.length - 1].content = (
                 <ItemScreen 
                    listing={updatedSelectedListing} 
                    onBack={popScreen}
                    onBuyNow={handleBuyNow} 
                    onWrite={handleStartChat}
                    onConfirmReceipt={handleConfirmReceipt}
                    onReportIssue={handleReportIssue}
                    onOpenDispute={handleOpenDispute}
                    onViewDispute={viewDisputeHandler}
                    onViewSellerProfile={handleViewSellerProfile}
                    onBoost={() => showModal(<BoostListingSheet listing={updatedSelectedListing} onConfirm={handleBoostConfirmed} />)}
                    onEdit={handleSelectListingToEdit}
                    isDisputed={disputes.some(d => d.listing.id === updatedSelectedListing.id)}
                    showToast={showToast}
                />
            );
        }
        return { ...prev, [activeTab]: newStack };
      });
    }
    
    const userPurchases = listings.filter(l => l.buyer?.address === user.address);
    if (userPurchases.length === 0) {
        awardBadge({ id: 'badge-first-purchase', name: 'Первая покупка', description: 'Совершил свою первую сделку в качестве покупателя.', icon: 'first-purchase', condition: 'Совершите 1 покупку', perks: ['+50 GVT (Сила голоса в DAO)', 'Доступ к разделу "Отзывы"'] });
    }

    setTimeout(() => showToast('Сделка успешно создана!'), 300);
  };
  
  const handleReviewSubmitted = (review: Omit<Review, 'id'>) => {
    const newReview = { ...review, id: `review-${Date.now()}` };
  
    setReviews(prevReviews => {
      const updatedReviews = [newReview, ...prevReviews];
  
      setListings(prevListings => {
        return prevListings.map(l => {
          if (l.seller.address === listingToReview?.seller.address) {
            const sellerReviews = updatedReviews.filter(r => {
              const reviewedListing = prevListings.find(li => li.id === r.listingId);
              return reviewedListing && reviewedListing.seller.address === l.seller.address;
            });
  
            const totalRating = sellerReviews.reduce((acc, r) => acc + r.rating, 0);
            const newAverage = sellerReviews.length > 0 ? totalRating / sellerReviews.length : 0;
            
            if (sellerReviews.length >= 25 && newAverage > 96 && !l.seller.badges.some(b => b.id === 'badge-top-seller')) {
                showToast(`Продавец ${l.seller.username} получил бадж "Топ-продавец"!`, 'info');
            }
  
            return {
              ...l,
              seller: { ...l.seller, rating: newAverage, reviews: sellerReviews.length }
            };
          }
          return l;
        });
      });
      return updatedReviews;
    });
  
    hideModal();
    showToast('Спасибо за ваш отзыв!');
  };

  const handleReceiptConfirmed = (listing: Listing) => {
    if (!listing || !user) return;
    hideModal();

    const updatedListings = listings.map(l => {
        if (l.id === listing.id) {
            return { ...l, status: 'Sold' as const };
        }
        return l;
    });
    setListings(updatedListings);
    setDisputes(prev => prev.filter(d => d.listing.id !== listing.id));

    const updatedSelectedListing = updatedListings.find(l => l.id === listing.id);
    if (updatedSelectedListing) {
        setActiveListingForModal(updatedSelectedListing);
        setListingToReview(updatedSelectedListing);
        showModal(<LeaveReviewSheet listing={updatedSelectedListing} user={user} onSubmit={handleReviewSubmitted} />);
        
        setScreenStacks(prev => {
            const newStack = [...(prev[activeTab] || [])];
            if (newStack.length > 0) {
                const viewDisputeHandler = () => {
                    const disputeToView = disputes.find(d => d.listing.id === updatedSelectedListing.id);
                    if (disputeToView) {
                      pushScreen(<DisputeScreen dispute={disputeToView} onBack={popScreen} />);
                    }
                };
                newStack[newStack.length - 1].content = (
                    <ItemScreen 
                        listing={updatedSelectedListing} 
                        onBack={popScreen}
                        onBuyNow={handleBuyNow} 
                        onWrite={handleStartChat}
                        onConfirmReceipt={handleConfirmReceipt}
                        onReportIssue={handleReportIssue}
                        onOpenDispute={handleOpenDispute}
                        onViewDispute={viewDisputeHandler}
                        onViewSellerProfile={handleViewSellerProfile}
                        onBoost={() => showModal(<BoostListingSheet listing={updatedSelectedListing} onConfirm={handleBoostConfirmed} />)}
                        onEdit={handleSelectListingToEdit}
                        isDisputed={disputes.some(d => d.listing.id === updatedSelectedListing.id)}
                        showToast={showToast}
                    />
                );
            }
            return { ...prev, [activeTab]: newStack };
        });
    }

    setTimeout(() => showToast('Получение подтверждено! Сделка завершена.'), 300);
  };
  
  const handleReportConfirmed = () => {
    lockStake(MIN_STAKE_FOR_REPORT);
    hideModal();
    setTimeout(() => showToast('Спасибо! Ваша жалоба отправлена.'), 300);
  };
  
  const handleDisputeInitiated = (listing: Listing) => {
    if (!listing) return;
    hideModal();

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
    
    const viewThisDispute = () => {
        pushScreen(<DisputeScreen dispute={newDispute} onBack={popScreen} />);
    };
    
    setScreenStacks(prev => {
        const newStack = [...(prev[activeTab] || [])];
        if (newStack.length > 0) {
            newStack[newStack.length - 1] = {
                ...newStack[newStack.length - 1],
                content: (
                     <ItemScreen 
                        listing={listing} 
                        onBack={popScreen}
                        onBuyNow={handleBuyNow} 
                        onWrite={handleStartChat}
                        onConfirmReceipt={handleConfirmReceipt}
                        onReportIssue={handleReportIssue}
                        onOpenDispute={handleOpenDispute}
                        onViewDispute={viewThisDispute}
                        onViewSellerProfile={handleViewSellerProfile}
                        onBoost={() => showModal(<BoostListingSheet listing={listing} onConfirm={handleBoostConfirmed} />)}
                        onEdit={handleSelectListingToEdit}
                        isDisputed={true}
                        showToast={showToast}
                    />
                )
            };
        }
        return {
            ...prev,
            [activeTab]: [...newStack, { id: `dispute-screen-${newDispute.id}`, content: <DisputeScreen dispute={newDispute} onBack={popScreen} /> }]
        };
    });
  };

  const handleBoostConfirmed = (listingId: string, cost: number, durationDays: number) => {
    spendDmt(cost);
    setListings(prev => prev.map(l => {
        if (l.id === listingId) {
            const boostedUntil = new Date();
            boostedUntil.setDate(boostedUntil.getDate() + durationDays);
            return { ...l, boostedUntil: boostedUntil.toISOString() };
        }
        return l;
    }));
    hideModal();
    showToast(`Объявление успешно продвигается на ${durationDays} дней!`);
  };

  const handleMintBadge = async () => {
    showToast('🚀 Минтинг NFT-баджа...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    confirmMintedBadge();
    hideModal();
    showToast('✨ Бадж успешно добавлен в ваш профиль!');
  };

  // --- Stabilized Navigation Handlers ---

  const handleBuyNow = useCallback((listing: Listing) => {
    if (!isConnected) return showModal(<ConnectWalletSheet />);
    if (!user?.location) return showModal(<LocationSetupSheet />);
    setActiveListingForModal(listing);
    showModal(<EscrowPaySheet listing={listing} onConfirm={(purchasedQuantity) => handlePurchaseConfirmed(listing, purchasedQuantity)} />);
  }, [isConnected, user, showModal]);

  const handleConfirmReceipt = useCallback((listing: Listing) => {
    if (!isConnected) return showModal(<ConnectWalletSheet />);
    if (!user?.location) return showModal(<LocationSetupSheet />);
    setActiveListingForModal(listing);
    showModal(<ConfirmReceiptSheet listing={listing} onConfirm={() => handleReceiptConfirmed(listing)} />);
  }, [isConnected, user, showModal]);

  const handleReportIssue = useCallback((listing: Listing) => {
    if (!isConnected) return showModal(<ConnectWalletSheet />);
    if (!user?.location) return showModal(<LocationSetupSheet />);
    if (!user || user.stake < MIN_STAKE_FOR_REPORT) {
        showToast(`Необходимо внести стейк (мин. ${MIN_STAKE_FOR_REPORT} $DMT) для подачи жалоб.`, 'warning');
        return;
    }
    if (user.stake - user.lockedStake < MIN_STAKE_FOR_REPORT) {
        showToast(`Недостаточно свободных средств в стейке для подачи жалобы.`, 'warning');
        return;
    }
    setActiveListingForModal(listing);
    showModal(<ReportIssueSheet listing={listing} onConfirm={handleReportConfirmed} />);
  }, [isConnected, user, showToast, showModal]);
  
  const handleOpenDispute = useCallback((listing: Listing) => {
    if (!isConnected) return showModal(<ConnectWalletSheet />);
    if (!user?.location) return showModal(<LocationSetupSheet />);
    setActiveListingForModal(listing);
    showModal(<DisputeSheet listing={listing} onConfirm={() => handleDisputeInitiated(listing)} />);
  }, [isConnected, user, showModal]);

  const handleStartChat = useCallback((seller: User) => {
    if (!isConnected) return showModal(<ConnectWalletSheet />);
    if (!user?.location) return showModal(<LocationSetupSheet />);
    let chat = mockChats.find(c => c.user.address === seller.address) || {
        id: `chat-${Date.now()}`, user: seller, lastMessage: 'Начните разговор...', timestamp: '', unread: 0, messages: []
    };
    pushScreen(<ChatDetailScreen chat={chat} onBack={popScreen} />);
  }, [isConnected, user, pushScreen, popScreen, showModal]);
  
  const handleToggleFavorite = (listingId: string) => {
    if (!isConnected) return showModal(<ConnectWalletSheet />);
    setFavorites(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectListingToEdit = (listing: Listing) => {
    if (!user?.location) return;
    setListingToEdit(listing);
    showModal(<CreateListingModal userLocation={user.location} onSave={handleSaveListing} listingToEdit={listing} />);
  };

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
  }, [listings, reviews, pushScreen, popScreen, handleToggleFavorite, favorites]);

  const handleListingClick = useCallback((listing: Listing) => {
    if (!isConnected) {
        showModal(<ConnectWalletSheet />);
        return;
    }
    
    const isDisputed = disputes.some(d => d.listing.id === listing.id);
    
    const viewDisputeHandler = () => {
        const disputeToView = disputes.find(d => d.listing.id === listing.id);
        if (disputeToView) {
          pushScreen(<DisputeScreen dispute={disputeToView} onBack={popScreen} />);
        }
    };
    
    pushScreen(
      <ItemScreen 
        listing={listing} 
        onBack={popScreen}
        onBuyNow={handleBuyNow} 
        onWrite={handleStartChat}
        onConfirmReceipt={handleConfirmReceipt}
        onReportIssue={handleReportIssue}
        onOpenDispute={handleOpenDispute}
        onViewDispute={viewDisputeHandler}
        onViewSellerProfile={handleViewSellerProfile}
        onBoost={() => showModal(<BoostListingSheet listing={listing} onConfirm={handleBoostConfirmed} />)}
        onEdit={handleSelectListingToEdit}
        isDisputed={isDisputed}
        showToast={showToast}
      />
    );
  }, [isConnected, disputes, popScreen, handleBuyNow, handleStartChat, handleConfirmReceipt, handleReportIssue, handleOpenDispute, pushScreen, showToast, handleViewSellerProfile, showModal]);
  
  // FIX: Added the missing 'handleDisputeClick' function to handle navigation to the dispute screen.
  const handleDisputeClick = useCallback((dispute: Dispute) => {
    pushScreen(<DisputeScreen dispute={dispute} onBack={popScreen} />);
  }, [pushScreen, popScreen]);

  // Handle deep linking on initial load
  useEffect(() => {
    const handleDeepLink = async () => {
        const params = new URLSearchParams(window.location.search);
        const listingId = params.get('listing');
        if (listingId) {
            if (!isLoading) {
                const listing = await demarketService.getListingById(listingId);
                if (listing) {
                    handleListingClick(listing);
                } else {
                    showToast(`Объявление с ID ${listingId} не найдено.`, 'error');
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        }
    };
    handleDeepLink();
  }, [isLoading, handleListingClick, showToast]);

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

  const renderTabsContent = () => {
    if (isListingsLoading) {
        return <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-10 h-10 text-cyan-400" /></div>;
    }
    
    const userPurchases = listings.filter(l => l.buyer?.address === user?.address && (l.status === 'In Escrow' || l.status === 'Sold'));
    const userSales = listings.filter(l => l.seller.address === user?.address && (l.status === 'In Escrow' || l.status === 'Sold'));
    const userListings = listings.filter(l => l.seller.address === user?.address);
    const userReviews = reviews.filter(r => listings.find(l => l.id === r.listingId)?.seller.address === user?.address);

    switch (activeTab) {
      case 'home':
        return <HomeScreen listings={listings} onListingClick={handleListingClick} userCity={user?.location?.city} favorites={favorites} onToggleFavorite={handleToggleFavorite} onEditLocation={() => showModal(<LocationSetupSheet />)} />;
      case 'catalog':
        return <CatalogScreen onNavigateRequest={handleNavigateRequest} listings={listings} onListingClick={handleListingClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} onBack={popScreen} />;
      case 'profile':
        return <ProfileScreen onNavigateRequest={handleNavigateRequest} showModal={showModal} hideModal={hideModal} userListings={userListings} userPurchases={userPurchases} userSales={userSales} userReviews={userReviews} onEditLocation={() => showModal(<LocationSetupSheet />)} onEditListing={handleSelectListingToEdit} onBoostListing={handleOpenBoostSheetFromProfile} allListings={listings} favorites={favorites} onListingClick={handleListingClick} onToggleFavorite={handleToggleFavorite} disputes={disputes} onStartChat={handleStartChat} onDisputeClick={handleDisputeClick} onArchiveListing={handleArchiveListing} onRestoreListing={handleRestoreListing} onBack={popScreen}/>;
      case 'chats':
        return <ChatsScreen chats={mockChats} disputes={disputes} onDisputeClick={handleDisputeClick} onChatClick={(chat) => pushScreen(<ChatDetailScreen chat={chat} onBack={popScreen} />)} />;
      default:
        return <HomeScreen listings={listings} onListingClick={handleListingClick} userCity={user?.location?.city} favorites={favorites} onToggleFavorite={handleToggleFavorite} onEditLocation={() => showModal(<LocationSetupSheet />)} />;
    }
  };
  
  const handleTabChange = (tab: Tab) => {
    if (!isConnected) {
        if (tab === 'create' || tab === 'chats' || tab === 'profile' || tab === 'catalog') {
            showModal(<ConnectWalletSheet />);
            return;
        }
    } else if (!user?.location) {
        showModal(<LocationSetupSheet />);
        return;
    }

    if (tab === 'create') {
      if(user.location){
        showModal(<CreateListingModal userLocation={user.location} onSave={handleSaveListing} listingToEdit={listingToEdit} />);
      }
    } else if (tab === activeTab) {
      // If on the same tab, pop to root
      if (screenStacks[tab].length > 0) {
        setScreenStacks(prev => ({ ...prev, [tab]: [] }));
      }
    } else {
      setActiveTab(tab);
    }
  };
  
  const totalUnreadCount = useMemo(() => {
    const unreadChats = mockChats.reduce((sum, chat) => sum + chat.unread, 0);
    const unreadDisputes = disputes.reduce((sum, dispute) => sum + dispute.unread, 0);
    return unreadChats + unreadDisputes;
  }, [disputes]);

  return (
      <div className="h-full w-full font-sans antialiased bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
        {isAppLoading && <SplashScreen onLoadingComplete={handleLoadingComplete} />}
        
        <div className="relative h-full flex flex-col overflow-hidden">
          
          <div 
            className={`main-content h-full ${isScreenPushed ? 'main-content--pushed' : ''}`} 
            style={isScreenPushed && screenStackDepth === 1 ? underlyingStyle : {}}
          >
            <main className="flex-1 overflow-y-auto h-full scroll-pb-28">
              {renderTabsContent()}
            </main>
          </div>
          
          <div className="pushed-screen-stack">
            {currentStack.map((screen, index) => {
                const isTop = index === screenStackDepth - 1;
                const isSecond = index === screenStackDepth - 2;
                
                let screenClass = 'pushed-screen-wrapper';
                
                if (isTop) {
                    screenClass += ' pushed-screen-wrapper--top';
                    if (isDragging) {
                        screenClass += ' pushed-screen-wrapper--dragging';
                    }
                } else if (isSecond) {
                    screenClass += ' pushed-screen-wrapper--second';
                } else {
                    screenClass += ' pushed-screen-wrapper--hidden';
                }

                let style: React.CSSProperties = {};
                // CRITICAL FIX: Inline styles from the swipe hook are now ONLY applied when the user is actively dragging.
                // This prevents them from overriding the CSS class-based "slide-in" animation for new screens,
                // solving the "half-open screen" bug globally.
                if (isTop && isDragging) {
                    style = pushedStyle;
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
                        {isTop && <SwipeProgressIndicator progress={dragProgress} />}
                        <div className="w-full h-full bg-black">
                            {screen.content}
                        </div>
                     </div>
                );
            })}
          </div>

          {!isScreenPushed && (
            <TabBar activeTab={activeTab} onTabChange={handleTabChange}>
              <TabBar.Item id="home" label="Главная" icon={<HomeIcon />} />
              <TabBar.Item id="catalog" label="Каталог" icon={<Squares2X2Icon />} />
              <TabBar.Item id="create" label="Создать" icon={<PlusCircleIcon />} isAction />
              <TabBar.Item id="chats" label="Чаты" icon={<TelegramIcon />} badge={totalUnreadCount} />
              <TabBar.Item id="profile" label="Профиль" icon={<UserCircleIcon />} />
            </TabBar>
          )}
          
          <Toast message={toast.message} type={toast.type} show={toast.show} />

        </div>
      </div>
  );
};

const App: React.FC = () => (
  <WalletProvider>
    <ModalProvider>
      <AppContent />
    </ModalProvider>
  </WalletProvider>
);

export default App;