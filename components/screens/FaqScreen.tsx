
import React from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { ChevronRightIcon, ChevronLeftIcon } from '../icons/Icons';
import { useModal } from '../../hooks/useModal';
import { 
  TbRocket, 
  TbWallet, 
  TbCoins, 
  TbShieldCheck, 
  TbTrophy, 
  TbPercentage, 
  TbDiamond, 
  TbLock, 
  TbBuildingBank, 
  TbBook 
} from 'react-icons/tb';

// Helper for colored icons in larger square
const FaqIcon: React.FC<{ icon: React.ElementType; color: string }> = ({ icon: Icon, color }) => (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-800 ${color}`}>
        <Icon size={22} />
    </div>
);

const faqData = [
    // === 1. НАЧАЛО РАБОТЫ ===
    {
        id: 'getting_started',
        title: "Начало работы",
        icon: <FaqIcon icon={TbRocket} color="text-blue-400" />,
        content: (
            <>
                <p><strong>Что такое DeMarket?</strong><br />
                DeMarket — это децентрализованный P2P-маркетплейс, созданный для обеспечения свободной и безопасной торговли без посредников. В отличие от централизованных платформ, мы используем смарт-контракты для гарантии исполнения сделок (Escrow) и управляемся сообществом через DAO (Децентрализованную Автономную Организацию).</p>
                
                <p><strong>Первые шаги на DeMarket:</strong><br />
                <ol className="list-decimal list-inside space-y-1 pl-2 mt-2">
                    <li><strong>Создайте кошелек:</strong> Вы можете войти через Google/Apple (мы создадим для вас безопасный кошелек) или подключить существующий, например, MetaMask.</li>
                    <li><strong>Пополните баланс:</strong> Приобретите стейблкоины (USDC/USDT) в сети Arbitrum One. Это можно сделать на P2P-площадках крупных бирж.</li>
                    <li><strong>Настройте профиль:</strong> Укажите ваш город, чтобы видеть релевантные объявления.</li>
                    <li><strong>Начинайте торговать:</strong> Вы готовы размещать объявления и совершать безопасные покупки!</li>
                </ol>
                </p>
            </>
        )
    },
    {
        id: 'wallets',
        title: "Кошельки: MetaMask vs. Вход через соцсети",
        icon: <FaqIcon icon={TbWallet} color="text-cyan-400" />,
        content: (
            <>
                 <p>На DeMarket есть два способа управления вашими средствами:</p>
                <p><strong>1. Внешний кошелек (например, MetaMask):</strong><br/>
                Это стандартный Web3-подход. Вы подключаете свой собственный кошелек, где хранятся ваши средства и NFT.
                <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                    <li><strong>Плюсы:</strong> Полный и единоличный контроль над вашими активами ("your keys, your crypto").</li>
                    <li><strong>Минусы:</strong> Вы несете полную ответственность за сохранность вашей сид-фразы. Ее утеря приведет к безвозвратной потере средств.</li>
                </ul>
                </p>
                <p><strong>2. Встроенный кошелек (Вход через Google/Apple):</strong><br/>
                Мы используем технологию Абстракции Счета (EIP-4337), чтобы создать для вас уникальный смарт-контракт кошелек, привязанный к вашему социальному аккаунту.
                <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                    <li><strong>Плюсы:</strong> Максимальная простота — не нужно запоминать сид-фразы. Есть возможность восстановления доступа через ваш Google/Apple аккаунт. Идеально для новичков.</li>
                    <li><strong>Минусы:</strong> Технически, доступ к кошельку частично зависит от безопасности вашего социального аккаунта.</li>
                </ul>
                </p>
            </>
        )
    },
     {
        id: 'crypto',
        title: "Где взять криптовалюту?",
        icon: <FaqIcon icon={TbCoins} color="text-yellow-400" />,
        content: (
            <>
                <p>Для совершения покупок на DeMarket используются стейблкоины (USDC или USDT) в сети Arbitrum One. Это цифровые активы, курс которых стабилен и привязан к доллару США. Вот пошаговая инструкция, как их приобрести.</p>
                
                <div>
                    <strong className="text-white">Шаг 1: Покупка на P2P-платформе (на примере Bybit P2P)</strong>
                    <ol className="list-decimal list-inside space-y-1 pl-2 mt-2">
                        <li>Зарегистрируйтесь на крупной бирже (например, Bybit, OKX, Binance) и пройдите верификацию личности (KYC).</li>
                        <li>Перейдите в раздел "Купить криптовалюту" → "P2P-торговля".</li>
                        <li>Выберите монету (USDT или USDC), вашу местную валюту (например, RUB) и способ оплаты (например, перевод на карту).</li>
                        <li>Найдите надежного продавца с хорошим рейтингом и создайте сделку на нужную сумму.</li>
                        <li>Переведите деньги продавцу по указанным реквизитам и нажмите "Я оплатил". После подтверждения продавцом, криптовалюта поступит на ваш баланс на бирже.</li>
                    </ol>
                </div>

                <div>
                    <strong className="text-white">Шаг 2: Вывод средств на ваш Web3-кошелек</strong>
                    <p>Теперь, когда у вас есть стейблкоины на бирже, их нужно перевести на ваш личный децентрализованный кошелек (например, MetaMask), чтобы использовать на DeMarket.</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2 mt-2">
                         <li>В вашем аккаунте на бирже перейдите в раздел "Активы" → "Вывести".</li>
                         <li>Выберите монету, которую вы купили (USDT или USDC).</li>
                         <li>В поле "Адрес кошелька" вставьте адрес вашего кошелька MetaMask.</li>
                         <li className="p-2 bg-yellow-500/10 border-l-4 border-yellow-400 rounded-r-lg text-yellow-300">
                            <strong className="font-bold text-yellow-200">ВАЖНО:</strong> В поле "Сеть" (Chain Type) обязательно выберите <strong>Arbitrum One (ARB1)</strong>. Отправка в другой сети приведет к потере средств!
                         </li>
                         <li>Введите сумму, подтвердите вывод и дождитесь поступления средств на ваш кошелек (обычно 1-5 минут).</li>
                    </ol>
                </div>

                <div>
                    <strong className="text-white">Шаг 3: Готово!</strong>
                    <p>Как только средства появятся в вашем MetaMask, вы можете подключать его к DeMarket и совершать безопасные покупки через Escrow.</p>
                </div>
            </>
        )
    },

    // === 2. КАК ЭТО РАБОТАЕТ ===
    {
        id: 'escrow',
        title: "Что такое Смарт-контракт Escrow?",
        icon: <FaqIcon icon={TbShieldCheck} color="text-green-400" />,
        content: (
            <>
                <p>Escrow — это ядро безопасности DeMarket. Представьте его как <strong className="text-white">"умный торговый автомат"</strong> для вашей сделки, который работает на блокчейне и не может быть обманут.</p>
                <p><strong>Как это работает:</strong>
                <ol className="list-decimal list-inside space-y-1 pl-2 mt-2">
                    <li><strong>Депозит:</strong> Покупатель вносит средства за товар. Автомат (смарт-контракт) надежно их блокирует.</li>
                    <li><strong>Отправка:</strong> Продавец видит, что деньги в автомате, и спокойно отправляет товар.</li>
                    <li><strong>Подтверждение:</strong> Покупатель получает товар, проверяет его и "нажимает кнопку" в приложении.</li>
                    <li><strong>Выдача средств:</strong> Автомат автоматически отдает деньги продавцу. Сделка завершена честно и без риска.</li>
                </ol>
                </p>
                 <p><strong>Что если что-то пошло не так?</strong><br/>
                Если товар не пришел или не соответствует описанию, покупатель может открыть спор. В этом случае "автомат" заблокирует средства до тех пор, пока независимые арбитры из DAO не решат, кому вернуть деньги. Это полностью исключает мошенничество.</p>
            </>
        )
    },
     {
        id: 'reputation',
        title: "Репутация и Доверие",
        icon: <FaqIcon icon={TbTrophy} color="text-amber-400" />,
        content: (
            <>
                <p><strong>Как работает система репутации?</strong><br />
                После каждой сделки покупатель и продавец могут оставить друг другу отзыв и рейтинг. Эти данные записываются в блокчейн и не могут быть изменены или удалены кем-либо. Это создает честную и прозрачную историю для каждого пользователя.</p>
                <p><strong>Что такое Баджи (Badges)?</strong><br />
                Это специальные непередаваемые NFT-награды (Soulbound Tokens), которые вы получаете за достижения на платформе: "Первая сделка", "10+ успешных продаж" и т.д. Они отображаются в вашем профиле и служат дополнительным знаком доверия.</p>
                <p><strong>Как выбрать надежного продавца?</strong><br />
                Обращайте внимание на:
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Общий рейтинг и количество отзывов.</li>
                    <li>Дату регистрации на платформе.</li>
                    <li>Наличие специальных баджей в профиле.</li>
                </ul>
                </p>
            </>
        )
    },
    {
        id: 'fees',
        title: "Комиссии и Газ",
        icon: <FaqIcon icon={TbPercentage} color="text-red-400" />,
        content: (
            <>
                <p><strong>Какие комиссии я плачу?</strong><br />
                Существует два типа сборов:
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Комиссия платформы (DAO):</strong> Мы взимаем всего 1% с каждой успешной сделки. Эти средства идут в казну DAO и используются сообществом для развития проекта.</li>
                    <li><strong>Сетевая комиссия (Газ):</strong> Это небольшая плата, которую вы платите сети блокчейн (Arbitrum) за обработку вашей транзакции (например, за блокировку средств). DeMarket не получает эти деньги. Благодаря L2-технологии, эта комиссия обычно составляет всего несколько центов ($0.01 - $0.10).</li>
                </ul>
                </p>
                <p><strong>Нужно ли платить за размещение объявлений?</strong><br/>
                Базовое размещение объявлений бесплатно. Платные опции, такие как "Поднять в поиске", оплачиваются отдельно токенами $DMT.</p>
            </>
        )
    },
    
    // === 3. ЭКОСИСТЕМА DEMARKET ===
    {
        id: 'tokenomics',
        title: "Экосистема DeMarket ($DMT)",
        icon: <FaqIcon icon={TbDiamond} color="text-purple-400" />,
        content: (
            <>
                <p><strong>Что такое токен $DMT?</strong><br />
                $DMT (DeMarket Token) — это utility-токен, который является "топливом" нашей платформы. Он не используется для оплаты товаров, но необходим для доступа к ключевым функциям и участия в экосистеме.</p>
                <p><strong>Для чего используется $DMT?</strong><br/>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Стейкинг:</strong> Внесение токенов в стейк необходимо для подачи жалоб, участия в арбитраже и голосованиях DAO.</li>
                    <li><strong>Оплата услуг:</strong> Продвижение объявлений и другие премиум-функции оплачиваются исключительно в $DMT.</li>
                    <li><strong>Награды:</strong> Активные участники, особенно арбитры, получают вознаграждение в $DMT.</li>
                </ul>
                </p>
            </>
        )
    },
     {
        id: 'staking',
        title: "Стейкинг и Арбитраж",
        icon: <FaqIcon icon={TbLock} color="text-orange-400" />,
        content: (
            <>
                 <p><strong>Что такое стейкинг?</strong><br />
                Стейкинг — это процесс "заморозки" ваших токенов $DMT на платформе. Это доказывает вашу заинтересованность в честной работе экосистемы и открывает доступ к расширенным функциям.</p>
                <p><strong>Зачем нужен стейкинг?</strong><br/>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Чтобы подать жалобу:</strong> Необходим минимальный стейк в <strong>100 $DMT</strong>. Это защищает систему от спама.</li>
                    <li><strong>Чтобы стать арбитром:</strong> Необходимо внести в стейк <strong>5,000 $DMT</strong> или больше. Это позволяет вам участвовать в разрешении споров и получать за это награды.</li>
                </ul>
                </p>
            </>
        )
    },
    {
        id: 'dao',
        title: "Управление DAO",
        icon: <FaqIcon icon={TbBuildingBank} color="text-pink-400" />,
        content: (
            <>
                <p><strong>Что такое DAO?</strong><br />
                DAO (Децентрализованная Автономная Организация) — это коллективный орган управления платформой. Участники DAO принимают все ключевые решения: от размера комиссий до внедрения новых функций.</p>
                <p><strong>Как работает голосование?</strong><br/>
                Любой участник, имеющий стейк, может голосовать "За" или "Против" по активным предложениям. Решения принимаются на основе большинства голосов, взвешенных по "силе голоса".</p>
            </>
        )
    },

    // === 4. СЛОВАРЬ ===
    {
        id: 'glossary',
        title: "Словарь Web3-терминов",
        icon: <FaqIcon icon={TbBook} color="text-teal-400" />,
        content: (
            <>
                <p><strong>Кошелек (Wallet):</strong> Ваше цифровое портфолио для хранения криптовалюты и NFT. Может быть в виде программы (MetaMask) или встроен в приложение (вход через соцсети).</p>
                <p><strong>Смарт-контракт (Smart Contract):</strong> Программа, работающая на блокчейне. Она автоматически выполняет заранее заданные условия. Наш Escrow — это смарт-контракт.</p>
                <p><strong>Газ (Gas):</strong> Небольшая комиссия, которую вы платите сети блокчейн (не нам) за обработку вашей транзакции. В сети Arbitrum она очень низкая (обычно несколько центов).</p>
                <p><strong>Стейблкоин (Stablecoin):</strong> Криптовалюта, курс которой привязан к реальному активу, например, к доллару США (USDC, USDT). Это обеспечивает стабильность цен на маркетплейсе.</p>
            </>
        )
    }
];

type FaqCategory = typeof faqData[0];

const FaqDetailModalContent: React.FC<{ category: FaqCategory }> = ({ category }) => (
    <div className="px-4 pt-0 space-y-4">
        <h2 className="text-lg font-bold text-white text-center">{category.title}</h2>
        <div className="text-gray-300 text-sm leading-relaxed space-y-4 break-words hyphens-auto">
            {category.content}
        </div>
    </div>
);


const FaqCategoryRow: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void; isLast: boolean }> = ({ title, icon, onClick, isLast }) => (
    <div 
        onClick={onClick} 
        className="flex pl-4 cursor-pointer transition-colors active:bg-white/5"
    >
        <div className="flex flex-col justify-center py-3">
            {icon}
        </div>
        <div className={`flex-1 flex items-center justify-between py-3 mr-4 ml-3 ${!isLast ? 'border-b border-white/15' : ''}`}>
            <span className="text-white text-base font-medium">{title}</span>
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
        </div>
    </div>
);

interface FaqScreenProps {
    onBack: () => void;
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ onBack }) => {
    const { showModal } = useModal();

    const handleCategoryClick = (category: FaqCategory) => {
        showModal(<FaqDetailModalContent category={category} />);
    };
    
    return (
        <div className="h-full bg-black flex flex-col">
            <header className="sticky top-0 z-10 p-4 flex items-center bg-black/80 backdrop-blur-lg pt-12">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2">
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-1 pr-8">
                    FAQ & Помощь
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
                <GlassPanel className="overflow-hidden">
                    {faqData.map((category, index) => (
                        <FaqCategoryRow 
                            key={category.id} 
                            title={category.title}
                            icon={category.icon}
                            onClick={() => handleCategoryClick(category)}
                            isLast={index === faqData.length - 1}
                        />
                    ))}
                </GlassPanel>
            </main>
        </div>
    );
};