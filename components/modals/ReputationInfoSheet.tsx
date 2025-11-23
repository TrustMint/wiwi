
import React from 'react';
import { ReputationMedalIcon } from '../icons/Icons';

export const ReputationInfoSheet: React.FC = () => {
    const tiers = [
        {
            level: 'Bronze',
            title: 'уверенный старт',
            description: 'Рейтинг ≥ 90% и не менее 5 отзывов.',
            tier: 'bronze' as const
        },
        {
            level: 'Silver',
            title: 'надежный продавец',
            description: 'Рейтинг ≥ 95% и не менее 20 отзывов.',
            tier: 'silver' as const
        },
        {
            level: 'Gold',
            title: 'элита рынка',
            description: 'Рейтинг ≥ 98% и не менее 50 отзывов.',
            tier: 'gold' as const
        }
    ];

    return (
        <div className="p-4 pt-0 space-y-4">
            <h2 className="text-lg font-bold text-white text-center mb-2">Система репутации</h2>
            <div className="space-y-4">
                {tiers.map((item) => (
                    <div key={item.level} className="flex items-start gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                        <ReputationMedalIcon tier={item.tier} className="w-12 h-12 flex-shrink-0" />
                        <div className="text-left">
                            <p className="font-bold text-white text-base">
                                {item.level} — <span className="font-normal text-gray-300">{item.title}</span>
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-4 text-center text-xs text-gray-500">
                <p>Рейтинг пересчитывается автоматически после каждого нового отзыва.</p>
            </div>
        </div>
    );
};
