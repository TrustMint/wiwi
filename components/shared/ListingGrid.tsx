
import React from 'react';
import { Listing } from '../../types';
import { HeartIcon } from '../icons/Icons';

interface ListingGridProps {
    items: Listing[];
    favorites: string[];
    onListingClick: (listing: Listing) => void;
    onToggleFavorite: (listingId: string) => void;
}

export const ListingGrid: React.FC<ListingGridProps> = ({ items, favorites, onListingClick, onToggleFavorite }) => {

    const handleListingClick = (listing: Listing) => {
        onListingClick(listing);
    };
    
    const handleToggleFavorite = (e: React.MouseEvent, listingId: string) => {
        e.stopPropagation();
        onToggleFavorite(listingId);
    };

    return (
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {items.map((listing) => {
          const isBoosted = listing.boostedUntil && new Date(listing.boostedUntil) > new Date();
          
          return (
            <div key={listing.id} className="group" >
              <div 
                onClick={() => handleListingClick(listing)} 
                className={`aspect-square w-full overflow-hidden rounded-xl bg-gray-800 shadow-lg relative cursor-pointer ${isBoosted ? 'boosted-glow' : ''}`}
              >
                  <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                      <button
                          onClick={(e) => handleToggleFavorite(e, listing.id)}
                          className="p-1.5 bg-black/30 backdrop-blur-md rounded-full text-white transition-colors"
                          aria-label="Добавить в избранное"
                      >
                          <HeartIcon 
                              filled={favorites.includes(listing.id)}
                              className={`w-5 h-5 transition-all ${favorites.includes(listing.id) ? 'text-red-500' : 'text-white/80'}`} 
                          />
                      </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-xs text-white/80 truncate">{listing.location}</p>
                  </div>
              </div>
              
              <div 
                  onClick={() => handleListingClick(listing)} 
                  className="cursor-pointer"
              >
                <h3 className={`mt-2 text-sm font-medium truncate ${isBoosted ? 'text-yellow-400 font-bold' : 'text-gray-100'}`}>{listing.title}</h3>
                <p className="mt-1 text-lg font-semibold text-white">{listing.price} {listing.currency}</p>
              </div>
            </div>
          )
        })}
      </div>
    );
};
