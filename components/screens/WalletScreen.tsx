
import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';
import { ChevronLeftIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, InformationCircleIcon, ETHIcon, USDCIcon, USDTIcon, DMTIcon, MapPinIcon, ChevronRightIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from '../icons/Icons';
import { GlassPanel } from '../shared/GlassPanel';
import { DepositSheet } from '../modals/DepositSheet';
import { formatDistanceToNowStrict } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Transaction } from '../../types';

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
                <button onClick={handleDisconnect} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-semibold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors">
                    Выйти
                </button>
            </div>
        </div>
    );
};

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
