
import React, { useMemo, useState, useCallback } from 'react';
import { Listing } from '../../types';
import { HeartIcon, FunnelIcon, ChevronLeftIcon } from '../icons/Icons';
import { ListingGrid } from '../shared/ListingGrid';
import { useModal } from '../../hooks/useModal';

interface FavoritesScreenProps {
  listings: Listing[];
  favorites: string[];
  onListingClick: (listing: Listing) => void;
  onToggleFavorite: (listingId: string) => void;
  isSubScreen?: boolean;
  onBack?: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ 
  listings = [], 
  favorites = [], 
  onListingClick, 
  onToggleFavorite, 
  isSubScreen = false, 
  onBack 
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const { showModal, hideModal } = useModal();

    const favoriteListings = useMemo(() => {
        return listings.filter(listing => favorites.includes(listing.id));
    }, [listings, favorites]);

    const categories = useMemo(() => {
        return [...new Set(favoriteListings.map(l => l.category))].sort();
    }, [favoriteListings]);

    const filteredFavorites = useMemo(() => {
        if (!selectedCategory) {
            return favoriteListings;
        }
        return favoriteListings.filter(l => l.category === selectedCategory);
    }, [favoriteListings, selectedCategory]);

    const hasFavorites = favoriteListings.length > 0;
    const hasFilteredResults = filteredFavorites.length > 0;

    const handleCategorySelect = useCallback((category: string) => {
        setSelectedCategory(category);
        hideModal();
    }, [hideModal]);

    const openCategoryModal = useCallback(() => {
        showModal(
            <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
                <h3 className="px-3 pt-1 pb-2 text-lg font-bold text-white text-center">
                    Фильтр по категории
                </h3>
                <button 
                    onClick={() => handleCategorySelect('')}
                    className={`w-full text-left px-3 py-2.5 text-base rounded-lg transition-colors ${
                        selectedCategory === '' 
                            ? 'font-semibold text-cyan-400 bg-white/5' 
                            : 'text-white hover:bg-white/10'
                    }`}
                >
                    Все категории
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`w-full text-left px-3 py-2.5 text-base rounded-lg transition-colors ${
                            selectedCategory === cat 
                                ? 'font-semibold text-cyan-400 bg-white/5' 
                                : 'text-white hover:bg-white/10'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        );
    }, [showModal, handleCategorySelect, selectedCategory, categories]);

    const handleBackClick = useCallback(() => {
        if (onBack) {
            onBack();
        }
    }, [onBack]);

    const handleBackKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && onBack) {
            e.preventDefault();
            onBack();
        }
    }, [onBack]);

    const clearFilter = useCallback(() => {
        setSelectedCategory('');
    }, []);

    return (
        <div className="h-full flex flex-col bg-black">
            {isSubScreen ? (
                <header className="sticky top-0 z-30 p-4 flex items-center justify-between bg-black/80 backdrop-blur-lg pt-12">
                    <div className="flex items-center flex-1">
                        <button 
                            onClick={handleBackClick}
                            onKeyDown={handleBackKeyDown}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors -ml-2"
                            aria-label="Назад"
                        >
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <h1 className="text-xl font-bold text-white ml-4">Избранное</h1>
                    </div>
                </header>
            ) : (
                <div className="px-4 pt-12 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Избранное</h1>
                </div>
            )}
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
                {hasFavorites && (
                    <div className="space-y-3">
                        {categories.length > 1 && (
                            <button 
                                onClick={openCategoryModal}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm flex justify-between items-center hover:bg-white/10"
                                aria-haspopup="dialog"
                                aria-expanded="false"
                            >
                                <span>{selectedCategory || 'Все категории'}</span>
                                <FunnelIcon className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        
                        {selectedCategory && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                    Категория: <span className="text-white font-medium">{selectedCategory}</span>
                                </span>
                                <button 
                                    onClick={clearFilter}
                                    className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
                                >
                                    Сбросить
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {hasFavorites ? (
                    hasFilteredResults ? (
                        <>
                            <div className="text-sm text-gray-400 mb-2">
                                Найдено: {filteredFavorites.length} товар{filteredFavorites.length === 1 ? '' : 'а'}
                            </div>
                            <ListingGrid 
                                items={filteredFavorites} 
                                favorites={favorites} 
                                onListingClick={onListingClick} 
                                onToggleFavorite={onToggleFavorite}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-gray-500 pt-10">
                            <HeartIcon filled={false} className="w-16 h-16 text-gray-600 mb-4" />
                            <h2 className="font-semibold text-xl text-gray-200 mb-2">Ничего не найдено</h2>
                            <p className="max-w-xs text-base text-gray-400 mb-4">
                                В категории "{selectedCategory}" нет избранных товаров.
                            </p>
                            {selectedCategory && (
                                <button 
                                    onClick={clearFilter}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                                >
                                    Показать все избранное
                                </button>
                            )}
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 px-4">
                        <HeartIcon filled={false} className="w-20 h-20 text-gray-600 mb-6" />
                        <h2 className="font-semibold text-2xl text-gray-200 mb-3">Пусто в избранном</h2>
                        <p className="max-w-sm text-lg text-gray-400 leading-relaxed">
                            Нажмите на значок сердца на объявлении, чтобы сохранить его здесь.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};
