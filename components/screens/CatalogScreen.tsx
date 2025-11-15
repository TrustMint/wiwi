import React from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { Listing } from '../../types';
import { CategoryListingsScreen } from './CategoryListingsScreen';
import { ChevronRightIcon } from '../icons/Icons';

const IOSIcon: React.FC<{ emoji: string; }> = ({ emoji }) => (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800">
        <span className="text-xl">{emoji}</span>
    </div>
);

const categories = [
    { name: 'Недвижимость', icon: <IOSIcon emoji="🏠" /> },
    { name: 'Автомобили', icon: <IOSIcon emoji="🚗" /> },
    { name: 'Электроника', icon: <IOSIcon emoji="⚡️" /> },
    { name: 'Телефоны и аксессуары', icon: <IOSIcon emoji="📱" /> },
    { name: 'Компьютеры и ноутбуки', icon: <IOSIcon emoji="💻" /> },
    { name: 'Бытовая техника', icon: <IOSIcon emoji="🔌" /> },
    { name: 'Фото- и видеотехника', icon: <IOSIcon emoji="📷" /> },
    { name: 'Игровые приставки и игры', icon: <IOSIcon emoji="🎮" /> },
    { name: 'Цифровые товары', icon: <IOSIcon emoji="💾" /> },
    { name: 'Одежда, обувь, аксессуары', icon: <IOSIcon emoji="👕" /> },
    { name: 'Товары для детей и игрушки', icon: <IOSIcon emoji="🧸" /> },
    { name: 'Мебель и интерьер', icon: <IOSIcon emoji="🛋️" /> },
    { name: 'Ремонт и строительство', icon: <IOSIcon emoji="🛠️" /> },
    { name: 'Услуги', icon: <IOSIcon emoji="🧑‍🔧" /> },
    { name: 'Работа и вакансии', icon: <IOSIcon emoji="🧑‍💼" /> },
    { name: 'Обучение и курсы', icon: <IOSIcon emoji="🎓" /> },
    { name: 'Другое', icon: <IOSIcon emoji="📦" /> },
];

interface CatalogScreenProps {
    listings: Listing[];
    onListingClick: (listing: Listing) => void;
    favorites: string[];
    onToggleFavorite: (listingId: string) => void;
    onNavigateRequest: (screen: React.ReactNode) => void;
    onBack: () => void;
}

const CategoryRow: React.FC<{ name: string; icon: React.ReactNode; onClick: () => void }> = ({ name, icon, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="flex items-center p-3 cursor-pointer hover:bg-white/5 transition-colors"
        >
            {icon}
            <span className="flex-1 text-white text-base ml-4">{name}</span>
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
        </div>
    );
};

export const CatalogScreen: React.FC<CatalogScreenProps> = (props) => {
    
    const handleCategoryClick = (categoryName: string) => {
        props.onNavigateRequest(
            <CategoryListingsScreen 
                listings={props.listings}
                category={categoryName} 
                onBack={props.onBack}
                onListingClick={props.onListingClick} 
                favorites={props.favorites}
                onToggleFavorite={props.onToggleFavorite}
            />
        );
    };

    return (
        <div className="p-4 space-y-6 bg-black pb-28">
            <header className="pt-6 px-2">
                <h1 className="text-3xl font-bold text-white">Каталог</h1>
            </header>
            
            <GlassPanel className="overflow-hidden divide-y divide-white/10">
                {categories.map((category) => (
                    <CategoryRow 
                        key={category.name} 
                        name={category.name}
                        icon={category.icon}
                        onClick={() => handleCategoryClick(category.name)}
                    />
                ))}
            </GlassPanel>
        </div>
    );
};

export { CategoryListingsScreen };