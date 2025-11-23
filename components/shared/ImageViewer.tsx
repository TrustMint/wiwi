import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XCircleIcon, PlayCircleIcon } from '../icons/Icons';

interface ImageViewerProps {
  media: { url: string; type: 'image' | 'video' }[];
  initialIndex: number;
  onClose: () => void;
  // FIX: Added onTouchEnd to accept touch event handlers from parent components. This resolves a TypeScript error and allows for better event control, such as stopping propagation.
  onTouchEnd?: React.TouchEventHandler<HTMLDivElement>;
}

// Icon for the zoom-in cursor hint
const ZoomInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
);


export const ImageViewer: React.FC<ImageViewerProps> = ({ media, initialIndex, onClose, onTouchEnd }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  // State for desktop zoom/magnifier
  const [isHovering, setIsHovering] = useState(false);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const MAGNIFIER_SIZE = 200; // px
  const ZOOM_LEVEL = 2.5;

  const nextMedia = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const prevMedia = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextMedia();
      else if (e.key === 'ArrowLeft') prevMedia();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, nextMedia, prevMedia]);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.touches[0].clientX;
    if (diff > 50) { nextMedia(); setTouchStartX(null); } 
    else if (diff < -50) { prevMedia(); setTouchStartX(null); }
  };
  const handleTouchEnd = () => setTouchStartX(null);

  // Desktop zoom handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (imageWrapperRef.current) {
        const rect = imageWrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
    }
  };

  const handleZoomClick = (e: React.MouseEvent) => {
    if(media[currentIndex].type !== 'image') return;
    e.stopPropagation();
    setIsZoomActive(prev => !prev);
  };
  
  const currentMedia = media[currentIndex];

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-opacity duration-300 ${isVisible ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent pointer-events-none'}`}
      onClick={handleClose}
    >
      <div 
        className={`relative w-full h-full flex flex-col items-center justify-center transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd();
          onTouchEnd?.(e);
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 text-white/70 hover:text-white transition-colors"
          aria-label="Close image viewer"
        >
          <XCircleIcon className="w-8 h-8" />
        </button>

        {/* Main Image & Desktop Zoom Wrapper */}
        <div className="flex-grow w-full flex items-center justify-center relative">
            <div 
                ref={imageWrapperRef}
                className={`relative max-w-full max-h-full p-4 ${currentMedia.type === 'image' ? 'lg:cursor-none' : ''}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => { setIsHovering(false); setIsZoomActive(false); }}
                onClick={handleZoomClick}
            >
                {currentMedia.type === 'image' ? (
                    <img
                        src={currentMedia.url}
                        alt={`Image ${currentIndex + 1}`}
                        className="object-contain max-w-full max-h-[80vh] lg:max-h-[calc(90vh-8rem)] rounded-lg shadow-2xl"
                    />
                ) : (
                    <video
                        src={currentMedia.url}
                        controls
                        autoPlay
                        className="object-contain max-w-full max-h-[80vh] lg:max-h-[calc(90vh-8rem)] rounded-lg shadow-2xl focus:outline-none"
                    />
                )}
                

                {/* Hover Icon (Desktop only, for images) */}
                {currentMedia.type === 'image' && (
                  <div className={`hidden lg:block absolute pointer-events-none transition-opacity duration-200 ${isHovering && !isZoomActive ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                          top: `${mousePosition.y - 24}px`, // half of h-12 (48px)
                          left: `${mousePosition.x - 24}px`, // half of w-12 (48px)
                      }}
                  >
                      <ZoomInIcon />
                  </div>
                )}


                {/* Magnifier Element (Desktop only, for images) */}
                {currentMedia.type === 'image' && (
                  <div className={`hidden lg:block absolute rounded-full border-2 border-white/50 bg-no-repeat pointer-events-none transition-opacity duration-200 ${isZoomActive ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                          height: `${MAGNIFIER_SIZE}px`,
                          width: `${MAGNIFIER_SIZE}px`,
                          top: `${mousePosition.y - MAGNIFIER_SIZE / 2}px`,
                          left: `${mousePosition.x - MAGNIFIER_SIZE / 2}px`,
                          backgroundImage: `url(${media[currentIndex].url})`,
                          backgroundSize: `${(imageWrapperRef.current?.clientWidth || 0) * ZOOM_LEVEL}px ${(imageWrapperRef.current?.clientHeight || 0) * ZOOM_LEVEL}px`,
                          backgroundPosition: `-${mousePosition.x * ZOOM_LEVEL - MAGNIFIER_SIZE / 2}px -${mousePosition.y * ZOOM_LEVEL - MAGNIFIER_SIZE / 2}px`,
                      }}
                  >
                      {/* Crosshair inside magnifier */}
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-px h-6 bg-white/50"></div>
                          <div className="absolute w-6 h-px bg-white/50"></div>
                      </div>
                  </div>
                )}
            </div>
        </div>


        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevMedia(); }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextMedia(); }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter for Mobile */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full lg:hidden">
            {currentIndex + 1} / {media.length}
          </div>
        )}

         {/* Thumbnail Strip for Desktop */}
         {media.length > 1 && (
             <div className="hidden lg:flex w-full justify-center items-center flex-shrink-0 h-28 px-4">
                 <div className="flex space-x-2 overflow-x-auto p-2">
                    {media.map((item, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                            className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                currentIndex === index
                                    ? 'border-cyan-400'
                                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'
                            }`}
                            aria-label={`View media ${index + 1}`}
                        >
                            {/* FIX: Replaced the undefined `images` variable with logic to find the first image from the `media` prop. This provides a valid image URL for video thumbnails, resolving the "Cannot find name 'images'" error. */}
                            <img src={item.type === 'video' ? media.find(m => m.type === 'image')?.url : item.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                            {item.type === 'video' && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <PlayCircleIcon className="w-8 h-8 text-white/80"/>
                              </div>
                            )}
                        </button>
                    ))}
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};