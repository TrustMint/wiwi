import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Listing, Message as MessageType, MessageStatus, Dispute } from '../../types';
import { GlassPanel } from '../shared/GlassPanel';
import { ChevronLeftIcon, ChevronDownIcon, PaperClipIcon, InformationCircleIcon } from '../icons/Icons';

interface DisputeScreenProps {
  dispute: Dispute;
  onBack: () => void;
}

interface DisputeStatusTimelineProps {
  status: 'negotiation' | 'review' | 'decision';
}

interface OrderDetailsProps {
  listing: Listing;
}

interface MessageBubbleProps {
  msg: MessageType & { senderType?: 'arbitrator' | 'user' };
}

// --- Sub-components ---

const DisputeStatusTimeline: React.FC<DisputeStatusTimelineProps> = ({ status }) => {
    const steps = [
        { id: 'negotiation', label: 'Переговоры' },
        { id: 'review', label: 'Рассмотрение' },
        { id: 'decision', label: 'Решение' }
    ];
    const activeIndex = steps.findIndex(step => step.id === status);

    return (
        <div className="flex justify-between items-center text-xs text-center" role="status" aria-label={`Статус спора: ${steps[activeIndex]?.label}`}>
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                index <= activeIndex 
                                    ? 'bg-cyan-500 border-cyan-500 text-white' 
                                    : 'bg-gray-700 border-gray-500 text-gray-400'
                            }`}
                            aria-current={index === activeIndex ? 'step' : undefined}
                        >
                            {index < activeIndex ? '✓' : index + 1}
                        </div>
                        <p className={`mt-1 font-medium ${index <= activeIndex ? 'text-white' : 'text-gray-400'}`}>
                            {step.label}
                        </p>
                    </div>
                    {index < steps.length - 1 && (
                        <div 
                            className={`flex-1 h-0.5 -mt-4 mx-2 ${
                                index < activeIndex ? 'bg-cyan-500' : 'bg-gray-600'
                            }`}
                            aria-hidden="true"
                        ></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const OrderDetails: React.FC<OrderDetailsProps> = ({ listing }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const toggleOpen = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
        }
    }, [toggleOpen]);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const getInitials = useCallback((username: string) => {
        return username
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, []);

    return (
        <GlassPanel className="overflow-hidden">
            <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Скрыть' : 'Показать'} детали заказа`}
            >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-lg bg-gray-700 flex-shrink-0 overflow-hidden">
                        {!imageError && listing.images?.[0] ? (
                            <img 
                                src={listing.images[0]} 
                                alt={listing.title}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-600">
                                <span className="text-white text-xs font-bold">
                                    {getInitials(listing.title)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{listing.title}</p>
                        <p className="text-xs text-gray-400">
                            {listing.price} {listing.currency}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-sm text-gray-300 hidden sm:inline">Детали</span>
                    <ChevronDownIcon 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`} 
                    />
                </div>
            </div>
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-40' : 'max-h-0'
                }`}
            >
                <div className="p-3 border-t border-white/10 text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-400">ID Сделки:</span>
                        <span className="text-white font-mono text-xs">
                            ESC-X{listing.id?.slice(0, 8).toUpperCase() || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Продавец:</span>
                        <span className="text-white truncate ml-2">
                            {listing.seller?.username || 'Неизвестно'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Статус:</span>
                        <span className="text-yellow-400 font-semibold">В споре</span>
                    </div>
                </div>
            </div>
        </GlassPanel>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg }) => {
    const isMe = msg.sender === 'me';
    const isArbitrator = msg.senderType === 'arbitrator';

    if (isArbitrator) {
        return (
            <div 
                className="my-2 flex items-center justify-center text-xs text-yellow-300 space-x-2 text-center max-w-sm mx-auto px-2"
                role="status"
                aria-label={`Сообщение арбитра: ${msg.text}`}
            >
                 <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{msg.text}</span>
            </div>
        );
    }

    return (
        <div 
            className={`flex items-end gap-2 my-1 ${isMe ? 'justify-end' : 'justify-start'}`}
            role="listitem"
        >
            <div 
                className={`max-w-xs md:max-w-md px-3 pt-2 pb-1 rounded-2xl flex flex-col ${
                    isMe 
                        ? 'bg-cyan-600 text-white rounded-br-none' 
                        : 'bg-gray-700 text-white rounded-bl-none'
                }`}
            >
                <p className="text-left whitespace-pre-wrap break-words">{msg.text}</p>
                 <div className="flex items-center justify-end gap-1.5 self-end mt-1">
                    <time 
                        className="text-xs text-gray-300/80"
                        dateTime={msg.timestamp}
                    >
                        {msg.timestamp}
                    </time>
                 </div>
            </div>
        </div>
    );
};

// --- Main Screen Component ---

export const DisputeScreen: React.FC<DisputeScreenProps> = ({ dispute, onBack }) => {
    const [messages, setMessages] = useState(dispute.messages || []);
    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (dispute.status !== 'negotiation' || !dispute.createdAt) {
            setTimeLeft(0);
            return;
        }

        const calculateTimeLeft = () => {
            try {
                const negotiationEndTime = new Date(dispute.createdAt!).getTime() + 60 * 60 * 1000;
                const now = Date.now();
                return Math.max(0, negotiationEndTime - now);
            } catch (error) {
                console.error('Error calculating time left:', error);
                return 0;
            }
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (newTimeLeft <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [dispute.status, dispute.createdAt]);

    const isNegotiationActive = dispute.status === 'negotiation' && timeLeft > 0;

    const formatTime = useCallback((ms: number) => {
        const minutes = Math.floor((ms / 1000 / 60) % 60);
        const seconds = Math.floor((ms / 1000) % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const handleSend = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' && attachments.length === 0) return;

        const sentMsg: MessageType = {
            id: `msg-sent-${Date.now()}`,
            text: newMessage.trim(),
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };
        setMessages(prev => [...prev, sentMsg]);
        setNewMessage('');
        setAttachments([]);
    }, [newMessage, attachments]);

    const handleAttachment = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
            // Reset input to allow selecting same file again
            e.target.value = '';
        }
    }, []);

    const removeAttachment = useCallback((index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleBackClick = useCallback(() => {
        onBack();
    }, [onBack]);

    const handleBackKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBack();
        }
    }, [onBack]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    }, [handleSend]);

    const canSend = newMessage.trim() !== '' || attachments.length > 0;

    const disputeId = useMemo(() => {
        return dispute.listing.id?.slice(-6).toUpperCase() || 'UNKNOWN';
    }, [dispute.listing.id]);

    const statusLabel = useMemo(() => {
        switch (dispute.status) {
            case 'negotiation':
                return isNegotiationActive ? 'Переговоры' : 'Переговоры завершены';
            case 'review':
                return 'Рассмотрение арбитром';
            case 'decision':
                return 'Решение принято';
            default:
                return 'Неизвестный статус';
        }
    }, [dispute.status, isNegotiationActive]);

    return (
        <div className="h-full bg-black flex flex-col bg-[url('https://images.unsplash.com/photo-1608221925304-6a8435d8b746?q=80&w=2574&auto=format&fit=crop')] bg-center bg-cover">
          <div className="h-full flex flex-col bg-black/90 backdrop-blur-sm">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg border-b border-white/10">
                <button 
                    onClick={handleBackClick}
                    onKeyDown={handleBackKeyDown}
                    className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Назад"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="ml-3 text-center flex-1 pr-8 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">
                        Спор #{disputeId}
                    </h1>
                    <p className="text-xs text-yellow-400 truncate">
                        Статус: {statusLabel}
                    </p>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-36 custom-scrollbar">
                <DisputeStatusTimeline status={dispute.status} />
                <OrderDetails listing={dispute.listing} />

                {isNegotiationActive && (
                    <GlassPanel className="p-4 my-4 text-center">
                        <p className="text-lg font-bold text-yellow-400">Идет период переговоров</p>
                        <p className="text-sm text-gray-300 mt-1">
                            У вас есть время договориться с продавцом. Если проблема не решится, арбитр DAO присоединится к чату.
                        </p>
                        <div 
                            className="mt-3 text-3xl font-mono font-bold text-white tracking-wider"
                            aria-live="polite"
                        >
                            {formatTime(timeLeft)}
                        </div>
                    </GlassPanel>
                )}

                {dispute.status === 'negotiation' && timeLeft === 0 && (
                    <GlassPanel className="p-4 my-4 text-center">
                        <p className="text-lg font-bold text-cyan-400">Время переговоров истекло</p>
                        <p className="text-sm text-gray-300 mt-1">
                            Арбитр DAO скоро подключится к спору для рассмотрения дела.
                        </p>
                    </GlassPanel>
                )}

                <div className="space-y-2" role="log" aria-label="История сообщений спора">
                   {messages.map(msg => (
                       <MessageBubble key={msg.id} msg={msg} />
                   ))}
                   <div ref={messagesEndRef} aria-hidden="true" />
                </div>
            </main>

            <footer className="sticky bottom-0 p-2 bg-black/80 backdrop-blur-lg border-t border-white/10">
                {attachments.length > 0 && (
                     <div className="px-2 pb-2 flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                            <div 
                                key={index} 
                                className="bg-gray-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 max-w-[200px]"
                            >
                               <span className="truncate flex-1" title={file.name}>
                                   {file.name}
                               </span>
                               <button 
                                   onClick={() => removeAttachment(index)} 
                                   className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center font-bold text-xs"
                                   aria-label={`Удалить файл ${file.name}`}
                               >
                                   &times;
                               </button>
                            </div>
                        ))}
                     </div>
                )}
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleAttachment} 
                        className="hidden" 
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        aria-label="Прикрепить файл"
                    />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-3 text-gray-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/10"
                        aria-label="Прикрепить файл"
                    >
                        <PaperClipIcon />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Введите ваше сообщение..."
                        className="flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        aria-label="Текст сообщения"
                    />
                    <button 
                        type="submit" 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all ${
                            canSend 
                                ? 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/25' 
                                : 'bg-gray-600 cursor-not-allowed'
                        }`}
                        disabled={!canSend}
                        aria-label="Отправить сообщение"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
            </footer>
          </div>
        </div>
    );
};