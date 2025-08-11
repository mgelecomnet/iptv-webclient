import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';
import './SeriesPage.css'; // Separate CSS file for series page
import MediaTile from '../components/MediaTile';
import { updateGridLayout } from '../utils/deviceScaling'; // Import the grid layout function
import { fetchSeries, SeriesType } from '../services/seriesApi';

interface SeriesPageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

// Filter options
const filterOptions = [
  { id: 'all', label: 'همه' },
  { id: 'latest', label: 'جدیدترین‌ها' },
  { id: 'popular', label: 'محبوب‌ترین‌ها' },
  { id: 'highest_rated', label: 'بیشترین امتیاز' },
  { id: 'drama', label: 'درام' },
  { id: 'comedy', label: 'کمدی' },
  { id: 'crime', label: 'جنایی' }
];

function SeriesPage({ onLeftArrowPress, onRightArrowPress }: SeriesPageProps) {
  // Series state
  const [series, setSeries] = useState<SeriesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // UI state
  const [activeFilter, setActiveFilter] = useState('all');
  const [seriesPerRow, setSeriesPerRow] = useState(6);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, cols: 0 });
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const seriesRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const lastSeriesElementRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 12;
  
  // Add a new state to track if this is an initial load or filter change
  const [isFilterChange, setIsFilterChange] = useState<boolean>(false);
  
  // Calculate grid dimensions based on series count and series per row
  useEffect(() => {
    const totalSeriesCount = series.length;
    const rows = Math.ceil(totalSeriesCount / seriesPerRow);
    setGridDimensions({ rows, cols: seriesPerRow });
    
    // Update CSS variable for grid layout
    if (gridRef.current) {
      gridRef.current.style.setProperty('--grid-columns', seriesPerRow.toString());
    }
    
    // Reset refs array to match the new layout
    seriesRefs.current = Array(totalSeriesCount);
    
    console.log(`Grid dimensions updated: ${rows} rows x ${seriesPerRow} columns`);
  }, [seriesPerRow, series.length]);
  
  // Determine series per row based on CSS variable set by device scaling
  useEffect(() => {
    function calculateSeriesPerRow() {
      // Get the CSS variable for movies per row (same for series)
      const cssSeriesPerRow = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--movies-per-row'));
      
      // Use the CSS variable if available, otherwise use a fallback
      if (!isNaN(cssSeriesPerRow) && cssSeriesPerRow > 0) {
        setSeriesPerRow(cssSeriesPerRow);
      } else {
        // Fallback calculation (should rarely be needed)
        const width = window.innerWidth;
        let count = Math.floor(width * 0.9 / 200); // Simple estimate: 90% of width divided by approx tile width
        setSeriesPerRow(Math.max(2, count)); // Ensure at least 2 per row
      }
    }
    
    calculateSeriesPerRow();
    window.addEventListener('resize', calculateSeriesPerRow);
    
    return () => {
      window.removeEventListener('resize', calculateSeriesPerRow);
    };
  }, []);
  
  // Update grid dimensions when series count or series per row changes
  useEffect(() => {
    if (gridRef.current && seriesPerRow > 0) {
      // No need to manually set --grid-columns, we'll use --movies-per-row directly in CSS
      setGridDimensions({
        rows: Math.ceil(series.length / seriesPerRow),
        cols: seriesPerRow
      });
      
      // Reset refs array to match the new layout
      seriesRefs.current = Array(series.length);
    }
  }, [series.length, seriesPerRow]);
  
  // Function to fetch series from API
  const loadSeries = useCallback(async (pageNumber: number, isLoadingMore: boolean = false) => {
    try {
      if (!isLoadingMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Set up the API parameters
      let ordering = '-publishDate';
      let category = '';
      
      if (activeFilter === 'latest') {
        ordering = '-publishDate';
      } else if (activeFilter === 'popular') {
        ordering = '-likeCount';
      } else if (activeFilter === 'highest_rated') {
        ordering = '-imdb';
      } else if (activeFilter !== 'all') {
        // Assume the filter is a category
        category = activeFilter;
      }
      
      const response = await fetchSeries(
        pageNumber,
        ITEMS_PER_PAGE,
        ordering,
        category
      );
      
      // Update the state
      setTotalItems(response.count);
      
      // Check if we got any results - if not and we're loading more, we've reached the end
      if (response.results.length === 0 && isLoadingMore) {
        setHasMore(false);
        setLoadingMore(false);
        setLoading(false);
        return;
      }
      
      if (isLoadingMore) {
        setSeries(prevSeries => [...prevSeries, ...response.results]);
      } else {
        setSeries(response.results);
      }
      
      setHasMore(response.next !== null);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
    } catch (err) {
      console.error('Error loading series:', err);
      
      // Don't show error on screen if we already have content loaded
      // Just stop trying to load more
      if (isLoadingMore) {
        console.log('Error during load more, stopping infinite scroll');
        setHasMore(false);
        setLoadingMore(false);
      } else {
        setError('خطا در بارگذاری سریال‌ها. لطفا دوباره تلاش کنید.');
        setLoading(false);
      }
      
      // In any error case, make sure loading states are reset
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter]);
  
  // Initial load and filter change
  useEffect(() => {
    setSeries([]);
    setPage(1);
    setHasMore(true);
    setFocusedElement(null);
    
    // Start loading and set loading state
    setLoading(true);
    loadSeries(1);
  }, [activeFilter, loadSeries]);
  
  // A separate effect to handle focusing after loading completes
  useEffect(() => {
    // Only proceed if we were loading and now we're not
    if (!loading && focusedElement === null) {
      console.log(`Loading complete. Series count: ${series.length}`);
      
      // If we have content and this was a filter change (not initial load)
      if (series.length > 0 && isFilterChange) {
        // Wait a bit longer to ensure the DOM is updated
        setTimeout(() => {
          console.log('Focusing first series after filter change');
          focusSeries(0);
        }, 500);
      } else if (series.length === 0 && isFilterChange) {
        // If no content after filter change, focus back on the active filter
        const activeIndex = filterOptions.findIndex(f => f.id === activeFilter);
        if (activeIndex >= 0) {
          setTimeout(() => {
            console.log('Focusing back on filter since no content available');
            focusFilter(activeIndex);
          }, 100);
        }
      } else {
        // On initial page load, don't change focus (leave it on sidebar)
        console.log('Initial page load - leaving focus on sidebar');
      }
    }
    
    // Also handle error case for focus management
    if (error && focusedElement === null && isFilterChange) {
      // If error after filter change, focus back on the filter
      const activeIndex = filterOptions.findIndex(f => f.id === activeFilter);
      if (activeIndex >= 0) {
        setTimeout(() => {
          console.log('Error occurred, focusing back on filter');
          focusFilter(activeIndex);
        }, 100);
      }
    }
  }, [loading, series.length, activeFilter, isFilterChange, error]);
  
  // When series are loaded, update the refs array
  useEffect(() => {
    // Reset refs array to match new content
    seriesRefs.current = Array(series.length);
    
    // Log the state for debugging
    console.log(`Series updated: ${series.length} items, focused element: ${focusedElement}`);
  }, [series]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        console.log('Loading more series, currently at page', page);
        // Add a maximum page check to prevent excessive API calls
        if (page < 3) { // Hard limit at page 2 since we know page 3 doesn't exist
          setPage(prevPage => prevPage + 1);
        } else {
          console.log('Reached maximum page limit, stopping infinite scroll');
          setHasMore(false);
        }
      }
    };
    
    observer.current = new IntersectionObserver(observerCallback, {
      rootMargin: '0px 0px 300px 0px', // Start loading 300px before reaching the end
      threshold: 0.1
    });
    
    if (lastSeriesElementRef.current) {
      observer.current.observe(lastSeriesElementRef.current);
    }
    
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, page]);
  
  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadSeries(page, true);
    }
  }, [page, loadSeries]);

  // Helper function to get position from index
  const getPositionFromIndex = (index: number) => {
    const row = Math.floor(index / seriesPerRow);
    const col = index % seriesPerRow;
    return { row, col };
  };
  
  // Helper function to get index from position
  const getIndexFromPosition = (row: number, col: number) => {
    // Ensure col is within bounds
    if (col < 0) col = 0;
    if (col >= seriesPerRow) col = seriesPerRow - 1;
    
    const index = row * seriesPerRow + col;
    // Ensure index is within bounds of available series
    if (index >= series.length) {
      return series.length - 1;
    }
    return index;
  };
  
  // Helpers to focus elements
  const focusSeries = (index: number) => {
    if (index >= series.length) index = series.length - 1;
    if (index < 0) index = 0;
    
    setFocusedElement('series');
    setFocusedIndex(index);
    
    setTimeout(() => {
      seriesRefs.current[index]?.focus();
      
      // Scroll into view if needed
      if (seriesRefs.current[index]) {
        const element = seriesRefs.current[index];
        const rect = element?.getBoundingClientRect();
        
        if (rect) {
          const isInView = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          );
          
          if (!isInView) {
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    }, 0);
  };
  
  const focusFilter = (index: number) => {
    if (index >= filterOptions.length) index = filterOptions.length - 1;
    if (index < 0) index = 0;
    
    setFocusedElement('filter');
    setFocusedIndex(index);
    
    setTimeout(() => {
      filterRefs.current[index]?.focus();
      filterRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  };
  
  // Handle keyboard events from anywhere in the component
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        handleLeftArrow();
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleRightArrow();
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleUpArrow();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleDownArrow();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect();
        break;
      default:
        // Let other keys pass through
        break;
    }
  };
  
  // Set up event listeners for document-level keyboard events
  useEffect(() => {
    function handleDocumentKeyDown(e: KeyboardEvent) {
      // Only handle arrow left when there's a clear intention to move from sidebar
      // and we're specifically requesting it with the ArrowLeft key
      if (e.key === 'ArrowLeft' && !focusedElement) {
        // Check if this is likely coming from the sidebar
        const isFromSidebar = document.activeElement?.closest('.sidebar') !== null;
        
        if (isFromSidebar) {
          e.preventDefault();
          console.log('User explicitly moving from sidebar to series content');
          // Coming from sidebar, focus the first series or filter
          if (series.length > 0) {
            focusSeries(0);
          } else if (filterOptions.length > 0) {
            focusFilter(0);
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [focusedElement, series.length]);
  
  // Keyboard handling logic
  const handleLeftArrow = () => {
    if (focusedElement === 'filter') {
      if (focusedIndex < filterOptions.length - 1) {
        focusFilter(focusedIndex + 1);
      } else {
        // Last filter, move to first series
        focusSeries(0);
      }
    } else if (focusedElement === 'series') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (col < seriesPerRow - 1) {
        const nextIndex = getIndexFromPosition(row, col + 1);
        if (nextIndex < series.length) {
          focusSeries(nextIndex);
        }
      }
    }
  };
  
  const handleRightArrow = () => {
    if (focusedElement === 'filter') {
      if (focusedIndex > 0) {
        focusFilter(focusedIndex - 1);
      } else {
        // First filter, go to sidebar
        if (onRightArrowPress) {
          setFocusedElement(null);
          onRightArrowPress();
        }
      }
    } else if (focusedElement === 'series') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (col > 0) {
        focusSeries(getIndexFromPosition(row, col - 1));
      } else {
        // First column, go to sidebar
        if (onRightArrowPress) {
          setFocusedElement(null);
          onRightArrowPress();
        }
      }
    }
  };
  
  const handleUpArrow = () => {
    if (focusedElement === 'series') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (row > 0) {
        // Move to the row above
        focusSeries(getIndexFromPosition(row - 1, col));
      } else {
        // First row, move to filters
        const filterIndex = Math.min(col, filterOptions.length - 1);
        focusFilter(filterIndex);
      }
    }
  };
  
  const handleDownArrow = () => {
    if (focusedElement === 'filter') {
      // Move from filters to series
      const col = Math.min(focusedIndex, seriesPerRow - 1);
      focusSeries(getIndexFromPosition(0, col));
    } else if (focusedElement === 'series') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      const nextRowIndex = getIndexFromPosition(row + 1, col);
      
      if (nextRowIndex < series.length) {
        // Move to the row below
        focusSeries(nextRowIndex);
      }
    }
  };
  
  const handleSelect = () => {
    if (focusedElement === 'filter') {
      const selectedFilter = filterOptions[focusedIndex].id;
      
      // Only trigger a change if the filter actually changed
      if (selectedFilter !== activeFilter) {
        // Mark this as a filter change, not initial load
        setIsFilterChange(true);
        
        // Change filter and let the loading effect handle focus
        setActiveFilter(selectedFilter);
        // Focus will be handled by the effect that monitors loading state
      }
    } else if (focusedElement === 'series') {
      // Navigate to series details page
      const selectedSeries = series[focusedIndex];
      if (selectedSeries && seriesRefs.current[focusedIndex]) {
        // Use the native click event to trigger the Link navigation
        seriesRefs.current[focusedIndex]?.click();
      }
    }
  };
  
  // Clear focus when moving to sidebar
  useEffect(() => {
    return () => {
      setFocusedElement(null);
    };
  }, []);

  // Show loading state
  if (loading && series.length === 0) {
    return (
      <div className="main-content">
        <div className="series-container">
          <h2>سریال‌ها</h2>
          <div className="loading-container">در حال بارگذاری سریال‌ها...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && series.length === 0) {
    return (
      <div className="main-content">
        <div className="series-container">
          <h2>سریال‌ها</h2>
          <div className="error-container">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="main-content" 
      ref={containerRef}
      tabIndex={-1}
    >
      <div className="series-container">
        <h2>سریال‌ها</h2>
        
        {/* Filter buttons */}
        <div className="series-filter">
          {filterOptions.map((filter, index) => (
            <button
              key={filter.id}
              ref={(el) => { filterRefs.current[index] = el; }}
              className={`filter-button ${activeFilter === filter.id ? 'active' : ''} ${focusedElement === 'filter' && focusedIndex === index ? 'focused' : ''}`}
              onClick={() => {
                setActiveFilter(filter.id);
                focusFilter(index);
              }}
              onFocus={() => focusFilter(index)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Series grid */}
        <div 
          className="series-grid" 
          ref={gridRef}
          style={{ 
            gridTemplateColumns: `repeat(var(--movies-per-row, ${seriesPerRow}), 1fr)`,
            gap: 'var(--grid-gap, 15px)',
            width: '100%',
            marginLeft: '0',
            paddingLeft: '0'
          }}
        >
          {series.map((item, index) => {
            const isLastSeries = index === series.length - 1;
            
            return (
              <div 
                key={item.id} 
                ref={isLastSeries ? lastSeriesElementRef : null}
              >
                <MediaTile
                  id={item.id}
                  type={item.type?.toLowerCase()}
                  title={item.caption}
                  poster={item.imageUrl}
                  year={item.year ? item.year.toString() : ''}
                  rating={item.imdb}
                  extraInfo={item.seasonCount ? `${item.seasonCount} فصل` : undefined}
                  ref={(el) => { seriesRefs.current[index] = el as HTMLAnchorElement; }}
                  className={`media-tile ${focusedElement === 'series' && focusedIndex === index ? 'focused' : ''}`}
                  onFocus={() => focusSeries(index)}
                  onKeyDown={handleKeyDown}
                  tabIndex={0}
                />
              </div>
            );
          })}
        </div>
        
        {/* Loading indicator for infinite scroll */}
        {loadingMore && (
          <div className="loading-more">
            در حال بارگذاری سریال‌های بیشتر...
          </div>
        )}
        
        {/* End of list message */}
        {!hasMore && series.length > 0 && (
          <div className="end-of-list">
            پایان فهرست سریال‌ها
          </div>
        )}
      </div>
    </div>
  );
}

export default SeriesPage; 
