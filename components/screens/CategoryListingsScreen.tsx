import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Listing } from '../../types';
import { Bars3BottomRightIcon, HeartIcon } from '../icons/Icons';
import { ListingGrid } from '../shared/ListingGrid';
import { useModal } from '../../hooks/useModal';

interface CategoryListingsScreenProps {
  listings: Listing[];
  category: string;
  onBack: () => void;
  onListingClick: (listing: Listing) => void;
  favorites: string[];
  onToggleFavorite: (listingId: string) => void;
}

type SortOption = 'date_desc' | 'price_asc' | 'price_desc';

export const CategoryListingsScreen: React.FC<CategoryListingsScreenProps> = ({
  listings,
  category,
  onBack,
  onListingClick,
  favorites,
  onToggleFavorite
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const { showModal, hideModal } = useModal();

  const categoryListings = useMemo(() => 
    (listings || []).filter(
      listing => listing.category === category && listing.status === 'Available'
    ), 
    [category, listings]
  );

  const sortedListings = useMemo(() => {
    const sortableListings = [...categoryListings];
    switch (sortBy) {
      case 'price_asc':
        return sortableListings.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        return sortableListings.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'date_desc':
      default:
        return sortableListings.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }
  }, [categoryListings, sortBy]);

  const handleSortSelect = (option: SortOption) => {
    setSortBy(option);
    hideModal();
  };

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'date_desc', label: 'Сначала новые' },
    { key: 'price_asc', label: 'Сначала дешевые' },
    { key: 'price_desc', label: 'Сначала дорогие' },
  ];

  const openSortModal = () => {
    showModal(
      <div className="p-2 space-y-1">
        <h3 className="px-3 pt-1 pb-2 text-lg font-bold text-white text-center">
          Сортировка
        </h3>
        {sortOptions.map(option => (
          <button 
            key={option.key} 
            onClick={() => handleSortSelect(option.key)}
            className={`w-full text-left px-3 py-2.5 text-base rounded-lg transition-colors ${
              sortBy === option.key 
                ? 'font-semibold text-cyan-400 bg-white/5' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full bg-black flex flex-col">
      <header className="sticky top-0 z-30 p-4 flex items-center justify-between bg-black/80 backdrop-blur-lg pt-12">
        <div className="flex items-center flex-1">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2"
            aria-label="Назад"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-6 h-6 text-white"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15.75 19.5L8.25 12l7.5-7.5" 
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white ml-4 truncate">
            {category}
          </h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={openSortModal} 
            className="p-2 text-white"
            aria-label="Сортировка"
          >
            <Bars3BottomRightIcon />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {sortedListings.length > 0 ? (
          <ListingGrid 
            items={sortedListings} 
            favorites={favorites} 
            onListingClick={onListingClick} 
            onToggleFavorite={onToggleFavorite} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <p className="font-semibold">Здесь пока пусто</p>
            <p className="text-sm">В этой категории пока нет объявлений.</p>
          </div>
        )}
      </main>
    </div>
  );
};