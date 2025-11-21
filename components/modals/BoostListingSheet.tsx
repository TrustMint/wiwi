import React, { useState } from 'react';
import { Listing } from '../../types';
import { useWallet } from '../../hooks/useWallet';
import { SparklesIcon, XCircleIcon } from '../icons/Icons';

interface BoostListingSheetProps {
    listing: Listing;
    onConfirm: (listingId: string, cost: number, durationDays: number) => void;
}

const boostOptions = [
    { durationDays: 1, cost: 50, name: 'Турбо' },
    { durationDays: 7, cost: 250, name: 'Приоритет' },
    { durationDays: 30, cost: 900, name: 'Максимум' },
];

export const BoostListingSheet: React.FC<BoostListingSheetProps> = ({ listing, onConfirm }) => {
    const { user } = useWallet();
    const [selectedOption, setSelectedOption] = useState(boostOptions[1]);

    const handleConfirm = () => {
        if (!user || user.dmtBalance < selectedOption.cost) return;
        onConfirm(listing.id, selectedOption.cost, selectedOption.durationDays);
    };

    return (
        <div className="p-4 space-y-3 text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Продвинуть объявление</h2>
            <p className="text-gray-400 text-sm">
                Ваше объявление будет показываться выше в результатах поиска и на главной.
            </p>

            <div className="space-y-3 pt-2">
                {boostOptions.map(option => (
                    <button
                        key={option.durationDays}
                        onClick={() => setSelectedOption(option)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${selectedOption.durationDays === option.durationDays ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-white/5'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-white">{option.durationDays} {option.durationDays === 1 ? 'день' : 'дней'} ({option.name})</span>
                            <span className="font-bold text-yellow-400">{option.cost} $DMT</span>
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="text-sm text-gray-400 pt-2">
                Ваш баланс: <span className="font-bold text-white">{user?.dmtBalance.toLocaleString() ?? 0} $DMT</span>
            </div>

            {user && user.dmtBalance < selectedOption.cost && (
                <div className="flex items-center justify-center gap-2 text-red-400">
                    <XCircleIcon className="w-5 h-5" />
                    <span>Недостаточно средств</span>
                </div>
            )}

            <button 
                onClick={handleConfirm}
                disabled={!user || user.dmtBalance < selectedOption.cost}
                className="w-full py-3 bg-yellow-500 text-black text-base font-semibold rounded-lg shadow-lg shadow-yellow-500/30 hover:bg-yellow-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Продвинуть за {selectedOption.cost} $DMT
            </button>

        </div>
    );
};
