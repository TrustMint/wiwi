import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { GlassPanel } from '../shared/GlassPanel';
import { useModal } from '../../hooks/useModal';
import { ChevronRightIcon, RocketLaunchIcon, SparklesIcon, ClipboardDocumentListIcon, BanknotesIcon, ShieldCheckIcon, BitcoinIcon, ChevronLeftIcon, CheckCircleIcon, SearchIcon, FilterIcon, QuestionMarkCircleIcon, TrophyIcon, PencilSquareIcon, ArrowUpRightIcon, ArrowDownLeftIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowsRightLeftIcon, Cog6ToothIcon, ClipboardDocumentIcon, InformationCircleIcon, ScaleIcon, HeartIcon, MapPinIcon, ChatBubbleOvalLeftEllipsisIcon, FunnelIcon, XCircleIcon, TrashIcon, ArrowUpIcon, LockClosedIcon, UserCircleIcon, Squares2X2Icon, PlusCircleIcon, DMTIcon } from '../icons/Icons';
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

interface DateFilterModalContentProps {
    initialStartDate: string;
    initialEndDate: string;
    onApply: (dates: { startDate: string, endDate: string }) => void;
}

// FIX: Added missing IOSIcon component definition. This component is used throughout the profile screens but was not defined.
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
                <div>
                    <label className="text-xs text-gray-400 block mb-1">От</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm" 
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">До</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm" 
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

    type ListingFilter = 'all' | 'available' | 'sold' | 'archived';
    const [activeFilter, setActiveFilter] = useState<ListingFilter>('all');
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
        let filtered = listings;

        switch(activeFilter) {
            case 'available':
                filtered = listings.filter(l => l.status === 'Available');
                break;
            case 'sold':
                filtered = listings.filter(l => l.status === 'Sold');
                break;
            case 'archived':
                filtered = listings.filter(l => l.status === 'Archived');
                break;
            case 'all':
            default:
                filtered = listings.filter(l => l.status !== 'Archived');
                break;
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

        return (
            <GlassPanel className="p-3 flex flex-col gap-2.5">
                <div 
                    onClick={() => onListingClick(listing)} 
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onListingClick(listing);
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
                                className="hover:text-cyan-400 transition-colors"
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
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onRestore(listing.id); 
                            }}
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-green-400 transition-colors"
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
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onBoost(listing); 
                                    }}
                                    className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors"
                                >
                                    <ArrowUpIcon className="w-4 h-4" />
                                    Продвигать
                                </button>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <button
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onEdit(listing); 
                                    }}
                                    className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors"
                                >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    Изменить
                                </button>
                                <div className="w-px h-4 bg-gray-600"></div>
                            </>
                        )}
                        {listing.status === 'Available' && (
                            <button
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onArchive(listing.id); 
                                }}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-red-400 transition-colors"
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
        { key: 'all', label: 'Все' },
        { key: 'available', label: 'Активные' },
        { key: 'sold', label: 'Продано' },
        { key: 'archived', label: 'Архив' },
    ];

    const emptyStateMessages: Record<ListingFilter, { title: string, description: string}> = {
        all: { 
            title: "У вас пока нет объявлений", 
            description: "Когда вы создадите свое первое объявление, оно появится здесь." 
        },
        available: { 
            title: "Нет активных объявлений", 
            description: "Объявления, доступные для покупки, будут отображаться тут." 
        },
        sold: { 
            title: "Нет проданных товаров", 
            description: "После успешного завершения, ваши проданные товары появятся в этом разделе." 
        },
        archived: { 
            title: "Архив пуст", 
            description: "Удаленные вами объявления будут храниться здесь." 
        },
    };
    
    const currentEmptyState = emptyStateMessages[activeFilter];

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2"
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
                <div className="p-1 bg-black/20 rounded-lg grid grid-cols-4 gap-1">
                    {listingFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`w-full py-1 rounded-md text-sm font-semibold transition-all duration-300 ${
                                activeFilter === f.key 
                                    ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' 
                                    : 'text-gray-300 hover:bg-white/5'
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
    const { showModal } = useModal();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    type PurchaseFilter = 'all' | 'active' | 'completed' | 'disputed';
    const [activeFilter, setActiveFilter] = useState<PurchaseFilter>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

     const handleOpenFilter = () => {
        showModal(<DateFilterModalContent initialStartDate={startDate} initialEndDate={endDate} onApply={({ startDate, endDate }) => { setStartDate(startDate); setEndDate(endDate); }} />);
    };
    
    const statusMap: Record<Listing['status'], { text: string; color: string; }> = {
        'Sold': { text: 'Завершено', color: 'text-green-500' },
        'In Escrow': { text: 'Активно', color: 'text-yellow-500' },
        'Available': { text: 'Недоступно', color: 'text-gray-400' }, // Should not appear
        'Archived': { text: 'В архиве', color: 'text-gray-400' },
    };

    const sortedAndFilteredPurchases = useMemo(() => {
        let filtered = purchases;
        const disputeListingIds = disputes.map(d => d.listing.id);

        // Filter by status tab
        switch(activeFilter) {
            case 'all':
                // No status filtering needed for 'all'
                filtered = purchases;
                break;
            case 'active':
                // Active means In Escrow AND not disputed
                filtered = purchases.filter(p => p.status === 'In Escrow' && !disputeListingIds.includes(p.id));
                break;
            case 'completed':
                filtered = purchases.filter(p => p.status === 'Sold');
                break;
            case 'disputed':
                // Disputed means it has an active dispute entry
                filtered = purchases.filter(p => disputeListingIds.includes(p.id)); 
                break;
        }

        // Filter by date range
        const start = startDate ? parseISO(startDate) : null;
        const end = endDate ? parseISO(endDate) : null;

        if (start && isValid(start)) {
            filtered = filtered.filter(p => parseISO(p.createdAt) >= start);
        }
        if (end && isValid(end)) {
            // Add 1 day to the end date to make it inclusive
            end.setDate(end.getDate() + 1);
            filtered = filtered.filter(p => parseISO(p.createdAt) < end);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [purchases, activeFilter, disputes, startDate, endDate]);

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

        return (
            <GlassPanel onClick={() => onPurchaseClick(purchase)} className="p-3 cursor-pointer hover:border-cyan-500/50 transition-all flex flex-col gap-2.5">
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
                    <span className="text-gray-400">Сумма</span>
                    <span className="text-white text-right font-medium">{purchase.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {purchase.currency}</span>
                    
                    <span className="text-gray-400">ID объявления</span>
                    <div className="text-white font-mono text-xs text-right">
                         {copiedId === purchase.id ? (
                            <span className="bg-green-500/20 text-green-300 font-sans font-semibold px-2 py-0.5 rounded-md">
                                Скопировано
                            </span>
                        ) : (
                            <span className="cursor-pointer" onClick={(e) => handleCopy(e, purchase.id)}>
                                {purchase.id}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isDisputed && dispute) {
                                onDisputeClick(dispute);
                            } else {
                                onStartChat(purchase.seller); 
                            }
                        }}
                        className="text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20 transition-colors"
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
        { key: 'all', label: 'Все' },
        { key: 'active', label: 'Активные' },
        { key: 'completed', label: 'Завершено' },
        { key: 'disputed', label: 'Диспут' },
    ];
    
    const emptyStateMessages: Record<PurchaseFilter, { title: string, description: string}> = {
        all: { title: "У вас пока нет покупок", description: "Когда вы совершите свою первую сделку, она появится здесь." },
        active: { title: "Нет активных сделок", description: "Сделки в Escrow, по которым нет спора, будут отображаться тут." },
        completed: { title: "Нет завершенных покупок", description: "После успешного завершения, ваши покупки появятся в этом разделе." },
        disputed: { title: "Нет открытых споров", description: "Если по какой-либо из ваших покупок возникнет спор, он будет виден здесь." },
    };
    const currentEmptyState = emptyStateMessages[activeFilter];

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="p-2 -ml-2">
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
                <div className="p-1 bg-black/20 rounded-lg grid grid-cols-4 gap-1">
                    {purchaseFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`w-full py-1 rounded-md text-sm font-semibold transition-all duration-300 ${activeFilter === f.key ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
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
    const { showModal } = useModal();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    type SaleFilter = 'all' | 'active' | 'completed' | 'disputed';
    const [activeFilter, setActiveFilter] = useState<SaleFilter>('all');
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
        let filtered = sales;
        const disputeListingIds = disputes.map(d => d.listing.id);

        switch(activeFilter) {
            case 'all':
                filtered = sales;
                break;
            case 'active':
                filtered = sales.filter(s => s.status === 'In Escrow' && !disputeListingIds.includes(s.id));
                break;
            case 'completed':
                filtered = sales.filter(s => s.status === 'Sold');
                break;
            case 'disputed':
                filtered = sales.filter(s => disputeListingIds.includes(s.id)); 
                break;
        }

        const start = startDate ? parseISO(startDate) : null;
        const end = endDate ? parseISO(endDate) : null;

        if (start && isValid(start)) {
            filtered = filtered.filter(p => parseISO(p.createdAt) >= start);
        }
        if (end && isValid(end)) {
            end.setDate(end.getDate() + 1);
            filtered = filtered.filter(p => parseISO(p.createdAt) < end);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sales, activeFilter, disputes, startDate, endDate]);

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

        return (
            <GlassPanel onClick={() => onSaleClick(sale)} className="p-3 cursor-pointer hover:border-cyan-500/50 transition-all flex flex-col gap-2.5">
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
                    <span className="text-white text-right font-medium">{sale.buyer?.username || 'N/A'}</span>

                    <span className="text-gray-400">Сумма</span>
                    <span className="text-white text-right font-medium">{sale.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sale.currency}</span>
                    
                    <span className="text-gray-400">ID объявления</span>
                    <div className="text-white font-mono text-xs text-right">
                         {copiedId === sale.id ? (
                            <span className="bg-green-500/20 text-green-300 font-sans font-semibold px-2 py-0.5 rounded-md">
                                Скопировано
                            </span>
                        ) : (
                            <span className="cursor-pointer" onClick={(e) => handleCopy(e, sale.id)}>
                                {sale.id}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isDisputed && dispute) {
                                onDisputeClick(dispute);
                            } else if (sale.buyer) {
                                onStartChat(sale.buyer); 
                            }
                        }} 
                        disabled={!sale.buyer}
                        className="text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
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
        { key: 'all', label: 'Все' },
        { key: 'active', label: 'Активные' },
        { key: 'completed', label: 'Завершено' },
        { key: 'disputed', label: 'Диспут' },
    ];
    
    const emptyStateMessages: Record<SaleFilter, { title: string, description: string}> = {
        all: { title: "У вас пока нет продаж", description: "Когда вы совершите свою первую сделку, она появится здесь." },
        active: { title: "Нет активных продаж", description: "Сделки в Escrow, по которым нет спора, будут отображаться тут." },
        completed: { title: "Нет завершенных продаж", description: "После успешного завершения, ваши продажи появятся в этом разделе." },
        disputed: { title: "Нет открытых споров", description: "Если по какой-либо из ваших продаж возникнет спор, он будет виден здесь." },
    };
    const currentEmptyState = emptyStateMessages[activeFilter];

    return (
        <div className="h-full flex flex-col bg-black">
             <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="p-2 -ml-2">
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
                <div className="p-1 bg-black/20 rounded-lg grid grid-cols-4 gap-1">
                    {saleFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`w-full py-1 rounded-md text-sm font-semibold transition-all duration-300 ${activeFilter === f.key ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
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

    const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
        const stars = Math.round(rating / 20); // Convert 0-100 to 0-5
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < stars ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
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
        return <div className="w-10 h-10 flex items-center justify-center bg-yellow-500/10 rounded-lg text-yellow-400">{icons[icon] || <TrophyIcon />}</div>;
    };

    if (!user) return null;

    return (
        <div className="h-full flex flex-col bg-black">
             <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="p-2 -ml-2">
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
                                            onClick={() => mintUnlockedBadge(badge)}
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
                                        <img src={review.buyerAvatar} alt={review.buyerUsername} className="w-8 h-8 rounded-full" />
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

export const AboutScreen: React.FC<{onBack: ()=>void}> = ({onBack}) => (
    <div className="h-full flex flex-col bg-black">
        <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
            <button onClick={onBack} className="p-2 -ml-2">
                <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white text-center flex-1 pr-10">
                О проекте
            </h1>
        </header>
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
            <AboutInfoSection icon={<IOSIcon emoji="🚀"/>} title="Наше Видение: Устойчивая Экономика">
                <p>Традиционные P2P-платформы, такие как Avito и Kufar, доминируют на рынке СНГ, но их централизация создает уязвимости. Растущие комиссии, цензура и зависимость от традиционной банковской системы ограничивают финансовую свободу пользователей, особенно в условиях санкций.</p>
                <p><strong>DeMarket — это не просто "Avito на крипте".</strong> Это устойчивая к цензуре экономическая инфраструктура, созданная для обеспечения трансграничных P2P-сделок и финансовой независимости.</p>
            </AboutInfoSection>

            <AboutInfoSection icon={<IOSIcon emoji="🛡️"/>} title="Технологический Фундамент">
                <p>Мы используем передовые Web3-технологии для создания быстрой, дешевой и безопасной платформы:</p>
                <ul className="list-none space-y-2 mt-2">
                    <li><strong className="text-white">L2-Блокчейн (Arbitrum):</strong> Для обеспечения почти мгновенных транзакций (финализация ~30 сек) и сверхнизких комиссий (менее $0.1), мы выбрали ведущее Layer-2 решение. Это позволяет нам конкурировать по скорости с централизованными биржами.</li>
                    <li><strong className="text-white">Смарт-Контракт Escrow:</strong> Каждая сделка защищена автоматизированным Escrow. Средства покупателя блокируются на независимом контракте и переводятся продавцу только после подтверждения получения товара, что полностью исключает риск мошенничества.</li>
                    <li><strong className="text-white">PWA (Progressive Web App):</strong> Наш выбор в пользу PWA обеспечивает максимальную доступность и устойчивость к цензуре. Приложение не зависит от App Store и Google Play, его невозможно удалить, а обновления доставляются мгновенно всем пользователям.</li>
                </ul>
            </AboutInfoSection>
            
            <AboutInfoSection icon={<IOSIcon emoji="💸"/>} title="Экономика Платформы: DAO и Токен">
                <p>DeMarket построен по принципу "DAO-first". Платформой управляет не компания, а сообщество ее пользователей.</p>
                <ul className="list-none space-y-2 mt-2">
                    <li><strong className="text-white">DeMarket DAO:</strong> Децентрализованная Автономная Организация управляет казной, принимает решения о размере комиссий, обновлениях и разрешает споры. Каждый участник может влиять на развитие проекта.</li>
                    <li><strong className="text-white">Двойная Экономика:</strong>
                        <ul className="list-disc list-inside pl-4 mt-1">
                            <li>Товары и услуги оплачиваются <strong className="text-cyan-300">стейблкоинами (USDC/USDT)</strong>, обеспечивая стабильность цен.</li>
                            <li>Сервисные сборы (продвижение, участие в арбитраже) оплачиваются нативным <strong className="text-cyan-300">Utility-токеном</strong>. Это юридически отделяет платежный механизм от оплаты услуг платформы.</li>
                        </ul>
                    </li>
                </ul>
            </AboutInfoSection>

            <AboutInfoSection icon={<IOSIcon emoji="✨"/>} title="Наш Подход к UX: Web3 для Всех">
                <p>Мы убеждены, что массовое принятие Web3 возможно только при устранении барьеров для входа. Наша цель — создать продукт, который выглядит и ощущается как премиальное Web2-приложение.</p>
                <ul className="list-none space-y-2 mt-2">
                    <li><strong className="text-white">"iOS Crypto-Glass" UI:</strong> Мы используем принципы Glassmorphism и Vibrancy для создания интуитивно понятного, чистого и эстетически приятного интерфейса.</li>
                    <li><strong className="text-white">Абстракция Счета (AA):</strong> Благодаря технологии EIP-4337, мы "прячем" сложность блокчейна. Пользователи могут входить в систему через Google или Apple ID, не записывая сид-фразы, а комиссии за газ (транзакции) могут спонсироваться платформой, делая первые шаги в Web3 бесшовными.</li>
                </ul>
            </AboutInfoSection>
        </main>
    </div>
);


const ShimmerTxRow = () => (
     <div className="p-3 flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-800"></div>
             <div>
                <div className="h-4 bg-gray-800 rounded w-28 mb-1.5"></div>
                <div className="h-3 bg-gray-800 rounded w-20"></div>
            </div>
        </div>
         <div className="text-right">
            <div className="h-4 bg-gray-800 rounded w-24 mb-1.5"></div>
            <div className="h-3 bg-gray-800 rounded w-16"></div>
        </div>
    </div>
);

const TransactionRow: React.FC<{ tx: Transaction, currentUserAddress: string }> = ({ tx, currentUserAddress }) => {
    const isOut = tx.from.toLowerCase() === currentUserAddress.toLowerCase();
    const txType = isOut ? 'Отправка' : (tx.to.toLowerCase() === currentUserAddress.toLowerCase() ? 'Получение' : 'Взаимодействие');
    const peerAddress = isOut ? tx.to : tx.from;

    return (
        <a href={`https://arbiscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOut ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                    {isOut ? <ArrowUpRightIcon className="w-5 h-5 text-red-400"/> : <ArrowDownLeftIcon className="w-5 h-5 text-green-400"/>}
                </div>
                <div>
                    <p className="text-white font-medium text-sm">{txType}</p>
                    <p className="text-xs text-gray-400 font-mono">
                       {peerAddress.substring(0,6)}...{peerAddress.substring(peerAddress.length-4)}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-semibold text-sm ${isOut ? 'text-red-400' : 'text-green-400'}`}>
                    {isOut ? '-' : '+'} {parseFloat(tx.value).toFixed(5)} {tx.asset}
                </p>
                <p className="text-xs text-gray-500">
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
        <div className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <p className="text-white font-semibold">{symbol}</p>
                    <p className="text-xs text-gray-400">${pricePerToken.toFixed(2)}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-white font-medium">{balance ? parseFloat(balance).toFixed(4) : '0.0000'}</p>
                <p className="text-xs text-gray-400">${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </div>
    );
}

// FIX: Added missing WalletScreen component, which was causing import errors in App.tsx.
export const WalletScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { 
        user,
        nativeBalance,
        tokenBalances,
        totalBalanceUSD,
        transactions,
        isBalanceLoading,
        isHistoryLoading,
        refetchBalances,
        refetchTransactions
    } = useWallet();
    const { showModal } = useModal();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refetchBalances(), refetchTransactions()]);
        setIsRefreshing(false);
    };
    
    const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5m11 2a9 9 0 11-2-7.89M4 15a9 9 0 102 7.89" />
        </svg>
    );


    if (!user) return null;

    return (
        <div className="h-full flex flex-col bg-black">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="p-2 -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1 pr-8">
                    Мой кошелек
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
                <GlassPanel className="p-4 text-center">
                    <p className="text-sm text-gray-400">Общий баланс</p>
                    <p className="text-4xl font-bold text-white mt-1">
                        ${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                     <div className="mt-4 grid grid-cols-3 gap-3">
                        <button onClick={() => showModal(<DepositSheet address={user.address} />)} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10">
                            <ArrowDownCircleIcon className="w-6 h-6 text-cyan-400" />
                            <span className="text-xs font-semibold text-white">Депозит</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10">
                            <ArrowUpCircleIcon className="w-6 h-6 text-cyan-400" />
                            <span className="text-xs font-semibold text-white">Вывод</span>
                        </button>
                         <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10">
                            <ArrowsRightLeftIcon className="w-6 h-6 text-cyan-400" />
                            <span className="text-xs font-semibold text-white">Обмен</span>
                        </button>
                    </div>
                </GlassPanel>

                <GlassPanel className="overflow-hidden">
                    <h3 className="p-3 text-lg font-semibold text-white">Активы</h3>
                    {isBalanceLoading ? (
                        <div className="p-4 text-center text-gray-400">Загрузка активов...</div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            <AssetRow icon={<BitcoinIcon className="w-8 h-8 text-orange-400" />} symbol="ETH" balance={nativeBalance} pricePerToken={3500} />
                            <AssetRow icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} symbol="USDC" balance={tokenBalances.USDC} pricePerToken={1} />
                            <AssetRow icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} symbol="USDT" balance={tokenBalances.USDT} pricePerToken={1} />
                            <AssetRow icon={<DMTIcon className="w-8 h-8 text-cyan-400" />} symbol="DMT" balance={tokenBalances.DMT} pricePerToken={0.85} />
                        </div>
                    )}
                </GlassPanel>

                <GlassPanel className="overflow-hidden">
                    <div className="p-3 flex justify-between items-center">
                         <h3 className="text-lg font-semibold text-white">История транзакций</h3>
                         <button onClick={handleRefresh} className={`text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}>
                            <RefreshIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    {isHistoryLoading ? (
                        <div className="space-y-2">
                           {[...Array(3)].map((_, i) => <ShimmerTxRow key={i} />)}
                        </div>
                    ) : (
                        transactions.length > 0 ? (
                             <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
                                {transactions.map(tx => <TransactionRow key={tx.hash} tx={tx} currentUserAddress={user.address} />)}
                            </div>
                        ) : (
                            <p className="p-4 text-center text-sm text-gray-400">Нет транзакций.</p>
                        )
                    )}
                </GlassPanel>

            </main>
        </div>
    );
};

// FIX: Added missing SettingsScreen component, which was causing import errors in App.tsx.
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
                <button onClick={handleDisconnect} className="w-full py-2.5 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/40 transition-colors">
                    Отключить кошелек
                </button>
            </div>
        </div>
    );
};

const ProfileHomeScreen: React.FC<{ 
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

    if (!user) return null;

    const activeListingsCount = props.userListings.filter(l => l.status === 'Available').length;
    const activePurchasesCount = props.userPurchases.filter(p => p.status === 'In Escrow').length;
    const activeSalesCount = props.userSales.filter(s => s.status === 'In Escrow').length;
    const arbitrationCasesCount = mockArbitrationCases.filter(c => c.status === 'voting').length;

    const handleCopy = () => {
        navigator.clipboard.writeText(user.address);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const headerTitle = user.username.includes('@')
      ? user.username
      : user.username.includes('.')
          ? user.username
          : `${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}`;

    const headerSubtitle = `${user.rating.toFixed(0)}% (${user.reviews} отзывов)`;

    const ProfileRow: React.FC<{ icon: React.ReactNode; label: string; value?: string; onClick: () => void }> = ({ icon, label, value, onClick }) => (
        <div onClick={onClick} className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-3">{icon}<span className="text-white">{label}</span></div>
            <div className="flex items-center space-x-2"><span className="text-gray-400">{value}</span><ChevronRightIcon className="w-5 h-5 text-gray-500" /></div>
        </div>
    );
    
    return (
        <div className="space-y-4">
            <div className="px-4 pt-12 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Профиль</h1>
                <button onClick={() => props.showModal(<SettingsScreen onBack={props.hideModal} onEditLocation={props.onEditLocation} />)} className="p-2 text-gray-400 hover:text-white">
                    <Cog6ToothIcon className="w-6 h-6"/>
                </button>
            </div>
            <div className="px-4 space-y-4 pb-28">
                <GlassPanel className="p-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                            {connectionType === 'sca' ? 
                                <BitcoinIcon className="w-10 h-10 text-orange-400"/> :
                                <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            }
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold text-white truncate">{headerTitle}</p>
                            <p className="text-sm text-gray-400">{headerSubtitle}</p>
                             <button 
                                onClick={!isCopied ? handleCopy : undefined} 
                                className={`mt-2 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${isCopied ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300'}`}
                            >
                                {isCopied ? 'Скопировано!' : 'Копировать адрес'}
                            </button>
                        </div>
                        
                    </div>
                </GlassPanel>

                <GlassPanel className="divide-y divide-white/10 overflow-hidden">
                    <ProfileRow icon={<IOSIcon emoji="💰"/>} label="Мой кошелек" onClick={() => props.onNavigateRequest(<WalletScreen onBack={props.onBack} />)} />
                    <ProfileRow icon={<IOSIcon emoji="🏆"/>} label="Моя репутация" value={`${user.badges.length} баджей`} onClick={() => props.onNavigateRequest(<MyReputationScreen onBack={props.onBack} reviews={props.userReviews} />)} />
                    <ProfileRow icon={<IOSIcon emoji="❤️"/>} label="Избранное" value={`${props.favoritesCount}`} onClick={() => props.onNavigateRequest(<FavoritesScreen isSubScreen listings={props.allListings} favorites={props.favorites} onListingClick={props.onListingClick} onToggleFavorite={props.onToggleFavorite} onBack={props.onBack} />)} />
                </GlassPanel>
                <GlassPanel className="divide-y divide-white/10 overflow-hidden">
                    <ProfileRow icon={<IOSIcon emoji="📋"/>} label="Мои объявления" value={`Активные: ${activeListingsCount}`} onClick={() => props.onNavigateRequest(<MyListingsScreen onBack={props.onBack} listings={props.userListings} onEdit={props.onEditListing} onBoost={props.onBoostListing} onListingClick={props.onListingClick} onArchive={props.onArchiveListing} onRestore={props.onRestoreListing} />)} />
                    <ProfileRow icon={<IOSIcon emoji="🧾"/>} label="Мои покупки" value={`Активно: ${activePurchasesCount}`} onClick={() => props.onNavigateRequest(<MyPurchasesScreen onBack={props.onBack} purchases={props.userPurchases} onPurchaseClick={props.onListingClick} disputes={props.disputes} onStartChat={props.onStartChat} onDisputeClick={props.onDisputeClick} />)} />
                    <ProfileRow icon={<IOSIcon emoji="📈"/>} label="Мои продажи" value={`Активно: ${activeSalesCount}`} onClick={() => props.onNavigateRequest(<MySalesScreen onBack={props.onBack} sales={props.userSales} onSaleClick={props.onListingClick} disputes={props.disputes} onStartChat={props.onStartChat} onDisputeClick={props.onDisputeClick} />)} />
                </GlassPanel>
                <GlassPanel className="divide-y divide-white/10 overflow-hidden">
                    <ProfileRow icon={<IOSIcon emoji="🛡️"/>} label="Управление DAO" value="Голосования: 1" onClick={() => props.onNavigateRequest(<DaoScreen onBack={props.onBack} />)} />
                    <ProfileRow icon={<IOSIcon emoji="⚖️"/>} label="Арбитраж" value={`Споры: ${arbitrationCasesCount}`} onClick={() => props.onNavigateRequest(<ArbitrationScreen onBack={props.onBack} />)} />
                </GlassPanel>
                <GlassPanel className="divide-y divide-white/10 overflow-hidden">
                    <ProfileRow icon={<IOSIcon emoji="ℹ️"/>} label="О проекте" onClick={() => props.onNavigateRequest(<AboutScreen onBack={props.onBack}/>)} />
                    <ProfileRow icon={<IOSIcon emoji="❓"/>} label="FAQ & Помощь" onClick={() => props.onNavigateRequest(<FaqScreen onBack={props.onBack} />)} />
                </GlassPanel>
                <button onClick={disconnectWallet} className="w-full py-3 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/40 transition-colors">Отключить</button>
            </div>
        </div>
    );
}

interface ProfileScreenProps {
    userListings: Listing[];
    userPurchases: Listing[];
    userSales: Listing[];
    userReviews: Review[];
    onEditLocation: () => void;
    onEditListing: (listing: Listing) => void;
    onBoostListing: (listing: Listing) => void;
    allListings: Listing[];
    favorites: string[];
    onListingClick: (listing: Listing) => void;
    onToggleFavorite: (listingId: string) => void;
    disputes: Dispute[];
    onStartChat: (user: User) => void;
    onDisputeClick: (dispute: Dispute) => void;
    onNavigateRequest: (screen: React.ReactNode) => void;
    onArchiveListing: (listingId: string) => void;
    onRestoreListing: (listingId: string) => void;
    onBack: () => void;
    showModal: (content: React.ReactNode) => void;
    hideModal: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = (props) => {
    const { user, isConnected } = useWallet();

    if (!isConnected || !user) {
        return <ConnectWalletSheet isPageReplacement={true} />;
    }

    return (
        <div className="h-full bg-black">
            <div className="h-full overflow-y-auto">
                <ProfileHomeScreen {...props} favoritesCount={props.favorites.length} />
            </div>
        </div>
    );
};
