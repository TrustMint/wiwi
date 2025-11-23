
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Listing, User, ListingVariant } from '../../types';
import { GlassPanel } from '../shared/GlassPanel';
import { ChevronLeftIcon, ShareIcon, InformationCircleIcon, SparklesIcon, PlayCircleIcon, PencilSquareIcon, ReputationMedalIcon, ClipboardDocumentListIcon, XCircleIcon } from '../icons/Icons';
import { useWallet } from '../../hooks/useWallet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ToastType } from '../shared/Toast';
import { ImageViewer } from '../shared/ImageViewer';
import { ReputationInfoSheet } from '../modals/ReputationInfoSheet';
import { Avatar } from '../shared/Avatar';
import { EscrowPaySheet } from '../modals/EscrowPaySheet';
import { demarketService } from '../../services/demarketService';

interface ItemScreenProps {
  listing: Listing;
  onBack: () => void;
  onBuyNow: (listing: Listing, variant?: ListingVariant) => void;
  onWrite: (seller: User) => void;
  onViewSellerProfile: (seller: User) => void;
  onConfirmReceipt: (listing: Listing) => void;
  onReportIssue: (listing: Listing) => void;
  onOpenDispute: (listing: Listing) => void;
  onViewDispute: () => void;
  onBoost: () => void;
  onEdit: (listing: Listing) => void;
  isDisputed: boolean;
  showToast: (message: string, type?: ToastType) => void;
  showModal: (content: React.ReactNode) => void;
}

type MediaItem = { url: string; type: 'image' | 'video' };

// New Flag Icon for Report Action
const FlagIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
);

export const ItemScreen: React.FC<ItemScreenProps> = ({
  listing,
  onBack,
  onBuyNow,
  onWrite,
  onViewSellerProfile,
  onConfirmReceipt,
  onReportIssue,
  onOpenDispute,
  onViewDispute,
  onBoost,
  onEdit,
  isDisputed,
  showToast,
  showModal,
}) => {
  const { user, provider } = useWallet();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [isIdCopied, setIsIdCopied] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isCancelling, setIsCancelling] = useState(false);

  // Variant Selection State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ListingVariant | null>(null);

  const mainScrollRef = useRef<HTMLElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const actionPanelRef = useRef<HTMLDivElement>(null);
  const [actionPanelHeight, setActionPanelHeight] = useState(0);

  const media: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = [];
    if (listing.videoUrl) {
      items.push({ url: listing.videoUrl, type: 'video' });
    }
    (listing.images || []).forEach(img => items.push({ url: img, type: 'image' }));
    return items;
  }, [listing.images, listing.videoUrl]);

  const variantKeys = useMemo(() => {
      if (!listing.variants || listing.variants.length === 0) return [];
      return Object.keys(listing.variants[0].attributes);
  }, [listing.variants]);

  useEffect(() => {
      if (listing.variants && variantKeys.length > 0 && Object.keys(selectedOptions).length === variantKeys.length) {
          const match = listing.variants.find(v => {
              return variantKeys.every(key => v.attributes[key] === selectedOptions[key]);
          });
          setSelectedVariant(match || null);
      } else {
          setSelectedVariant(null);
      }
  }, [selectedOptions, listing.variants, variantKeys]);
  
  const displayPrice = selectedVariant ? selectedVariant.price : listing.price;
  const displayQuantity = selectedVariant ? selectedVariant.quantity : listing.quantity;
  const isMultiVariant = variantKeys.length > 0;

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const panel = entry.target as HTMLElement;
        if (panel.offsetHeight > 0 && window.getComputedStyle(panel).display !== 'none') {
            const panelHeight = panel.offsetHeight;
            const bottomOffset = 24; 
            setActionPanelHeight(panelHeight + bottomOffset);
        } else {
            setActionPanelHeight(0);
        }
      }
    });

    const panelElement = actionPanelRef.current;
    if (panelElement) {
      observer.observe(panelElement);
    }
    
    return () => {
      if (panelElement) {
        observer.unobserve(panelElement);
      }
    };
  }, []);

  // Explicit address check for ownership
  const isMyListing = user && listing.seller.address.toLowerCase() === user.address.toLowerCase();
  const isBoosted = listing.boostedUntil && new Date(listing.boostedUntil) > new Date();

  const handleImageScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
        if (imageContainerRef.current) {
            const { scrollLeft, clientWidth } = imageContainerRef.current;
            if (clientWidth > 0) {
                const newIndex = Math.round(scrollLeft / clientWidth);
                setCurrentImageIndex(newIndex);
            }
        }
    }, 150);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (imageContainerRef.current) {
        const { clientWidth } = imageContainerRef.current;
        imageContainerRef.current.scrollTo({
            left: index * clientWidth,
            behavior: 'smooth'
        });
    }
  }, []);

  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentImageIndex(index);
    if (window.innerWidth < 1024) {
      scrollToIndex(index);
    }
  }, [scrollToIndex]);

  const handleImageClick = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
  }, []);

  useEffect(() => {
    thumbnailRefs.current = thumbnailRefs.current.slice(0, media.length);
    if (thumbnailRefs.current[currentImageIndex]) {
        thumbnailRefs.current[currentImageIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        });
    }
  }, [currentImageIndex, media.length]);

  const handleImageError = useCallback((imageId: string) => {
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  }, []);

  const handleShare = useCallback(async () => {
    const deepLink = listing.ipfsCid 
        ? `${window.location.origin}/?cid=${listing.ipfsCid}`
        : `${window.location.origin}/?listing=${listing.id}`;

    const shareData = {
      title: listing.title,
      text: `Посмотрите это объявление на DeMarket: ${listing.title}`,
      url: deepLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Ссылка скопирована!', 'success');
      }
    } catch (error) {
      showToast('Не удалось скопировать ссылку', 'error');
    }
  }, [listing.id, listing.title, listing.ipfsCid, showToast]);

  const displayId = listing.ipfsCid || listing.id;

  const handleCopyId = useCallback(() => {
    if (isIdCopied) return;
    navigator.clipboard.writeText(displayId).then(() => {
        setIsIdCopied(true);
        setTimeout(() => {
          setIsIdCopied(false);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy ID: ', err);
        showToast('Не удалось скопировать ID', 'error');
    });
  }, [displayId, isIdCopied, showToast]);

  const handleBackClick = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleBackKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBackClick();
    }
  }, [handleBackClick]);

  const formattedDate = useMemo(() => 
    format(new Date(listing.createdAt), "d MMMM yyyy 'г.'", { locale: ru }),
    [listing.createdAt]
  );

  const handleBuyClick = () => {
      if (isMultiVariant && !selectedVariant) {
          showToast('Пожалуйста, выберите параметры товара', 'warning');
          return;
      }
      onBuyNow(listing, selectedVariant || undefined);
  };

  // --- NEW: Cancel Deal Logic ---
  const handleCancelDeal = async () => {
      if (!provider) {
          showToast('Кошелек не подключен', 'error');
          return;
      }
      setIsCancelling(true);
      try {
          const signer = await provider.getSigner();
          await demarketService.cancelTradeOnChain(listing.id, signer);
          showToast('Сделка отменена, средства возвращены покупателю.', 'success');
          onBack(); 
      } catch (err: any) {
          console.error(err);
          showToast(err.message || 'Ошибка отмены сделки', 'error');
      } finally {
          setIsCancelling(false);
      }
  };

  const renderFloatingActions = (isMobile: boolean) => {
      const btnBase = isMobile 
        ? "backdrop-blur-xl shadow-lg rounded-2xl transition-all active:scale-95 pointer-events-auto"
        : "backdrop-blur-xl shadow-lg rounded-2xl transition-all active:scale-95";

      // SELLER ACTIONS
      if (isMyListing) {
          return (
            <div className={`flex flex-col gap-3 w-full ${isMobile ? 'pointer-events-none' : ''}`}>
                {listing.status === 'Available' && (
                    <div className={`flex gap-3 w-full ${isMobile ? 'pointer-events-none' : ''}`}>
                        <button 
                            onClick={onBoost}
                            className={`flex-1 py-3 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold hover:bg-yellow-500/30 flex items-center justify-center gap-2 ${btnBase}`}
                        >
                            <SparklesIcon className="w-5 h-5"/>
                            Продвинуть
                        </button>
                        <button 
                            onClick={() => onEdit(listing)}
                            className={`flex-1 py-3 bg-gray-800/80 border border-white/10 text-white font-bold hover:bg-gray-700 flex items-center justify-center gap-2 ${btnBase}`}
                        >
                            <PencilSquareIcon className="w-5 h-5"/>
                            Изменить
                        </button>
                    </div>
                )}

                {listing.status === 'In Escrow' && (
                     <div className={`flex flex-col gap-3 w-full ${isMobile ? 'pointer-events-none' : ''}`}>
                        <div className={`p-3 text-center text-yellow-300 text-sm font-medium bg-yellow-500/10 rounded-2xl border border-yellow-500/20 backdrop-blur-md ${isMobile ? 'pointer-events-auto' : ''}`}>
                            Ожидание подтверждения от покупателя
                        </div>
                        
                        {/* EXCLUSIVE SELLER BUTTON: CANCEL DEAL */}
                        {!isDisputed && (
                            <button
                                onClick={handleCancelDeal}
                                disabled={isCancelling}
                                className={`w-full py-3 bg-red-500/20 border border-red-500/50 text-red-300 font-bold hover:bg-red-500/30 flex items-center justify-center gap-2 ${btnBase} disabled:opacity-50 pointer-events-auto`}
                            >
                                {isCancelling ? 'Отмена...' : 'Отменить сделку (Вернуть средства)'}
                            </button>
                        )}

                        {isDisputed ? (
                             <button 
                                onClick={onViewDispute}
                                className={`w-full py-3 bg-red-500 text-white font-bold hover:bg-red-600 shadow-red-500/30 ${btnBase}`}
                            >
                                Перейти к спору
                            </button>
                        ) : listing.buyer && (
                            <button 
                                onClick={() => onWrite(listing.buyer!)}
                                className={`w-full py-3 bg-gray-800/90 border border-white/10 text-white font-bold hover:bg-gray-700 ${btnBase}`}
                            >
                                Написать покупателю
                            </button>
                        )}
                    </div>
                )}

                {(listing.status === 'Sold' || listing.status === 'Archived') && (
                    <div className={`p-3 w-full text-center text-gray-400 font-medium bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md ${isMobile ? 'pointer-events-auto' : ''}`}>
                        {listing.status === 'Sold' ? 'Сделка успешно завершена' : 'Объявление в архиве'}
                    </div>
                )}
            </div>
          );
      }

      // BUYER ACTIONS
      // Strict check: Am I the buyer?
      const isBuyer = user && listing.buyer?.address.toLowerCase() === user.address.toLowerCase();

      return (
        <div className={`flex flex-col gap-3 w-full ${isMobile ? 'pointer-events-none' : ''}`}>
             {listing.status === 'Available' && (
                <button 
                    onClick={handleBuyClick}
                    disabled={displayQuantity === 0 || (isMultiVariant && !selectedVariant)}
                    className={`w-full py-4 bg-cyan-500 text-white text-lg font-bold hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed shadow-cyan-500/20 ${btnBase}`}
                >
                     {displayQuantity === 0 
                        ? 'Нет в наличии' 
                        : (isMultiVariant && !selectedVariant ? 'Выберите параметры' : 'Купить сейчас')}
                </button>
             )}

             {listing.status === 'In Escrow' && isBuyer && (
                 <div className={`flex flex-col gap-3 w-full ${isMobile ? 'pointer-events-none' : ''}`}>
                     <button 
                        onClick={() => onConfirmReceipt(listing)}
                        className={`w-full py-3.5 bg-green-500 text-white font-bold hover:bg-green-400 flex items-center justify-center gap-2 shadow-green-500/30 ${btnBase}`}
                    >
                        Подтвердить получение
                    </button>
                    
                    {isDisputed ? (
                         <button 
                            onClick={onViewDispute}
                            className={`w-full py-3 bg-red-500/20 border border-red-500/50 text-red-400 font-semibold hover:bg-red-500/30 ${btnBase}`}
                        >
                            Спор
                        </button>
                    ) : (
                         <button 
                            onClick={() => onOpenDispute(listing)}
                            className={`w-full py-3 bg-gray-800/80 border border-white/10 text-white font-semibold hover:bg-gray-700 ${btnBase}`}
                        >
                            Открыть спор
                        </button>
                    )}
                 </div>
             )}
             
             {/* Case where listing is in Escrow but viewer is NEITHER buyer NOR seller */}
             {listing.status === 'In Escrow' && !isBuyer && !isMyListing && (
                 <div className={`p-3 w-full text-center text-yellow-500 font-medium bg-yellow-500/10 rounded-2xl border border-yellow-500/20 backdrop-blur-md ${isMobile ? 'pointer-events-auto' : ''}`}>
                     Товар зарезервирован
                 </div>
             )}
        </div>
      );
  };

  const handleSellerProfileClick = useCallback(() => {
    onViewSellerProfile(listing.seller);
  }, [listing.seller, onViewSellerProfile]);

  const handleWriteOrDisputeClick = useCallback(() => {
    if (isDisputed) {
      onViewDispute();
    } else {
      onWrite(listing.seller);
    }
  }, [isDisputed, onViewDispute, onWrite, listing.seller]);

  const currentMedia = media[currentImageIndex] || media[0];

  const VariantSelectors = () => {
      if (!isMultiVariant) return null;

      return (
          <div className="space-y-4 pt-2">
              {variantKeys.map(key => {
                  const values = [...new Set(listing.variants?.map(v => v.attributes[key]))].filter(Boolean);
                  return (
                      <div key={key}>
                          <p className="text-sm font-medium text-gray-400 mb-2">{key}</p>
                          <div className="flex flex-wrap gap-2">
                              {values.map(value => (
                                  <button
                                      key={value}
                                      onClick={() => setSelectedOptions(prev => ({ ...prev, [key]: value }))}
                                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                          selectedOptions[key] === value
                                              ? 'bg-white/20 text-white ring-1 ring-white/50 shadow-lg'
                                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                                      }`}
                                  >
                                      {value}
                                  </button>
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="h-full bg-black flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <button 
          onClick={handleBackClick}
          onKeyDown={handleBackKeyDown}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors backdrop-blur-md bg-black/20"
          aria-label="Назад"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
             <button 
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors backdrop-blur-md bg-black/20"
              aria-label="Поделиться"
            >
                <ShareIcon />
            </button>
            <button 
              onClick={() => onReportIssue(listing)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors backdrop-blur-md bg-black/20 text-gray-300 hover:text-red-400"
              aria-label="Пожаловаться"
            >
                <FlagIcon />
            </button>
        </div>
      </header>

      <main 
        ref={mainScrollRef} 
        className="flex-1 overflow-y-auto lg:pb-0"
        style={{ paddingBottom: `${actionPanelHeight}px` }}
      >
        <div className="lg:grid w-full lg:grid-cols-[6fr_5fr] lg:gap-x-8 lg:px-8">
          
          {/* Left Column: Image & Description */}
          <div className="lg:pt-16 lg:space-y-4">
            
            {/* MOBILE GALLERY */}
            <div className="relative lg:hidden">
              <div 
                ref={imageContainerRef} 
                onScroll={handleImageScroll} 
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
              >
                {media.map((item, index) => (
                    <div 
                      key={index}
                      onClick={() => handleImageClick(index)} 
                      className="w-full flex-shrink-0 snap-center aspect-square cursor-pointer relative" 
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleImageClick(index);
                        }
                      }}
                    >
                        {item.type === 'video' ? (
                            <div className="w-full h-full relative">
                                <video 
                                    src={item.url} 
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    loop
                                    autoPlay
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                    <PlayCircleIcon className="w-16 h-16 text-white/80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}/>
                                </div>
                            </div>
                        ) : (
                            <img 
                                src={item.url} 
                                alt={`${listing.title} - изображение ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(`main-${index}`)}
                            />
                        )}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                    </div>
                ))}
              </div>
              {listing.status === 'Sold' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-white/80 border-4 border-white/80 px-6 py-3 rounded-xl -rotate-12">ПРОДАНО</span>
                  </div>
              )}
              {media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
                  {media.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
                      }`}
                      aria-label={`Перейти к изображению ${index + 1}`}
                      onClick={() => handleThumbnailClick(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* DESKTOP GALLERY */}
            <div className="hidden lg:block relative w-full aspect-square bg-gray-800 lg:rounded-xl lg:overflow-hidden">
              {currentMedia && (
                <>
                    {currentMedia.type === 'video' ? (
                        <div className="w-full h-full relative" onClick={() => handleImageClick(currentImageIndex)}>
                            <video
                                src={currentMedia.url}
                                className="w-full h-full object-cover cursor-pointer"
                                muted
                                playsInline
                                loop
                                autoPlay
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                <PlayCircleIcon className="w-24 h-24 text-white/80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}/>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={currentMedia.url}
                            alt={listing.title}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handleImageClick(currentImageIndex)}
                            onError={() => handleImageError(`desktop-main`)}
                        />
                    )}
                </>
              )}
               {listing.status === 'Sold' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-white/80 border-4 border-white/80 px-6 py-3 rounded-xl -rotate-12">ПРОДАНО</span>
                  </div>
              )}
            </div>

            {media.length > 1 && (
                <div className="mt-2 lg:mt-4 hidden lg:block">
                    <div ref={thumbnailContainerRef} className="flex space-x-2 overflow-x-auto p-2 no-scrollbar">
                        {media.map((item, index) => (
                            <button
                                key={index}
                                ref={(el) => { thumbnailRefs.current[index] = el; }}
                                onClick={() => handleThumbnailClick(index)}
                                className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                    currentImageIndex === index
                                        ? 'border-cyan-400'
                                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'
                                }`}
                                aria-label={`Просмотр изображения ${index + 1}`}
                                aria-current={currentImageIndex === index ? 'true' : 'false'}
                            >
                                {item.type === 'video' ? (
                                    <div className="w-full h-full relative bg-black">
                                        <video src={item.url} className="w-full h-full object-cover" muted />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <PlayCircleIcon className="w-6 h-6 text-white/80"/>
                                        </div>
                                    </div>
                                ) : (
                                    <img 
                                        src={item.url} 
                                        alt={`Миниатюра ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(`thumb-${index}`)}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Description Panel for DESKTOP */}
            <div className="hidden lg:block px-4 lg:px-0">
                <GlassPanel className="p-4">
                    <h2 className="text-lg font-semibold text-white mb-2">Описание</h2>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {listing.description || 'Описание отсутствует'}
                    </p>
                </GlassPanel>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
              <div className="h-full flex flex-col">
                  {/* Scrollable Info Area */}
                  <div className="lg:py-16 flex-grow lg:overflow-y-auto lg:pr-4 custom-scrollbar">
                      <div className="p-4 lg:p-0 space-y-4">
                        {/* Title and Price */}
                        <GlassPanel className="p-4">
                          <h1 className={`text-2xl font-bold break-words ${isBoosted ? 'text-yellow-400' : 'text-white'}`}>
                            {listing.title}
                          </h1>
                          <div className="flex items-baseline gap-3 mt-2">
                            <p className="text-3xl font-bold text-cyan-400">
                              {isMultiVariant && !selectedVariant ? `от ${displayPrice}` : displayPrice} {listing.currency}
                              {listing.attributes?.['Тип сделки'] === 'Аренда' && ' / мес.'}
                            </p>
                            {listing.isNegotiable && (
                              <span className="text-sm font-medium text-gray-300 bg-white/10 px-2 py-0.5 rounded-md">
                                Торг уместен
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-2 flex items-center space-x-4 flex-wrap">
                              <span>{listing.location || 'Местоположение не указано'}</span>
                              <span>•</span>
                              <span>{formattedDate}</span>
                          </div>
                          
                          {/* Render Variants if available */}
                          <VariantSelectors />
                          
                        </GlassPanel>

                        {/* Seller Info */}
                        <GlassPanel className="p-2">
                          <div className="flex flex-row items-stretch justify-between gap-2">
                            <button
                              onClick={handleSellerProfileClick}
                              className="flex items-center space-x-3 p-2 text-left rounded-lg bg-black/20 hover:bg-black/40 transition-colors ring-1 ring-white/10 flex-1 min-w-0"
                              aria-label={`Посмотреть профиль продавца ${listing.seller.username}`}
                            >
                                <div className="flex-shrink-0 w-12 h-12">
                                    <Avatar seed={listing.seller.address} className="w-full h-full" />
                                </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="font-semibold text-white truncate">{listing.seller.username}</p>
                                    {listing.seller.reputationTier !== 'none' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                showModal(<ReputationInfoSheet />);
                                            }}
                                            aria-label="Показать информацию о репутации"
                                        >
                                            <ReputationMedalIcon tier={listing.seller.reputationTier} className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">
                                  {listing.seller.rating?.toFixed(0) || 0}% ({listing.seller.reviews || 0} отзывов)
                                </p>
                              </div>
                            </button>
                            {!isMyListing && (
                              <button
                                onClick={handleWriteOrDisputeClick}
                                className="px-4 flex items-center justify-center rounded-lg bg-black/20 hover:bg-black/40 transition-colors ring-1 ring-white/10 flex-shrink-0"
                                aria-label={isDisputed ? 'Перейти к спору' : 'Написать продавцу'}
                              >
                                <span className="font-semibold text-white text-sm whitespace-nowrap">
                                  {isDisputed ? 'Спор' : 'Написать'}
                                </span>
                              </button>
                            )}
                          </div>
                        </GlassPanel>

                        {/* Details Panel */}
                        <GlassPanel className="p-4">
                          <h2 className="text-lg font-semibold text-white mb-2">Детали</h2>
                          <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                              <div className="text-gray-400">Категория</div>
                              <div className="text-white text-right">{listing.category || 'Не указана'}</div>
                              
                              {listing.brand && (
                                <>
                                  <div className="text-gray-400">Бренд</div>
                                  <div className="text-white text-right">{listing.brand}</div>
                                </>
                              )}
                              
                              {listing.model && (
                                <>
                                  <div className="text-gray-400">Модель</div>
                                  <div className="text-white text-right">{listing.model}</div>
                                </>
                              )}
                              
                              {listing.category !== 'Недвижимость' && (
                                <>
                                  <div className="text-gray-400">Состояние</div>
                                  <div className="text-white text-right">
                                    {listing.condition === 'New' ? 'Новый' : 'Б/у'}
                                  </div>
                                  <div className="text-gray-400">В наличии</div>
                                  <div className="text-white text-right">
                                    {displayQuantity || 0} шт.
                                  </div>
                                </>
                              )}
                          </div>
                          
                          {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm pt-3 mt-3 border-t border-white/10">
                                {Object.entries(listing.attributes).map(([key, value]) => (
                                    <React.Fragment key={key}>
                                        <div className="text-gray-400">{key}</div>
                                        <div className="text-white text-right">
                                          {value}
                                          {key === 'Площадь (м²)' && ' м²'}
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                          )}

                          {listing.serviceDetails && (
                            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm pt-3 mt-3 border-t border-white/10">
                                <div className="text-gray-400">Срок</div>
                                <div className="text-white text-right">
                                  {listing.serviceDetails.duration} {
                                    listing.serviceDetails.unit === 'hour' ? 'час' : 
                                    listing.serviceDetails.unit === 'day' ? 'день' : 'проект'
                                  }
                                </div>
                                <div className="text-gray-400">Формат</div>
                                <div className="text-white text-right">
                                  {listing.serviceDetails.locationType === 'remote' ? 'Удаленно' : 'На месте'}
                                </div>
                            </div>
                          )}
                          
                          {listing.ipfsCid && (
                             <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Метаданные (IPFS)</span>
                                    <a 
                                        href={`https://gateway.pinata.cloud/ipfs/${listing.ipfsCid}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 text-xs font-mono bg-cyan-900/20 px-2 py-1 rounded border border-cyan-500/30"
                                        title="Посмотреть реальный JSON-файл в блокчейне"
                                    >
                                        {listing.ipfsCid.substring(0, 8)}...
                                    </a>
                                </div>
                            </div>
                          )}

                          <div 
                            className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
                            onClick={handleCopyId}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleCopyId();
                              }
                            }}
                            aria-label="Копировать ID объявления"
                          >
                              <span className="text-sm text-gray-400">{listing.ipfsCid ? 'IPFS CID' : 'Внутренний ID'}</span>
                              {isIdCopied ? (
                                <span className="font-sans text-xs text-green-400 font-semibold">Скопировано!</span>
                              ) : (
                                <span className="font-mono text-xs text-gray-300 truncate max-w-[120px]">
                                  {displayId}
                                </span>
                              )}
                          </div>
                          
                          {listing.proofOfPurchaseCid && (
                             <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                                <span className="text-sm text-gray-400">Док-во покупки</span>
                                <a 
                                  href={`https://gateway.pinata.cloud/ipfs/${listing.proofOfPurchaseCid}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-cyan-400 text-xs font-mono hover:underline break-all ml-2 flex items-center gap-1"
                                  aria-label="Посмотреть доказательство покупки на IPFS"
                                >
                                    <ClipboardDocumentListIcon className="w-3 h-3"/>
                                    Открыть (IPFS)
                                </a>
                            </div>
                          )}
                        </GlassPanel>

                        {/* Action Buttons for DESKTOP */}
                        <div className="hidden lg:block">
                             <GlassPanel className="p-4 bg-slate-900/70">
                                 {renderFloatingActions(false)}
                            </GlassPanel>
                        </div>
                        
                        {/* Description Panel for MOBILE */}
                        <div className="lg:hidden">
                             <GlassPanel className="p-4">
                                <h2 className="text-lg font-semibold text-white mb-2">Описание</h2>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {listing.description || 'Описание отсутствует'}
                                </p>
                            </GlassPanel>
                        </div>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      </main>
      
      {/* Floating Action Bar for MOBILE (Separated buttons without background) */}
      <div 
        ref={actionPanelRef}
        className="fixed inset-x-4 bottom-[max(env(safe-area-inset-bottom),_16px)] z-30 pointer-events-none flex flex-col justify-end gap-3 lg:hidden"
      >
           {renderFloatingActions(true)}
      </div>

      {/* ImageViewer */}
      {isImageViewerOpen && (
        <ImageViewer
          media={media}
          initialIndex={currentImageIndex}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </div>
  );
};
