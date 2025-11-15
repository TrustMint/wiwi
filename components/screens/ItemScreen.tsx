import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Listing, User } from '../../types';
import { GlassPanel } from '../shared/GlassPanel';
import { ChevronLeftIcon, ShareIcon, InformationCircleIcon, SparklesIcon, PlayCircleIcon, PencilSquareIcon } from '../icons/Icons';
import { useWallet } from '../../hooks/useWallet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ToastType } from '../shared/Toast';
import { ImageViewer } from '../shared/ImageViewer';

interface ItemScreenProps {
  listing: Listing;
  onBack: () => void;
  onBuyNow: (listing: Listing) => void;
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
}

type MediaItem = { url: string; type: 'image' | 'video' };

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
}) => {
  const { user } = useWallet();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [isIdCopied, setIsIdCopied] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
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

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const panel = entry.target as HTMLElement;
        
        if (panel.offsetHeight > 0) {
            const panelHeight = panel.offsetHeight;
            const bottomOffset = 16;
            const breathingRoom = 192;
            setActionPanelHeight(panelHeight + bottomOffset + breathingRoom);
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

  const isMyListing = user?.address === listing.seller.address;
  const isBoosted = listing.boostedUntil && new Date(listing.boostedUntil) > new Date();

  // Image navigation and error handling
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

  const getInitials = useCallback((username: string) => {
    return username
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
  }, []);

  const handleShare = useCallback(async () => {
    const deepLink = `${window.location.origin}${window.location.pathname}?listing=${listing.id}`;
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
        console.log('Web Share API failed, falling back to clipboard.', error);
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Ссылка скопирована!', 'success');
      } else {
        showToast('Функция "Поделиться" не поддерживается', 'warning');
      }
    } catch (error) {
      console.error('Clipboard fallback failed:', error);
      showToast('Не удалось скопировать ссылку', 'error');
    }
  }, [listing.id, listing.title, showToast]);

  const handleCopyId = useCallback(() => {
    if (isIdCopied) return;
    navigator.clipboard.writeText(listing.id).then(() => {
        setIsIdCopied(true);
        setTimeout(() => setIsIdCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy ID: ', err);
        showToast('Не удалось скопировать ID', 'error');
    });
  }, [listing.id, isIdCopied, showToast]);

  const handleBackClick = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleBackKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onBack();
    }
  }, [onBack]);

  const formattedDate = useMemo(() => 
    format(new Date(listing.createdAt), "d MMMM yyyy 'г.'", { locale: ru }),
    [listing.createdAt]
  );

  const ActionButtons = useCallback(() => (
    <div className="w-full space-y-2">
      {!isMyListing ? (
        <>
          {listing.status === 'Available' && (
            <>
              <button 
                onClick={() => onBuyNow(listing)}
                className="w-full py-3 bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:shadow-none"
                disabled={listing.quantity === 0}
              >
                {listing.quantity === 0 ? 'Нет в наличии' : 'Купить'}
              </button>
              <button 
                onClick={() => onReportIssue(listing)}
                className="w-full text-center text-xs text-gray-400 hover:text-red-400 py-1 transition-colors"
              >
                Пожаловаться на объявление
              </button>
            </>
          )}
          {listing.status === 'In Escrow' && (
            <div className="space-y-2">
              <div className="p-3 bg-yellow-500/10 text-yellow-300 text-sm rounded-xl flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
                <span>Средства заблокированы. Подтвердите получение после проверки товара.</span>
              </div>
              <button 
                onClick={() => onConfirmReceipt(listing)}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
              >
                Подтвердить получение
              </button>
              <div className="grid grid-cols-2 gap-2">
                {isDisputed ? (
                  <button 
                    onClick={onViewDispute}
                    className="w-full py-2 bg-red-500/20 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    Посмотреть спор
                  </button>
                ) : (
                  <button 
                    onClick={() => onOpenDispute(listing)}
                    className="w-full py-2 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Открыть спор
                  </button>
                )}
                <button 
                  onClick={() => onReportIssue(listing)}
                  className="w-full py-2 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                >
                  Сообщить о проблеме
                </button>
              </div>
            </div>
          )}
          {listing.status === 'Sold' && (
            <div className="text-center py-3 text-gray-400 font-semibold">Товар продан</div>
          )}
        </>
      ) : (
        <>
          {listing.status === 'Available' && (
            <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onBoost}
                  className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                    <SparklesIcon className="w-5 h-5 text-yellow-400"/>
                    Поднять в поиске
                </button>
                <button 
                  onClick={() => onEdit(listing)}
                  className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                    <PencilSquareIcon className="w-5 h-5"/>
                    Редактировать
                </button>
            </div>
          )}
        </>
      )}
    </div>
  ), [
    isMyListing, 
    listing, 
    isDisputed, 
    onBuyNow, 
    onReportIssue, 
    onConfirmReceipt, 
    onOpenDispute, 
    onViewDispute, 
    onBoost, 
    onEdit
  ]);

  const currentMedia = media[currentImageIndex] || media[0];

  return (
    <div className="h-full bg-black flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent lg:bg-none">
        <button 
          onClick={handleBackClick}
          onKeyDown={handleBackKeyDown}
          className="p-2 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors"
              aria-label="Поделиться"
            >
                <ShareIcon />
            </button>
        </div>
      </header>

      <main 
        ref={mainScrollRef} 
        className="flex-1 overflow-y-auto lg:pb-0"
        style={{ paddingBottom: `${actionPanelHeight}px` }}
      >
        <div className="lg:grid lg:max-w-7xl lg:mx-auto lg:grid-cols-[6fr_5fr] lg:gap-x-8 lg:px-8">
          
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
                        <img 
                          src={item.type === 'video' ? (listing.images?.[0] || '') : item.url} 
                          alt={`${listing.title} - изображение ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(`main-${index}`)}
                        />
                         {item.type === 'video' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <PlayCircleIcon className="w-16 h-16 text-white/80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}/>
                          </div>
                        )}
                    </div>
                ))}
              </div>
              {listing.status === 'Sold' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-white/80 border-4 border-white/80 px-6 py-3 rounded-xl -rotate-12">ПРОДАНО</span>
                  </div>
              )}
              {media.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {media.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
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
                  <img
                    src={currentMedia.type === 'video' ? (listing.images?.[0] || '') : currentMedia.url}
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleImageClick(currentImageIndex)}
                    onError={() => handleImageError(`desktop-main`)}
                  />
                  {currentMedia.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <PlayCircleIcon className="w-24 h-24 text-white/80" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}/>
                    </div>
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
                <div className="mt-2 lg:mt-4">
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
                                <img 
                                  src={item.type === 'video' ? (listing.images?.[0] || '') : item.url} 
                                  alt={`Миниатюра ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={() => handleImageError(`thumb-${index}`)}
                                />
                                {item.type === 'video' && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <PlayCircleIcon className="w-6 h-6 text-white/80"/>
                                  </div>
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
                              {listing.price} {listing.currency}
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
                        </GlassPanel>

                        {/* Seller Info */}
                        <GlassPanel className="p-2">
                          <div className="flex flex-row items-stretch justify-between gap-2">
                            <button
                              onClick={() => onViewSellerProfile(listing.seller)}
                              className="flex items-center space-x-3 p-2 text-left rounded-lg bg-black/20 hover:bg-black/40 transition-colors ring-1 ring-white/10 flex-1 min-w-0"
                              aria-label={`Посмотреть профиль продавца ${listing.seller.username}`}
                            >
                              {!imageErrors[`seller-avatar-${listing.seller.address}`] ? (
                                <img 
                                  src={listing.seller.avatar} 
                                  alt={listing.seller.username} 
                                  className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                                  onError={() => handleImageError(`seller-avatar-${listing.seller.address}`)}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {getInitials(listing.seller.username)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{listing.seller.username}</p>
                                <p className="text-sm text-gray-400">
                                  {listing.seller.rating?.toFixed(0) || 0}% ({listing.seller.reviews || 0} отзывов)
                                </p>
                              </div>
                            </button>
                            {!isMyListing && (
                              <button
                                onClick={() => { isDisputed ? onViewDispute() : onWrite(listing.seller); }}
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
                                    {listing.quantity || 0} шт.
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
                              <span className="text-sm text-gray-400">ID Объявления</span>
                              {isIdCopied ? (
                                <span className="font-sans text-xs text-green-400 font-semibold">Скопировано!</span>
                              ) : (
                                <span className="font-mono text-xs text-gray-300 truncate max-w-[120px]">
                                  {listing.id}
                                </span>
                              )}
                          </div>
                          
                          {listing.proofOfPurchaseCid && (
                             <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                                <span className="text-sm text-gray-400">Док-во покупки</span>
                                <a 
                                  href={`https://ipfs.io/ipfs/${listing.proofOfPurchaseCid}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-cyan-400 text-xs font-mono hover:underline break-all ml-2"
                                  aria-label="Посмотреть доказательство покупки на IPFS"
                                >
                                    IPFS
                                </a>
                            </div>
                          )}
                        </GlassPanel>

                        {/* Action Buttons for DESKTOP */}
                        <div className="hidden lg:block">
                            <GlassPanel className="p-4 bg-slate-900/70">
                                <ActionButtons />
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
      
      {/* Floating Action Bar for MOBILE */}
      <div 
        ref={actionPanelRef}
        className="fixed inset-x-4 bottom-4 z-20 pb-[env(safe-area-inset-bottom)] lg:hidden pointer-events-none"
      >
          <div className="max-w-md mx-auto pointer-events-auto">
              <GlassPanel className="p-3 ring-1 ring-white/15 rounded-xl shadow-2xl">
                  <ActionButtons />
              </GlassPanel>
          </div>
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