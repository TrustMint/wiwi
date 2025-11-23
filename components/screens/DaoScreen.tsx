
import React, { useState, useMemo, useRef } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { DAOProposal, Vote } from '../../types';
import { useWallet } from '../../hooks/useWallet';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { PlusIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, ChevronLeftIcon, BanknotesIcon, ShieldCheckIcon } from '../icons/Icons';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useModal } from '../../hooks/useModal';
import { Avatar } from '../shared/Avatar';

interface DaoScreenProps {
    onBack: () => void;
}

// --- About DAO Content for Modal ---
const AboutDaoContent: React.FC = () => (
     <div className="p-4 pt-0 space-y-4">
        <h2 className="text-lg font-bold text-white text-center mb-4">О DeMarket DAO</h2>
        <GlassPanel className="p-4">
            <div className="flex items-center mb-3">
                <div className="w-8 h-8 flex items-center justify-center bg-cyan-500/20 rounded-lg mr-4 text-cyan-400">
                    <InformationCircleIcon />
                </div>
                <h3 className="text-xl font-semibold text-white">Что такое DAO?</h3>
            </div>
            <p className="pl-12 text-gray-300 text-sm leading-relaxed">
                DAO (Децентрализованная Автономная Организация) — это сердце нашего маркетплейса. Вместо традиционной компании, платформой управляет сообщество ее участников с помощью голосований. Решения принимаются прозрачно и коллективно.
            </p>
        </GlassPanel>
        <GlassPanel className="p-4">
             <div className="flex items-center mb-3">
                <div className="w-8 h-8 flex items-center justify-center bg-green-500/20 rounded-lg mr-4 text-green-400">
                    <BanknotesIcon />
                </div>
                <h3 className="text-xl font-semibold text-white">Сила Голоса (GVT)</h3>
            </div>
            <p className="pl-12 text-gray-300 text-sm leading-relaxed space-y-2">
                Ваше влияние в DAO определяется "силой голоса" (Governance Voice Token - GVT). Это не торгуемый токен, который отражает вашу репутацию и вклад в развитие платформы.
                <br/><br/>
                <strong>Как получить GVT:</strong>
                 <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Завершение успешных сделок</li>
                    <li>Положительные отзывы</li>
                    <li>Активное участие в жизни сообщества</li>
                    <li>Работа в качестве арбитра</li>
                </ul>
            </p>
        </GlassPanel>
         <GlassPanel className="p-4">
             <div className="flex items-center mb-3">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-500/20 rounded-lg mr-4 text-purple-400">
                    <ShieldCheckIcon />
                </div>
                <h3 className="text-xl font-semibold text-white">Как стать участником?</h3>
            </div>
            <p className="pl-12 text-gray-300 text-sm leading-relaxed">
                Каждый пользователь DeMarket автоматически становится частью DAO. Вы можете выносить на обсуждение свои предложения по улучшению платформы, а также голосовать за инициативы других участников, используя накопленную силу голоса.
            </p>
        </GlassPanel>
    </div>
);


// --- Proposal Detail Screen ---
const ProposalDetailScreen: React.FC<{ proposal: DAOProposal, onBack: () => void, onVote: (proposalId: string, choice: 'for' | 'against') => void }> = ({ proposal, onBack, onVote }) => {
    const { user } = useWallet();
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
    const totalPowerVoted = proposal.votes.reduce((acc, v) => acc + v.power, 0);
    const quorumProgress = Math.min((totalPowerVoted / (250000)) * 100, 100); // Mock total voting power
    
    const userVote = proposal.votes.find(v => v.voterUsername === user?.username);

    const handleVote = (choice: 'for' | 'against') => {
        onVote(proposal.id, choice);
    }
    
    const VoterRow: React.FC<{vote: Vote}> = ({ vote }) => (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0">
                     <Avatar seed={vote.voterUsername} className="w-full h-full" />
                </div>
                <div>
                    <p className="font-semibold text-white text-sm">{vote.voterUsername}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(vote.timestamp), "dd MMM yyyy, HH:mm", { locale: ru })}</p>
                </div>
            </div>
            <div className={`text-sm font-bold text-right ${vote.choice === 'for' ? 'text-green-400' : 'text-red-400'}`}>
                {vote.choice === 'for' ? 'За' : 'Против'}
                <p className="text-xs font-normal text-gray-500">{vote.power.toLocaleString()} GVT</p>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button 
                    onClick={onBack} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-xl font-bold text-white text-center flex-1 pr-8 truncate">
                    Предложение #{proposal.id.slice(-4)}
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
                <GlassPanel className="p-4">
                    <h2 className="text-xl font-semibold text-white">{proposal.title}</h2>
                    <p className="text-sm text-gray-400 mt-2">Предложено: <span className="font-medium text-cyan-400">{proposal.proposer}</span></p>
                </GlassPanel>
                
                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-white mb-2">Описание</h3>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{proposal.description}</p>
                </GlassPanel>

                <GlassPanel className="p-4">
                    <h3 className="font-semibold text-white mb-3">Голосование</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-green-400 font-medium">За ({forPercentage.toFixed(1)}%)</span>
                                <span className="text-gray-300">{proposal.votesFor.toLocaleString()} GVT</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${forPercentage}%` }}></div>
                            </div>
                        </div>
                         <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-red-400 font-medium">Против ({againstPercentage.toFixed(1)}%)</span>
                                <span className="text-gray-300">{proposal.votesAgainst.toLocaleString()} GVT</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${againstPercentage}%` }}></div>
                            </div>
                        </div>
                         <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-gray-400 font-medium">Кворум ({proposal.quorum}%)</span>
                                <span className="text-gray-300">{quorumProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${quorumProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </GlassPanel>
                
                 {proposal.status === 'active' && (
                    <GlassPanel className="p-4">
                        {user && user.stake > 0 ? (
                            userVote ? (
                                <div className="text-center">
                                    <p className="text-gray-300">Вы проголосовали:</p>
                                    <p className={`text-xl font-bold mt-1 ${userVote.choice === 'for' ? 'text-green-400' : 'text-red-400'}`}>
                                        {userVote.choice === 'for' ? 'ЗА' : 'ПРОТИВ'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex space-x-3">
                                    <button onClick={() => handleVote('for')} className="w-full py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/40 transition-colors">За</button>
                                    <button onClick={() => handleVote('against')} className="w-full py-3 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/40 transition-colors">Против</button>
                                </div>
                            )
                        ) : (
                             <div className="text-center text-gray-400 text-sm">
                                Внесите стейк в разделе "Арбитраж", чтобы участвовать в голосовании.
                            </div>
                        )}
                    </GlassPanel>
                )}

                <GlassPanel>
                    <h3 className="font-semibold text-white p-4">Голоса ({proposal.votes.length})</h3>
                    <div className="divide-y divide-white/10 px-4 max-h-60 overflow-y-auto">
                        {proposal.votes.map(vote => <VoterRow key={vote.voterUsername} vote={vote} />)}
                    </div>
                </GlassPanel>

            </main>
        </div>
    );
};

// --- Create Proposal Screen ---
const CreateProposalScreen: React.FC<{ onCreate: (title: string, description: string) => void }> = ({ onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const canSubmit = title.trim().length > 10 && description.trim().length > 20;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onCreate(title, description);
    }
    
    return (
        <div className="p-4 pt-0 space-y-4">
             <h2 className="text-lg font-bold text-white text-center">Новое предложение</h2>
             <div className="space-y-4">
                <div>
                    <label htmlFor="prop-title" className="text-sm font-medium text-gray-300">Название</label>
                    <input id="prop-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Краткая суть предложения" className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                    <label htmlFor="prop-desc" className="text-sm font-medium text-gray-300">Описание</label>
                    <textarea id="prop-desc" rows={6} value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробно опишите вашу инициативу, ее цели и обоснование." className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
                </div>
            </div>
             <div className="p-3 bg-yellow-500/10 text-yellow-300 text-sm rounded-lg flex items-start gap-2">
                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Для создания предложения необходимо иметь не менее 10,000 GVT силы голоса. После отправки предложение нельзя будет изменить.</span>
             </div>
             <button onClick={handleSubmit} disabled={!canSubmit} className="w-full py-3 bg-cyan-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                Отправить на голосование
            </button>
        </div>
    );
};

// --- Proposal Card ---
const ProposalCard: React.FC<{ proposal: DAOProposal, onClick: () => void }> = ({ proposal, onClick }) => {

    const statusInfo = {
        active: { text: 'Активно', color: 'bg-cyan-500/20 text-cyan-400', icon: <InformationCircleIcon className="w-4 h-4" /> },
        passed: { text: 'Принято', color: 'bg-green-500/20 text-green-400', icon: <CheckCircleIcon className="w-4 h-4"/> },
        failed: { text: 'Отклонено', color: 'bg-red-500/20 text-red-400', icon: <XCircleIcon className="w-4 h-4"/> },
        executed: { text: 'Исполнено', color: 'bg-purple-500/20 text-purple-400', icon: <CheckCircleIcon className="w-4 h-4"/> }
    }[proposal.status];

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const endDate = parseISO(proposal.endDate);
    const timeDistance = formatDistanceToNowStrict(endDate, { locale: ru, addSuffix: true });

    return (
        <GlassPanel 
            onClick={onClick}
            className="p-4 cursor-pointer hover:border-cyan-400/50 transition-colors duration-300">
            <div className="flex justify-between items-start">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.text}
                </span>
                <span className="text-xs text-gray-400">
                   {proposal.status === 'active' ? `Завершится ${timeDistance}` : `Завершилось ${timeDistance}`}
                </span>
            </div>
            <h3 className="mt-3 font-semibold text-white text-lg">{proposal.title}</h3>
            
            <div className="mt-4">
                <div className="w-full bg-red-500/30 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${forPercentage}%` }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-green-400 font-medium">{forPercentage.toFixed(1)}% За</span>
                    <span className="text-gray-400">{totalVotes.toLocaleString()} GVT</span>
                </div>
            </div>
        </GlassPanel>
    );
};

// --- Main DAO Screen (Router) ---
export const DaoScreen: React.FC<DaoScreenProps> = ({ onBack }) => {
    const { user } = useWallet();
    const { showModal, hideModal } = useModal();
    const [proposals, setProposals] = useState<DAOProposal[]>([]); // REAL: Empty initially
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    type Screen = 'list' | 'detail';
    const [activeScreen, setActiveScreen] = useState<Screen>('list');
    const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);

    const handleBackFromDetail = () => {
        setActiveScreen('list');
        setSelectedProposal(null);
    };

    const isDetailView = activeScreen !== 'list';

    const { 
      dragHandlers, 
      pushedStyle, 
      underlyingStyle 
    } = useSwipeBack({ onSwipeBack: handleBackFromDetail, enabled: isDetailView });

    const filteredProposals = useMemo(() => {
        const sorted = proposals.sort((a,b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime());
        if (activeTab === 'active') {
            return sorted.filter(p => p.status === 'active');
        }
        return sorted.filter(p => p.status !== 'active');
    }, [proposals, activeTab]);
    
    const handleSelectProposal = (proposal: DAOProposal) => {
        setSelectedProposal(proposal);
        setActiveScreen('detail');
    };
    
    const handleVote = (proposalId: string, choice: 'for' | 'against') => {
        if (!user) return;
        const votePower = 1500; // mock power
        
        const newVote: Vote = {
            voterUsername: user.username,
            voterAvatar: user.avatar,
            choice,
            power: votePower, 
            timestamp: new Date().toISOString()
        };

        const updateProposal = (p: DAOProposal) => {
             if (p.id === proposalId) {
                return {
                    ...p,
                    votes: [newVote, ...p.votes],
                    votesFor: choice === 'for' ? p.votesFor + votePower : p.votesFor,
                    votesAgainst: choice === 'against' ? p.votesAgainst + votePower : p.votesAgainst,
                };
            }
            return p;
        }

        setProposals(prev => prev.map(updateProposal));
        setSelectedProposal(prev => prev ? updateProposal(prev) : null);
    }

    const handleCreateProposal = (title: string, description: string) => {
        const newProposal: DAOProposal = {
            id: `prop-${Date.now()}`,
            title,
            description,
            proposer: user?.username || 'anonymous.eth',
            status: 'active',
            votesFor: 0,
            votesAgainst: 0,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            quorum: 50,
            votes: [],
        };
        setProposals(prev => [newProposal, ...prev]);
        hideModal();
    };

    const screens: Record<Screen, React.ReactNode> = {
        list: (
            <div className="h-full bg-black flex flex-col">
                <header className="sticky top-0 z-10 p-4 flex items-center justify-between bg-black/80 backdrop-blur-lg pt-12">
                    <div className="flex items-center gap-2">
                         <button 
                             onClick={onBack} 
                             className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                         >
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <h2 className="text-2xl font-bold text-white">Управление DAO</h2>
                    </div>
                    <button onClick={() => showModal(<AboutDaoContent />)} className="p-2 text-gray-400 hover:text-white">
                        <InformationCircleIcon className="w-6 h-6"/>
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
                    <GlassPanel className="p-4 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                                <BanknotesIcon className="w-5 h-5"/> Казна DAO
                            </div>
                            <span className="font-bold text-white text-base">$1,250,340 USDC</span>
                        </div>
                         <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                                <CheckCircleIcon className="w-5 h-5"/> Ваша сила голоса
                            </div>
                            <span className="font-bold text-white text-base">1,500 GVT</span>
                        </div>
                    </GlassPanel>

                    <div className="flex justify-between items-center">
                         <div className="flex space-x-2">
                            <button 
                                onClick={() => setActiveTab('active')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'active' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}
                            >
                                Активные
                            </button>
                            <button 
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-lg shadow-white/5 backdrop-blur-sm' : 'text-gray-400 bg-transparent hover:text-white hover:bg-white/5'}`}
                            >
                                Завершенные
                            </button>
                        </div>
                         <button onClick={() => showModal(<CreateProposalScreen onCreate={handleCreateProposal} />)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors">
                            <PlusIcon className="w-5 h-5" />
                            <span>Создать</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {filteredProposals.length > 0 ? (
                            filteredProposals.map(prop => <ProposalCard key={prop.id} proposal={prop} onClick={() => handleSelectProposal(prop)}/>)
                        ) : (
                            <div className="text-center text-gray-400 py-10">
                                <DocumentTextIcon className="w-12 h-12 mx-auto" />
                                <p className="mt-2 font-semibold">Нет предложений</p>
                                <p className="text-sm">В этой категории пока нет предложений.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        ),
        detail: selectedProposal ? <ProposalDetailScreen proposal={selectedProposal} onBack={handleBackFromDetail} onVote={handleVote} /> : null,
    };

    return (
        <div className="relative h-full overflow-hidden">
            <div 
                className={`absolute inset-0 will-change-transform,filter ${!isDetailView ? 'transition-transform,filter duration-400 cubic-bezier(0.32, 0.72, 0, 1)' : ''} ${isDetailView ? 'transform -translate-x-1/3 filter brightness-75' : 'transform translate-x-0 filter brightness-100'}`}
                style={underlyingStyle}
            >
                {screens.list}
            </div>
             <div 
                className={`absolute inset-0 bg-black shadow-lg will-change-transform ${!isDetailView ? 'transition-transform,filter duration-400 cubic-bezier(0.32, 0.72, 0, 1)' : ''} ${isDetailView ? 'translate-x-0' : 'translate-x-full'}`}
                style={pushedStyle}
                {...(isDetailView ? dragHandlers : {})}
            >
                {isDetailView && screens[activeScreen]}
            </div>
        </div>
    );
};
