
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, Message, MessageStatus } from '../../types';
import { CheckIcon, DoubleCheckIcon, PaperClipIcon, BitcoinIcon, ChevronLeftIcon } from '../icons/Icons';
import { Avatar } from '../shared/Avatar';

interface ChatDetailScreenProps {
  chat: Chat;
  onBack: () => void;
}

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

const MessageBubble: React.FC<{ msg: Message; senderName: string }> = ({ msg, senderName }) => (
    <div 
        className={`max-w-xs md:max-w-md px-3 pt-2 pb-1 rounded-2xl flex flex-col ${
            msg.sender === 'me' 
                ? 'bg-cyan-600 text-white rounded-br-none ml-auto' 
                : 'bg-gray-700 text-white rounded-bl-none'
        }`}
        role="article"
        aria-label={`Сообщение от ${msg.sender === 'me' ? 'вас' : senderName}`}
    >
        <p className="text-left break-words">{msg.text}</p>
        <div className="flex items-center justify-end gap-1.5 self-end mt-1">
            <time className="text-xs text-gray-300">{msg.timestamp}</time>
            {msg.sender === 'me' && msg.status && <StatusIcon status={msg.status} />}
        </div>
    </div>
);

const DateSeparator: React.FC<{ date: string }> = ({ date }) => (
    <div className="text-center my-4" role="separator" aria-label={`Сообщения за ${date}`}>
        <span className="bg-black/20 backdrop-blur-lg text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
            {date}
        </span>
    </div>
);

export const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ chat, onBack }) => {
  const [messages, setMessages] = useState<Message[]>(chat.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number[]>([]);

  // Use address/avatar field as seed for consistent avatar
  const avatarSeed = chat.user.avatar || chat.user.address || chat.user.username;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    const sentMsgId = `msg-sent-${Date.now()}`;
    const sentMsg: Message = {
      id: sentMsgId,
      text: newMessage.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    
    setMessages(prev => [...prev, sentMsg]);
    setNewMessage('');

    // Simulate status updates & reply
    const deliveredTimeout = window.setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === sentMsgId ? {...m, status: 'delivered'} : m));
    }, 1000);

    const readTimeout = window.setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === sentMsgId ? {...m, status: 'read'} : m));
        setIsTyping(true);
    }, 2000);

    const replyTimeout = window.setTimeout(() => {
        const replyMsg: Message = {
            id: `msg-reply-${Date.now()}`,
            text: `Спасибо за ваше сообщение! Мы скоро ответим.`,
            sender: 'them',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
        };
        setIsTyping(false);
        setMessages(prev => [...prev, replyMsg]);
    }, 4000);

    // Store timeouts for cleanup
    timeoutRef.current = [deliveredTimeout, readTimeout, replyTimeout];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Improved date grouping with actual date logic
  const messageGroups = messages.reduce((acc: Record<string, Message[]>, msg) => {
    const today = new Date();
    const messageDate = new Date(); // In real app, use actual message date
    
    let dateKey = 'Сегодня';
    // Simple date formatting logic - extend this based on your needs
    if (messageDate.toDateString() !== today.toDateString()) {
      dateKey = messageDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
      });
    }
    
    return {
      ...acc,
      [dateKey]: [...(acc[dateKey] || []), msg],
    };
  }, {} as Record<string, Message[]>);

  const canSend = newMessage.trim() !== '';

  return (
    <div className="w-full h-full bg-black flex flex-col z-50 relative">
        <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg border-b border-white/10">
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
              aria-label="Назад к чатам"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
             <div className="w-10 h-10 flex-shrink-0 ml-2">
                 <Avatar seed={avatarSeed} className="w-full h-full" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{chat.user.username}</h1>
                <p className="text-xs text-cyan-400 truncate">
                  {isTyping ? 'печатает...' : 'в сети'}
                </p>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.entries(messageGroups).map(([date, msgs]: [string, Message[]]) => (
                <React.Fragment key={date}>
                    <DateSeparator date={date} />
                    {msgs.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} senderName={chat.user.username} />
                    ))}
                </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
        </main>

        <footer className="sticky bottom-0 p-2 bg-black/80 backdrop-blur-lg border-t border-white/10">
            <form onSubmit={handleSend} className="flex items-center space-x-2">
                <button 
                    type="button" 
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
                    placeholder="Сообщение..."
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
                <button 
                    type="submit" 
                    disabled={!canSend}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all ${
                        canSend 
                            ? 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/25' 
                            : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    aria-label="Отправить"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform rotate-45 -ml-1">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </form>
        </footer>
    </div>
  );
};
