import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { SearchIcon, FilterIcon, XCircleIcon, SpinnerIcon, MapPinIcon } from '../icons/Icons';
import { Listing } from '../../types';
import Fuse from 'fuse.js';
import { ListingGrid } from '../shared/ListingGrid';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';
import { ConnectWalletSheet } from '../modals/ConnectWalletSheet';

interface HomeScreenProps {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
  userCity?: string;
  favorites: string[];
  onToggleFavorite: (listingId: string) => void;
  onEditLocation: () => void;
}

const locations = {
  'Россия': ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Красноярск', 'Самара', 'Уфа', 'Ростов-на-Дону', 'Омск', 'Краснодар', 'Воронеж', 'Пермь'],
  'Беларусь': ['Минск', 'Гомель', 'Могилёв', 'Витебск', 'Гродно', 'Брест', 'Бобруйск', 'Барановичи', 'Пинск', 'Орша', 'Мозырь', 'Солигорск', 'Лида', 'Новополоцк', 'Молодечно'],
};

const allCities = [...locations['Россия'], ...locations['Беларусь']].sort();

interface Filters {
  minPrice: string;
  maxPrice: string;
  city: string;
  condition: 'New' | 'Used' | '';
}

const initialFilters: Filters = {
  minPrice: '',
  maxPrice: '',
  city: '',
  condition: '',
};

interface FilterModalContentProps {
  initialFilters: Filters;
  onApply: (filters: Filters) => void;
  listings: Listing[];
  searchQuery: string;
  filterAndSort: (items: Listing[], filters: Filters, query: string, options?: { navigateOnExactMatch?: boolean }) => Listing[];
  userCountry?: string;
}

const FilterModalContent: React.FC<FilterModalContentProps> = ({ 
  initialFilters, 
  onApply, 
  listings, 
  searchQuery, 
  filterAndSort, 
  userCountry 
}) => {
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);

  const onFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const onReset = useCallback(() => {
    setTempFilters(initialFilters);
    setShowCustomCityInput(false);
  }, [initialFilters]);

  const previewCount = useMemo(() => {
    return filterAndSort(listings, tempFilters, searchQuery, { navigateOnExactMatch: false }).length;
  }, [listings, tempFilters, searchQuery, filterAndSort]);

  const citiesForDropdown = useMemo(() => {
    if (userCountry && locations[userCountry as keyof typeof locations]) {
      return locations[userCountry as keyof typeof locations];
    }
    return allCities;
  }, [userCountry]);

  useEffect(() => {
    if (tempFilters.city && !allCities.includes(tempFilters.city)) {
      setShowCustomCityInput(true);
    } else {
      setShowCustomCityInput(false);
    }
  }, [tempFilters.city]);

  const handleCitySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'other') {
      setShowCustomCityInput(true);
      onFilterChange('city', '');
    } else {
      setShowCustomCityInput(false);
      onFilterChange('city', value);
    }
  };

  const selectValue = allCities.includes(tempFilters.city) ? tempFilters.city : showCustomCityInput ? 'other' : '';

  return (
    <div className="p-4 pt-0 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-black pb-2">
        <button 
          onClick={onReset} 
          className="text-gray-400 hover:text-white transition text-sm font-medium"
        >
          Сбросить
        </button>
        <h2 className="text-lg font-bold text-white">Фильтры</h2>
        <div className="w-16"></div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1 font-medium">Цена</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="от" 
              value={tempFilters.minPrice} 
              min="0" 
              onChange={e => onFilterChange('minPrice', e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
            />
            <div className="h-px w-3 bg-gray-500"></div>
            <input 
              type="number" 
              placeholder="до" 
              value={tempFilters.maxPrice} 
              min="0" 
              onChange={e => onFilterChange('maxPrice', e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1 font-medium">Город</label>
          <select
            value={selectValue}
            onChange={handleCitySelectChange}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm appearance-none"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
              backgroundPosition: 'right 0.5rem center', 
              backgroundRepeat: 'no-repeat', 
              backgroundSize: '1.5em 1.5em' 
            }}
          >
            <option value="">Все города</option>
            {citiesForDropdown.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="other">Другой город...</option>
          </select>
          {showCustomCityInput && (
            <input
              type="text"
              value={tempFilters.city}
              onChange={e => onFilterChange('city', e.target.value)}
              placeholder="Введите название города"
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
              autoFocus
            />
          )}
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-2 font-medium">Состояние</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/20 rounded-lg">
            <button 
              onClick={() => onFilterChange('condition', '')} 
              className={`py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                tempFilters.condition === '' 
                  ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              Все
            </button>
            <button 
              onClick={() => onFilterChange('condition', 'New')} 
              className={`py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                tempFilters.condition === 'New' 
                  ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              Новое
            </button>
            <button 
              onClick={() => onFilterChange('condition', 'Used')} 
              className={`py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                tempFilters.condition === 'Used' 
                  ? 'bg-white/10 backdrop-blur-sm ring-1 ring-white/15 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              Б/у
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 sticky bottom-0 bg-black pt-4">
        <button 
          onClick={() => onApply(tempFilters)} 
          className="w-full px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:shadow-none"
          disabled={previewCount === 0}
        >
          Показать {previewCount} объявлений
        </button>
      </div>
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  listings = [], 
  onListingClick, 
  userCity, 
  favorites = [], 
  onToggleFavorite, 
  onEditLocation 
}) => {
  const { user, isConnected } = useWallet();
  const { showModal, hideModal } = useModal();
  const userCountry = user?.location?.country;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setDebouncedQuery('');
      return;
    }
    
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 500);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  const fuse = useMemo(() => {
    return new Fuse(listings, {
      keys: [
        { name: 'title', weight: 0.6 },
        { name: 'tags', weight: 0.3 },
        { name: 'description', weight: 0.1 },
        { name: 'id', weight: 0.1 },
        { name: 'ipfsCid', weight: 0.1 },
      ],
      includeScore: true,
      threshold: 0.4,
      minMatchCharLength: 2,
      ignoreLocation: true,
      distance: 100,
    });
  }, [listings]);

  const filterAndSort = useCallback((items: Listing[], filters: Filters, query: string, options: { navigateOnExactMatch?: boolean } = {}): Listing[] => {
    const { navigateOnExactMatch = true } = options;
    
    if (query.trim()) {
      const exactMatch = items.find(item => item.id === query.trim() || item.ipfsCid === query.trim());
      if (exactMatch) {
        if (navigateOnExactMatch) {
          onListingClick(exactMatch);
          return [];
        } else {
          return [exactMatch];
        }
      }
    }
    
    let result: Listing[];

    if (query.trim()) {
      result = fuse.search(query)
        .filter(fuseResult => (fuseResult.score ?? 1) <= 0.5)
        .map(fuseResult => fuseResult.item);
    } else {
      result = items;
    }
    
    result = result.filter(l => l.status === 'Available');
    
    const { city, condition, minPrice, maxPrice } = filters;

    if (city) {
      const lowercasedCity = city.toLowerCase().trim();
      result = result.filter(listing => 
        listing.location?.toLowerCase().includes(lowercasedCity)
      );
    }
    
    if (condition) {
      result = result.filter(listing => listing.condition === condition);
    }
    
    const min = parseFloat(minPrice);
    if (!isNaN(min) && min >= 0) {
      result = result.filter(listing => listing.price >= min);
    }
    
    const max = parseFloat(maxPrice);
    if (!isNaN(max) && max >= 0) {
      result = result.filter(listing => listing.price <= max);
    }
    
    result.sort((a, b) => {
      const aIsBoosted = a.boostedUntil && new Date(a.boostedUntil) > new Date();
      const bIsBoosted = b.boostedUntil && new Date(b.boostedUntil) > new Date();
      
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [fuse, onListingClick]);

  const filteredListings = useMemo(() => {
    return filterAndSort(listings, appliedFilters, debouncedQuery, { navigateOnExactMatch: true });
  }, [listings, appliedFilters, debouncedQuery, filterAndSort]);
  
  const { localListings, otherListings } = useMemo(() => {
    if (!userCity || appliedFilters.city.trim()) {
      return { localListings: filteredListings, otherListings: [] };
    }
    const local = filteredListings.filter(l => 
      l.location?.toLowerCase().startsWith(userCity.toLowerCase())
    );
    const other = filteredListings.filter(l => 
      !l.location?.toLowerCase().startsWith(userCity.toLowerCase())
    );
    return { localListings: local, otherListings: other };
  }, [filteredListings, userCity, appliedFilters.city]);
  
  const handleApplyFilters = useCallback((filters: Filters) => {
    setAppliedFilters(filters);
    hideModal();
  }, [hideModal]);

  const openFilterModal = useCallback(() => {
    if (!isConnected) {
      showModal(<ConnectWalletSheet />);
      return;
    }
    showModal(
      <FilterModalContent
        initialFilters={appliedFilters}
        onApply={handleApplyFilters}
        listings={listings}
        searchQuery={searchQuery}
        filterAndSort={filterAndSort}
        userCountry={userCountry}
      />
    );
  }, [showModal, isConnected, appliedFilters, handleApplyFilters, listings, searchQuery, filterAndSort, userCountry]);
  
  const areFiltersActive = useMemo(() => {
    return JSON.stringify(appliedFilters) !== JSON.stringify(initialFilters);
  }, [appliedFilters]);

  const handleRemoveFilter = (key: keyof Filters | 'price') => {
    if (key === 'price') {
      setAppliedFilters(prev => ({
        ...prev,
        minPrice: '',
        maxPrice: '',
      }));
    } else {
      setAppliedFilters(prev => ({
        ...prev,
        [key]: initialFilters[key as keyof Filters],
      }));
    }
  };

  const handleEditLocationClick = () => {
    if (!isConnected) {
      showModal(<ConnectWalletSheet />);
      return;
    }
    onEditLocation();
  };
  
  const ActiveFiltersDisplay: React.FC = () => {
    if (!areFiltersActive) return null;

    const filtersToDisplay = [];
    if (appliedFilters.minPrice || appliedFilters.maxPrice) {
      let priceLabel = '';
      if (appliedFilters.minPrice && appliedFilters.maxPrice) {
        priceLabel += `от ${appliedFilters.minPrice} до ${appliedFilters.maxPrice}`;
      } else if (appliedFilters.minPrice) {
        priceLabel += `от ${appliedFilters.minPrice}`;
      } else {
        priceLabel += `до ${appliedFilters.maxPrice}`;
      }
      filtersToDisplay.push({ key: 'price', label: priceLabel });
    }
    if (appliedFilters.city) {
      filtersToDisplay.push({ key: 'city', label: appliedFilters.city });
    }
    if (appliedFilters.condition) {
      filtersToDisplay.push({ 
        key: 'condition', 
        label: `${appliedFilters.condition === 'New' ? 'Новое' : 'Б/у'}` 
      });
    }

    return (
      <div className="pt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
          {filtersToDisplay.map(filter => (
            <div 
              key={filter.key} 
              className="flex-shrink-0 flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-cyan-500/50 text-cyan-300 text-xs font-medium pl-3 pr-1 py-1 rounded-full"
            >
              <span>{filter.label}</span>
              <button 
                onClick={() => handleRemoveFilter(filter.key as keyof Filters | 'price')}
                className="bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                aria-label={`Сбросить фильтр ${filter.label}`}
              >
                <XCircleIcon className="w-4 h-4 m-0.5"/>
              </button>
            </div>
          ))}
          <button 
            onClick={() => setAppliedFilters(initialFilters)} 
            className="flex-shrink-0 bg-black/40 backdrop-blur-xl border border-cyan-500/50 text-gray-300 hover:text-white transition text-xs font-medium px-3 py-1.5 rounded-full"
          >
            Сбросить все
          </button>
        </div>
      </div>
    );
  };

  const hasListings = localListings.length > 0 || otherListings.length > 0;
  const showNoResults = !isSearching && !hasListings;

  return (
    <div className="flex flex-col bg-black min-h-screen">
      <div className="px-4 pt-12 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Главная</h1>
        <button 
          onClick={handleEditLocationClick} 
          className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-sm text-gray-200 hover:bg-white/20 transition-colors border border-cyan-500/50"
        >
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span className="max-w-[120px] truncate">{userCity || 'Выбрать город'}</span>
        </button>
      </div>
      
      <div className="sticky top-0 z-20 px-4 py-2 bg-gradient-to-b from-black via-black/90 to-black/0 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex-grow flex items-center gap-2 bg-black/50 backdrop-blur-xl rounded-full ring-1 ring-white/20 shadow-lg px-4 focus-within:ring-cyan-500/50 transition-all">
            <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0"/>
            <input
              type="text"
              placeholder="Поиск по объявлениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow bg-transparent py-3 text-base text-white placeholder-gray-400 focus:outline-none"
              aria-label="Поиск объявлений"
            />
            <div className="flex items-center">
              {isSearching ? (
                <SpinnerIcon className="w-5 h-5 text-gray-400" />
              ) : (
                searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Очистить поиск"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                )
              )}
            </div>
          </div>
          <button 
            onClick={openFilterModal}
            className="w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full ring-1 ring-white/20 shadow-lg text-white hover:ring-cyan-500/50 transition-all flex-shrink-0 relative flex items-center justify-center"
            aria-label="Фильтры"
          >
            <FilterIcon className="w-6 h-6"/>
            {areFiltersActive && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-black"></span>
            )}
          </button>
        </div>
        <ActiveFiltersDisplay />
      </div>

      <div className="flex-1 px-4 pt-6 space-y-4 pb-28">
        <div>
          {localListings.length > 0 && userCity && !appliedFilters.city.trim() && (
            <h2 className="text-xl font-bold text-white mb-4">В вашем городе</h2>
          )}
          <ListingGrid 
            items={localListings} 
            favorites={favorites} 
            onListingClick={onListingClick} 
            onToggleFavorite={onToggleFavorite} 
          />
          
          {otherListings.length > 0 && userCity && !appliedFilters.city.trim() && (
            <h2 className="text-xl font-bold text-white my-4 pt-4 border-t border-white/10">В других городах</h2>
          )}
          <ListingGrid 
            items={otherListings} 
            favorites={favorites} 
            onListingClick={onListingClick} 
            onToggleFavorite={onToggleFavorite} 
          />
        </div>

        {showNoResults && (
          <div className="col-span-full mt-8">
            <GlassPanel className="p-8 text-center">
              <p className="font-bold text-xl text-white">Ничего не найдено</p>
              <p className="text-gray-300 mt-2">
                {debouncedQuery || areFiltersActive 
                  ? 'Попробуйте изменить поисковый запрос или сбросить фильтры.' 
                  : 'Объявления появятся здесь скоро.'}
              </p>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
};