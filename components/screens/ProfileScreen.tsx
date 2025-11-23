
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useWallet, config } from '../../hooks/useWallet';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { GlassPanel } from '../shared/GlassPanel';
import { useModal } from '../../hooks/useModal';
import { ChevronRightIcon, RocketLaunchIcon, SparklesIcon, ClipboardDocumentListIcon, BanknotesIcon, ShieldCheckIcon, BitcoinIcon, ChevronLeftIcon, CheckCircleIcon, SearchIcon, FilterIcon, QuestionMarkCircleIcon, TrophyIcon, PencilSquareIcon, ArrowUpRightIcon, ArrowDownLeftIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowsRightLeftIcon, Cog6ToothIcon, ClipboardDocumentIcon, InformationCircleIcon, ScaleIcon, HeartIcon, MapPinIcon, ChatBubbleOvalLeftEllipsisIcon, FunnelIcon, XCircleIcon, TrashIcon, ArrowUpIcon, LockClosedIcon, UserCircleIcon, Squares2X2Icon, PlusCircleIcon, DMTIcon, ETHIcon, USDCIcon, USDTIcon, ReputationMedalIcon, HandThumbDownIcon, HandThumbUpIcon } from '../icons/Icons';
import { ConnectWalletSheet } from '../modals/ConnectWalletSheet';
import { DepositSheet } from '../modals/DepositSheet';
import { FavoritesScreen } from './FavoritesScreen';
import { FaqScreen } from './FaqScreen';
import { mockBadges } from '../../services/mockData';
import { Listing, Review, Badge, Transaction, User, Dispute } from '../../types';
import { DaoScreen } from './DaoScreen';
import { ArbitrationScreen } from './ArbitrationScreen';
import { ethers, TransactionResponse } from 'ethers';
import { format, formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ReputationInfoSheet } from '../modals/ReputationInfoSheet';
import { SellerProfileScreen } from './SellerProfileScreen';
import { Avatar } from '../shared/Avatar';
import { 
  TbWallet, 
  TbTrophy, 
  TbHeart, 
  TbList, 
  TbShoppingBag, 
  TbTrendingUp, 
  TbBuildingBank, 
  TbScale, 
  TbInfoCircle, 
  TbBook,
  TbRocket,
  TbShieldCheck,
  TbCoins,
  TbBolt,
  TbDatabase
} from 'react-icons/tb';

interface DateFilterModalContentProps {
    initialStartDate: string;
    initialEndDate: string;
    onApply: (dates: { startDate: string, endDate: string }) => void;
}

// New component replacing IOSIcon
const MenuIcon: React.FC<{ icon: React.ElementType; color: string }> = ({ icon: Icon, color }) => (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-800 ${color}`}>
        <Icon size={22} />
    </div>
);

const DateFilterModalContent: React.FC<DateFilterModalContentProps> = ({ 
    initialStartDate, 
    initialEndDate, 
    onApply 
}) => {
    const { hideModal } = useModal();
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
    };

    const handleApplyClick = () => {
        onApply({ startDate, endDate });
        hideModal();
    };

    const isValidDateRange = startDate && endDate && startDate > endDate;

    return (
        <div className="p-4 pt-0 space-y-4">
            <h3 className="text-lg font-bold text-white text-center mb-4">Фильтр по дате</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                    <label className="text-xs text-gray-400 block mb-1">От</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-xs sm:text-sm min-w-0 appearance-none" 
                    />
                </div>
                <div className="min-w-0">
                    <label className="text-xs text-gray-400 block mb-1">До</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-xs sm:text-sm min-w-0 appearance-none" 
                    />
                </div>
            </div>
            {isValidDateRange && (
                <p className="text-red-400 text-xs text-center">
                    Дата начала не может быть позже даты окончания
                </p>
            )}
            <div className="flex gap-3 pt-2">
                <button 
                    onClick={handleReset} 
                    className="w-full py-2.5 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                    Сбросить
                </button>
                <button 
                    onClick={handleApplyClick} 
                    disabled={isValidDateRange}
                    className="w-full py-2.5 bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 disabled:bg-gray-600 disabled:shadow-none transition-colors"
                >
                    Применить
                </button>
            </div>
        </div>
    );
};

interface MyListingsScreenProps {
    listings: Listing[]; 
    onEdit: (listing: Listing) => void; 
    onBoost: (listing: Listing) => void; 
    onListingClick: (listing: Listing) => void; 
    onArchive: (listingId: string) => void;
    onRestore: (listingId: string) => void;
    onBack: () => void;
}

export const MyListingsScreen: React.FC<MyListingsScreenProps> = ({ 
    listings = [], 
    onEdit, 
    onBoost, 
    onListingClick, 
    onBack, 
    onArchive, 
    onRestore 
}) => {
    const { showModal } = useModal();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    type ListingFilter = 'available' | 'archived';
    const [activeFilter, setActiveFilter] = useState<ListingFilter>('available');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleOpenFilter = () => {
        showModal(
            <DateFilterModalContent 
                initialStartDate={startDate} 
                initialEndDate={endDate} 
                onApply={({ startDate, endDate }) => { 
                    setStartDate(startDate); 
                    setEndDate(endDate); 
                }} 
            />
        );
    };

    const statusMap: Record<Listing['status'], { text: string; color: string; }> = {
        'Available': { text: 'Активно', color: 'text-green-500' },
        'In Escrow': { text: 'В Escrow', color: 'text-yellow-500' },
        'Sold': { text: 'Продано', color: 'text-gray-500' },
        'Archived': { text: 'В архиве', color: 'text-gray-500' },
    };

    const sortedAndFilteredListings = useMemo(() => {
        let filtered = listings.filter(l => {
            if (activeFilter === 'available') return l.status === 'Available';
            if (activeFilter === 'archived') return l.status === 'Archived';
            return false;
        });
        
        const start = startDate ? parseISO(startDate) : null;
        const end = endDate ? parseISO(endDate) : null;

        if (start && isValid(start)) {
            filtered = filtered.filter(p => parseISO(p.createdAt) >= start);
        }
        if (end && isValid(end)) {
            const nextDay = new Date(end);
            nextDay.setDate(nextDay.getDate() + 1);
            filtered = filtered.filter(p => parseISO(p.createdAt) < nextDay);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [listings, activeFilter, startDate, endDate]);
  
    const handleCopy = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => {
            setCopiedId(null);
        }, 2000);
    };

    const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
        const statusDetails = statusMap[listing.status] || { text: 'Неизвестно', color: 'text-gray-400' };

        const handleCardClick = () => {
            onListingClick(listing);
        };

        const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
            e.stopPropagation();
            action();
        };

        return (
            <GlassPanel className="p-3 flex flex-col gap-2.5">
                <div 
                    onClick={handleCardClick}
                    className="cursor-pointer active:opacity-80 transition-opacity"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick();
                        }
                    }}
                >
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="text-base font-bold text-white flex-1 min-w-0 truncate">
                            {listing.title}
                        </h3>
                        <div className={`flex items-center gap-1 text-sm font-semibold ${statusDetails.color} flex-shrink-0`}>
                            <span>{statusDetails.text}</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(listing.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </p>
                </div>
                
                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm pt-2.5 border-t border-white/10">
                    <span className="text-gray-400">Цена</span>
                    <span className="text-white text-right font-medium">
                        {listing.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {listing.currency}
                    </span>
                    
                    <span className="text-gray-400">В наличии</span>
                    <span className="text-white text-right font-medium">{listing.quantity} шт.</span>

                    <span className="text-gray-400">ID объявления</span>
                    <div className="text-white font-mono text-xs text-right">
                        {copiedId === listing.id ? (
                            <span className="bg-green-500/20 text-green-300 font-sans font-semibold px-2 py-0.5 rounded-md">
                                Скопировано
                            </span>
                        ) : (
                            <button 
                                onClick={(e) => handleCopy(e, listing.id)}
                                className="hover:text-cyan-400 active:text-cyan-300 transition-colors"
                                aria-label="Копировать ID объявления"
                            >
                                {listing.id}
                            </button>
                        )}
                    </div>
                </div>
                
                {listing.status === 'Archived' ? (
                    <div className="flex justify-end items-center pt-2.5 border-t border-white/10">
                        <button
                            onClick={(e) => handleButtonClick(e, () => onRestore(listing.id))}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-green-400 active:text-green-300 transition-colors"
                        >
                            <ClipboardDocumentListIcon className="w-4 h-4" />
                            Восстановить
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-end items-center gap-4 pt-2.5 border-t border-white/10">
                        {listing.status === 'Available' && (
                            <>
                                <button
                                    onClick={(e) => handleButtonClick(e, () => onBoost(listing))}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-yellow-400 active:text-yellow-300 transition-colors"
                                >
                                    <ArrowUpIcon className="w-4 h-4" />
                                    Продвигать
                                </button>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <button
                                    onClick={(e) => handleButtonClick(e, () => onEdit(listing))}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 active:text-cyan-300 transition-colors"
                                >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Изменить
                                </button>
                                <div className="w-px h-4 bg-gray-600"></div>
                            </>
                        )}
                        {listing.status === 'Available' && (
                            <button
                                onClick={(e) => handleButtonClick(e, () => onArchive(listing.id))}
                                className="flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-red-400 active:text-red-300 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Архивировать
                            </button>
                        )}
                    </div>
                )}
            </GlassPanel>
        );
    };
  
    const listingFilters: { key: ListingFilter; label: string }[] = [
        { key: 'available', label: 'Активные' },
        { key: 'archived', label: 'Архив' },
    ];

    const emptyStateMessages: Record<ListingFilter, { title: string, description: string}> = {
        available: { 
            title: "Нет активных объявлений", 
            description: "Объявления, доступные для покупки, будут отображаться тут." 
        },
        archived: { 
            title: "Архив пуст", 
            description: "Удаленные вами объявления будут храниться здесь." 
        },
    };
    
    const currentEmptyState = emptyStateMessages[activeFilter];

    const handleFilterChange = (filter: ListingFilter) => {
        setActiveFilter(filter);
    };

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={onBack} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                    aria-label="Назад"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1">
                    Мои объявления
                </h1>
                <div className="w-10 h-10 flex items-center justify-end">
                    <button 
                        onClick={handleOpenFilter} 
                        className="p-2 text-white"
                        aria-label="Фильтры"
                    >
                        <FunnelIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
                <div className="grid grid-cols-2 gap-2">
                    {listingFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                activeFilter === f.key 
                                    ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' 
                                    : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
                            }`}
                            aria-pressed={activeFilter === f.key}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {sortedAndFilteredListings.length > 0 ? (
                    <div className="space-y-3">
                        {sortedAndFilteredListings.map(listing => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <GlassPanel className="text-center text-gray-400 py-12">
                        <p className="font-semibold text-white text-lg">{currentEmptyState.title}</p>
                        <p className="text-sm mt-1">{currentEmptyState.description}</p>
                    </GlassPanel>
                )}
            </main>
        </div>
    );
};

export const MyPurchasesScreen: React.FC<{ 
    purchases: Listing[]; 
    onPurchaseClick: (listing: Listing) => void; 
    disputes: Dispute[]; 
    onStartChat: (user: User) => void;
    onDisputeClick: (dispute: Dispute) => void;
    onBack: () => void;
}> = ({ purchases, onPurchaseClick, disputes, onStartChat, onDisputeClick, onBack }) => {
    const { user } = useWallet();
    const { showModal } = useModal();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    type PurchaseFilter = 'active' | 'completed' | 'disputed';
    const [activeFilter, setActiveFilter] = useState<PurchaseFilter>('active');
    const [copiedId, setCopiedId] = useState<string | null>(null);

     const handleOpenFilter = () => {
        showModal(<DateFilterModalContent initialStartDate={startDate} initialEndDate={endDate} onApply={({ startDate, endDate }) => { setStartDate(startDate); setEndDate(endDate); }} />);
    };
    
    const statusMap: Record<Listing['status'], { text: string; color: string; }> = {
        'Sold': { text: 'Завершено', color: 'text-green-500' },
        'In Escrow': { text: 'Активно', color: 'text-yellow-500' },
        'Available': { text: 'Недоступно', color: 'text-gray-400' },
        'Archived': { text: 'В архиве', color: 'text-gray-400' },
    };

    const sortedAndFilteredPurchases = useMemo(() => {
        const userPurchaseDisputeIds = new Set(
            disputes
                .filter(d => d.listing.buyer?.address === user?.address)
                .map(d => d.listing.id)
        );
        
        let filtered = purchases;

        if (activeFilter === 'active') {
            filtered = purchases.filter(p => 
                p.status === 'In Escrow' && 
                !userPurchaseDisputeIds.has(p.id)
            );
        } else if (activeFilter === 'completed') {
            filtered = purchases.filter(p => p.status === 'Sold');
        } else if (activeFilter === 'disputed') {
            filtered = purchases.filter(p => 
                userPurchaseDisputeIds.has(p.id) && 
                (p.status === 'In Escrow' || p.status === 'Sold')
            );
        }
        
        const start = startDate ? parseISO(startDate) : null;
        const end = endDate ? parseISO(endDate) : null;

        if (start && isValid(start)) {
            filtered = filtered.filter(p => parseISO(p.createdAt) >= start);
        }
        if (end && isValid(end)) {
            const nextDay = new Date(end);
            nextDay.setDate(nextDay.getDate() + 1);
            filtered = filtered.filter(p => parseISO(p.createdAt) < nextDay);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [purchases, activeFilter, disputes, startDate, endDate, user]);

    const handleCopy = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => {
            setCopiedId(null);
        }, 2000);
    };

    const PurchaseCard: React.FC<{ purchase: Listing }> = ({ purchase }) => {
        const dispute = disputes.find(d => d.listing.id === purchase.id);
        const isDisputed = !!dispute;
        const statusDetails = isDisputed 
            ? { text: 'Диспут', color: 'text-red-500' }
            : statusMap[purchase.status] || { text: 'Неизвестно', color: 'text-gray-400' };

        const handleCardClick = () => {
            onPurchaseClick(purchase);
        };

        const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
            e.stopPropagation();
            action();
        };

        return (
            <GlassPanel onClick={handleCardClick} className="p-3 cursor-pointer active:border-cyan-500/50 transition-all flex flex-col gap-2.5">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-base font-bold text-white flex-1 min-w-0 truncate">
                        {purchase.title}
                    </h3>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${statusDetails.color} flex-shrink-0`}>
                        <span>{statusDetails.text}</span>
                        <ChevronRightIcon className="w-5 h-5" />
                    </div>
                </div>

                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
                    <span className="text-gray-400">Продавец</span>
                    <span className="text-white text-right font-medium">{purchase.seller.username}</span>

                    <span className="text-gray-400">Сумма</span>
                    <span className="text-white text-right font-medium">{purchase.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {purchase.currency}</span>
                    
                    <span className="text-gray-400">ID объявления</span>
                    <div className="text-white font-mono text-xs text-right">
                         {copiedId === purchase.id ? (
                            <span className="bg-green-500/20 text-green-300 font-sans font-semibold px-2 py-0.5 rounded-md">
                                Скопировано
                            </span>
                        ) : (
                            <span className="cursor-pointer hover:text-cyan-400" onClick={(e) => handleCopy(e, purchase.id)}>
                                {purchase.id}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                    <button 
                        onClick={(e) => { 
                            if (isDisputed && dispute) {
                                handleButtonClick(e, () => onDisputeClick(dispute));
                            } else {
                                handleButtonClick(e, () => onStartChat(purchase.seller));
                            }
                        }}
                        className="text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
                    >
                        {isDisputed ? 'Спор' : 'Чат'}
                    </button>
                    <span className="text-sm text-gray-400 font-mono">
                        {format(new Date(purchase.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                </div>
            </GlassPanel>
        );
    };

    const purchaseFilters: { key: PurchaseFilter; label: string }[] = [
        { key: 'active', label: 'Активные' },
        { key: 'completed', label: 'Завершено' },
        { key: 'disputed', label: 'Диспут' },
    ];
    
    const emptyStateMessages: Record<PurchaseFilter, { title: string, description: string}> = {
        active: { title: "Нет активных сделок", description: "Сделки в Escrow, по которым нет спора, будут отображаться тут." },
        completed: { title: "Нет завершенных покупок", description: "После успешного завершения, ваши покупки появятся в этом разделе." },
        disputed: { title: "Нет открытых споров", description: "Если по какой-либо из ваших покупок возникнет спор, он будет виден здесь." },
    };
    const currentEmptyState = emptyStateMessages[activeFilter];

    const handleFilterChange = (filter: PurchaseFilter) => {
        setActiveFilter(filter);
    };

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1">
                    Мои покупки
                </h1>
                <div className="w-10 h-10 flex items-center justify-end">
                    <button onClick={handleOpenFilter} className="p-2 text-white">
                        <FunnelIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                    {purchaseFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                activeFilter === f.key 
                                    ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' 
                                    : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {sortedAndFilteredPurchases.length > 0 ? (
                    <div className="space-y-3">
                        {sortedAndFilteredPurchases.map(purchase => <PurchaseCard key={purchase.id} purchase={purchase} />)}
                    </div>
                ) : (
                    <GlassPanel className="text-center text-gray-400 py-12">
                        <p className="font-semibold text-white text-lg">{currentEmptyState.title}</p>
                        <p className="text-sm mt-1">{currentEmptyState.description}</p>
                    </GlassPanel>
                )}
            </main>
        </div>
    );
};

export const MySalesScreen: React.FC<{ 
    sales: Listing[]; 
    onSaleClick: (listing: Listing) => void; 
    disputes: Dispute[]; 
    onStartChat: (user: User) => void;
    onDisputeClick: (dispute: Dispute) => void;
    onBack: () => void;
}> = ({ sales, onSaleClick, disputes, onStartChat, onDisputeClick, onBack }) => {
    const { user } = useWallet();
    const { showModal } = useModal();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    type SaleFilter = 'active' | 'completed' | 'disputed';
    const [activeFilter, setActiveFilter] = useState<SaleFilter>('active');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleOpenFilter = () => {
        showModal(<DateFilterModalContent initialStartDate={startDate} initialEndDate={endDate} onApply={({ startDate, endDate }) => { setStartDate(startDate); setEndDate(endDate); }} />);
    };
    
    const statusMap: Record<Listing['status'], { text: string; color: string; }> = {
        'Sold': { text: 'Завершено', color: 'text-green-500' },
        'In Escrow': { text: 'Активно', color: 'text-yellow-500' },
        'Available': { text: 'Недоступно', color: 'text-gray-400' },
        'Archived': { text: 'В архиве', color: 'text-gray-400' },
    };

    const sortedAndFilteredSales = useMemo(() => {
        const userSaleDisputeIds = new Set(
            disputes
                .filter(d => d.listing.seller.address === user?.address)
                .map(d => d.listing.id)
        );

        let filtered = sales;

        if (activeFilter === 'active') {
            filtered = sales.filter(s => 
                s.status === 'In Escrow' && 
                !userSaleDisputeIds.has(s.id)
            );
        } else if (activeFilter === 'completed') {
            filtered = sales.filter(s => s.status === 'Sold');
        } else if (activeFilter === 'disputed') {
            filtered = sales.filter(s => 
                userSaleDisputeIds.has(s.id) && 
                (s.status === 'In Escrow' || s.status === 'Sold')
            );
        }

        const start = startDate ? parseISO(startDate) : null;
        const end = endDate ? parseISO(endDate) : null;

        if (start && isValid(start)) {
            filtered = filtered.filter(p => parseISO(p.createdAt) >= start);
        }
        if (end && isValid(end)) {
            const nextDay = new Date(end);
            nextDay.setDate(nextDay.getDate() + 1);
            filtered = filtered.filter(p => parseISO(p.createdAt) < nextDay);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sales, activeFilter, disputes, startDate, endDate, user]);

    const handleCopy = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => {
            setCopiedId(null);
        }, 2000);
    };

    const SaleCard: React.FC<{ sale: Listing }> = ({ sale }) => {
        const dispute = disputes.find(d => d.listing.id === sale.id);
        const isDisputed = !!dispute;
        const statusDetails = isDisputed 
            ? { text: 'Диспут', color: 'text-red-500' }
            : statusMap[sale.status] || { text: 'Неизвестно', color: 'text-gray-400' };

        const handleCardClick = () => {
            onSaleClick(sale);
        };

        const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
            e.stopPropagation();
            action();
        };

        return (
            <GlassPanel onClick={handleCardClick} className="p-3 cursor-pointer active:border-cyan-500/50 transition-all flex flex-col gap-2.5">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-base font-bold text-white flex-1 min-w-0 truncate">
                        {sale.title}
                    </h3>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${statusDetails.color} flex-shrink-0`}>
                        <span>{statusDetails.text}</span>
                        <ChevronRightIcon className="w-5 h-5" />
                    </div>
                </div>

                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
                    <span className="text-gray-400">Покупатель</span>
                    <span className="text-white text-right font-medium">{sale.buyer?.username || 'Не указан'}</span>

                    <span className="text-gray-400">Сумма</span>
                    <span className="text-white text-right font-medium">{sale.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sale.currency}</span>
                    
                    <span className="text-gray-400">ID объявления</span>
                    <div className="text-white font-mono text-xs text-right">
                         {copiedId === sale.id ? (
                            <span className="bg-green-500/20 text-green-300 font-sans font-semibold px-2 py-0.5 rounded-md">
                                Скопировано
                            </span>
                        ) : (
                            <span className="cursor-pointer hover:text-cyan-400" onClick={(e) => handleCopy(e, sale.id)}>
                                {sale.id}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                    <button 
                        onClick={(e) => { 
                            if (isDisputed && dispute) {
                                handleButtonClick(e, () => onDisputeClick(dispute));
                            } else if (sale.buyer) {
                                handleButtonClick(e, () => onStartChat(sale.buyer!));
                            }
                        }} 
                        disabled={!sale.buyer && !isDisputed}
                        className="text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50"
                    >
                        {isDisputed ? 'Спор' : 'Чат'}
                    </button>
                    <span className="text-sm text-gray-400 font-mono">
                        {format(new Date(sale.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                </div>
            </GlassPanel>
        );
    };

    const saleFilters: { key: SaleFilter; label: string }[] = [
        { key: 'active', label: 'Активные' },
        { key: 'completed', label: 'Завершено' },
        { key: 'disputed', label: 'Диспут' },
    ];
    
    const emptyStateMessages: Record<SaleFilter, { title: string, description: string}> = {
        active: { title: "Нет активных продаж", description: "Сделки в Escrow, по которым нет спора, будут отображаться тут." },
        completed: { title: "Нет завершенных продаж", description: "После успешного завершения, ваши продажи появятся в этом разделе." },
        disputed: { title: "Нет открытых споров", description: "Если по какой-либо из ваших продаж возникнет спор, он будет виден здесь." },
    };
    const currentEmptyState = emptyStateMessages[activeFilter];

    const handleFilterChange = (filter: SaleFilter) => {
        setActiveFilter(filter);
    };

    return (
        <div className="h-full flex flex-col bg-black">
             <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1">
                    Мои продажи
                </h1>
                <div className="w-10 h-10 flex items-center justify-end">
                    <button onClick={handleOpenFilter} className="p-2 text-white">
                        <FunnelIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                    {saleFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                activeFilter === f.key 
                                    ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' 
                                    : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {sortedAndFilteredSales.length > 0 ? (
                    <div className="space-y-3">
                        {sortedAndFilteredSales.map(sale => <SaleCard key={sale.id} sale={sale} />)}
                    </div>
                ) : (
                    <GlassPanel className="text-center text-gray-400 py-12">
                        <p className="font-semibold text-white text-lg">{currentEmptyState.title}</p>
                        <p className="text-sm mt-1">{currentEmptyState.description}</p>
                    </GlassPanel>
                )}
            </main>
        </div>
    );
};

export const MyReputationScreen: React.FC<{ reviews: Review[], onBack: () => void }> = ({ reviews, onBack }) => {
    const { user, mintUnlockedBadge } = useWallet();

    const handleMintClick = useCallback((badge: Badge) => {
        mintUnlockedBadge(badge);
    }, [mintUnlockedBadge]);

    const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
        const stars = Math.round(rating / 20);
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
        return <div className="w-10 h-10 flex items-center justify-center bg-yellow-500/10 rounded-lg text-yellow-400">{icons[icon] || <TrophyIcon />}</div>;
    };

    if (!user) return null;

    return (
        <div className="h-full flex flex-col bg-black">
             <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1 pr-10">
                    Моя репутация
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ваши Баджи</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {mockBadges.map(badge => {
                            const isMinted = user.badges.some(b => b.id === badge.id);
                            const isUnlocked = user.unlockedBadges?.includes(badge.id);

                            const badgeState = isMinted ? 'minted' : isUnlocked ? 'unlocked' : 'locked';

                            return (
                                <GlassPanel key={badge.id} className={`p-3 flex flex-col justify-between transition-all duration-300 ${badgeState === 'locked' ? 'grayscale opacity-50' : ''}`}>
                                    <div>
                                        <div className="flex items-start gap-3">
                                            <div className="relative flex-shrink-0">
                                                <BadgeIcon icon={badge.icon} />
                                                {badgeState === 'locked' && <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"><LockClosedIcon className="w-5 h-5 text-gray-300"/></div>}
                                            </div>
                                            <div className='flex-1'>
                                                <p className="font-bold text-white text-sm">{badge.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{badgeState === 'locked' ? badge.condition : badge.description}</p>
                                            </div>
                                        </div>
                                        {badgeState !== 'locked' && (
                                            <div className="mt-3 pt-2 border-t border-white/10">
                                                <p className="font-semibold text-xs text-gray-300 mb-1.5">Награды:</p>
                                                <ul className="space-y-1">
                                                    {badge.perks.map((perk, index) => (
                                                        <li key={index} className="flex items-center gap-1.5 text-xs text-green-300">
                                                            <CheckCircleIcon className="w-3.5 h-3.5 text-green-400 flex-shrink-0"/>
                                                            <span>{perk}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {badgeState === 'unlocked' && (
                                        <button 
                                            onClick={() => handleMintClick(badge)}
                                            className="mt-3 w-full text-center py-1.5 bg-cyan-500/80 text-white text-xs font-semibold rounded-md hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
                                        >
                                            Сминтить за 1 USDC
                                        </button>
                                    )}
                                </GlassPanel>
                            )
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Последние отзывы</h3>
                    {reviews.length > 0 ? (
                        <div className="space-y-3">
                            {reviews.map(review => (
                                <GlassPanel key={review.id} className="p-3">
                                    <div className="flex items-start gap-3">
                                        <Avatar seed={review.buyerUsername} className="w-8 h-8" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-white text-sm">{review.buyerUsername}</p>
                                                <StarRating rating={review.rating} />
                                            </div>
                                            <p className="text-sm text-gray-300 mt-1">{review.comment}</p>
                                            <p className="text-xs text-gray-500 mt-2">{format(new Date(review.createdAt), "dd MMM yyyy", { locale: ru })}</p>
                                        </div>
                                    </div>
                                </GlassPanel>
                            ))}
                        </div>
                    ) : (
                        <GlassPanel className="p-4 text-center text-gray-400 text-sm">
                            <p>Вам еще не оставили ни одного отзыва.</p>
                        </GlassPanel>
                    )}
                </div>
            </main>
        </div>
    );
};

const AboutInfoSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <GlassPanel className="p-4">
        <div className="flex items-center mb-3">
            <div className="mr-3">{icon}</div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed space-y-3 hyphens-auto break-words">
            {children}
        </div>
    </GlassPanel>
);

const DebugInfoSection: React.FC = () => {
    const { tokenBalances } = useWallet();
    
    // Use config values and meta env
    const marketplaceAddress = config.MARKETPLACE_ADDRESS || 'Unknown';
    const subgraphUrl = process.env.VITE_SUBGRAPH_URL || 'Unknown';

    return (
        <GlassPanel className="p-4 border-t border-yellow-500/30">
            <div className="flex items-center mb-3">
                <div className="mr-3 text-yellow-400"><TbDatabase size={24}/></div>
                <h3 className="text-xl font-semibold text-white">Debug Info</h3>
            </div>
            <div className="text-xs text-gray-400 font-mono space-y-2 break-all">
                <p><strong className="text-gray-300">Network:</strong> {config.NETWORK_NAME}</p>
                <p><strong className="text-gray-300">Marketplace:</strong> {marketplaceAddress}</p>
                <p><strong className="text-gray-300">Subgraph:</strong> {subgraphUrl.substring(0, 30)}...</p>
                <p><strong className="text-gray-300">USDC Balance:</strong> {tokenBalances.USDC}</p>
            </div>
        </GlassPanel>
    );
};

export const AboutScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1 pr-10">
                    О проекте
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
                <AboutInfoSection icon={<InformationCircleIcon className="w-6 h-6 text-cyan-400"/>} title="DeMarket">
                    <p>Децентрализованный P2P-маркетплейс нового поколения.</p>
                    <p>Мы объединяем безопасность смарт-контрактов с удобством современных приложений.</p>
                </AboutInfoSection>
                <AboutInfoSection icon={<ShieldCheckIcon className="w-6 h-6 text-green-400"/>} title="Безопасность">
                    <p>Все сделки защищены Escrow-контрактом в сети Arbitrum.</p>
                </AboutInfoSection>
                 <AboutInfoSection icon={<TbBolt size={24} className="text-purple-400"/>} title="Уникальность">
                    <p>Ваша репутация и история сделок навсегда записаны в блокчейн.</p>
                </AboutInfoSection>
                
                <DebugInfoSection />
            </main>
        </div>
    );
}

export const SettingsScreen: React.FC<{ onBack: () => void, onEditLocation: () => void }> = ({ onBack, onEditLocation }) => {
    const { disconnectWallet } = useWallet();

    const handleDisconnect = () => {
        onBack(); // close modal first
        setTimeout(disconnectWallet, 300); // then disconnect
    }

    const handleEditLocationClick = () => {
        onBack(); // close this modal
        setTimeout(onEditLocation, 300); // open location modal
    }

    return (
        <div className="p-4 pt-0 space-y-3">
            <h2 className="text-lg font-bold text-white text-center">Настройки</h2>
            <div className="divide-y divide-white/10">
                <div onClick={handleEditLocationClick} className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-3">
                        <MapPinIcon className="w-6 h-6 text-gray-400" />
                        <span className="text-white">Изменить город</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </div>
                {/* Add other settings here if needed */}
            </div>
            <div className="pt-2">
                <button onClick={handleDisconnect} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 hover:bg-red-600 transition-colors">
                    Выйти
                </button>
            </div>
        </div>
    );
};

const ShimmerTxRow = () => (
     <div className="px-6 py-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-800"></div>
             <div>
                <div className="h-4 bg-gray-800 rounded w-28 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-20"></div>
            </div>
        </div>
         <div className="text-right">
            <div className="h-4 bg-gray-800 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-16"></div>
        </div>
    </div>
);

const TransactionRow: React.FC<{ tx: Transaction, currentUserAddress: string }> = ({ tx, currentUserAddress }) => {
    const isOut = tx.from.toLowerCase() === currentUserAddress.toLowerCase();
    const txType = isOut ? 'Отправка' : (tx.to.toLowerCase() === currentUserAddress.toLowerCase() ? 'Получение' : 'Взаимодействие');
    const peerAddress = isOut ? tx.to : tx.from;

    return (
        <a href={`https://arbiscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOut ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    {isOut ? <ArrowUpRightIcon className="w-5 h-5 text-red-400"/> : <ArrowDownLeftIcon className="w-5 h-5 text-green-400"/>}
                </div>
                <div>
                    <p className="text-white font-medium text-sm">{txType}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                       {peerAddress.substring(0,6)}...{peerAddress.substring(peerAddress.length-4)}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-semibold text-sm ${isOut ? 'text-red-400' : 'text-green-400'}`}>
                    {isOut ? '-' : '+'} {parseFloat(tx.value).toFixed(5)} {tx.asset}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNowStrict(new Date(tx.timestamp), { locale: ru, addSuffix: true })}
                </p>
            </div>
        </a>
    )
};

const AssetRow: React.FC<{
    icon: React.ReactNode;
    symbol: string;
    balance: string | undefined;
    pricePerToken: number;
}> = ({ icon, symbol, balance, pricePerToken }) => {
    const usdValue = parseFloat(balance || '0') * pricePerToken;

    return (
        <div className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <p className="text-white font-semibold text-base">{symbol}</p>
                    <p className="text-sm text-gray-400">${pricePerToken.toFixed(2)}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-white font-medium text-base">{balance ? parseFloat(balance).toFixed(4) : '0.0000'}</p>
                <p className="text-sm text-gray-400">${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </div>
    );
}

export const WalletScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { 
        user,
        nativeBalance,
        tokenBalances,
        totalBalanceUSD,
        transactions,
        isBalanceLoading,
        isHistoryLoading,
    } = useWallet();
    const { showModal } = useModal();
    const [activeTab, setActiveTab] = useState<'assets' | 'history'>('assets');
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (!user) return null;

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="sticky top-0 z-10 p-4 flex items-center justify-between bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-xl font-bold text-white">
                    Мой кошелек
                </h1>
                <div className="w-10 h-10" />
            </header>

            <main className="flex-1 overflow-y-auto pb-28">
                {/* Balance Section */}
                <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-400 font-medium tracking-wide">Общий баланс</p>
                    <p className="text-5xl font-bold text-white mt-3 tracking-tight">
                        ${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                     <div className="mt-10 flex justify-center items-center gap-12">
                        <button onClick={() => showModal(<DepositSheet address={user.address} />)} className="group flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/10 group-hover:bg-white/20 transition-all active:scale-95">
                                <ArrowDownCircleIcon className="w-8 h-8 text-cyan-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Депозит</span>
                        </button>
                        <button className="group flex flex-col items-center gap-3">
                             <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/10 group-hover:bg-white/20 transition-all active:scale-95">
                                <ArrowUpCircleIcon className="w-8 h-8 text-cyan-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Вывод</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 mb-6">
                    <div className="flex p-1 bg-white/10 rounded-xl">
                        <button
                            onClick={() => setActiveTab('assets')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'assets'
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Активы
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'history'
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            История
                        </button>
                    </div>
                </div>
                
                {/* Lists - Edge to Edge style with dividers */}
                <div className="border-t border-white/10">
                    {activeTab === 'assets' && (
                        <div>
                            {isBalanceLoading ? (
                                <div className="p-8 text-center text-gray-500">Загрузка...</div>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    <AssetRow icon={<ETHIcon className="w-10 h-10" />} symbol="ETH" balance={nativeBalance} pricePerToken={3500} />
                                    <AssetRow icon={<USDCIcon className="w-10 h-10" />} symbol="USDC" balance={tokenBalances.USDC} pricePerToken={1} />
                                    <AssetRow icon={<USDTIcon className="w-10 h-10" />} symbol="USDT" balance={tokenBalances.USDT} pricePerToken={1} />
                                    <AssetRow icon={<DMTIcon className="w-10 h-10" />} symbol="DMT" balance={tokenBalances.DMT} pricePerToken={0.85} />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                         <div>
                            {isHistoryLoading ? (
                                <div className="divide-y divide-white/10">
                                   {[...Array(3)].map((_, i) => <ShimmerTxRow key={i} />)}
                                </div>
                            ) : (
                                transactions.length > 0 ? (
                                     <div className="divide-y divide-white/10">
                                        {transactions.map(tx => <TransactionRow key={tx.hash} tx={tx} currentUserAddress={user.address} />)}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-gray-500">
                                        <p>Нет транзакций</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export const ProfileScreen: React.FC<{ 
    onNavigateRequest: (screen: React.ReactNode) => void;
    showModal: (content: React.ReactNode) => void;
    hideModal: () => void;
    onEditLocation: () => void;
    userListings: Listing[];
    userPurchases: Listing[];
    userSales: Listing[];
    favoritesCount: number;
    allListings: Listing[];
    favorites: string[];
    onListingClick: (listing: Listing) => void;
    onToggleFavorite: (listingId: string) => void;
    onEditListing: (listing: Listing) => void;
    onBoostListing: (listing: Listing) => void;
    disputes: Dispute[];
    onStartChat: (user: User) => void;
    onDisputeClick: (dispute: Dispute) => void;
    userReviews: Review[];
    onArchiveListing: (listingId: string) => void;
    onRestoreListing: (listingId: string) => void;
    onBack: () => void;
}> = (props) => {
    const { user, disconnectWallet, connectionType } = useWallet();
    const [isCopied, setIsCopied] = useState(false);

    if (!user) {
        return <ConnectWalletSheet isPageReplacement />;
    }

    const activeListingsCount = props.userListings.filter(l => l.status === 'Available').length;
    const activePurchasesCount = props.userPurchases.filter(p => p.status === 'In Escrow').length;
    const activeSalesCount = props.userSales.filter(s => s.status === 'In Escrow').length;
    // Removed mock data dependency here for arbitration count, using 0 for now as we don't fetch global stats yet
    const arbitrationCasesCount = 0; 

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(user.address);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const handleNavigate = (screen: React.ReactNode) => {
        props.onNavigateRequest(screen);
    };
    
    // Force display of full hex address formatted nicely
    const headerTitle = user.address 
        ? `0x${user.address.substring(2, 6)}...${user.address.substring(user.address.length - 4)}`
        : user.username;

    const headerSubtitle = `${user.rating.toFixed(0)}% (${user.reviews} отзывов)`;

    const handleViewOwnProfile = () => {
        props.onNavigateRequest(
            <SellerProfileScreen
                seller={user}
                allListings={props.allListings}
                allReviews={props.userReviews}
                onBack={props.onBack}
                onListingClick={props.onListingClick}
                onToggleFavorite={props.onToggleFavorite}
                favorites={props.favorites}
                hideListings={true}
            />
        );
    };

    const ProfileRow: React.FC<{ 
        icon: React.ReactNode; 
        label: string; 
        value?: string; 
        onClick: () => void;
        isLast?: boolean;
    }> = ({ icon, label, value, onClick, isLast }) => (
        <div 
            onClick={onClick} 
            className="flex pl-4 cursor-pointer transition-colors active:bg-white/5"
        >
            <div className="flex flex-col justify-center py-3 pr-3">
                {icon}
            </div>
            <div className={`flex-1 flex items-center justify-between py-3 mr-4 ${!isLast ? 'border-b border-white/15' : ''}`}>
                <span className="text-white text-base font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    {value && <span className="text-gray-400 text-sm">{value}</span>}
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="h-full bg-black overflow-y-auto">
            <div className="px-4 pt-12 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Профиль</h1>
                <button 
                    onClick={() => {
                        props.showModal(<SettingsScreen onBack={props.hideModal} onEditLocation={props.onEditLocation} />);
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-gray-400 hover:text-white"
                >
                    <Cog6ToothIcon className="w-6 h-6"/>
                </button>
            </div>
            <div className="px-4 pt-4 pb-28 space-y-4">
                <GlassPanel
                    className="p-4 cursor-pointer transition-colors"
                    onClick={handleViewOwnProfile}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewOwnProfile(); } }}
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 flex-shrink-0">
                             <Avatar seed={user.address} className="w-full h-full" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 h-7">
                                <button 
                                    onClick={handleCopy}
                                    className={`text-lg font-semibold truncate transition-all duration-200 focus:outline-none text-left font-mono ${isCopied ? 'text-green-400' : 'text-white hover:text-gray-300'}`}
                                >
                                    {isCopied ? 'Скопировано' : headerTitle}
                                </button>
                                {user.reputationTier !== 'none' && !isCopied && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            props.showModal(<ReputationInfoSheet />);
                                        }}
                                        aria-label="Показать информацию о репутации"
                                        className="animate-fadeIn"
                                    >
                                        <ReputationMedalIcon tier={user.reputationTier} className="w-7 h-7" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm text-gray-400">{headerSubtitle}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <MapPinIcon className="w-3 h-3" />
                                <span>
                                    {user.location?.city}
                                    {user.location?.region && !user.location.region.includes(user.location.city) 
                                        ? `, ${user.location.region}` 
                                        : `, ${user.location?.country}`
                                    }
                                </span>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    </div>
                </GlassPanel>

                <GlassPanel className="overflow-hidden">
                    <ProfileRow 
                        icon={<MenuIcon icon={TbWallet} color="text-cyan-400" />} 
                        label="Мой кошелек" 
                        onClick={() => handleNavigate(<WalletScreen onBack={props.onBack} />)} 
                    />
                    <ProfileRow 
                        icon={<MenuIcon icon={TbTrophy} color="text-yellow-400" />} 
                        label="Моя репутация" 
                        value={`${user.badges.length} баджей`} 
                        onClick={() => handleNavigate(<MyReputationScreen onBack={props.onBack} reviews={props.userReviews} />)} 
                    />
                    <ProfileRow 
                        icon={<MenuIcon icon={TbHeart} color="text-red-500" />} 
                        label="Избранное" 
                        value={`${props.favoritesCount}`} 
                        onClick={() => handleNavigate(<FavoritesScreen isSubScreen listings={props.allListings} favorites={props.favorites} onListingClick={props.onListingClick} onToggleFavorite={props.onToggleFavorite} onBack={props.onBack} />)} 
                        isLast={true}
                    />
                </GlassPanel>
                <GlassPanel className="overflow-hidden">
                    <ProfileRow 
                        icon={<MenuIcon icon={TbList} color="text-blue-400" />} 
                        label="Мои объявления" 
                        value={`Активные: ${activeListingsCount}`} 
                        onClick={() => handleNavigate(<MyListingsScreen onBack={props.onBack} listings={props.userListings} onEdit={props.onEditListing} onBoost={props.onBoostListing} onListingClick={props.onListingClick} onArchive={props.onArchiveListing} onRestore={props.onRestoreListing} />)} 
                    />
                    <ProfileRow 
                        icon={<MenuIcon icon={TbShoppingBag} color="text-emerald-400" />} 
                        label="Мои покупки" 
                        value={`Активно: ${activePurchasesCount}`} 
                        onClick={() => handleNavigate(<MyPurchasesScreen onBack={props.onBack} purchases={props.userPurchases} onPurchaseClick={props.onListingClick} disputes={props.disputes} onStartChat={props.onStartChat} onDisputeClick={props.onDisputeClick} />)} 
                    />
                    <ProfileRow 
                        icon={<MenuIcon icon={TbTrendingUp} color="text-green-400" />} 
                        label="Мои продажи" 
                        value={`Активно: ${activeSalesCount}`} 
                        onClick={() => handleNavigate(<MySalesScreen onBack={props.onBack} sales={props.userSales} onSaleClick={props.onListingClick} disputes={props.disputes} onStartChat={props.onStartChat} onDisputeClick={props.onDisputeClick} />)} 
                        isLast={true}
                    />
                </GlassPanel>
                <GlassPanel className="overflow-hidden">
                    <ProfileRow 
                        icon={<MenuIcon icon={TbBuildingBank} color="text-purple-400" />} 
                        label="Управление DAO" 
                        value="Голосования: 0" 
                        onClick={() => handleNavigate(<DaoScreen onBack={props.onBack} />)} 
                    />
                    <ProfileRow 
                        icon={<MenuIcon icon={TbScale} color="text-orange-400" />} 
                        label="Арбитраж" 
                        value={`Споры: ${arbitrationCasesCount}`} 
                        onClick={() => handleNavigate(<ArbitrationScreen onBack={props.onBack} />)} 
                        isLast={true}
                    />
                </GlassPanel>
                <GlassPanel className="overflow-hidden">
                    <ProfileRow 
                        icon={<MenuIcon icon={TbInfoCircle} color="text-sky-400" />} 
                        label="О проекте" 
                        onClick={() => handleNavigate(<AboutScreen onBack={props.onBack}/>)} 
                    />
                    <ProfileRow 
                        icon={<MenuIcon icon={TbBook} color="text-indigo-400" />} 
                        label="FAQ & Помощь" 
                        onClick={() => handleNavigate(<FaqScreen onBack={props.onBack} />)} 
                        isLast={true}
                    />
                </GlassPanel>
                <button 
                    onClick={() => {
                        disconnectWallet();
                    }}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                >
                    Выйти
                </button>
            </div>
        </div>
    );
};
