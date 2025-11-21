
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { GlassPanel } from '../shared/GlassPanel';
import { useModal } from '../../hooks/useModal';
import { ChevronRightIcon, RocketLaunchIcon, SparklesIcon, ClipboardDocumentListIcon, BanknotesIcon, ShieldCheckIcon, BitcoinIcon, ChevronLeftIcon, CheckCircleIcon, SearchIcon, FilterIcon, QuestionMarkCircleIcon, TrophyIcon, PencilSquareIcon, ArrowUpRightIcon, ArrowDownLeftIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowsRightLeftIcon, Cog6ToothIcon, ClipboardDocumentIcon, InformationCircleIcon, ScaleIcon, HeartIcon, MapPinIcon, ChatBubbleOvalLeftEllipsisIcon, FunnelIcon, XCircleIcon, TrashIcon, ArrowUpIcon, LockClosedIcon, UserCircleIcon, Squares2X2Icon, PlusCircleIcon, DMTIcon, ETHIcon, USDCIcon, USDTIcon, ReputationMedalIcon, HandThumbDownIcon, HandThumbUpIcon } from '../icons/Icons';
import { ConnectWalletSheet } from '../modals/ConnectWalletSheet';
import { DepositSheet } from '../modals/DepositSheet';
import { FavoritesScreen } from './FavoritesScreen';
import { FaqScreen } from './FaqScreen';
import { mockArbitrationCases, mockBadges } from '../../services/mockData';
import { Listing, Review, Badge, Transaction, User, Dispute } from '../../types';
import { DaoScreen } from './DaoScreen';
import { ArbitrationScreen } from './ArbitrationScreen';
import { ethers, TransactionResponse } from 'ethers';
import { format, formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ReputationInfoSheet } from '../modals/ReputationInfoSheet';
import { SellerProfileScreen } from './SellerProfileScreen';
import { Avatar } from '../shared/Avatar';

interface DateFilterModalContentProps {
    initialStartDate: string;
    initialEndDate: string;
    onApply: (dates: { startDate: string, endDate: string }) => void;
}

const IOSIcon: React.FC<{ emoji: string; }> = ({ emoji }) => (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800">
        <span className="text-xl">{emoji}</span>
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
