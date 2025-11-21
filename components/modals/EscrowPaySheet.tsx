
import React, { useState, useEffect } from 'react';
import { Listing, ListingVariant } from '../../types';
import { InformationCircleIcon, ShieldCheckIcon } from '../icons/Icons';
import { useModal } from '../../hooks/useModal';

interface EscrowPaySheetProps {
    listing: Listing;
    onConfirm: (purchasedQuantity: number) => void;
    variant?: ListingVariant; // NEW
}

export const EscrowPaySheet: React.FC<EscrowPaySheetProps> = ({ listing, onConfirm, variant }) => {
    const { hideModal } = useModal();
    const [isProcessing, setIsProcessing] = useState(false);
    const [purchasedQuantity, setPurchasedQuantity] = useState(1);

    // Use variant price/qty if available
    const effectivePrice = variant ? variant.price : listing.price;
    const maxQuantity = variant ? variant.quantity : listing.quantity;

    // Recalculate prices based on selected quantity
    const itemPrice = effectivePrice * purchasedQuantity;
    const commission = itemPrice * 0.01;
    const sellerReceives = itemPrice - commission;
    const totalToBlock = itemPrice;

    useEffect(() => {
        // Reset quantity to 1 whenever the sheet is opened for a new item
        setPurchasedQuantity(1);
    }, [listing.id, variant?.id]);
    
    const handleQuantityChange = (delta: number) => {
        const newQuantity = purchasedQuantity + delta;
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            setPurchasedQuantity(newQuantity);
        }
    };

    const handleConfirm = () => {
        setIsProcessing(true);
        // Simulate API call/blockchain transaction
        setTimeout(() => {
            onConfirm(purchasedQuantity);
        }, 2000);
    };

    // Format variant attributes string
    const variantDescription = variant 
        ? Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';

    return (
        <div className="p-4 space-y-2 text-center">
            <h2 className="text-base font-semibold text-cyan-400">DeMarket Escrow</h2>
            <p className="text-sm text-gray-300">Подтверждение сделки</p>

            <div className="py-2 space-y-1.5 text-left border-y border-white/10">
                <div className="flex justify-between items-start gap-4">
                    <span className="text-gray-400 flex-shrink-0 text-xs">Товар:</span>
                    <div className="text-right min-w-0">
                        <span className="text-white font-medium block truncate text-xs">{listing.title}</span>
                        {variantDescription && (
                            <span className="text-cyan-400 text-[10px] block">{variantDescription}</span>
                        )}
                    </div>
                </div>
                 <div className="flex justify-between items-start gap-4">
                    <span className="text-gray-400 flex-shrink-0 text-xs">Продавец:</span>
                    <span className="text-white font-medium text-right truncate text-xs">{listing.seller.username}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Количество:</span>
                    <div className="flex items-center space-x-1 bg-white/5 rounded-md p-0.5">
                        <button onClick={() => handleQuantityChange(-1)} disabled={purchasedQuantity <= 1} className="px-1.5 rounded text-base font-bold disabled:opacity-50">-</button>
                        <span className="text-white font-medium w-5 text-center text-xs" aria-live="polite">{purchasedQuantity}</span>
                        <button onClick={() => handleQuantityChange(1)} disabled={purchasedQuantity >= maxQuantity} className="px-1.5 rounded text-base font-bold disabled:opacity-50">+</button>
                    </div>
                </div>
            </div>

            <div className="py-2 space-y-1 text-left border-b border-white/10 text-xs">
                 <div className="flex justify-between">
                    <span className="text-gray-400">Сумма покупки:</span>
                    <span className="text-white font-medium">{itemPrice.toFixed(2)} {listing.currency}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400">Продавец получит:</span>
                    <span className="text-white font-medium">{sellerReceives.toFixed(2)} {listing.currency}</span>
                </div>
                <div className="flex justify-between text-gray-500 pl-4">
                    <span>(Сумма за вычетом комиссии DAO 1%)</span>
                    <span>- {commission.toFixed(2)} {listing.currency}</span>
                </div>
            </div>

            <div className="flex justify-between items-center py-1">
                <span className="text-sm text-white font-bold">Итого:</span>
                <span className="text-sm text-white font-bold">{totalToBlock.toFixed(2)} {listing.currency}</span>
            </div>
            
            <div className="p-2 bg-green-500/10 text-green-300 text-xs rounded-lg flex items-start gap-2 text-left">
                <ShieldCheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-400" />
                <div>
                    <strong className="font-semibold text-green-200">Безопасность Escrow:</strong> Средства будут заморожены в смарт-контракте до вашего подтверждения получения.
                </div>
            </div>

            <div className="p-2 bg-blue-500/10 text-blue-300 text-xs rounded-lg flex items-start gap-2 text-left">
                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <strong className="font-semibold text-blue-200">Рекомендация:</strong> Уточните все детали с продавцом в чате перед подтверждением.
                </div>
            </div>

            <button 
                onClick={handleConfirm}
                disabled={isProcessing || maxQuantity === 0}
                className="w-full py-2.5 bg-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-wait"
            >
                {isProcessing ? 'Обработка...' : 'Подтвердить'}
            </button>

        </div>
    );
};
