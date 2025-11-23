import React, { useState } from 'react';
import { Listing } from '../../types';
import { InformationCircleIcon } from '../icons/Icons';

interface ReportIssueSheetProps {
    listing: Listing;
    onConfirm: () => void;
}

const reportReasons = [
    'Мошенничество',
    'Запрещенный товар',
    'Неверное описание',
    'Спам',
    'Другое'
];

export const ReportIssueSheet: React.FC<ReportIssueSheetProps> = ({ listing, onConfirm }) => {
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
            <h2 className="text-lg font-bold text-white text-center">Сообщить о нарушении</h2>
            <p className="text-sm text-gray-400 text-center">
                Вы жалуетесь на объявление: <span className="font-semibold text-white">{listing.title}</span>
            </p>
            
            <div>
                <label className="text-sm font-medium text-gray-300">Причина жалобы<span className="text-red-400">*</span></label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {reportReasons.map(reason => (
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
                    <label className="text-sm font-medium text-gray-300">Уточните, пожалуйста<span className="text-red-400">*</span></label>
                    <textarea
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Опишите проблему..."
                        className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
                    />
                </div>
            )}
            
            <div className="p-3 bg-yellow-500/10 text-yellow-300 text-xs rounded-lg flex items-start gap-2 text-left">
                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-400" />
                <div>
                    <span className="font-semibold text-yellow-200">Внимание:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>При подаче жалобы, <span className="font-bold">100 $DMT</span> из вашего стейка будут <span className="font-bold">заблокированы</span> до принятия решения.</li>
                        <li>За <span className="font-semibold">обоснованные жалобы</span>, вы получите вознаграждение.</li>
                        <li>За <span className="font-semibold">ложные жалобы</span> с вашего стейка будет списан штраф.</li>
                    </ul>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={handleConfirm}
                    disabled={!isFormValid || isProcessing}
                    className="w-full py-2.5 bg-red-500 text-white font-semibold rounded-lg shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors disabled:bg-red-800 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Отправка...' : 'Отправить жалобу'}
                </button>
            </div>
        </div>
    );
};
