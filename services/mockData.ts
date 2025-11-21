
import { User, Listing, Chat, Message, Dispute, DAOProposal, ArbitrationCase, Vote, Review, Badge } from '../types';

// TIER 1: Welcome Badges (Easy to achieve, encourages initial engagement)
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

// TIER 2: Growing Badges (Requires some effort and time)
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

// TIER 3: Established Badges (Recognizes significant contribution)
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

// TIER 4: Legendary Badges (Very long-term goals)
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


export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: '0x1a2...s0t',
    address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    avatar: `https://i.pravatar.cc/150?u=user-1`,
    rating: 98,
    reviews: 521,
    memberSince: 2022,
    location: { country: 'Россия', region: 'Москва (город)', city: 'Москва' },
    dmtBalance: 100000,
    stake: 50000,
    lockedStake: 1200,
    badges: [mockBadges[10], mockBadges[11]],
    unlockedBadges: [],
    reputationTier: 'gold',
    createdAt: new Date(Date.now() - 947 * 24 * 60 * 60 * 1000).toISOString(),
    firstDealAt: new Date(Date.now() - 920 * 24 * 60 * 60 * 1000).toISOString(),
    goodReviewsCount: 514,
    badReviewsCount: 7,
    avgPaymentTime: 2,
    avgTransferTime: 1,
  },
  {
    id: 'user-2',
    username: '0x098...edc',
    address: '0x0987654321fedcba98765432109876543210fedc',
    avatar: `https://i.pravatar.cc/150?u=user-2`,
    rating: 96,
    reviews: 88,
    memberSince: 2023,
    location: { country: 'Россия', region: 'Санкт-Петербург (город)', city: 'Санкт-Петербург' },
    dmtBalance: 50000,
    stake: 10000,
    lockedStake: 0,
    badges: [mockBadges[1]],
    unlockedBadges: [],
    reputationTier: 'silver',
    createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    firstDealAt: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString(),
    goodReviewsCount: 85,
    badReviewsCount: 3,
    avgPaymentTime: 5,
    avgTransferTime: 3,
  },
  {
    id: 'user-3',
    username: '0xabc...stu',
    address: '0xabc123def456ghi789jkl012mno345pqr678stu9',
    avatar: `https://i.pravatar.cc/150?u=user-3`,
    rating: 92,
    reviews: 42,
    memberSince: 2024,
    location: { country: 'Беларусь', region: 'Минская область', city: 'Минск' },
    dmtBalance: 25000,
    stake: 5000,
    lockedStake: 300,
    badges: [],
    unlockedBadges: [],
    reputationTier: 'bronze',
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    firstDealAt: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString(),
    goodReviewsCount: 39,
    badReviewsCount: 3,
    avgPaymentTime: 10,
    avgTransferTime: 5,
  },
];

const createListing = (id: number, seller: User, overrides: Partial<Listing>): Listing => {
    const defaults: Omit<Listing, 'id' | 'seller'> = {
        title: `Mock Listing ${id}`,
        description: 'This is a detailed description for a high-quality product. It has been well-maintained and is in excellent working condition. Comes with all original accessories.',
        price: 100 + id * 10,
        currency: 'USDC',
        images: [`https://picsum.photos/seed/listing-${id}/400/400`],
        category: 'Электроника',
        condition: 'Used',
        status: 'Available',
        createdAt: new Date(Date.now() - id * 1000 * 60 * 60 * 24).toISOString(),
        location: seller.location ? `${seller.location.city}, ${seller.location.country}` : 'Неизвестно',
        quantity: 1,
        tags: [],
    };
    return { ...defaults, ...overrides, id: `listing-${id}`, seller };
};

export const mockListings: Listing[] = [
    createListing(1, mockUsers[1], {
        title: 'iPhone 15 Pro 256GB Natural Titanium',
        price: 1200,
        currency: 'USDT',
        images: ['https://i.insider.com/6501e3ec04d471001962a133?width=1200&format=jpeg'],
        category: 'Телефоны и аксессуары',
        condition: 'New',
        status: 'Available',
        quantity: 5,
        boostedUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['айфон', 'смартфон', 'телефон', 'apple'],
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        isNegotiable: true,
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        attributes: {
            'Память (GB)': 256,
            'Цвет': 'Natural Titanium',
            'RAM (GB)': 8,
        }
    }),
    createListing(2, mockUsers[0], {
        title: 'Sony A7 IV Body',
        price: 2200,
        currency: 'USDC',
        images: ['https://www.bhphotovideo.com/images/images2500x2500/sony_ilce_7m4_b_alpha_a7_iv_mirrorless_1667802.jpg', 'https://www.trustedreviews.com/wp-content/uploads/sites/54/2021/11/Sony-A7-IV-_3-1-scaled.jpg'],
        category: 'Фото- и видеотехника',
        condition: 'Used',
        status: 'Available',
        tags: ['фотоаппарат', 'камера', 'sony', 'беззеркалка'],
        brand: 'Sony',
        model: 'Alpha A7 IV'
    }),
    createListing(3, mockUsers[2], {
        title: 'Кроссовки Nike Air Jordan 1',
        price: 250,
        currency: 'USDT',
        images: ['https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Reimagined-Product.jpg?fit=fill&bg=FFFFFF&w=1200&h=860&fm=jpg&auto=compress&q=90&dpr=2&trim=color&updated_at=1665693089'],
        category: 'Одежда, обувь, аксессуары',
        condition: 'New',
        status: 'In Escrow',
        buyer: mockUsers[1],
        quantity: 1,
        brand: 'Nike',
        model: 'Air Jordan 1'
    }),
    createListing(4, mockUsers[0], {
        title: 'BMW M3 G80',
        price: 95000,
        currency: 'USDC',
        images: ['https://cdn.bmwblog.com/wp-content/uploads/2022/07/bmw-m3-touring-g81-most-expensive-16.jpg'],
        category: 'Автомобили',
        condition: 'Used',
        status: 'Available',
        tags: ['бмв', 'машина', 'авто', 'седан', 'm3'],
        brand: 'BMW',
        model: 'M3 G80',
        isNegotiable: false,
        proofOfPurchaseCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        attributes: {
            'Год выпуска': 2022,
            'Пробег (км)': 15000,
            'Объем двигателя (л)': 3.0,
            'Коробка передач': 'Автомат',
        }
    }),
    createListing(5, mockUsers[1], {
        title: 'Услуги графического дизайна',
        price: 100,
        currency: 'USDC',
        images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2942&auto=format&fit=crop'],
        category: 'Услуги',
        condition: 'New',
        status: 'Sold',
        buyer: mockUsers[2],
        quantity: 0,
        isNegotiable: true,
        serviceDetails: {
            duration: 1,
            unit: 'project',
            locationType: 'remote'
        }
    }),
    createListing(6, mockUsers[2], {
        title: 'Аренда 1-комнатной квартиры, Минск',
        price: 800,
        currency: 'USDT',
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2940&auto=format&fit=crop'],
        category: 'Недвижимость',
        condition: 'Used', // This will be ignored by the UI
        status: 'Available',
        quantity: 1, // This will be ignored by the UI
        attributes: {
            'Тип сделки': 'Аренда',
            'Тип недвижимости': 'Квартира',
            'Площадь (м²)': 42,
            'Количество комнат': 1,
            'Этаж': 7,
            'Этажей в доме': 15,
        }
    }),
    createListing(7, mockUsers[0], {
        title: 'Гитара акустическая Yamaha F310',
        price: 150,
        currency: 'USDC',
        images: ['https://picsum.photos/seed/new-listing-7/400/400'],
        category: 'Музыкальные инструменты',
        condition: 'Used',
        status: 'Available',
        boostedUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        brand: 'Yamaha',
        model: 'F310'
    }),
    createListing(8, mockUsers[1], {
        title: 'Игровая приставка Steam Deck 512GB',
        price: 550,
        currency: 'USDT',
        images: ['https://picsum.photos/seed/new-listing-8/400/400'],
        category: 'Игровые приставки и игры',
        condition: 'Used',
        status: 'Available',
        tags: ['steamdeck', 'valve', 'консоль', 'портативка'],
        brand: 'Valve',
        model: 'Steam Deck'
    }),
    // New listings for User 1
    createListing(9, mockUsers[0], {
        title: 'MacBook Pro 16 M3 Max',
        price: 3500,
        currency: 'USDC',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=2626&auto=format&fit=crop'],
        category: 'Компьютеры и ноутбуки',
        condition: 'New',
        status: 'Available',
        brand: 'Apple',
        model: 'MacBook Pro',
        attributes: { 'Процессор': 'M3 Max', 'RAM (GB)': 36, 'Тип накопителя': 'SSD', 'Объем накопителя (GB)': 1000 }
    }),
    createListing(10, mockUsers[0], {
        title: 'PlayStation 5 Slim',
        price: 450,
        currency: 'USDT',
        images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=2940&auto=format&fit=crop'],
        category: 'Игровые приставки и игры',
        condition: 'New',
        status: 'Available',
        brand: 'Sony',
        model: 'PS5 Slim'
    }),
    createListing(11, mockUsers[0], {
        title: 'AirPods Max Silver',
        price: 400,
        currency: 'USDC',
        images: ['https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=2940&auto=format&fit=crop'],
        category: 'Электроника',
        condition: 'Used',
        status: 'Available',
        brand: 'Apple',
        model: 'AirPods Max'
    }),
    createListing(12, mockUsers[0], {
        title: 'Dyson V15 Detect',
        price: 600,
        currency: 'USDT',
        images: ['https://images.unsplash.com/photo-1558317374-a35498f96533?q=80&w=2864&auto=format&fit=crop'],
        category: 'Бытовая техника',
        condition: 'New',
        status: 'Available',
        brand: 'Dyson',
        model: 'V15'
    }),
    createListing(13, mockUsers[0], {
        title: 'Herman Miller Aeron',
        price: 900,
        currency: 'USDC',
        images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=2950&auto=format&fit=crop'],
        category: 'Мебель и интерьер',
        condition: 'Used',
        status: 'Available',
        brand: 'Herman Miller',
        model: 'Aeron'
    }),
    createListing(14, mockUsers[0], {
        title: 'iPad Pro 12.9 M2',
        price: 1000,
        currency: 'USDT',
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=2915&auto=format&fit=crop'],
        category: 'Электроника',
        condition: 'Used',
        status: 'Available',
        brand: 'Apple',
        model: 'iPad Pro'
    }),
    createListing(15, mockUsers[0], {
        title: 'DJI Mini 4 Pro',
        price: 750,
        currency: 'USDC',
        images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2940&auto=format&fit=crop'],
        category: 'Фото- и видеотехника',
        condition: 'New',
        status: 'Available',
        brand: 'DJI',
        model: 'Mini 4 Pro'
    })
];


const createChat = (id: number, user: User, messages: Message[], pinned?: boolean): Chat => {
    const lastMessage = messages[messages.length - 1];
    return {
        id: `chat-${id}`,
        user,
        lastMessage: lastMessage.text,
        timestamp: '1д',
        unread: id === 1 ? 2 : 0,
        messages,
        pinned,
    };
};

export const mockChats: Chat[] = [
    createChat(1, mockUsers[1], [
        { id: 'msg-1-1', text: 'Здравствуйте! MacBook еще в продаже?', sender: 'me', timestamp: '14:30', status: 'read' },
        { id: 'msg-1-2', text: 'Добрый день! Да, в продаже.', sender: 'them', timestamp: '14:32', status: 'read' },
        { id: 'msg-1-3', text: 'Отлично, готов купить через Escrow.', sender: 'me', timestamp: '14:35', status: 'delivered' },
        { id: 'msg-1-4', text: 'Хорошо, жду вашего подтверждения.', sender: 'them', timestamp: '14:36', status: 'sent' },
    ], true),
    createChat(2, mockUsers[2], [
        { id: 'msg-2-1', text: 'Привет! Расскажите про состояние авто.', sender: 'me', timestamp: '10:00', status: 'read' },
        { id: 'msg-2-2', text: 'Состояние идеальное, пробег 20 тыс. км.', sender: 'them', timestamp: '10:05', status: 'read' },
    ]),
];

export const mockDisputes: Dispute[] = [
    {
        id: 'dispute-1',
        listing: mockListings.find(l => l.status === 'In Escrow')!,
        status: 'review',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        lastMessage: 'Пожалуйста, обе стороны, загрузите доказательства...',
        timestamp: '15:06',
        unread: 1,
        messages: [
            { id: 'dispute-1-1', text: 'Арбитр DAO подключился к спору.', sender: 'them', senderType: 'arbitrator', timestamp: '15:01', status: 'read' },
            { id: 'dispute-1-2', text: 'Здравствуйте. Я не получил товар, хотя продавец утверждает, что отправил его.', sender: 'me', timestamp: '15:02', status: 'read' },
            { id: 'dispute-1-3', text: 'Я все отправил! У меня есть квитанция. Покупатель просто пытается меня обмануть.', sender: 'them', timestamp: '15:05', status: 'read' },
            { id: 'dispute-1-4', text: 'Пожалуйста, обе стороны, загрузите доказательства (фото, видео, скриншоты переписки, квитанции) в течение 24 часов.', sender: 'them', senderType: 'arbitrator', timestamp: '15:06', status: 'read' },
        ]
    }
];

const mockVotes: Vote[] = [
    { voterUsername: '0x1a2...s0t', voterAvatar: `https://i.pravatar.cc/150?u=user-1`, choice: 'for', power: 50000, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { voterUsername: '0xabc...stu', voterAvatar: `https://i.pravatar.cc/150?u=user-3`, choice: 'against', power: 25000, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { voterUsername: '0xdef...456', voterAvatar: `https://i.pravatar.cc/150?u=user-4`, choice: 'for', power: 75000, timestamp: new Date(Date.now() - 1 * 12 * 60 * 60 * 1000).toISOString() },
];


export const mockProposals: DAOProposal[] = [
    {
        id: 'prop-1',
        title: 'Снизить комиссию платформы до 0.8%',
        description: 'Предлагается снизить комиссию с 1% до 0.8% для повышения конкурентоспособности платформы и привлечения новых пользователей. Ожидается, что это увеличит общий объем торгов, что компенсирует снижение процентной ставки.\n\nТекущая комиссия: 1%\nПредлагаемая комиссия: 0.8%\n\nОбоснование: Привлечение большего числа продавцов и покупателей за счет более выгодных условий.',
        proposer: '0x098...edc',
        status: 'active',
        votesFor: 125000,
        votesAgainst: 45000,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        quorum: 50, // 50%
        votes: mockVotes,
    },
    {
        id: 'prop-2',
        title: 'Интеграция с блокчейном Solana для стейблкоинов',
        description: 'Добавление поддержки USDC и USDT в сети Solana позволит снизить транзакционные издержки для пользователей и ускорить проведение сделок.',
        proposer: '0x1a2...s0t',
        status: 'passed',
        votesFor: 210000,
        votesAgainst: 15000,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        quorum: 40,
        votes: [],
    },
     {
        id: 'prop-3',
        title: 'Выделить грант на маркетинговую кампанию',
        description: 'Предлагается выделить 50,000 USDC из казны DAO на проведение маркетинговой кампании в социальных сетях для привлечения новой аудитории.',
        proposer: '0xabc...stu',
        status: 'failed',
        votesFor: 80000,
        votesAgainst: 95000,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        quorum: 50,
        votes: [],
    },
];

export const mockArbitrationCases: ArbitrationCase[] = [
    {
        id: 'case-1',
        dispute: mockDisputes[0],
        status: 'voting',
        evidence: [
            { id: 'ev-1', uploader: 'seller', type: 'image', url: 'https://picsum.photos/seed/receipt/300/200', description: 'Квитанция об отправке', timestamp: new Date().toISOString() },
            { id: 'ev-2', uploader: 'buyer', type: 'text', content: 'Трек-номер не отслеживается уже неделю. Продавец перестал отвечать на сообщения.', description: 'Показания покупателя', timestamp: new Date().toISOString() },
        ],
        votesForBuyer: 2,
        votesForSeller: 1,
        arbitrators: ['0x1a2...s0t', '0x098...edc', '0xabc...stu', '0xarb...th4', '0xarb...th5'],
        votes: [
            { arbitratorAddress: '0x1a2...s0t', decision: 'buyer', comment: 'Продавец не предоставил достаточно убедительных доказательств отправки.', timestamp: new Date().toISOString() },
            { arbitratorAddress: '0x098...edc', decision: 'buyer', comment: 'Отсутствие ответа от продавца вызывает подозрения.', timestamp: new Date().toISOString() },
            { arbitratorAddress: '0xabc...stu', decision: 'seller', comment: 'Квитанция выглядит подлинной.', timestamp: new Date().toISOString() }
        ],
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'case-2',
        dispute: { ...mockDisputes[0], id: 'dispute-2', listing: mockListings[6] },
        status: 'resolved',
        evidence: [],
        votesForBuyer: 1,
        votesForSeller: 4,
        arbitrators: ['0x1a2...s0t', '0x098...edc', '0xabc...stu', '0xarb...th4', '0xarb...th5'],
        votes: [],
        deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resolution: {
            winner: 'seller',
            reason: 'Большинство арбитров сочли доказательства продавца достаточными. Покупатель не смог опровергнуть факт получения товара.'
        }
    }
];

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    listingId: 'listing-5',
    rating: 100,
    comment: 'Отличный исполнитель! Все сделал быстро и качественно. Очень доволен результатом. Рекомендую!',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    buyerUsername: '0x1a2...s0t',
    buyerAvatar: `https://i.pravatar.cc/150?u=user-1`
  },
   {
    id: 'review-2',
    listingId: 'listing-2',
    rating: 80,
    comment: 'Машина в хорошем состоянии, как и в описании. Были небольшие царапины, но в целом все отлично. Продавец был вежлив.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    buyerUsername: '0xano...eth',
    buyerAvatar: `https://i.pravatar.cc/150?u=user-4`
  },
  {
    id: 'review-3',
    listingId: 'listing-4',
    rating: 100,
    comment: 'Работал не первый. Всё отлично.буду обращаться далее.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    buyerUsername: 'User8687PHigSI',
    buyerAvatar: `https://i.pravatar.cc/150?u=user-5`
  },
  {
    id: 'review-4',
    listingId: 'listing-4',
    rating: 100,
    comment: 'Обмен на наличные в СПб, комфортная прозрачная сделка в офисе, оперативная поддержка и сопровождение, впечатления положительные. Рекомендую👍',
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    buyerUsername: 'User1137DEC8f2',
    buyerAvatar: `https://i.pravatar.cc/150?u=user-6`
  },
  {
    id: 'review-5',
    listingId: 'listing-4',
    rating: 20,
    comment: 'Ненадежный. Долго не отвечал.',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    buyerUsername: 'Three6tripin',
    buyerAvatar: `https://i.pravatar.cc/150?u=user-7`
  },
  {
    id: 'review-6',
    listingId: 'listing-7',
    rating: 100,
    comment: 'Быстрые ответы,Надёжный,Быстрые ответы',
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    buyerUsername: 'WhiteG_business',
    buyerAvatar: `https://i.pravatar.cc/150?u=user-8`
  }
];