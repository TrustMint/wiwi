
import React, { useState, useMemo } from 'react';
import { User, Listing, Review } from '../../types';
import { GlassPanel } from '../shared/GlassPanel';
import { ChevronLeftIcon, HandThumbUpIcon, HandThumbDownIcon, ReputationMedalIcon, InformationCircleIcon, SparklesIcon, ShieldCheckIcon, FingerPrintIcon, BoltIcon } from '../icons/Icons';
import { ListingGrid } from '../shared/ListingGrid';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useModal } from '../../hooks/useModal';
import { ReputationInfoSheet } from '../modals/ReputationInfoSheet';
import { Avatar } from '../shared/Avatar';
import { getReputationTier, useWallet } from '../../hooks/useWallet';
import { TbDna } from 'react-icons/tb';

interface SellerProfileScreenProps {
    seller: User;
    allListings: Listing[];
    allReviews: Review[];
    onBack: () => void;
    onListingClick: (listing: Listing) => void;
    onToggleFavorite: (listingId: string) => void;
    favorites: string[];
    hideListings?: boolean;
}

// New Modal Content for Avatar History
const AvatarLoreSheet: React.FC<{ address: string; isOwner: boolean }> = ({ address, isOwner }) => (
    <div className="p-4 pt-0 space-y-6">
        <h2 className="text-2xl font-bold text-white text-center mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-purple-200">
            Генезис Цифровой Души
        </h2>
        
        <div className="flex justify-center py-6 relative">
             <div className="w-48 h-48 relative group">
                 <div className="absolute inset-0 bg-cyan-500/30 blur-[40px] rounded-full animate-pulse duration-[4000ms]"></div>
                 <Avatar seed={address} className="w-full h-full relative z-10 drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                 {/* Decorative rings */}
                 <div className="absolute -inset-4 border border-white/10 rounded-full animate-[spin_12s_linear_infinite]"></div>
                 <div className="absolute -inset-1 border border-cyan-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
             </div>
        </div>

        {/* Section 1: The Mystical Origin */}
        <GlassPanel className="p-5 space-y-4 relative overflow-hidden border-t border-purple-500/30">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none rotate-12">
                <TbDna size={120} className="text-purple-400" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-900/30 ring-1 ring-purple-500/40">
                   <FingerPrintIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Эхо Блокчейна</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed font-light relative z-10">
                <p>
                    Этот образ не был нарисован рукой человека. Он возник из чистой математики в ту самую миллисекунду, когда энтропия вселенной сколлапсировала в уникальную последовательность вашего ключа.
                </p>
                <p>
                    В мире Web3 ваш адрес — это лишь набор сухих цифр. Аватар вдыхает в них жизнь. Это визуальная проекция вашей криптографической сущности, уникальный узор, который математически привязан к вашей личности в сети Arbitrum. Пока существует блокчейн, существует и этот облик.
                </p>
            </div>
        </GlassPanel>

        {/* Section 2: The Symbolism */}
        <GlassPanel className="p-5 space-y-4 bg-gradient-to-br from-amber-900/20 to-transparent border-t border-amber-500/30 relative overflow-hidden">
             <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
                <ShieldCheckIcon className="w-32 h-32 text-amber-400" />
            </div>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-900/30 ring-1 ring-amber-500/40">
                    <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Наследие Зубра</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed font-light relative z-10">
                <p>
                    В строгих геометрических линиях скрыт дух <strong className="text-amber-200">Зубра</strong> — древнего символа мощи и стойкости наших земель. Он не отступает и не сдается перед лицом стихии.
                </p>
                <p>
                    Зубр заключен в <strong className="text-cyan-200">Криптографический Щит</strong>. Это символ неизменности. В отличие от физического мира, здесь вашу репутацию невозможно подделать, украсть или стереть. Каждая сделка, каждый отзыв навсегда вписаны в историю под защитой этого щита. Это герб вашей цифровой чести, который вы куете сами.
                </p>
            </div>
        </GlassPanel>

        {/* Section 3: The Math */}
        <GlassPanel className="p-5 space-y-4 border-t border-indigo-500/30">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-500/40">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Математика Хаоса</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed font-light">
                <p>
                    Здесь нет случайности. Алгоритм берет хаос шестнадцатеричного хеша вашего адреса и упорядочивает его в гармонию цвета и формы.
                </p>
                <p>
                    Угол градиента, выбор палитры, наложение паттернов — всё это вычислено с абсолютной точностью. Вероятность встретить точного двойника составляет <span className="text-indigo-300 font-mono font-medium">1 к 4 294 967 296</span>. Вы — единственны во вселенной DeMarket, и математика это доказывает.
                </p>
            </div>
        </GlassPanel>

        {/* Private Seed Section - ONLY FOR OWNER */}
        {isOwner && (
            <div className="animate-fadeIn pt-6 pb-4">
                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-black px-3 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Исходный Код Личности</span>
                    </div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center gap-2 group cursor-copy active:scale-95 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ваш публичный ключ (Seed)</p>
                    <p className="text-xs text-cyan-400 font-mono break-all text-center select-all bg-cyan-950/30 px-2 py-1 rounded">
                        {address}
                    </p>
                </div>
            </div>
        )}
    </div>
);

export const SellerProfileScreen: React.FC<SellerProfileScreenProps> = ({ 
    seller, 
    allListings = [], 
    allReviews = [], 
    onBack, 
    onListingClick, 
    onToggleFavorite, 
    favorites = [],
    hideListings = false,
}) => {
    const { user } = useWallet();
    type Tab = 'listings' | 'info' | 'reviews';
    const [activeTab, setActiveTab] = useState<Tab>(hideListings ? 'info' : 'listings');
    const { showModal } = useModal();

    // Recalculate seller stats to ensure they are always up-to-date
    const displaySeller = useMemo(() => {
        const sellerReviews = allReviews.filter(
            r => allListings.find(l => l.id === r.listingId)?.seller.address === seller.address
        );
        const reviewCount = sellerReviews.length;
        const goodReviewsCount = sellerReviews.filter(r => r.rating > 50).length;
        const badReviewsCount = reviewCount - goodReviewsCount;
        const totalRating = sellerReviews.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = reviewCount > 0 ? totalRating / reviewCount : 100;
        
        // Dynamic Tier recalculation ensures UI is always in sync with reviews
        const reputationTier = getReputationTier(averageRating, reviewCount);

        return {
            ...seller,
            reviews: reviewCount,
            rating: averageRating,
            goodReviewsCount,
            badReviewsCount,
            reputationTier, 
        };
    }, [seller, allListings, allReviews]);

    const sellerListings = useMemo(() => allListings.filter(
        l => l.seller.address === displaySeller.address && l.status === 'Available'
    ), [allListings, displaySeller.address]);
    
    const sellerReviews = useMemo(() => allReviews.filter(
        r => allListings.find(l => l.id === r.listingId)?.seller.address === displaySeller.address
    ), [allReviews, allListings, displaySeller.address]);

    const handleBackClick = () => onBack();
    const handleBackKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBack(); } };
    
    // Check ownership for AvatarLoreSheet privacy
    const isOwner = user?.address === displaySeller.address;

    const handleAvatarClick = () => {
        showModal(<AvatarLoreSheet address={displaySeller.address} isOwner={isOwner} />);
    };

    // --- Tab Content Components ---

    const InfoSection = () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const salesLast30Days = useMemo(() => allListings.filter(l => l.seller.address === displaySeller.address && l.status === 'Sold' && new Date(l.createdAt) >= thirtyDaysAgo).length, [allListings, displaySeller.address, thirtyDaysAgo]);
        const totalSales = useMemo(() => allListings.filter(l => l.seller.address === displaySeller.address && l.status === 'Sold').length, [allListings, displaySeller.address]);
        
        const daysSinceAccountCreation = useMemo(() => displaySeller.createdAt ? differenceInDays(new Date(), parseISO(displaySeller.createdAt)) : 0, [displaySeller.createdAt]);
        const daysSinceFirstDeal = useMemo(() => displaySeller.firstDealAt ? differenceInDays(new Date(), parseISO(displaySeller.firstDealAt)) : 0, [displaySeller.firstDealAt]);

        return (
            <GlassPanel className="p-4">
                <div className="space-y-4 divide-y divide-white/10">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-200">Статистика продавца</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Исполненные сделки за 30 дней</span> 
                                <span className="font-semibold text-white">{salesLast30Days}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Все исполненные сделки</span> 
                                <span className="font-semibold text-white">{totalSales}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Дней с создания аккаунта</span> 
                                <span className="font-semibold text-white">{daysSinceAccountCreation}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Дней с первой сделки</span> 
                                <span className="font-semibold text-white">{daysSinceFirstDeal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassPanel>
        );
    };

    const ListingsSection = () => (
        <div>
            {sellerListings.length > 0 ? (
                <ListingGrid items={sellerListings} favorites={favorites} onListingClick={onListingClick} onToggleFavorite={onToggleFavorite} />
            ) : (
                <GlassPanel className="p-8 text-center text-gray-400"><p>У этого продавца нет активных объявлений.</p></GlassPanel>
            )}
        </div>
    );

    const ReviewsSection = () => {
        const highRatingPercent = useMemo(() => {
            const total = displaySeller.goodReviewsCount + displaySeller.badReviewsCount;
            return total > 0 ? (displaySeller.goodReviewsCount / total) * 100 : 100;
        }, [displaySeller.goodReviewsCount, displaySeller.badReviewsCount]);

        return (
            <div className="space-y-4">
                {/* Рейтинг блок */}
                <GlassPanel className="p-4">
                    <div className="text-center mb-4">
                        <p className="text-2xl font-bold text-white">{highRatingPercent.toFixed(0)}%</p>
                        <p className="text-sm text-gray-300">Текущий высокий рейтинг</p>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-green-400">
                            <HandThumbUpIcon className="w-4 h-4" />
                            <span>Хорошо {displaySeller.goodReviewsCount}</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-400">
                            <HandThumbDownIcon className="w-4 h-4" />
                            <span>Плохо {displaySeller.badReviewsCount}</span>
                        </div>
                    </div>
                </GlassPanel>

                {/* Список отзывов */}
                {sellerReviews.length > 0 ? (
                    <div className="space-y-3">
                        {sellerReviews.map(review => (
                            <GlassPanel key={review.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <Avatar seed={review.buyerUsername} className="w-8 h-8" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-semibold text-white text-sm">{review.buyerUsername}</p>
                                            <p className="text-xs text-gray-500">
                                                {format(parseISO(review.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: ru })}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-300">
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            </GlassPanel>
                        ))}
                    </div>
                ) : (
                    <GlassPanel className="p-8 text-center text-gray-400">
                        <p>Нет отзывов.</p>
                    </GlassPanel>
                )}
            </div>
        );
    };

    const tabOptions = useMemo(() => {
        const tabs: { key: Tab; label: string, count?: number }[] = [];
        if (!hideListings) {
            tabs.push({ key: 'listings', label: 'Объявления', count: sellerListings.length });
        }
        tabs.push({ key: 'info', label: 'Информация' });
        tabs.push({ key: 'reviews', label: 'Отзывы', count: sellerReviews.length });
        return tabs;
    }, [hideListings, sellerListings.length, sellerReviews.length]);

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 flex items-center bg-transparent">
                <button 
                    onClick={handleBackClick} 
                    onKeyDown={handleBackKeyDown} 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-white/10 transition-colors" 
                    aria-label="Назад"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
            </header>
            
            <div className="flex-1 overflow-y-auto px-4 pb-28">
                <div className="space-y-6 pt-12">
                    <div className="pb-4">
                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* Avatar */}
                            <button 
                                onClick={handleAvatarClick}
                                className="relative group cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-full"
                                aria-label="История аватара"
                            >
                                <Avatar seed={displaySeller.address} className="w-24 h-24 transition-transform group-hover:scale-105 group-active:scale-95" />
                                <div className="absolute bottom-0 right-0 bg-black/60 text-white p-1 rounded-full backdrop-blur-sm border border-white/20">
                                    <InformationCircleIcon className="w-4 h-4"/>
                                </div>
                            </button>

                            {/* Info Text */}
                            <div>
                                <div className="flex items-center justify-center gap-2">
                                    <h2 className="text-2xl font-semibold text-white">{displaySeller.username}</h2>
                                    {displaySeller.reputationTier !== 'none' && (
                                        <button onClick={() => showModal(<ReputationInfoSheet />)}>
                                            <ReputationMedalIcon tier={displaySeller.reputationTier} className="w-8 h-8" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-base text-gray-400">{displaySeller.rating?.toFixed(0) || 100}% ({displaySeller.reviews || 0} отзывов)</p>
                                <p className="text-sm text-gray-500 mt-1">В сети с {displaySeller.memberSince} г. • {displaySeller.location?.city || 'Город не указан'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Табы */}
                    <div className={`grid ${hideListings ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                        {tabOptions.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as Tab)}
                                className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                    activeTab === tab.key 
                                        ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' 
                                        : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
                                }`}
                                aria-pressed={activeTab === tab.key}
                            >
                                {tab.label} {tab.count !== undefined && `(${tab.count})`}
                            </button>
                        ))}
                    </div>
                
                    {/* Контент табов */}
                    <div>
                        {activeTab === 'listings' && !hideListings && <ListingsSection />}
                        {activeTab === 'info' && <InfoSection />}
                        {activeTab === 'reviews' && <ReviewsSection />}
                    </div>
                </div>
            </div>
        </div>
    );
};
