
import React, { useState, useMemo } from 'react';
import { Listing, User, Dispute } from '../../types';
import { ChevronLeftIcon, FunnelIcon, ChevronRightIcon } from '../icons/Icons';
import { GlassPanel } from '../shared/GlassPanel';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';
import { format, parseISO, isValid } from 'date-fns';

interface DateFilterModalContentProps {
    initialStartDate: string;
    initialEndDate: string;
    onApply: (dates: { startDate: string, endDate: string }) => void;
}

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
