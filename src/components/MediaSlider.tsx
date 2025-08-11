import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import './../App.css';
import '../pages/HomePage.css'; // Import HomePage styles

interface MediaItem {
  id: number;
  title: string;
  imageUrl: string;
  rating?: string; // Make optional as tileMedia doesn't have these yet
  duration?: string;
  year?: string;
  ageRating?: string;
  story?: string; // Add story field for movie description
  type?: string; // Add type field to differentiate between movies and series
  trailerVideoUrl?: string; // URL for trailer video
  streamingUrl?: string; // URL for streaming the full content
}

interface MediaSliderProps {
  items: MediaItem[];
  onRightArrowPress?: () => void;
  onLeftArrowPress?: () => void; // Add left arrow handler for navigation to play button
}

export interface MediaSliderHandles {
  handleLeftArrowFromHome: () => void;
}

const MediaSlider = forwardRef<MediaSliderHandles, MediaSliderProps>(
  ({ items, onRightArrowPress, onLeftArrowPress }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const playButtonRef = useRef<HTMLButtonElement>(null);
    const previewButtonRef = useRef<HTMLButtonElement>(null);
    const [focusedButtonIndex, setFocusedButtonIndex] = useState(-1); // -1 means no button is focused
    const [isKeyHandlingEnabled, setIsKeyHandlingEnabled] = useState<boolean>(true);
    const [hasFocus, setHasFocus] = useState<boolean>(false);
    const navigate = useNavigate();

    // We don't auto-focus any button on mount anymore
    // Focus should start on the Home button in sidebar

    useEffect(() => {
      const intervalId = setInterval(() => {
        setCurrentIndex(prevIndex =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
      }, 8000); // Change slide every 8 seconds

      // Clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    }, [items.length]); // Re-run effect if the number of items changes

    const goToPrevious = () => {
      const isFirstSlide = currentIndex === 0;
      const newIndex = isFirstSlide ? items.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
    };

    const goToNext = () => {
      const isLastSlide = currentIndex === items.length - 1;
      const newIndex = isLastSlide ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
    };

    // External handler for left arrow from Home
    // This should be called from the parent component when left arrow is pressed on Home
    const handleLeftArrowFromHome = () => {
      if (playButtonRef.current) {
        playButtonRef.current.focus();
        setFocusedButtonIndex(0);
        setHasFocus(true);
      }
    };

    // Expose this method to parent
    useImperativeHandle(ref, () => ({
      handleLeftArrowFromHome
    }));

    const handleKeyDown = (e: React.KeyboardEvent, buttonIndex: number) => {
      // Prevent double-firing
      if (!isKeyHandlingEnabled) {
        e.preventDefault();
        return;
      }

      // Set focus state when key is pressed
      setHasFocus(true);

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          // Left arrow moves from Play to Preview
          if (buttonIndex === 0) { // From Play button (index 0) to Preview button (index 1)
            previewButtonRef.current?.focus();
            setFocusedButtonIndex(1);
          }
          
          // Debounce
          setIsKeyHandlingEnabled(false);
          setTimeout(() => setIsKeyHandlingEnabled(true), 150);
          break;
        
        case 'ArrowRight':
          e.preventDefault();
          // Right arrow moves from Preview to Play or Play to Home
          if (buttonIndex === 1) { // From Preview button to Play button
            playButtonRef.current?.focus();
            setFocusedButtonIndex(0);
          } else if (buttonIndex === 0 && onRightArrowPress) { // From Play button to Home
            onRightArrowPress();
            setFocusedButtonIndex(-1); // No button focused
          }
          
          // Debounce
          setIsKeyHandlingEnabled(false);
          setTimeout(() => setIsKeyHandlingEnabled(true), 150);
          break;
        
        case 'ArrowDown':
          e.preventDefault();
          // Move focus to the first tile in the first row
          const firstTile = document.querySelector('.media-tiles-container .media-tile');
          if (firstTile instanceof HTMLElement) {
            firstTile.focus();
            
            // Ensure we don't handle keys again too quickly
            setIsKeyHandlingEnabled(false);
            setTimeout(() => setIsKeyHandlingEnabled(true), 200);
          }
          break;
      }
    };

    // Handle focus events
    const handleFocus = (buttonIndex: number) => {
      setFocusedButtonIndex(buttonIndex);
      setHasFocus(true);
    };

    const handlePlayClick = () => {
      const currentItem = items[currentIndex];
      if (currentItem) {
        if (currentItem.streamingUrl) {
          console.log(`پخش مستقیم محتوا: ${currentItem.title}`);
          // اگر بخواهید برای پخش مستقیم کدی اضافه کنید (مثلاً استفاده از VideoPlayer)، اینجا قرار دهید
          
          // اصلاح مسیر صفحه جزئیات
          const pageType = currentItem.type === 'series' ? 'series' : 'movie';
          navigate(`/${pageType}/${currentItem.id}`);
        } else {
          // اگر URL پخش موجود نباشد، به صفحه جزئیات هدایت می‌شویم
          const pageType = currentItem.type === 'series' ? 'series' : 'movie';
          navigate(`/${pageType}/${currentItem.id}`);
        }
      }
    };

    const handlePreviewClick = () => {
      const currentItem = items[currentIndex];
      if (currentItem) {
        if (currentItem.trailerVideoUrl) {
          console.log(`پخش پیش‌نمایش: ${currentItem.title}`);
          // اگر بخواهید برای پخش پیش‌نمایش کدی اضافه کنید، اینجا قرار دهید
          
          // اصلاح مسیر صفحه جزئیات
          const pageType = currentItem.type === 'series' ? 'series' : 'movie';
          navigate(`/${pageType}/${currentItem.id}`);
        } else {
          // اگر URL پیش‌نمایش موجود نباشد، به صفحه جزئیات هدایت می‌شویم
          const pageType = currentItem.type === 'series' ? 'series' : 'movie';
          navigate(`/${pageType}/${currentItem.id}`);
        }
      }
    };

    const currentItem = items[currentIndex];

    if (!currentItem) {
      return null;
    }

    return (
      <div className="media-slider-container">
        {items.length > 0 ? (
          <div className="slider-content">
            <img src={currentItem.imageUrl} alt={currentItem.title} className="slider-image" />
            <div className="slider-overlay"></div>
            
            <div className="slider-info">
              <h2>{currentItem.title}</h2>
              <div className="media-details">
                  {/* Using fixed spacing with flex layout */}
                  <span className="rating">{currentItem.rating || ''}</span>
                  <span className="age-rating">{currentItem.ageRating || ''}</span>
                  <span className="year">{currentItem.year || ''}</span>
                  <span className="duration">{currentItem.duration || ''}</span>
              </div>
              
              <div className="slider-buttons">
                  <button 
                    className="play-button" 
                    ref={playButtonRef}
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, 0)}
                    onFocus={() => handleFocus(0)}
                    onClick={handlePlayClick}
                  >
                    پخش
                  </button>
                  <button 
                    className="preview-button" 
                    ref={previewButtonRef}
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, 1)}
                    onFocus={() => handleFocus(1)}
                    onClick={handlePreviewClick}
                  >
                    پیش نمایش
                  </button>
              </div>
            </div>
            
            {currentItem.story && (
              <div className="slider-story">
                <p>{currentItem.story}</p>
              </div>
            )}
            
            <button className="slider-arrow left-arrow" onClick={goToPrevious}>&#8249;</button>
            <button className="slider-arrow right-arrow" onClick={goToNext}>&#8250;</button>
          </div>
        ) : (
          <p>No items to display in the slider.</p>
        )}
      </div>
    );
  }
);

export default MediaSlider;

