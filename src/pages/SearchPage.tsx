import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import './SearchPage.css'; // Separate CSS file for search page
import './SearchResults.css'; // CSS for search results
import { searchContent, SearchResults, Movie } from '../services/api';
import { Link } from 'react-router-dom';
import { updateGridLayout } from '../utils/deviceScaling';

interface SearchPageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

function SearchPage({ onLeftArrowPress, onRightArrowPress }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isPersianKeyboard, setIsPersianKeyboard] = useState<boolean>(true);
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState<boolean>(false);
  const [focusedKey, setFocusedKey] = useState<{row: number, col: number} | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  // --- Keyboard navigation for results ---
  const [focusedResultIndex, setFocusedResultIndex] = useState<number | null>(null);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if the device is mobile
  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
      setIsMobileDevice(isMobile);
      
      // Auto-focus input field on mobile
      if (isMobile && inputRef.current) {
        // Short delay to ensure rendering is complete
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };
    
    checkMobileDevice();
  }, []);

  // Persian keyboard layouts
  const persianKeyboard = {
    normal: [
      ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۰', '-', '='],
      ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
      ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
      ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', '.', '/']
    ],
    shift: [
      ['!', '@', '#', '$', '%', '^', '&', '*', ')', '(', '_', '+'],
      ['ْ', 'ٌ', 'ٍ', 'ً', 'ُ', 'ِ', 'َ', 'ّ', ']', '[', '}', '{'],
      ['ؤ', 'ئ', 'ي', 'إ', 'أ', 'آ', 'ة', '»', '«', ':', '"'],
      ['ك', 'ٓ', 'ژ', 'ٰ', '‌', 'ء', '؟', '>', '<', '|']
    ]
  };

  // English keyboard layouts
  const englishKeyboard = {
    normal: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
    ],
    shift: [
      ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?']
    ]
  };

  // Special keys for the bottom row
  const specialKeys = [
    { id: 'language', label: isPersianKeyboard ? 'English' : 'فارسی', action: toggleLanguage },
    { id: 'space', label: 'Space', action: handleSpace },
    { id: 'shift', label: 'Shift', action: handleShift },
    { id: 'backspace', label: '⌫', action: handleBackspace }
  ];

  // Handle search when query changes
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Reset results if query is too short
    if (searchQuery.length < 3) {
      setSearchResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce search requests - wait 500ms after typing stops
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchContent(searchQuery);
        setSearchResults(results);
        setIsLoading(false);
      } catch (err) {
        console.error('Search error:', err);
        setError('خطا در جستجو. لطفا دوباره تلاش کنید.');
        setIsLoading(false);
      }
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // Get current keyboard layout
  const getCurrentKeyboard = () => {
    const keyboard = isPersianKeyboard ? persianKeyboard : englishKeyboard;
    return isShiftActive ? keyboard.shift : keyboard.normal;
  };

  // Focus the keyboard
  const focusKeyboard = () => {
    // Don't focus virtual keyboard on mobile
    if (isMobileDevice) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }
    
    setIsKeyboardFocused(true);
    setFocusedKey({ row: 0, col: 0 });
    if (keyboardRef.current) {
      keyboardRef.current.focus();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    // Skip keyboard navigation setup on mobile devices
    if (isMobileDevice) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardFocused) {
        // Check for left arrow key to focus the keyboard in LTR context
        if (e.key === 'ArrowLeft' && !isSearchFocused) {
          e.preventDefault();
          focusKeyboard();
          return;
        }
        return;
      }
      
      e.preventDefault();
      
      const layout = getCurrentKeyboard();
      const maxRows = layout.length;
      const specialRow = maxRows; // Index for special keys row
      
      if (!focusedKey) {
        setFocusedKey({ row: 0, col: 0 });
        return;
      }
      
      const { row, col } = focusedKey;
      
      switch (e.key) {
        case 'ArrowUp':
          if (row > 0) {
            const newRow = row - 1;
            const maxCol = layout[newRow].length - 1;
            setFocusedKey({ row: newRow, col: Math.min(col, maxCol) });
          }
          break;
        case 'ArrowDown':
          if (row < maxRows) {
            if (row === maxRows - 1) {
              // Move to special keys row
              setFocusedKey({ row: specialRow, col: Math.min(col, specialKeys.length - 1) });
            } else {
              const newRow = row + 1;
              const maxCol = newRow < maxRows ? layout[newRow].length - 1 : specialKeys.length - 1;
              setFocusedKey({ row: newRow, col: Math.min(col, maxCol) });
            }
          } else if (row === maxRows) {
            // If on any special key in the bottom row, ArrowDown moves to first result tile if exists
            const results = getAllResults();
            if (results.length > 0) {
              setIsKeyboardFocused(false);
              setFocusedKey(null);
              setFocusedResultIndex(0);
              setTimeout(() => resultRefs.current[0]?.focus(), 0);
            } else if (onRightArrowPress && col === specialKeys.length - 1) {
              // Fallback: go to sidebar if no results and on the last key
              setIsKeyboardFocused(false);
              setFocusedKey(null);
              onRightArrowPress();
            }
          }
          break;
        case 'ArrowLeft':
          // Move focus left in LTR context
          if (row === specialRow) {
            // In special keys row
            if (col > 0) {
              setFocusedKey({ row, col: col - 1 });
            } else if (onLeftArrowPress) {
              // Exit keyboard to the left
              setIsKeyboardFocused(false);
              setFocusedKey(null);
              onLeftArrowPress();
            }
          } else if (col > 0) {
            setFocusedKey({ row, col: col - 1 });
          } else if (onLeftArrowPress && row === 0 && col === 0) {
            // Exit keyboard to the left from the first key
            setIsKeyboardFocused(false);
            setFocusedKey(null);
            onLeftArrowPress();
          }
          break;
        case 'ArrowRight':
          // Move focus right in LTR context
          if (row === specialRow) {
            // In special keys row
            if (col < specialKeys.length - 1) {
              setFocusedKey({ row, col: col + 1 });
            } else if (onRightArrowPress) {
              // Exit keyboard to the right
              setIsKeyboardFocused(false);
              setFocusedKey(null);
              onRightArrowPress();
            }
          } else if (col < layout[row].length - 1) {
            setFocusedKey({ row, col: col + 1 });
          } else if (onRightArrowPress && col === layout[row].length - 1) {
            // Exit keyboard to the right from the last key in the row
            setIsKeyboardFocused(false);
            setFocusedKey(null);
            onRightArrowPress();
          }
          break;
        case 'Enter':
        case ' ':
          if (row === specialRow) {
            // Special key
            specialKeys[col].action();
          } else {
            // Regular key
            handleVirtualKeyPress(layout[row][col]);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isKeyboardFocused, focusedKey, isPersianKeyboard, isShiftActive, isSearchFocused, isMobileDevice]);

  const getAllResults = () => {
    if (!searchResults) return [];
    const movies = searchResults.movies.map((m: Movie) => ({ ...m, type: 'movie' as const }));
    const series = searchResults.series.map((s: Movie) => ({ ...s, type: 'series' as const }));
    return [...movies, ...series];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isMobileDevice) return;
    const results = getAllResults();
    // اگر input فوکوس است و ArrowDown زدی، اولین تایل فوکوس شود
    if (document.activeElement === inputRef.current && e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setFocusedResultIndex(0);
      setTimeout(() => resultRefs.current[0]?.focus(), 0);
      return;
    }
    // ناوبری کناری
    if (e.key === 'ArrowLeft' && !isSearchFocused && !isKeyboardFocused) {
      e.preventDefault();
      if (onLeftArrowPress) {
        onLeftArrowPress();
      } else {
        focusKeyboard();
      }
    } else if (e.key === 'ArrowRight' && !isSearchFocused && !isKeyboardFocused && onRightArrowPress) {
      e.preventDefault();
      onRightArrowPress();
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setIsKeyboardFocused(false);
    setFocusedKey(null);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      // The search is already triggered by the useEffect
    } else if (searchQuery.length > 0) {
      setError('لطفا حداقل ۳ حرف برای جستجو وارد کنید.');
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    const newValue = searchQuery + key;
    setSearchQuery(newValue);
  };

  function handleBackspace() {
    if (searchQuery.length > 0) {
      setSearchQuery(searchQuery.substring(0, searchQuery.length - 1));
    }
  }

  function handleSpace() {
    handleVirtualKeyPress(' ');
  }

  function handleShift() {
    setIsShiftActive(!isShiftActive);
  }

  function toggleLanguage() {
    setIsPersianKeyboard(!isPersianKeyboard);
    setIsShiftActive(false);
  }

  // Render a media item (movie, series or TV channel)
  // index: index in getAllResults()
  const renderMediaItem = (item: Movie & { type: 'movie' | 'series' }, index: number) => {
    const linkPrefix = item.type === 'movie' ? '/movie/' : '/series/';
    const handleTileKeyDown = (e: React.KeyboardEvent) => {
      const results = getAllResults();
      // Dynamically calculate tiles per row from the DOM (responsive)
      let tilesPerRow = 1;
      let tileIdx = index;
      const parent = resultRefs.current[index]?.parentElement;
      let children: Element[] = [];
      if (parent) {
        children = Array.from(parent.children).filter(child => child.tagName === 'A');
        tileIdx = children.findIndex(el => el === resultRefs.current[index]);
        if (children.length > 1) {
          const firstTop = (children[0] as HTMLElement).offsetTop;
          tilesPerRow = children.findIndex((el, i) => i > 0 && (el as HTMLElement).offsetTop !== firstTop);
          if (tilesPerRow === -1) tilesPerRow = children.length; // single row
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = tileIdx + tilesPerRow;
        if (next < children.length) {
          setFocusedResultIndex(results.findIndex((_, i) => resultRefs.current[i] === children[next]));
          (children[next] as HTMLElement).focus();
        } else {
          setFocusedResultIndex(null);
          if (inputRef.current) inputRef.current.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = tileIdx - tilesPerRow;
        if (prev >= 0) {
          setFocusedResultIndex(results.findIndex((_, i) => resultRefs.current[i] === children[prev]));
          (children[prev] as HTMLElement).focus();
        } else {
          setFocusedResultIndex(null);
          if (inputRef.current) inputRef.current.focus();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (tileIdx % tilesPerRow !== 0) {
          const left = tileIdx - 1;
          setFocusedResultIndex(results.findIndex((_, i) => resultRefs.current[i] === children[left]));
          (children[left] as HTMLElement).focus();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if ((tileIdx + 1) % tilesPerRow !== 0 && tileIdx + 1 < children.length) {
          const right = tileIdx + 1;
          setFocusedResultIndex(results.findIndex((_, i) => resultRefs.current[i] === children[right]));
          (children[right] as HTMLElement).focus();
        }
      }
      // Enter/Space: default Link behavior
      else if (e.key === 'Tab') {
        setFocusedResultIndex(null);
      }
    };
    return (
      <Link
        to={`${linkPrefix}${item.id}`}
        className={`search-result-item${focusedResultIndex === index ? ' focused' : ''}`}
        key={`${item.type}-${item.id}`}
        ref={el => { resultRefs.current[index] = el; }}
        tabIndex={0}
        onFocus={() => setFocusedResultIndex(index)}
        onKeyDown={handleTileKeyDown}
      >
        <div className="media-poster">
          <img src={item.imageUrl || item.coverPortrait || item.coverLandscape} alt={item.caption} />
        </div>
        <div className="media-info">
          <h3>{item.caption}</h3>
          <div className="media-details">
            {item.imdb && <span className="rating">{item.imdb} IMDb</span>}
            {item.ageRange && item.ageRange.length > 0 && (
              <span className="age-rating">+{item.ageRange[0].value}</span>
            )}
            {item.year && <span className="year">{item.year}</span>}
            <span className="type">{item.type === 'movie' ? 'فیلم' : 'سریال'}</span>
          </div>
          {item.shortdescription && (
            <p className="description">{item.shortdescription}</p>
          )}
        </div>
      </Link>
    );
  };

  const renderKeyboard = () => {
    const layout = getCurrentKeyboard();

    return (
      <div 
        className="virtual-keyboard" 
        ref={keyboardRef}
        tabIndex={0}
        onFocus={() => setIsKeyboardFocused(true)}
        onBlur={() => {
          setIsKeyboardFocused(false);
          setFocusedKey(null);
        }}
        dir="ltr"
      >
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key, colIndex) => (
              <button
                key={colIndex}
                type="button"
                className={`keyboard-key ${focusedKey?.row === rowIndex && focusedKey?.col === colIndex ? 'focused' : ''}`}
                onClick={() => handleVirtualKeyPress(key)}
                tabIndex={-1}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="keyboard-row">
          {specialKeys.map((key, index) => (
            <button
              key={key.id}
              type="button"
              className={`keyboard-key ${key.id} ${focusedKey?.row === layout.length && focusedKey?.col === index ? 'focused' : ''}`}
              onClick={key.action}
              tabIndex={-1}
            >
              {key.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Apply grid layout scaling when component mounts
  useEffect(() => {
    // Update grid layout when component mounts
    updateGridLayout();
    
    // Also update on resize
    window.addEventListener('resize', updateGridLayout);
    
    return () => {
      window.removeEventListener('resize', updateGridLayout);
    };
  }, []);

  return (
    <div className="main-content" ref={mainContentRef} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={`search-container ${isMobileDevice ? 'mobile-search' : ''}`}>
        <h2>جستجو</h2>
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="نام فیلم یا سریال مورد نظر را وارد کنید..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            readOnly={isKeyboardFocused && !isMobileDevice}
            autoFocus={isMobileDevice}
          />
          <button type="submit" className="search-button">
            جستجو
          </button>
        </form>
        
        {/* Only render the virtual keyboard on non-mobile devices */}
        {!isMobileDevice && renderKeyboard()}
        
        <div className="search-results">
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="search-message">لطفا حداقل ۳ حرف برای جستجو وارد کنید.</p>
          )}
          
          {error && <p className="search-error">{error}</p>}
          
          {isLoading && <div className="loading-spinner"></div>}
          
          {searchResults && !isLoading && (
            <div className="search-results-container">
              {searchResults.movies.length === 0 && 
               searchResults.series.length === 0 && 
               searchResults.tvchannels.length === 0 ? (
                <p className="no-results">نتیجه‌ای برای "{searchQuery}" یافت نشد.</p>
              ) : (
                <>
                  {searchResults.movies.length > 0 && (
                    <div className="result-section">
                      <h3>فیلم‌ها</h3>
                      <div className="results-grid">
                        {getAllResults().map((item, idx) =>
                          item.type === 'movie' ? renderMediaItem(item, idx) : null
                        )}
                      </div>
                    </div>
                  )}
                  
                  {searchResults.series.length > 0 && (
                    <div className="result-section">
                      <h3>سریال‌ها</h3>
                      <div className="results-grid">
                        {getAllResults().map((item, idx) =>
                          item.type === 'series' ? renderMediaItem(item, idx) : null
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;