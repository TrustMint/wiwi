
import { Badge, Chat, Dispute, DAOProposal, ArbitrationCase, Review, User, Listing } from '../types';

// BADGE CONFIGURATION (CONSTANTS)
// These are not "mock data" but static definitions of achievements
const welcomeBadges: Badge[] = [
    {
        id: 'badge-first-purchase',
        name: 'Первая покупка',
        description: 'Совершил свою первую сделку в качестве покупателя.',
        icon: 'first-purchase',
        condition: 'Совершите 1 покупку',
        perks: ['+50 GVT (Сила голоса в DAO)', 'Доступ к разделу "Отзывы"']
    },
    {
        id: 'badge-first-sale',
        name: 'Первая продажа',
        description: 'Завершил свою первую сделку в качестве продавца.',
        icon: 'first-sale',
        condition: 'Совершите 1 продажу',
        perks: ['+100 GVT (Сила голоса в DAO)', 'Скидка 10% на первое продвижение']
    },
    {
        id: 'badge-profile-pro',
        name: 'Профи',
        description: 'Полностью заполнил свой профиль пользователя.',
        icon: 'profile-pro',
        condition: 'Заполните все поля в профиле',
        perks: ['+25 GVT (Сила голоса в DAO)', 'Профиль выглядит более доверенным']
    },
    {
        id: 'badge-communicator',
        name: 'Коммуникатор',
        description: 'Начал свой первый диалог с другим пользователем.',
        icon: 'communicator',
        condition: 'Отправьте первое сообщение в чате',
        perks: ['+10 GVT (Сила голоса в DAO)']
    }
];

const growingBadges: Badge[] = [
    {
        id: 'badge-trusted-seller',
        name: 'Надежный продавец',
        description: 'Завершил 5 сделок с рейтингом выше 4.5 звезд.',
        icon: 'trusted-seller',
        condition: '5 продаж с рейтингом > 4.5',
        perks: ['Снижение комиссии DAO на 0.05%', '+250 GVT (Сила голоса в DAO)']
    },
    {
        id: 'badge-power-buyer',
        name: 'Активный покупатель',
        description: 'Совершил 5 успешных покупок на платформе.',
        icon: 'power-buyer',
        condition: 'Совершите 5 покупок',
        perks: ['Приоритетный доступ к новым функциям', '+200 GVT (Сила голоса в DAO)']
    },
    {
        id: 'badge-collector',
        name: 'Коллекционер',
        description: 'Добавил 10 объявлений в избранное.',
        icon: 'collector',
        condition: 'Добавьте 10 объявлений в избранное',
        perks: ['Персональные подборки на главной', '+50 GVT (Сила голоса в DAO)']
    },
    {
        id: 'badge-specialist',
        name: 'Специалист',
        description: 'Разместил 5 объявлений в одной и той же категории.',
        icon: 'specialist',
        condition: '5 объявлений в одной категории',
        perks: ['Скидка 15% на продвижение в этой категории']
    },
    {
        id: 'badge-community-member',
        name: 'Участник сообщества',
        description: 'Проголосовал в первом предложении DAO.',
        icon: 'community-member',
        condition: 'Проголосуйте в любом предложении DAO',
        perks: ['+100 GVT (Сила голоса в DAO)', 'Доступ к закрытому чату DAO']
    }
];

const establishedBadges: Badge[] = [
    {
        id: 'badge-top-seller',
        name: 'Топ-продавец',
        description: 'Получил 25+ положительных отзывов с рейтингом выше 4.8.',
        icon: 'top-seller',
        condition: '25+ отзывов с рейтингом > 4.8',
        perks: ['Снижение комиссии DAO на 0.1%', 'Особая отметка в профиле', 'Приоритетная поддержка']
    },
    {
        id: 'badge-veteran',
        name: 'Ветеран',
        description: 'Является участником платформы более года.',
        icon: 'veteran',
        condition: 'Быть на платформе 1 год',
        perks: ['+1000 GVT (Сила голоса в DAO)', 'Эксклюзивный скин для профиля']
    },
    {
        id: 'badge-arbitrator',
        name: 'Арбитр',
        description: 'Принял участие в разрешении спора в качестве арбитра.',
        icon: 'arbitrator',
        condition: 'Примите участие в арбитраже',
        perks: ['Возможность получать награды за арбитраж', '+500 GVT (Сила голоса в DAO)']
    },
    {
        id: 'badge-tycoon',
        name: 'Магнат',
        description: 'Общий объем продаж превысил $10,000.',
        icon: 'tycoon',
        condition: 'Объем продаж > $10,000',
        perks: ['Снижение комиссии DAO на 0.25%', 'Персональный менеджер']
    },
    {
        id: 'badge-reputation-master',
        name: 'Мастер репутации',
        description: 'Получил 50 положительных отзывов.',
        icon: 'reputation-master',
        condition: 'Получите 50 отзывов',
        perks: ['Возможность закреплять лучший отзыв', '+750 GVT (Сила голоса в DAO)']
    }
];

const legendaryBadges: Badge[] = [
    {
        id: 'badge-dao-legislator',
        name: 'Законодатель DAO',
        description: 'Создал предложение в DAO, которое было успешно принято сообществом.',
        icon: 'dao-legislator',
        condition: 'Создайте и проведите успешное голосование в DAO',
        perks: ['Удвоенный вес голоса (GVT) на 1 месяц', 'Особая роль в сообществе Discord']
    },
    {
        id: 'badge-market-maker',
        name: 'Маркет-мейкер',
        description: 'Совершил 100 успешных продаж.',
        icon: 'market-maker',
        condition: 'Совершите 100 продаж',
        perks: ['Снижение комиссии DAO на 0.5% (постоянно)', 'Бесплатное продвижение 5 объявлений в месяц']
    },
    {
        id: 'badge-centurion',
        name: 'Центурион',
        description: 'Совершил 100 успешных покупок.',
        icon: 'centurion',
        condition: 'Совершите 100 покупок',
        perks: ['Кэшбэк 0.1% на все покупки токенами $DMT', 'Эксклюзивные предложения от партнеров']
    },
    {
        id: 'badge-og',
        name: 'DeMarket OG',
        description: 'Является участником платформы более 3 лет.',
        icon: 'og',
        condition: 'Быть на платформе 3 года',
        perks: ['+5000 GVT (Сила голоса в DAO)', 'Доступ к альфа-тестам новых функций']
    },
     {
        id: 'badge-evangelist',
        name: 'Евангелист',
        description: 'Пригласил 10 активных пользователей на платформу.',
        icon: 'evangelist',
        condition: 'Пригласите 10 пользователей (скоро)',
        perks: ['Получение % от комиссий приглашенных друзей', 'Особая отметка в профиле']
    },
];

export const mockBadges: Badge[] = [
    ...welcomeBadges,
    ...growingBadges,
    ...establishedBadges,
    ...legendaryBadges
];

// Empty arrays for production state (Data is now fetched from Subgraph/Chain)
export const mockUsers: User[] = [];
export const mockListings: Listing[] = [];
export const mockChats: Chat[] = [];
export const mockDisputes: Dispute[] = [];
export const mockProposals: DAOProposal[] = [];
export const mockArbitrationCases: ArbitrationCase[] = [];
export const mockReviews: Review[] = [];
