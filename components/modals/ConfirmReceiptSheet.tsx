import React, { useState } from 'react';
import { Listing } from '../../types';
import { useModal } from '../../hooks/useModal';

interface ConfirmReceiptSheetProps {
    listing: Listing;
    onConfirm: () => void;
}

export const ConfirmReceiptSheet: React.FC<ConfirmReceiptSheetProps> = ({ listing, onConfirm }) => {
    const { hideModal } = useModal();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = () => {
        setIsProcessing(true);
        // Simulate releasing funds
        setTimeout(() => {
            onConfirm();
        }, 2000);
    };

    return (
        <div className="p-4 space-y-3 text-center">
            <h2 className="text-lg font-bold text-white">Подтвердить получение?</h2>
            <p className="text-gray-300 text-sm">
                Подтверждая получение <span className="font-semibold text-white">{listing.title}</span>, вы соглашаетесь с тем, что товар соответствует описанию. Средства будут переведены продавцу из Escrow-контракта.
            </p>
            <p className="text-xs text-yellow-400">
                <span className="font-bold">Внимание:</span> Это действие необратимо.
            </p>

            <div className="pt-2 flex space-x-3">
                 <button
                    onClick={hideModal}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                    Отмена
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-green-500 text-white font-semibold rounded-lg shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors disabled:bg-green-700 disabled:cursor-wait"
                >
                    {isProcessing ? 'Подтверждение...' : 'Подтвердить'}
                </button>
            </div>
        </div>
    );
};
