import React, { useState } from 'react';
import { User, Listing, Review, Badge } from '../../types';
import { GlassPanel } from '../shared/GlassPanel';
import { ChevronLeftIcon, SparklesIcon, ShieldCheckIcon, TrophyIcon, UserCircleIcon, ChatBubbleOvalLeftEllipsisIcon, BanknotesIcon, HeartIcon, Squares2X2Icon, ClipboardDocumentListIcon, ScaleIcon, RocketLaunchIcon, ClipboardDocumentIcon, ArrowsRightLeftIcon, Cog6ToothIcon, PlusCircleIcon } from '../icons/Icons';
import { ListingGrid } from '../shared/ListingGrid';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SellerProfileScreenProps {
    seller: User;
    allListings: Listing[];
    allReviews: Review[];
    onBack: () => void;
    onListingClick: (listing: Listing) => void;
    onToggleFavorite: (listingId: string) => void;
    favorites: string[];
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const stars = Math.round(rating / 20); // Convert 0-100 to 0-5
    return (
        <div className="flex items-center" aria-label={`Рейтинг: ${stars} из 5 звезд`}>
            {[...Array(5)].map((_, i) => (
                <svg 
                    key={i} 
                    className={`w-4 h-4 ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

const BadgeIcon: React.FC<{ icon: Badge['icon'] }> = ({ icon }) => {
    const icons: Record<Badge['icon'], React.ReactNode> = {
        'first-purchase': <TrophyIcon />,
        'first-sale': <TrophyIcon />,
        'top-seller': <SparklesIcon />,
        'veteran': <ShieldCheckIcon />,
        'profile-pro': <UserCircleIcon />,
        'communicator': <ChatBubbleOvalLeftEllipsisIcon />,
        'trusted-seller': <ShieldCheckIcon />,
        'power-buyer': <BanknotesIcon />,
        'collector': <HeartIcon filled={true} />,
        'specialist': <Squares2X2Icon />,
        'community-member': <ClipboardDocumentListIcon />,
        'arbitrator': <ScaleIcon />,
        'tycoon': <RocketLaunchIcon />,
        'reputation-master': <SparklesIcon />,
        'dao-legislator': <ClipboardDocumentIcon />,
        'market-maker': <ArrowsRightLeftIcon />,
        'centurion': <TrophyIcon />,
        'og': <Cog6ToothIcon />,
        'evangelist': <PlusCircleIcon />,
    };
    
    return (
        <div 
            className="w-10 h-10 flex items-center justify-center bg-yellow-500/10 rounded-lg text-yellow-400"
            aria-hidden="true"
        >
            {icons[icon] || <TrophyIcon />}
        </div>
    );
};

export const SellerProfileScreen: React.FC<SellerProfileScreenProps> = ({ 
    seller, 
    allListings = [], 
    allReviews = [], 
    onBack, 
    onListingClick, 
    onToggleFavorite, 
    favorites = [] 
}) => {
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const sellerListings = allListings.filter(
        l => l.seller.address === seller.address && l.status === 'Available'
    );
    
    const sellerReviews = allReviews.filter(
        r => allListings.find(l => l.id === r.listingId)?.seller.address === seller.address
    );

    const handleImageError = (id: string) => {
        setImageErrors(prev => ({ ...prev, [id]: true }));
    };

    const getInitials = (username: string) => {
        return username
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleBackClick = () => {
        onBack();
    };

    const handleBackKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBack();
        }
    };

    return (
        <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={handleBackClick}
                    onKeyDown={handleBackKeyDown}
                    className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Назад"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-xl font-bold text-white text-center flex-1 pr-8 truncate">
                    Профиль продавца
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
                {/* Seller Info */}
                <GlassPanel className="p-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            {!imageErrors[`avatar-${seller.address}`] ? (
                                <img 
                                    src={seller.avatar} 
                                    alt={`Аватар ${seller.username}`}
                                    className="w-16 h-16 rounded-full object-cover"
                                    onError={() => handleImageError(`avatar-${seller.address}`)}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                                    <span className="text-white font-semibold text-lg">
                                        {getInitials(seller.username)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-white truncate">
                                {seller.username}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {seller.rating?.toFixed(0) || 0}% ({seller.reviews || 0} отзывов)
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                В сети с {seller.memberSince} г. • {seller.location?.city || 'Город не указан'}
                            </p>
                        </div>
                    </div>
                    
                    {seller.badges && seller.badges.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-semibold text-white mb-2">Баджи</h3>
                            <div className="flex flex-wrap gap-3">
                                {seller.badges.map(badge => (
                                    <div 
                                        key={badge.id} 
                                        className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                                        title={badge.description}
                                    >
                                        <BadgeIcon icon={badge.icon} />
                                        <div className="min-w-0">
                                            <p className="font-bold text-white text-xs truncate">
                                                {badge.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate max-w-[120px]">
                                                {badge.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </GlassPanel>

                {/* Seller Listings */}
                <section aria-labelledby="seller-listings-heading">
                    <h2 
                        id="seller-listings-heading"
                        className="text-xl font-bold text-white mb-4"
                    >
                        Объявления продавца ({sellerListings.length})
                    </h2>
                    {sellerListings.length > 0 ? (
                        <ListingGrid
                            items={sellerListings}
                            favorites={favorites}
                            onListingClick={onListingClick}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ) : (
                        <GlassPanel className="p-8 text-center text-gray-400">
                            <p>У этого продавца нет активных объявлений.</p>
                        </GlassPanel>
                    )}
                </section>

                {/* Seller Reviews */}
                <section aria-labelledby="seller-reviews-heading">
                    <h2 
                        id="seller-reviews-heading"
                        className="text-xl font-bold text-white mb-4"
                    >
                        Отзывы о продавце ({sellerReviews.length})
                    </h2>
                    {sellerReviews.length > 0 ? (
                        <div className="space-y-3" role="list" aria-label="Отзывы о продавце">
                            {sellerReviews.map(review => (
                                <GlassPanel 
                                    key={review.id} 
                                    className="p-3"
                                    role="listitem"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative flex-shrink-0">
                                            {!imageErrors[`review-avatar-${review.id}`] ? (
                                                <img 
                                                    src={review.buyerAvatar} 
                                                    alt={`Аватар ${review.buyerUsername}`}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    onError={() => handleImageError(`review-avatar-${review.id}`)}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                                    <span className="text-white text-xs font-medium">
                                                        {getInitials(review.buyerUsername)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <p className="font-semibold text-white text-sm truncate">
                                                    {review.buyerUsername}
                                                </p>
                                                <StarRating rating={review.rating} />
                                            </div>
                                            <p className="text-sm text-gray-300 mt-1 break-words">
                                                {review.comment}
                                            </p>
                                            <time 
                                                className="text-xs text-gray-500 mt-2 block"
                                                dateTime={review.createdAt}
                                            >
                                                {format(new Date(review.createdAt), "dd MMM yyyy", { locale: ru })}
                                            </time>
                                        </div>
                                    </div>
                                </GlassPanel>
                            ))}
                        </div>
                    ) : (
                        <GlassPanel className="p-8 text-center text-gray-400">
                            <p>Об этом продавце еще нет отзывов.</p>
                        </GlassPanel>
                    )}
                </section>
            </main>
        </div>
    );
};
