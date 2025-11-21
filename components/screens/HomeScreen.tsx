
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GlassPanel } from '../shared/GlassPanel';
import { SearchIcon, FilterIcon, XCircleIcon, SpinnerIcon, MapPinIcon, HomeIcon, UserCircleIcon, ClockIcon, ReputationMedalIcon, CheckCircleIcon } from '../icons/Icons';
import { Listing, User } from '../../types';
import Fuse, { type FuseResult } from 'fuse.js';
import { ListingGrid } from '../shared/ListingGrid';
import { useWallet } from '../../hooks/useWallet';
import { useModal } from '../../hooks/useModal';
import { ConnectWalletSheet } from '../modals/ConnectWalletSheet';
import { Avatar } from '../shared/Avatar';
import { demarketService } from '../../services/demarketService';

interface HomeScreenProps {
  listings: Listing[];
  users: User[];
  onListingClick: (listing: Listing) => void;
  onSellerClick: (user: User) => void;
  userCity?: string;
  favorites: string[];
  onToggleFavorite: (listingId: string) => void;
  onEditLocation: () => void;
}

// Geography Data matching LocationSetupSheet
const geography: Record<string, string[]> = {
    'Беларусь': [
        'Минск (город)',
        'Минская область',
        'Брестская область',
        'Витебская область',
        'Гомельская область',
        'Гродненская область',
        'Могилевская область',
    ],
    'Россия': [
        'Москва (город)',
        'Санкт-Петербург (город)',
        'Московская область',
        'Ленинградская область',
        'Краснодарский край',
        'Свердловская область',
        'Республика Татарстан',
        'Новосибирская область',
        'Нижегородская область',
        'Самарская область',
        'Ростовская область',
        'Республика Башкортостан',
        'Челябинская область',
        'Приморский край',
        'Хабаровский край',
    ],
};

interface Filters {
  minPrice: string;
  maxPrice: string;
  region: string;
  city: string;
  condition: 'New' | 'Used' | '';
  minReputation: 'none' | 'bronze' | 'silver' | 'gold';
}

const initialFilters: Filters = {
  minPrice: '',
  maxPrice: '',
  region: '',
  city: '',
  condition: '',
  minReputation: 'none',
};

const FilterSheetContent: React.FC<{
    currentFilters: Filters;
    onApply: (filters: Filters) => void;
    onReset: () => void;
    userCountry?: string;
  }> = ({ currentFilters, onApply, onReset, userCountry }) => {
    const [tempFilters, setTempFilters] = useState(currentFilters);
    
    // Get available regions based on user's country
    const availableRegions = useMemo(() => {
        return (userCountry && geography[userCountry]) ? geography[userCountry] : [];
    }, [userCountry]);

    const handleApply = () => {
      onApply(tempFilters);
    };
    
    const handleReset = () => {
      setTempFilters(initialFilters);
      onReset();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setTempFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTempFilters(prev => ({ ...prev, region: e.target.value }));
    };

    const handleConditionChange = (condition: 'New' | 'Used') => {
      setTempFilters(prev => ({ ...prev, condition: prev.condition === condition ? '' : condition }));
    };

    const handleReputationChange = (tier: 'none' | 'bronze' | 'silver' | 'gold') => {
        setTempFilters(prev => ({ ...prev, minReputation: prev.minReputation === tier ? 'none' : tier }));
    };

    const reputationTiers = [
        { id: 'bronze', label: 'Bronze+', icon: <ReputationMedalIcon tier="bronze" className="w-5 h-5"/> },
        { id: 'silver', label: 'Silver+', icon: <ReputationMedalIcon tier="silver" className="w-5 h-5"/> },
        { id: 'gold', label: 'Gold Only', icon: <ReputationMedalIcon tier="gold" className="w-5 h-5"/> },
    ];

    return (
      <div className="p-4 pt-0 space-y-5">
        <h2 className="text-lg font-bold text-white text-center">Фильтры</h2>
        
        {/* Location Section */}
        <div className="space-y-3">
             <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <MapPinIcon className="w-4 h-4 text-cyan-400"/>
                <span>Локация {userCountry ? `(${userCountry})` : ''}</span>
            </div>
            <div className="space-y-2">
                 {/* Region Select */}
                <div className="relative">
                    <select
                        value={tempFilters.region}
                        onChange={handleRegionChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white appearance-none focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                    >
                        <option value="" className="bg-gray-900 text-gray-400">Все регионы</option>
                        {availableRegions.map(r => (
                            <option key={r} value={r} className="bg-gray-900">{r}</option>
                        ))}
                         <option value="OTHER" className="bg-gray-900">Другой регион</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                </div>

                {/* City Input */}
                <input
                    type="text"
                    name="city"
                    value={tempFilters.city}
                    onChange={handleInputChange}
                    placeholder="Город или населенный пункт..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
                />
            </div>
        </div>

        {/* Price Section */}
        <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Цена</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                name="minPrice"
                value={tempFilters.minPrice}
                onChange={handleInputChange}
                placeholder="От"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
              />
              <input
                type="number"
                name="maxPrice"
                value={tempFilters.maxPrice}
                onChange={handleInputChange}
                placeholder="До"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
              />
            </div>
        </div>

        {/* Reputation Section */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <CheckCircleIcon className="w-4 h-4 text-green-400"/>
                <span>Репутация продавца</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {reputationTiers.map((tier) => {
                     const isSelected = tempFilters.minReputation === tier.id;
                     return (
                        <button
                            key={tier.id}
                            onClick={() => handleReputationChange(tier.id as any)}
                            className={`
                                flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all duration-200
                                ${isSelected 
                                    ? 'bg-white/15 border-white/30 text-white shadow-lg' 
                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                }
                            `}
                        >
                            {tier.icon}
                            <span className="text-xs font-semibold">{tier.label}</span>
                        </button>
                     )
                })}
            </div>
        </div>
          
        {/* Condition Section */}
        <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Состояние</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleConditionChange('New')} className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${tempFilters.condition === 'New' ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-white/5 text-gray-300'}`}>Новый</button>
              <button onClick={() => handleConditionChange('Used')} className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${tempFilters.condition === 'Used' ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-white/5 text-gray-300'}`}>Б/у</button>
            </div>
        </div>
        
        <div className="pt-2 flex space-x-3">
          <button onClick={handleReset} className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors">Сбросить</button>
          <button onClick={handleApply} className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30">Применить</button>
        </div>
      </div>
    );
  };

type SearchItem = (Listing & { type: 'listing' }) | (User & { type: 'user' });
type SearchResult = FuseResult<SearchItem>;

// --- Search Results Dropdown ---
const SearchResultsDropdown: React.FC<{
    results: SearchResult[];
    recentSearches: string[];
    isQueryEmpty: boolean;
    onListingClick: (listing: Listing) => void;
    onSellerClick: (user: User) => void;
    onRecentSearchClick: (term: string) => void;
    onClose: () => void;
    onClearHistory: () => void;
}> = ({ results, recentSearches, isQueryEmpty, onListingClick, onSellerClick, onRecentSearchClick, onClose, onClearHistory }) => {
    
    const listings = results.filter(r => r.item.type === 'listing');
    const sellers = results.filter(r => r.item.type === 'user');

    const handleItemClick = (item: SearchItem) => {
        if (item.type === 'listing') {
            onListingClick(item);
        } else {
            onSellerClick(item);
        }
        onClose();
    };

    // --- Recent Searches View ---
    if (isQueryEmpty) {
        if (recentSearches.length === 0) return null;

        return (
            <div className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl bg-black/95 backdrop-blur-[70px] ring-1 ring-white/10 shadow-2xl custom-scrollbar z-50 animate-fadeIn">
                 <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">История поиска</span>
                    <button 
                        onClick={onClearHistory}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Очистить
                    </button>
                </div>
                <div className="py-1">
                    {recentSearches.map((term, index) => (
                        <button 
                            key={index} 
                            onClick={() => onRecentSearchClick(term)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors group"
                        >
                            <ClockIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                            <span className="text-sm text-white truncate">{term}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Search Results View ---
    return (
        <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto rounded-2xl bg-black/95 backdrop-blur-[70px] ring-1 ring-white/10 shadow-2xl custom-scrollbar z-50 animate-fadeIn">
            <div className="p-2">
                 {results.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        Ничего не найдено. Попробуйте другой запрос.
                    </div>
                ) : (
                    <>
                        {listings.length > 0 && (
                            <div className="mb-2">
                                <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Товары</h3>
                                {listings.map(({ item }) => {
                                    if (item.type !== 'listing') return null;
                                    return (
                                        <div key={item.id} onClick={() => handleItemClick(item)} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/10">
                                            <HomeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate font-medium">{item.title}</p>
                                                <p className="text-xs text-gray-400 truncate">{item.category} • {item.location.split(',')[0]}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {sellers.length > 0 && (
                            <div>
                                <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Продавцы</h3>
                                {sellers.map(({ item }) => {
                                    if (item.type !== 'user') return null;
                                    return (
                                        <div key={item.id} onClick={() => handleItemClick(item)} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/10">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <Avatar seed={item.username} className="w-full h-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate font-medium">{item.username}</p>
                                                <p className="text-xs text-gray-400 truncate font-mono">{item.address}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};


export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  listings = [], 
  users = [],
  onListingClick, 
  onSellerClick,
  userCity, 
  favorites = [], 
  onToggleFavorite, 
  onEditLocation 
}) => {
  const { user, isConnected } = useWallet();
  const { showModal, hideModal } = useModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [placeholder, setPlaceholder] = useState("Поиск по товарам, продавцам или адресам...");
  
  // --- Recent Searches State ---
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
      const saved = localStorage.getItem('demarket_recent_searches');
      if (saved) {
          try {
              setRecentSearches(JSON.parse(saved));
          } catch (e) {
              console.error("Failed to parse recent searches", e);
          }
      }
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
      if (!term.trim()) return;
      setRecentSearches(prev => {
          const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase());
          const updated = [term, ...filtered].slice(0, 5); // Keep max 5
          localStorage.setItem('demarket_recent_searches', JSON.stringify(updated));
          return updated;
      });
  }, []);
  
  const clearHistory = useCallback(() => {
      setRecentSearches([]);
      localStorage.removeItem('demarket_recent_searches');
  }, []);

  const handleRecentSearchClick = (term: string) => {
      setSearchQuery(term);
      setIsSearchFocused(true); 
  };

  // Use the country name directly from user location
  const userCountry = user?.location?.country;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 420) {
        setPlaceholder("Поиск...");
      } else if (window.innerWidth < 640) {
        setPlaceholder("Поиск товаров и продавцов...");
      } else {
        setPlaceholder("Поиск по товарам, продавцам или адресам...");
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const FilterPill: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <div className="flex-shrink-0 flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full border border-cyan-500/20">
      <span>{label}</span>
      <button onClick={onRemove} className="p-0.5 rounded-full hover:bg-cyan-500/20 transition-colors" aria-label={`Remove filter: ${label}`}>
        <XCircleIcon className="w-4 h-4" />
      </button>
    </div>
  );

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);
    if(searchQuery.trim() !== '') setIsSearching(true);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Combined search logic with Fuse.js
  const fuse = useMemo(() => {
    const searchList: SearchItem[] = [
      ...listings.map(l => ({ ...l, type: 'listing' as const })),
      ...users.map(u => ({ ...u, type: 'user' as const }))
    ];
    return new Fuse(searchList, {
      keys: [
        { name: 'address', weight: 1.5 }, // Highest priority for direct address search
        { name: 'ipfsCid', weight: 1.5 }, // Highest priority for CID
        { name: 'title', weight: 0.6 },
        { name: 'tags', weight: 0.3 },
        { name: 'username', weight: 0.8 },
      ],
      includeScore: true,
      threshold: 0.4,
      minMatchCharLength: 2,
    });
  }, [listings, users]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      const results = fuse.search(debouncedQuery);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, fuse]);
  
  const { listingsInCity, listingsInCountry, otherListings } = useMemo(() => {
    let filteredBaseListings = listings.filter(l => l.status === 'Available');

    // 1. Filter by Price
    if (filters.minPrice && !isNaN(parseFloat(filters.minPrice))) {
      filteredBaseListings = filteredBaseListings.filter(l => l.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice && !isNaN(parseFloat(filters.maxPrice))) {
      filteredBaseListings = filteredBaseListings.filter(l => l.price <= parseFloat(filters.maxPrice));
    }

    // 2. Filter by Condition
    if (filters.condition) {
      filteredBaseListings = filteredBaseListings.filter(l => l.condition === filters.condition);
    }

    // 3. Filter by Region/City from Filters (Overrides generic split)
    if (filters.region && filters.region !== 'OTHER') {
         // Match listings where the seller's region matches the filter
         // Fallback to text check if seller location structure is incomplete
         filteredBaseListings = filteredBaseListings.filter(l => {
            if (l.seller.location?.region) {
                return l.seller.location.region === filters.region;
            }
            return l.location.includes(filters.region);
         });
    }

    if (filters.city) {
        const searchCity = filters.city.toLowerCase();
        filteredBaseListings = filteredBaseListings.filter(l => l.location.toLowerCase().includes(searchCity));
    }

    // 4. Filter by Reputation (Medals)
    if (filters.minReputation && filters.minReputation !== 'none') {
        const tiers = ['none', 'bronze', 'silver', 'gold'];
        const minIndex = tiers.indexOf(filters.minReputation);
        
        filteredBaseListings = filteredBaseListings.filter(l => {
            const sellerTier = l.seller.reputationTier || 'none';
            const sellerIndex = tiers.indexOf(sellerTier);
            return sellerIndex >= minIndex;
        });
    }
    
    // If user has a location, split listings into city and country
    if (userCity && userCountry) {
        const cityListings: Listing[] = [];
        const countryListings: Listing[] = [];
        
        const userCityLower = userCity.toLowerCase();
        const userCountryLower = userCountry.toLowerCase();

        filteredBaseListings.forEach(listing => {
            const listingLocLower = listing.location.toLowerCase();
            
            // Strict check: Listing MUST be in the user's country to be shown at all
            if (listingLocLower.includes(userCountryLower)) {
                // Then check if it's in the user's city
                if (listingLocLower.includes(userCityLower)) {
                    cityListings.push(listing);
                } else {
                    countryListings.push(listing);
                }
            }
            // Listings from other countries are ignored (not pushed to any list)
        });
        
        return { listingsInCity: cityListings, listingsInCountry: countryListings, otherListings: [] };
    }

    // If no user location, all listings are "other"
    return { listingsInCity: [], listingsInCountry: [], otherListings: filteredBaseListings };

  }, [listings, filters, userCity, userCountry]);


  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '' && value !== 'none').length;
  }, [filters]);

  const handleOpenFilterSheet = () => {
    if (!isConnected) {
        showModal(<ConnectWalletSheet />);
        return;
    }
    showModal(
      <FilterSheetContent
        currentFilters={filters}
        userCountry={userCountry}
        onApply={(newFilters) => {
          setFilters(newFilters);
          hideModal();
        }}
        onReset={() => {
          setFilters(initialFilters);
          hideModal();
        }}
      />
    );
  };

  // Hide dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditLocationClick = () => {
    if (!isConnected) {
      showModal(<ConnectWalletSheet />);
      return;
    }
    onEditLocation();
  };
  
  const handleSearchSubmit = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const term = searchQuery.trim();
          (e.target as HTMLInputElement).blur();
          setIsSearchFocused(false);
          
          if (term) {
              saveRecentSearch(term);

              // --- PRODUCTION SEARCH LOGIC START ---
              // If no local results, try to interpret as CID or Address
              if (searchResults.length === 0) {
                  // 1. Check for IPFS CID (roughly 46 chars starting with Qm or longer with bafy)
                  if (term.startsWith('Qm') || term.startsWith('bafy') || term.length > 40) {
                      setIsSearching(true);
                      try {
                          const importedListing = await demarketService.importListingFromIpfs(term);
                          setIsSearching(false);
                          if (importedListing) {
                              onListingClick(importedListing);
                              return;
                          }
                      } catch (err) {
                          console.error("Import failed", err);
                          setIsSearching(false);
                      }
                  }
                  
                  // 2. Check for ETH Address (0x...)
                  if (term.startsWith('0x') && term.length === 42) {
                      // In production, fetch user profile from Indexer.
                      console.log("Searching for address:", term);
                  }
              }
              // --- PRODUCTION SEARCH LOGIC END ---
          }
      }
  };
  
  // Show dropdown if focused AND (has query OR has recent searches)
  const showDropdown = isSearchFocused && (searchQuery.length > 0 || recentSearches.length > 0);

  return (
    <div className="flex flex-col bg-black min-h-full">
      <div className="px-4 pt-12 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Главная</h1>
        <button 
          onClick={handleEditLocationClick} 
          className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full text-sm text-gray-200 hover:bg-white/10 transition-colors border border-cyan-500/50 max-w-[50%]"
        >
          <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{userCity || 'Выбрать город'}</span>
        </button>
      </div>
      
      <div ref={searchContainerRef} className="sticky top-0 z-20 px-4 py-2">
        <div className="relative">
          {/* UNIFIED BAR */}
          <div className="flex items-center bg-black/80 backdrop-blur-3xl rounded-full ring-1 ring-white/10 shadow-2xl px-4 focus-within:ring-cyan-500/50 transition-all">
            <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0"/>
            <input
                type="text"
                inputMode="search" // Show "Search" button on iOS keyboard
                enterKeyHint="search"
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchSubmit}
                className="flex-grow bg-transparent py-3 px-3 text-base text-white placeholder-gray-400 focus:outline-none placeholder:text-xs sm:placeholder:text-base min-w-0"
                aria-label="Поиск"
            />
            <div className="flex items-center gap-3 flex-shrink-0">
                {isSearching ? (
                  <SpinnerIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchFocused(true); // Keep focus to show recent searches
                      }} 
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Очистить поиск"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  )
                )}
                
                <div className="w-px h-6 bg-white/10"></div>

                <button
                    onClick={handleOpenFilterSheet}
                    className="relative p-1 text-gray-300 hover:text-white transition-colors"
                    aria-label="Фильтры"
                >
                    <FilterIcon className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white ring-2 ring-black">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>
          </div>
          {showDropdown && (
             <SearchResultsDropdown 
                results={searchResults}
                recentSearches={recentSearches}
                isQueryEmpty={searchQuery.trim() === ''}
                onListingClick={onListingClick}
                onSellerClick={onSellerClick}
                onRecentSearchClick={handleRecentSearchClick}
                onClose={() => setIsSearchFocused(false)}
                onClearHistory={clearHistory}
             />
          )}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filters.minPrice && (
            <FilterPill
              label={`От ${filters.minPrice}`}
              onRemove={() => setFilters(prev => ({ ...prev, minPrice: '' }))}
            />
          )}
          {filters.maxPrice && (
            <FilterPill
              label={`До ${filters.maxPrice}`}
              onRemove={() => setFilters(prev => ({ ...prev, maxPrice: '' }))}
            />
          )}
          {filters.region && (
            <FilterPill
              label={filters.region === 'OTHER' ? 'Другой регион' : filters.region}
              onRemove={() => setFilters(prev => ({ ...prev, region: '' }))}
            />
          )}
           {filters.city && (
            <FilterPill
              label={filters.city}
              onRemove={() => setFilters(prev => ({ ...prev, city: '' }))}
            />
          )}
          {filters.condition && (
            <FilterPill
              label={filters.condition === 'New' ? 'Новый' : 'Б/у'}
              onRemove={() => setFilters(prev => ({ ...prev, condition: '' }))}
            />
          )}
          {filters.minReputation && filters.minReputation !== 'none' && (
              <FilterPill
                label={`Reputation: ${filters.minReputation.charAt(0).toUpperCase() + filters.minReputation.slice(1)}+`}
                onRemove={() => setFilters(prev => ({ ...prev, minReputation: 'none' }))}
              />
          )}
          <button
            onClick={() => setFilters(initialFilters)}
            className="flex-shrink-0 text-xs text-red-400 hover:text-red-300 transition-colors ml-2 font-medium"
          >
            Сбросить все
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
        {userCity ? (
          <>
            {listingsInCity.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">В вашем городе</h2>
                    <ListingGrid 
                        items={listingsInCity} 
                        favorites={favorites} 
                        onListingClick={onListingClick} 
                        onToggleFavorite={onToggleFavorite} 
                    />
                </section>
            )}
            {listingsInCountry.length > 0 && (
                <section className="relative">
                    {listingsInCity.length > 0 && (
                        <div className="absolute -top-3 left-0 right-0 border-t border-white/10" />
                    )}
                    <h2 className="text-xl font-bold text-white mb-4">В других городах</h2>
                     <ListingGrid 
                        items={listingsInCountry} 
                        favorites={favorites} 
                        onListingClick={onListingClick} 
                        onToggleFavorite={onToggleFavorite} 
                    />
                </section>
            )}
            {listingsInCity.length === 0 && listingsInCountry.length === 0 && (
                 <div className="text-center text-gray-400 pt-10">
                    <p className="font-semibold text-lg text-white">В вашей стране пока нет объявлений</p>
                    <p className="text-sm mt-1">Попробуйте изменить город или сбросить фильтры.</p>
                </div>
            )}
          </>
        ) : (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Все объявления</h2>
            {otherListings.length > 0 ? (
                <ListingGrid 
                    items={otherListings} 
                    favorites={favorites} 
                    onListingClick={onListingClick} 
                    onToggleFavorite={onToggleFavorite} 
                />
            ) : (
                 <div className="text-center text-gray-400 pt-10">
                    <p className="font-semibold text-lg text-white">Объявлений пока нет</p>
                    <p className="text-sm mt-1">Как только они появятся, вы увидите их здесь.</p>
                </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
