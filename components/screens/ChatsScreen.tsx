
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chat, Dispute, MessageStatus } from '../../types';
import { SearchIcon, PinIcon, CheckIcon, DoubleCheckIcon, ScaleIcon } from '../icons/Icons';
import { GlassPanel } from '../shared/GlassPanel';
import { Avatar } from '../shared/Avatar';

const StatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
    switch (status) {
        case 'read':
            return <DoubleCheckIcon className="w-4 h-4 text-cyan-400" />;
        case 'delivered':
            return <DoubleCheckIcon className="w-4 h-4 text-gray-300" />;
        case 'sent':
            return <CheckIcon className="w-4 h-4 text-gray-400" />;
        default:
            return null;
    }
};

const ChatRow: React.FC<{ chat: Chat; onClick: () => void; }> = ({ chat, onClick }) => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    const isMyLastMessage = lastMessage?.sender === 'me';
    // Use avatar field (address) as seed for consistency
    const avatarSeed = chat.user.avatar || chat.user.address || chat.user.username;
    
    return (
        <div 
            onClick={onClick}
            className="flex items-center p-3 space-x-4 cursor-pointer hover:bg-white/5 transition-colors rounded-lg"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="relative w-14 h-14 flex-shrink-0">
                <Avatar seed={avatarSeed} className="w-full h-full" />
            </div>
            <div className="flex-1 overflow-hidden border-b border-white/10 pb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <p className="text-white font-semibold truncate">{chat.user.username}</p>
                        {chat.pinned && <PinIcon className="text-gray-500" />}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{chat.timestamp}</p>
                </div>
                <div className="flex justify-between items-start mt-1">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm truncate">
                        {isMyLastMessage && lastMessage?.status && <StatusIcon status={lastMessage.status} />}
                        <p className="truncate">{lastMessage?.text || 'Нет сообщений'}</p>
                    </div>
                    {chat.unread > 0 && 
                        <span className="block h-5 min-w-[20px] px-1.5 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center font-bold">
                            {chat.unread > 99 ? '99+' : chat.unread}
                        </span>
                    }
                </div>
            </div>
        </div>
    );
};

const DisputeRow: React.FC<{ dispute: Dispute; onClick: () => void; }> = ({ dispute, onClick }) => {
    
    return (
        <div 
            onClick={onClick}
            className="flex items-center p-3 space-x-4 cursor-pointer hover:bg-white/5 transition-colors rounded-lg"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="relative w-14 h-14 flex-shrink-0">
                <img 
                    src={dispute.listing.images[0]} 
                    alt={dispute.listing.title} 
                    className="w-full h-full rounded-full object-cover ring-1 ring-white/10"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iMjgiIGZpbGw9IiMzNzM3M0YiLz4KPHBhdGggZD0iTTM0LjUgMjhDMzQuNSAyOS4zODA3IDMzLjM4MDcgMzAuNSAzMiAzMC41QzMwLjYxOTMgMzAuNSAyOS41IDI5LjM4MDcgMjkuNSAyOEMyOS41IDI2LjYxOTMgMzAuNjE5MyAyNS41IDMyIDI1LjVDMzMuMzgwNyAyNS41IDM0LjUgMjYuNjE5MyAzNC41IDI4WiIgZmlsbD0iIzhCOEI4QiIvPgo8cGF0aCBkPSJNMjggMzQuNUMzMC41MTU2IDM0LjUgMzIuODc4MSAzMy4zMDQ3IDM0LjUgMzEuMjA0N0w0MC4zODI4IDM3LjExN0MzOS4wMTE3IDM4LjUgMzcuMTQ3OCAzOS43NSAzNSAzOS43NUgyOUMxOS44MTUzIDM5Ljc1IDEzLjI1IDMzLjE4NDcgMTMuMjUgMjVDMTMuMjUgMTkuMjUgMTcuNzU2IDE0LjIxOTIgMjMuNDAyNyAxMy4yODI2TDI4IDE3Ljg3OTlWMzQuNVoiIGZpbGw9IiM4QjhCOEIiLz4KPC9zdmc+Cg==';
                    }}
                />
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-black">
                    <ScaleIcon className="w-3 h-3 text-black" />
                </div>
            </div>
            <div className="flex-1 overflow-hidden border-b border-white/10 pb-3">
                <div className="flex justify-between items-center">
                    <p className="text-yellow-400 font-semibold truncate">Спор: {dispute.listing.title}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{dispute.timestamp}</p>
                </div>
                <div className="flex justify-between items-start mt-1">
                    <p className="text-gray-400 text-sm truncate">{dispute.lastMessage}</p>
                    {dispute.unread > 0 && 
                        <span className="block h-5 min-w-[20px] px-1.5 rounded-full bg-yellow-500 text-black text-xs flex items-center justify-center font-bold">
                            {dispute.unread > 99 ? '99+' : dispute.unread}
                        </span>
                    }
                </div>
            </div>
        </div>
    );
};

type ListItem = (Chat & { type: 'chat' }) | (Dispute & { type: 'dispute' });
type ChatFilter = 'all' | 'unread' | 'disputes';

interface SegmentedControlProps {
    activeFilter: ChatFilter;
    onFilterChange: (filter: ChatFilter) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ activeFilter, onFilterChange }) => (
    <div className="grid grid-cols-3 gap-2 pt-2">
        <button 
            onClick={() => onFilterChange('all')}
            className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeFilter === 'all' 
                ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm'
                : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={activeFilter === 'all'}
        >
            Все
        </button>
        <button 
            onClick={() => onFilterChange('unread')}
            className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeFilter === 'unread' 
                ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm'
                : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={activeFilter === 'unread'}
        >
            Непрочитанные
        </button>
        <button 
            onClick={() => onFilterChange('disputes')}
            className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeFilter === 'disputes' 
                ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm'
                : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'
            }`}
            aria-pressed={activeFilter === 'disputes'}
        >
            Споры
        </button>
    </div>
);

interface ChatsScreenProps {
    chats: Chat[];
    disputes: Dispute[];
    onDisputeClick: (dispute: Dispute) => void;
    onChatClick: (chat: Chat) => void;
}

export const ChatsScreen: React.FC<ChatsScreenProps> = ({ 
    chats = [], 
    disputes = [], 
    onDisputeClick, 
    onChatClick 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);
    
    const combinedList: ListItem[] = useMemo(() => {
        const chatItems: ListItem[] = (chats || []).map(c => ({ ...c, type: 'chat' }));
        const disputeItems: ListItem[] = (disputes || []).map(d => ({ ...d, type: 'dispute' }));
        
        return [...disputeItems, ...chatItems].sort((a, b) => {
            // Disputes always on top
            if (a.type === 'dispute' && b.type !== 'dispute') return -1;
            if (a.type !== 'dispute' && b.type === 'dispute') return 1;
            
            // Sort by timestamp within same type
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
    }, [chats, disputes]);

    const filteredList = useMemo(() => {
        return combinedList.filter(item => {
            if (activeFilter === 'unread' && item.unread === 0) return false;
            if (activeFilter === 'disputes' && item.type !== 'dispute') return false;
            
            const lowercasedQuery = debouncedQuery.toLowerCase();
            if (lowercasedQuery.trim() === '') return true;

            if (item.type === 'chat') {
                return item.user.username.toLowerCase().includes(lowercasedQuery);
            } else {
                return item.listing.title.toLowerCase().includes(lowercasedQuery);
            }
        });
    }, [debouncedQuery, activeFilter, combinedList]);

    const handleCancelSearch = () => {
        setSearchQuery('');
        setDebouncedQuery('');
        inputRef.current?.blur();
    };

    const showCancelButton = isSearchFocused || searchQuery.length > 0;

    return (
        <div className="flex flex-col bg-black h-full">
            <div className="px-4 pt-12">
                <h1 className="text-3xl font-bold text-white">Чаты</h1>
            </div>

            <div className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-lg space-y-2">
                <div className="flex items-center gap-3 transition-all duration-300">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Поиск"
                            value={searchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border border-white/10 rounded-full pl-10 pr-4 py-2 text-base text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                            aria-label="Поиск в чатах"
                        />
                    </div>
                    {showCancelButton && (
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleCancelSearch}
                            className="text-green-400 text-base font-medium whitespace-nowrap"
                        >
                            Отмена
                        </button>
                    )}
                </div>
                
                <SegmentedControl activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-28">
                {filteredList.map(item => {
                    if (item.type === 'chat') {
                        return <ChatRow key={`chat-${item.id}`} chat={item} onClick={() => onChatClick(item)} />;
                    } else {
                        return <DisputeRow key={`dispute-${item.id}`} dispute={item} onClick={() => onDisputeClick(item)} />;
                    }
                })}
                {filteredList.length === 0 && (
                    <div className="pt-8">
                        <GlassPanel className="p-8 text-center">
                            <p className="font-bold text-xl text-white">
                                {debouncedQuery.trim() !== '' ? 'Ничего не найдено' : 'Нет чатов'}
                            </p>
                            <p className="text-gray-300 mt-2">
                                {debouncedQuery.trim() !== '' 
                                    ? 'Попробуйте изменить поисковый запрос.' 
                                    : 'Здесь будут отображаться ваши чаты и споры.'}
                            </p>
                        </GlassPanel>
                    </div>
                )}
            </div>
        </div>
    );
};
