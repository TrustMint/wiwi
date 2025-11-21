
import React from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { Listing } from '../../types';
import { CategoryListingsScreen } from './CategoryListingsScreen';
import { ChevronRightIcon } from '../icons/Icons';
// Use Tabler icons (Web3 aesthetic standard) from esm.sh
import { 
  TbBuildingSkyscraper, 
  TbCar, 
  TbCpu, 
  TbDeviceMobile, 
  TbDeviceLaptop, 
  TbPlug, 
  TbCamera, 
  TbDeviceGamepad2, 
  TbCloud, 
  TbArmchair, 
  TbHammer, 
  TbBriefcase, 
  TbUser, 
  TbSchool, 
  TbPackage
} from 'react-icons/tb';

// Updated wrapper: larger size (w-10 h-10), larger radius (rounded-xl)
const CategoryIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-800 text-xl ${className || 'text-white'}`}>
        {children}
    </div>
);

const categoriesData = [
    { name: 'Недвижимость', icon: TbBuildingSkyscraper, color: 'text-sky-400' },
    { name: 'Автомобили', icon: TbCar, color: 'text-red-500' },
    { name: 'Электроника', icon: TbCpu, color: 'text-violet-400' },
    { name: 'Телефоны и аксессуары', icon: TbDeviceMobile, color: 'text-cyan-400' },
    { name: 'Компьютеры и ноутбуки', icon: TbDeviceLaptop, color: 'text-indigo-400' },
    { name: 'Бытовая техника', icon: TbPlug, color: 'text-yellow-400' },
    { name: 'Фото- и видеотехника', icon: TbCamera, color: 'text-pink-400' },
    { name: 'Игровые приставки и игры', icon: TbDeviceGamepad2, color: 'text-purple-400' },
    { name: 'Цифровые товары', icon: TbCloud, color: 'text-blue-400' },
    { name: 'Мебель и интерьер', icon: TbArmchair, color: 'text-orange-400' },
    { name: 'Ремонт и строительство', icon: TbHammer, color: 'text-stone-400' },
    { name: 'Услуги', icon: TbBriefcase, color: 'text-emerald-400' },
    { name: 'Работа и вакансии', icon: TbUser, color: 'text-lime-400' },
    { name: 'Обучение и курсы', icon: TbSchool, color: 'text-fuchsia-400' },
    { name: 'Другое', icon: TbPackage, color: 'text-gray-400' },
];

interface CatalogScreenProps {
    listings: Listing[];
    onListingClick: (listing: Listing) => void;
    favorites: string[];
    onToggleFavorite: (listingId: string) => void;
    onNavigateRequest: (screen: React.ReactNode) => void;
    onBack: () => void;
}

const CategoryRow: React.FC<{ name: string; icon: React.ReactNode; onClick: () => void; isLast: boolean }> = ({ name, icon, onClick, isLast }) => {
    return (
        <div 
            onClick={onClick}
            className="flex pl-4 cursor-pointer transition-colors active:bg-white/5"
        >
            <div className="flex flex-col justify-center py-3 pr-3">
                {icon}
            </div>
            <div className={`flex-1 flex items-center justify-between py-3 mr-4 ${!isLast ? 'border-b border-white/15' : ''}`}>
                <span className="text-white text-base font-medium">{name}</span>
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </div>
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
            
            <GlassPanel className="overflow-hidden">
                {categoriesData.map((category, index) => (
                    <CategoryRow 
                        key={category.name} 
                        name={category.name}
                        icon={
                            <CategoryIconWrapper className={category.color}>
                                <category.icon size={22} />
                            </CategoryIconWrapper>
                        }
                        onClick={() => handleCategoryClick(category.name)}
                        isLast={index === categoriesData.length - 1}
                    />
                ))}
            </GlassPanel>
        </div>
    );
};

export { CategoryListingsScreen };
