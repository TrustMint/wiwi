import React, { useState } from 'react';
import { Listing } from '../../types';

interface DisputeSheetProps {
    listing: Listing;
    onConfirm: () => void;
}

const disputeReasons = [
    'Товар не получен',
    'Не соответствует описанию',
    'Продавец не отвечает',
    'Другое'
];

export const DisputeSheet: React.FC<DisputeSheetProps> = ({ listing, onConfirm }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isFormValid = selectedReason && (selectedReason !== 'Другое' || details.trim() !== '');

    const handleConfirm = () => {
        if (!isFormValid) return;
        setIsProcessing(true);
        // Simulate sending report
        setTimeout(() => {
            onConfirm();
        }, 1500);
    };

    return (
        <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold text-white text-center">Открытие спора по сделке</h2>
            <p className="text-sm text-gray-400 text-center">
                Сделка: <span className="font-semibold text-white">{listing.title}</span>
            </p>
            
            <div>
                <label className="text-sm font-medium text-gray-300">Причина спора<span className="text-red-400">*</span></label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {disputeReasons.map(reason => (
                        <button
                            key={reason}
                            onClick={() => setSelectedReason(reason)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                selectedReason === reason
                                ? 'bg-white/15 backdrop-blur-sm ring-1 ring-white/20 text-white shadow-md'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>
            </div>

            {selectedReason === 'Другое' && (
                 <div>
                    <label className="text-sm font-medium text-gray-300">Подробности спора<span className="text-red-400">*</span></label>
                    <textarea
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Опишите проблему как можно подробнее..."
                        className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
                    />
                </div>
            )}

            <div className="pt-2">
                <button
                    onClick={handleConfirm}
                    disabled={!isFormValid || isProcessing}
                    className="w-full py-2.5 bg-yellow-500 text-black font-semibold rounded-lg shadow-lg shadow-yellow-500/30 hover:bg-yellow-600 transition-colors disabled:bg-yellow-800 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Открываем...' : 'Открыть спор'}
                </button>
            </div>
        </div>
    );
};
