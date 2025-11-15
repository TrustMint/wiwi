import React from 'react';
import { Badge } from '../../types';
import { SparklesIcon, ShieldCheckIcon, TrophyIcon, CheckCircleIcon, XCircleIcon } from '../icons/Icons';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';

interface MintBadgeSheetProps {
    onMint: () => void;
    badge: Badge;
}

const BadgeIcon: React.FC<{ icon: Badge['icon'], className?: string }> = ({ icon, className = "w-12 h-12 text-yellow-400" }) => {
    const icons: Record<Badge['icon'], React.ReactNode> = {
        'first-purchase': <TrophyIcon />,
        'first-sale': <TrophyIcon />,
        'top-seller': <SparklesIcon />,
        'veteran': <ShieldCheckIcon />,
        // Add other new icons here if needed, but for the modal, a generic one is fine.
        'profile-pro': <TrophyIcon />,
        'communicator': <TrophyIcon />,
        'trusted-seller': <ShieldCheckIcon />,
        'power-buyer': <TrophyIcon />,
        'collector': <TrophyIcon />,
        'specialist': <TrophyIcon />,
        'community-member': <TrophyIcon />,
        'arbitrator': <ShieldCheckIcon />,
        'tycoon': <SparklesIcon />,
        'reputation-master': <SparklesIcon />,
        'dao-legislator': <TrophyIcon />,
        'market-maker': <SparklesIcon />,
        'centurion': <TrophyIcon />,
        'og': <ShieldCheckIcon />,
        'evangelist': <TrophyIcon />,
    };
    return <div className={className}>{icons[icon]}</div>;
};

export const MintBadgeSheet: React.FC<MintBadgeSheetProps> = ({ onMint, badge }) => {
    const { tokenBalances, cancelBadgeMint } = useWallet();
    const { hideModal } = useModal();
    const [isMinting, setIsMinting] = React.useState(false);

    const handleMint = () => {
        setIsMinting(true);
        onMint(); // The parent component handles the async logic and closing
    };
    
    // Reset minting state when sheet is closed/reopened
    React.useEffect(() => {
        setIsMinting(false);
    }, [badge.id]);

    const usdcBalance = parseFloat(tokenBalances.USDC || '0');
    const hasEnoughFunds = usdcBalance >= 1;

    return (
        <div className="p-4 space-y-2 text-center">
            <div className="w-14 h-14 mx-auto bg-yellow-500/10 rounded-xl flex items-center justify-center ring-1 ring-yellow-500/30">
                <BadgeIcon icon={badge.icon} className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Получен Бадж!</h2>
            <p className="text-sm font-semibold text-yellow-300">{badge.name}</p>
            <p className="text-xs text-gray-400">
                {badge.description}
            </p>

            <div className="text-left bg-white/5 p-2 rounded-md">
                <p className="font-semibold text-xs text-white mb-1.5">Награды:</p>
                <ul className="space-y-1">
                    {badge.perks.map((perk, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-green-300">
                            <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0"/>
                            <span>{perk}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-2 bg-blue-500/10 text-blue-300 text-xs rounded-md text-left">
                Это <strong className="text-white">непередаваемый NFT-токен</strong> (Soulbound), который будет навсегда закреплен за вашим адресом.
            </div>

            <div className="pt-2 flex flex-col space-y-1.5">
                <button
                    onClick={handleMint}
                    disabled={isMinting || !hasEnoughFunds}
                    className="w-full py-2.5 text-sm bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                    {isMinting ? 'Минтинг...' : 'Сминтить (1 USDC)'}
                </button>
                 {!hasEnoughFunds && !isMinting && (
                    <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                        <XCircleIcon className="w-4 h-4" />
                        <span>Недостаточно USDC для минтинга.</span>
                    </p>
                )}
                <button
                    onClick={() => {
                        cancelBadgeMint();
                        hideModal();
                    }}
                    disabled={isMinting}
                    className="w-full py-1.5 text-sm bg-transparent text-gray-400 rounded-lg font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    Позже
                </button>
            </div>
        </div>
    );
};
