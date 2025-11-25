
import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { GlassPanel } from '../shared/GlassPanel';
import { GoogleIcon, AppleIcon, InformationCircleIcon } from '../icons/Icons';

interface ConnectWalletSheetProps {
    isPageReplacement?: boolean;
}

const WalletButton: React.FC<{ icon: string; name: string; onClick: () => void; disabled?: boolean }> = ({ icon, name, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-wait"
    >
        <img src={icon} alt={`${name} logo`} className="w-7 h-7 mr-4" />
        <span className="text-base font-medium text-white">Подключить {name}</span>
    </button>
);

const SocialLoginButton: React.FC<{ icon: React.ReactNode; name: string; onClick: () => void; disabled?: boolean }> = ({ icon, name, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center w-full p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-wait"
    >
        {icon}
        <span className="text-base font-medium text-white ml-3">Войти через {name}</span>
    </button>
);

const InnerContent: React.FC = () => {
    const { connectWallet, connectWalletConnect, connectWithSocial, isLoading, walletAvailable } = useWallet();

    const WalletNotFoundMessage = () => (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg w-full flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0"/>
                <h3 className="font-semibold text-yellow-300 text-center">Кошелек не обнаружен</h3>
            </div>
            <p className="text-sm text-yellow-400/80 text-justify hyphens-auto">
                Для подключения установите расширение, например MetaMask или OKX Wallet. Вы также можете войти через Google или Apple — мы автоматически создадим для вас безопасный кошелек.
            </p>
        </div>
    );

    return (
        <div className="p-4 space-y-3 flex flex-col items-center">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white">Вход в DeMarket</h2>
                <p className="text-gray-400 mt-1">Начните свободную торговлю.</p>
            </div>
            
             <div className="w-full space-y-3">
                <SocialLoginButton icon={<GoogleIcon />} name="Google" onClick={() => connectWithSocial('google')} disabled={isLoading} />
                <SocialLoginButton icon={<AppleIcon />} name="Apple" onClick={() => connectWithSocial('apple')} disabled={isLoading} />
            </div>
            
            <div className="flex items-center w-full my-2">
                <div className="flex-grow h-px bg-white/10"></div>
                <span className="flex-shrink-0 px-2 text-sm text-gray-400">ИЛИ</span>
                <div className="flex-grow h-px bg-white/10"></div>
            </div>

            { walletAvailable ? (
                <div className="w-full space-y-3">
                    <WalletButton icon="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" name="MetaMask" onClick={connectWallet} disabled={isLoading} />
                    <WalletButton icon="https://www.okx.com/static/media/okx-wallet.e525285b.svg" name="OKX Wallet" onClick={connectWallet} disabled={isLoading} />
                    <WalletButton icon="https://seeklogo.com/images/W/walletconnect-logo-EE82B50C97-seeklogo.com.png" name="WalletConnect" onClick={connectWalletConnect} disabled={isLoading} />
                </div>
            ) : (
                <WalletNotFoundMessage />
            )}

            {isLoading && <div className="text-cyan-400 animate-pulse pt-2">Подключение...</div>}

            <p className="text-xs text-gray-500 text-center pt-2 leading-relaxed">
                Продолжая, вы соглашаетесь с нашими <a href="#" className="underline text-gray-400 hover:text-white transition-colors">Условиями использования</a> и <a href="#" className="underline text-gray-400 hover:text-white transition-colors">Политикой конфиденциальности</a>. Ваш вход защищен с помощью криптографической подписи.
            </p>
        </div>
    );
};


export const ConnectWalletSheet: React.FC<ConnectWalletSheetProps> = ({ isPageReplacement = false }) => {
    if (isPageReplacement) {
        return (
            <div className="p-4 h-full flex items-center justify-center">
                <GlassPanel className="w-full max-w-sm rounded-3xl">
                    <InnerContent />
                </GlassPanel>
            </div>
        );
    }

    return <InnerContent />;
};
