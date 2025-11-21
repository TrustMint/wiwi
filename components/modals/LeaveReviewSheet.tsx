import React, { useState, useEffect } from 'react';
import { Listing, User, Review } from '../../types';
import { XCircleIcon, InformationCircleIcon, HandThumbUpIcon, HandThumbDownIcon } from '../icons/Icons';

interface LeaveReviewSheetProps {
    listing: Listing;
    user: User;
    onSubmit: (review: Omit<Review, 'id'>) => void;
}

const positiveKeywords = ["Вежливый", "Быстрые ответы", "Надежный", "Отличный товар", "Рекомендую"];
const negativeKeywords = ["Грубый", "Долго отвечал", "Ненадежный", "Товар не соответствует", "Проблемы с доставкой"];

export const LeaveReviewSheet: React.FC<LeaveReviewSheetProps> = ({ listing, user, onSubmit }) => {
    const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null);
    const [comment, setComment] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const rating = sentiment === 'positive' ? 100 : sentiment === 'negative' ? 20 : 0;
    const isFormValid = sentiment !== null && comment.trim().length >= 10;

    useEffect(() => {
        setSentiment(null);
        setComment('');
        setIsProcessing(false);
    }, [listing.id]);

    const handleSubmit = () => {
        if (!isFormValid) return;
        setIsProcessing(true);
        const newReview: Omit<Review, 'id'> = {
            listingId: listing.id,
            rating,
            comment,
            createdAt: new Date().toISOString(),
            buyerUsername: user.username,
            buyerAvatar: user.avatar,
        };
        setTimeout(() => {
            onSubmit(newReview);
        }, 1500);
    };
    
    const addKeywordToComment = (keyword: string) => {
        setComment(prev => prev ? `${prev}, ${keyword}` : keyword);
    };

    return (
        <div className="p-4 space-y-3 text-center">
            <h2 className="text-lg font-semibold text-white">Как вы оценили бы взаимодействие с этим продавцом?</h2>
            <p className="text-gray-400 text-sm">
               Сделка по <span className="font-bold text-white">{listing.title}</span>
            </p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
                 <button
                    onClick={() => setSentiment('positive')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl transition-all duration-300 transform active:scale-95 ${sentiment === 'positive' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                    <HandThumbUpIcon className="w-5 h-5"/>
                    <span className="font-bold text-base">Хорошо</span>
                </button>
                 <button
                    onClick={() => setSentiment('negative')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl transition-all duration-300 transform active:scale-95 ${sentiment === 'negative' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                    <HandThumbDownIcon className="w-5 h-5"/>
                    <span className="font-bold text-base">Плохо</span>
                </button>
            </div>
            
            <div className={`grid transition-all duration-500 ease-in-out ${sentiment ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="pt-4 space-y-3">
                         {sentiment === 'negative' && (
                            <div className="p-3 bg-yellow-500/10 text-yellow-300 text-xs rounded-lg flex items-start gap-2 text-left border border-yellow-500/20">
                                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-400" />
                                <div>
                                    <strong className="font-semibold text-yellow-200">Важно:</strong>
                                    <p>Отправьте честный отзыв, который точно отражает реальное положение дел. Если мы обнаружим неточности, то можем принять меры.</p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {(sentiment === 'positive' ? positiveKeywords : negativeKeywords).map(keyword => (
                                <button 
                                    key={keyword}
                                    onClick={() => addKeywordToComment(keyword)}
                                    className="px-2.5 py-1 bg-white/10 text-gray-200 text-xs font-medium rounded-full hover:bg-white/20 transition-colors"
                                >
                                    {keyword}
                                </button>
                            ))}
                        </div>
                        <div>
                            <textarea
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Расскажите о вашем опыте подробнее (мин. 10 символов)..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
                            />
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={!isFormValid || isProcessing}
                            className="w-full py-2.5 bg-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Отправка...' : 'Отправить отзыв'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};