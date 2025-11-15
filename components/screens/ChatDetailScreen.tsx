import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, Message, MessageStatus } from '../../types';
import { CheckIcon, DoubleCheckIcon, PaperClipIcon, BitcoinIcon } from '../icons/Icons';

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
  const timeoutRef = useRef<NodeJS.Timeout[]>([]);

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
    const deliveredTimeout = setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === sentMsgId ? {...m, status: 'delivered'} : m));
    }, 1000);

    const readTimeout = setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === sentMsgId ? {...m, status: 'read'} : m));
        setIsTyping(true);
    }, 2000);

    const replyTimeout = setTimeout(() => {
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
    <div className="h-full bg-black flex flex-col bg-[url('https://images.unsplash.com/photo/1516222338279-4a7c1221652d?q=80&w=2574&auto=format&fit=crop')] bg-center bg-cover">
        <div className="h-full flex flex-col bg-black/80 backdrop-blur-sm">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg border-b border-white/10">
                <button 
                  onClick={onBack} 
                  className="p-2 -ml-2"
                  aria-label="Назад к чатам"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 ml-2">
                    <BitcoinIcon className="w-6 h-6 text-orange-400"/>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">{chat.user.username}</h1>
                    <p className="text-xs text-cyan-400 truncate">
                      {isTyping ? 'печатает...' : 'в сети'}
                    </p>
                </div>
            </header>

            <main 
              className="flex-1 overflow-y-auto p-4 space-y-2 pb-36"
              aria-live="polite"
              aria-atomic="false"
            >
                {Object.entries(messageGroups).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                        <DateSeparator date={date} />
                        {msgs.map((msg) => (
                             <div 
                               key={msg.id} 
                               className={`flex items-end gap-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                             >
                                <MessageBubble msg={msg} senderName={chat.user.username} />
                            </div>
                        ))}
                    </React.Fragment>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-white rounded-2xl rounded-bl-none px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} aria-hidden="true" />
            </main>

            <footer className="sticky bottom-0 p-2 bg-black/80 backdrop-blur-lg border-t border-white/10">
                <form onSubmit={handleSend} className="flex items-end space-x-2">
                    <button 
                      type="button" 
                      className="p-3 text-gray-400 hover:text-cyan-400 self-center transition-colors"
                      aria-label="Прикрепить файл"
                    >
                        <PaperClipIcon className="w-6 h-6"/>
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Сообщение..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-4 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            aria-label="Введите сообщение"
                            autoComplete="off"
                        />
                    </div>
                    <button 
                      type="submit" 
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 self-center transition-colors ${
                        canSend ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-gray-600 cursor-not-allowed'
                      }`}
                      disabled={!canSend}
                      aria-label="Отправить сообщение"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
            </footer>
        </div>
    </div>
  );
};