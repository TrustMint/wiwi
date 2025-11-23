
import React, { useState, useMemo } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { ArbitrationCase, Evidence, Message } from '../../types';
import { useWallet } from '../../hooks/useWallet';
import { ChevronLeftIcon, ScaleIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, LockClosedIcon } from '../icons/Icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ArbitrationScreenProps {
    onBack: () => void;
}

// --- Case Detail Screen ---
const CaseDetailScreen: React.FC<{ arbitrationCase: ArbitrationCase, onBack: () => void }> = ({ arbitrationCase, onBack }) => {
    const { user } = useWallet();
    const [vote, setVote] = useState<'buyer' | 'seller' | null>(null);
    const [comment, setComment] = useState('');

    const { dispute } = arbitrationCase;
    const hasVoted = arbitrationCase.votes.some(v => v.arbitratorAddress === user?.username);

    const EvidenceCard: React.FC<{ evidence: Evidence }> = ({ evidence }) => (
        <GlassPanel className="p-3">
            <p className="text-xs font-bold text-white mb-1">
                {evidence.uploader === 'buyer' ? 'Доказательство Покупателя' : 'Доказательство Продавца'}
            </p>
            <p className="text-sm text-gray-300 mb-2">{evidence.description}</p>
            {evidence.type === 'image' && evidence.url && (
                <img src={evidence.url} alt="evidence" className="rounded-lg max-h-40 w-auto" />
            )}
            {evidence.type === 'text' && (
                <p className="text-sm text-cyan-200 bg-cyan-500/10 p-2 rounded-lg italic">"{evidence.content}"</p>
            )}
        </GlassPanel>
    );

    const MessageBubble: React.FC<{ msg: Message & { senderType?: 'arbitrator' | 'user' } }> = ({ msg }) => {
        const isBuyer = msg.sender === 'me'; // Assuming 'me' in dispute context is the buyer
        const isArbitrator = msg.senderType === 'arbitrator';
        const senderName = isBuyer ? 'Покупатель' : 'Продавец';

        if(isArbitrator) {
            return (
                 <div className="my-2 flex items-center justify-center text-xs text-yellow-300 space-x-2 text-center max-w-sm mx-auto">
                     <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{msg.text}</span>
                </div>
            );
        }

        return (
            <div className="text-sm my-2">
                <p className={`font-semibold mb-1 ${isBuyer ? 'text-cyan-400' : 'text-purple-400'}`}>{senderName}</p>
                <div className={`max-w-xs md:max-w-md px-3 py-2 rounded-2xl ${isBuyer ? 'bg-cyan-800/80' : 'bg-purple-800/80'} text-white`}>
                    <p>{msg.text}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={onBack} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <div className="text-center flex-1 pr-8">
                     <h1 className="text-xl font-bold text-white">Дело #{dispute.id.slice(-6).toUpperCase()}</h1>
                     <p className="text-xs text-yellow-400">
                         {arbitrationCase.status === 'voting' ? 'Идет голосование' : 'Решено'}
                     </p>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
                <GlassPanel className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Детали спора</h3>
                    <p className="text-sm text-gray-300">
                        <span className="font-semibold text-cyan-400">{dispute.listing.seller.username}</span> (Продавец) vs <span className="font-semibold text-purple-400">{user?.username}</span> (Покупатель) по объявлению "{dispute.listing.title}".
                    </p>
                </GlassPanel>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Доказательства</h3>
                    <div className="space-y-3">
                         {arbitrationCase.evidence.map(ev => <EvidenceCard key={ev.id} evidence={ev} />)}
                    </div>
                </div>
                
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-2">История чата спора</h3>
                    <GlassPanel className="p-4 max-h-80 overflow-y-auto">
                         {dispute.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                    </GlassPanel>
                </div>

                {arbitrationCase.status === 'voting' && (
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Голосование арбитров ({arbitrationCase.votes.length}/{arbitrationCase.arbitrators.length})</h3>
                        <GlassPanel className="p-4">
                            {hasVoted ? (
                                <p className="text-center font-semibold text-green-400">Спасибо, ваш голос учтен.</p>
                            ) : (
                                <div className="space-y-4">
                                     <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setVote('buyer')} className={`py-3 rounded-lg font-semibold border-2 transition-colors ${vote === 'buyer' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-gray-600 text-gray-300 hover:bg-white/10'}`}>В пользу Покупателя</button>
                                        <button onClick={() => setVote('seller')} className={`py-3 rounded-lg font-semibold border-2 transition-colors ${vote === 'seller' ? 'bg-purple-500/20 border-purple-400 text-purple-400' : 'border-gray-600 text-gray-300 hover:bg-white/10'}`}>В пользу Продавца</button>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Обоснуйте ваше решение (необязательно)..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 transition"
                                    />
                                    <button disabled={!vote} className="w-full py-3 bg-cyan-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Отправить голос</button>
                                </div>
                            )}
                        </GlassPanel>
                    </div>
                )}
                 {arbitrationCase.status === 'resolved' && (
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Итоговое решение</h3>
                        <GlassPanel className={`p-4 border-l-4 ${arbitrationCase.resolution?.winner === 'buyer' ? 'border-cyan-400' : 'border-purple-400'}`}>
                            <p className="font-bold text-white">Решение в пользу: <span className={arbitrationCase.resolution?.winner === 'buyer' ? 'text-cyan-400' : 'text-purple-400'}>{arbitrationCase.resolution?.winner === 'buyer' ? 'Покупателя' : 'Продавца'}</span></p>
                            <p className="text-sm text-gray-300 mt-2">{arbitrationCase.resolution?.reason}</p>
                        </GlassPanel>
                    </div>
                 )}
            </main>
        </div>
    );
};

// --- Case List Screen ---
const CaseListView: React.FC<{
    cases: ArbitrationCase[];
    onCaseClick: (c: ArbitrationCase) => void;
    onBack: () => void;
}> = ({ cases, onCaseClick, onBack }) => {
    const [activeTab, setActiveTab] = useState<'voting' | 'resolved'>('voting');

    const filteredCases = useMemo(() => {
        return cases.filter(c => c.status === activeTab);
    }, [cases, activeTab]);

    const CaseCard: React.FC<{ arbitrationCase: ArbitrationCase; onClick: () => void }> = ({ arbitrationCase, onClick }) => {

       const statusInfo = {
           voting: { text: 'Идет голосование', color: 'bg-yellow-500/20 text-yellow-400' },
           resolved: { text: 'Решено', color: 'bg-gray-500/20 text-gray-400' },
       }[arbitrationCase.status];
   
       const deadline = parseISO(arbitrationCase.deadline);
       const timeAgo = formatDistanceToNow(deadline, { addSuffix: true, locale: ru });
   
       return (
           <GlassPanel 
                onClick={onClick}
                className="p-4 cursor-pointer hover:border-yellow-400/50 transition-colors duration-300">
                <div className="flex justify-between items-start">
                   <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md ${statusInfo.color}`}>
                      <ScaleIcon className="w-4 h-4"/> {statusInfo.text}
                   </span>
                   <span className="text-xs text-gray-400">
                      {arbitrationCase.status === 'voting' ? `Дедлайн ${timeAgo}` : `Закрыто ${timeAgo}`}
                   </span>
               </div>
               <h3 className="mt-3 font-semibold text-white text-lg truncate">Дело по: {arbitrationCase.dispute.listing.title}</h3>
               <p className="text-sm text-gray-400 mt-1">Спор #{arbitrationCase.dispute.id.slice(-6).toUpperCase()}</p>
               <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-300">Арбитров проголосовало:</div>
                    <div className="font-semibold text-white">{arbitrationCase.votes.length} / {arbitrationCase.arbitrators.length}</div>
               </div>
           </GlassPanel>
       );
   };

    return (
        <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={onBack} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-2xl font-bold text-white ml-2">Арбитражные дела</h2>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setActiveTab('voting')}
                        className={`w-full py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'voting' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}
                    >
                        Требуют внимания
                    </button>
                    <button 
                        onClick={() => setActiveTab('resolved')}
                        className={`w-full py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'resolved' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}
                    >
                        Закрытые дела
                    </button>
                </div>

                <div className="space-y-4">
                     {filteredCases.length > 0 ? (
                        filteredCases.map(c => <CaseCard key={c.id} arbitrationCase={c} onClick={() => onCaseClick(c)}/>)
                    ) : (
                        <div className="text-center text-gray-400 py-10">
                            <ScaleIcon className="w-12 h-12 mx-auto" />
                            <p className="mt-2 font-semibold">Дел пока нет</p>
                            <p className="text-sm">Здесь будут отображаться споры, требующие решения DAO.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// --- Arbitration Hub Screen ---
const ArbitrationHub: React.FC<{ onBack: () => void; onNavigate: (screen: 'case_list') => void; }> = ({ onBack, onNavigate }) => {
    const { user, handleStake, handleUnstake } = useWallet();
    const [amount, setAmount] = useState('');

    if (!user) return null;
    
    const availableToUnstake = user.stake - user.lockedStake;
    const canViewCases = user.stake >= 5000;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || parseFloat(value) >= 0) {
            setAmount(value);
        }
    };
    
    const onStake = () => {
        const stakeAmount = parseFloat(amount);
        if (stakeAmount > 0) {
            handleStake(stakeAmount);
            setAmount('');
        }
    };

    const onUnstake = () => {
        const unstakeAmount = parseFloat(amount);
        if (unstakeAmount > 0) {
            handleUnstake(unstakeAmount);
            setAmount('');
        }
    };
    
    const handleNavigate = () => onNavigate('case_list');

    return (
         <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={onBack} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-2xl font-bold text-white ml-2">Арбитраж</h2>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
                <GlassPanel className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg text-white">Ваш статус арбитра</h3>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Всего в стейке:</span>
                        <span className="font-bold text-white text-base">{user.stake.toLocaleString()} $DMT</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Заблокировано:</span>
                        <span className="font-bold text-yellow-400 text-base">{user.lockedStake.toLocaleString()} $DMT</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Доступно для вывода:</span>
                        <span className="font-bold text-green-400 text-base">{availableToUnstake.toLocaleString()} $DMT</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Статус:</span>
                        {user.stake >= 5000 ? (
                            <span className="font-bold text-green-400 text-base">Арбитр</span>
                        ) : user.stake >= 100 ? (
                            <span className="font-bold text-cyan-400 text-base">Участник</span>
                        ) : (
                            <span className="font-bold text-gray-400 text-base">Неактивен</span>
                        )}
                    </div>
                </GlassPanel>
                
                <GlassPanel className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg text-white">Управление стейком</h3>
                    <div>
                         <label htmlFor="stake-amount" className="text-xs text-gray-400">Сумма $DMT</label>
                         <input 
                            id="stake-amount" 
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white"
                         />
                         <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Баланс: {user.dmtBalance.toLocaleString()} $DMT</span>
                             <span>Доступно: {availableToUnstake.toLocaleString()} $DMT</span>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={onStake} className="w-full py-3 bg-cyan-500/20 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-500/40">Внести в стейк</button>
                        <button onClick={onUnstake} className="w-full py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20">Вывести</button>
                    </div>
                </GlassPanel>
                
                 <div className="p-3 bg-blue-500/10 text-blue-300 text-sm rounded-lg flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-blue-200">Для чего нужен стейкинг?</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                            <li><strong className="font-semibold text-white">Статус Арбитра (от 5,000 $DMT):</strong> Позволяет участвовать в разрешении споров и получать награды.</li>
                            <li><strong className="font-semibold text-white">Подача жалоб (от 100 $DMT):</strong> Дает возможность сообщать о нарушениях и получать вознаграждение.</li>
                        </ul>
                    </div>
                </div>

                <GlassPanel>
                    <div 
                        onClick={canViewCases ? handleNavigate : undefined}
                        className={`flex items-center justify-between p-4 transition-colors rounded-xl ${canViewCases ? 'cursor-pointer hover:bg-white/5' : 'cursor-not-allowed opacity-70'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <ScaleIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                            <div>
                                <span className="text-white font-semibold">Арбитражные дела</span>
                                {!canViewCases && <p className="text-xs text-gray-400">Требуется статус арбитра</p>}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {canViewCases ? (
                                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                                <LockClosedIcon className="w-5 h-5 text-yellow-400" />
                            )}
                        </div>
                    </div>
                </GlassPanel>
            </main>
        </div>
    );
};


// --- Main Arbitration Screen (Router) ---
export const ArbitrationScreen: React.FC<ArbitrationScreenProps> = ({ onBack }) => {
    const [cases] = useState<ArbitrationCase[]>([]); // REAL: Empty initially, no mocks
    const [selectedCase, setSelectedCase] = useState<ArbitrationCase | null>(null);
    const [activeScreen, setActiveScreen] = useState<'hub' | 'case_list' | 'detail'>('hub');

    const handleBack = () => {
        if (selectedCase) {
            setSelectedCase(null);
        } else if (activeScreen === 'case_list') {
            setActiveScreen('hub');
        } else {
            onBack();
        }
    };
    
    const handleSelectCase = (c: ArbitrationCase) => {
        setSelectedCase(c);
        setActiveScreen('detail');
    };

    const renderScreen = () => {
        switch (activeScreen) {
            case 'hub':
                return <ArbitrationHub onBack={onBack} onNavigate={setActiveScreen} />;
            case 'case_list':
                return <CaseListView cases={cases} onCaseClick={handleSelectCase} onBack={() => setActiveScreen('hub')} />;
            case 'detail':
                return selectedCase ? <CaseDetailScreen arbitrationCase={selectedCase} onBack={() => setActiveScreen('case_list')} /> : null;
            default:
                return null;
        }
    };
    
    return (
        <div className="relative h-full overflow-hidden">
            {renderScreen()}
        </div>
    );
};
