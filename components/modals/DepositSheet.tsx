import React, { useState } from 'react';
import { CheckCircleIcon, ClipboardDocumentIcon, InformationCircleIcon, XCircleIcon } from '../icons/Icons';
import { GlassPanel } from '../shared/GlassPanel';

interface DepositSheetProps {
    address: string;
}

export const DepositSheet: React.FC<DepositSheetProps> = ({ address }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="p-4 pt-2 space-y-3 text-center">
            <h2 className="text-xl font-bold text-white">Депозит</h2>
            <p className="text-sm text-gray-400">Отсканируйте QR-код или скопируйте адрес для пополнения.</p>
            
            <div className="p-2 bg-white rounded-lg inline-block">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${address}`} alt="QR Code" width="128" height="128" />
            </div>

            <GlassPanel className="p-2 text-center break-all">
                <p className="font-mono text-sm text-white">{address}</p>
            </GlassPanel>
            
            <button 
                onClick={handleCopy}
                className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center ${isCopied ? 'bg-green-500 text-white' : 'bg-cyan-500 text-white hover:bg-cyan-600'}`}
            >
                {isCopied ? 'Скопировано!' : 'Копировать адрес'}
            </button>

            <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20 text-center">
                <div className="flex items-center justify-center gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-semibold text-sm text-yellow-200">Только сеть Arbitrum One</h4>
                </div>
                <p className="text-xs text-yellow-300/80 mt-1 leading-relaxed">
                    Отправляйте на этот адрес только <strong>ETH, USDC, USDT</strong>. Активы из других сетей будут утеряны.
                </p>
            </div>
        </div>
    );
};
