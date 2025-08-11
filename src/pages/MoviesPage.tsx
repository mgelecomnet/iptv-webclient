import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../App.css';
import './MoviesPage.css'; // Separate CSS file for movies page
import MediaTile from '../components/MediaTile';
import { updateGridLayout } from '../utils/deviceScaling'; // Import the grid layout function
import { fetchMovies, MovieType } from '../services/movieApi';

interface MoviesPageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

// Filter options
const filterOptions = [
  { id: 'all', label: 'همه' },
  { id: 'latest', label: 'جدیدترین‌ها' },
  { id: 'popular', label: 'محبوب‌ترین‌ها' },
  { id: 'highest_rated', label: 'بیشترین امتیاز' },
  { id: 'action', label: 'اکشن' },
  { id: 'comedy', label: 'کمدی' },
  { id: 'drama', label: 'درام' }
];

function MoviesPage({ onLeftArrowPress, onRightArrowPress }: MoviesPageProps) {
  // Movies state
  const [movies, setMovies] = useState<MovieType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // UI state
  const [activeFilter, setActiveFilter] = useState('all');
  const [moviesPerRow, setMoviesPerRow] = useState(6);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, cols: 0 });
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const movieRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const lastMovieElementRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 12;
  
  // Add a new state to track if this is an initial load or filter change
  const [isFilterChange, setIsFilterChange] = useState<boolean>(false);
  
  // Calculate grid dimensions based on movies count and movies per row
  useEffect(() => {
    const totalMoviesCount = movies.length;
    const rows = Math.ceil(totalMoviesCount / moviesPerRow);
    setGridDimensions({ rows, cols: moviesPerRow });
    
    // Update CSS variable for grid layout
    if (gridRef.current) {
      gridRef.current.style.setProperty('--grid-columns', moviesPerRow.toString());
    }
    
    // Reset refs array to match the new layout
    movieRefs.current = Array(totalMoviesCount);
    
    console.log(`Grid dimensions updated: ${rows} rows x ${moviesPerRow} columns`);
  }, [moviesPerRow, movies.length]);
  
  // Determine movies per row based on CSS variable set by device scaling
  useEffect(() => {
    function calculateMoviesPerRow() {
      // Get the CSS variable for movies per row
      const cssMoviesPerRow = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--movies-per-row'));
      
      // Use the CSS variable if available, otherwise use a fallback
      if (!isNaN(cssMoviesPerRow) && cssMoviesPerRow > 0) {
        setMoviesPerRow(cssMoviesPerRow);
      } else {
        // Fallback calculation (should rarely be needed)
        const width = window.innerWidth;
        let count = Math.floor(width * 0.9 / 200); // Simple estimate: 90% of width divided by approx tile width
        setMoviesPerRow(Math.max(2, count)); // Ensure at least 2 per row
      }
    }
    
    calculateMoviesPerRow();
    window.addEventListener('resize', calculateMoviesPerRow);
    
    return () => {
      window.removeEventListener('resize', calculateMoviesPerRow);
    };
  }, []);
  
  // Update grid dimensions when movies count or movies per row changes
  useEffect(() => {
    if (gridRef.current && moviesPerRow > 0) {
      // No need to manually set --grid-columns, we'll use --movies-per-row directly in CSS
      setGridDimensions({
        rows: Math.ceil(movies.length / moviesPerRow),
        cols: moviesPerRow
      });
      
      // Reset refs array to match the new layout
      movieRefs.current = Array(movies.length);
    }
  }, [movies.length, moviesPerRow]);
  
  // Function to fetch movies from API
  const loadMovies = useCallback(async (pageNumber: number, isLoadingMore: boolean = false) => {
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
      
      const response = await fetchMovies(
        pageNumber,
        ITEMS_PER_PAGE,
        'movie',
        ordering,
        category
      );
      
      // Update the state
      setTotalItems(response.count);
      
      if (isLoadingMore) {
        setMovies(prevMovies => [...prevMovies, ...response.results]);
      } else {
        setMovies(response.results);
      }
      
      setHasMore(response.next !== null);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
    } catch (err) {
      console.error('Error loading movies:', err);
      
      // Don't show error on screen if we already have content loaded
      // Just stop trying to load more
      if (isLoadingMore) {
        console.log('Error during load more, stopping infinite scroll');
        setHasMore(false);
        setLoadingMore(false);
      } else {
        setError('خطا در بارگذاری فیلم‌ها. لطفا دوباره تلاش کنید.');
        setLoading(false);
      }
      
      // In any error case, make sure loading states are reset
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter]);
  
  // Initial load and filter change
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setFocusedElement(null);
    
    // Start loading and set loading state
    setLoading(true);
    loadMovies(1);
  }, [activeFilter, loadMovies]);
  
  // A separate effect to handle focusing after loading completes
  useEffect(() => {
    // Only proceed if we were loading and now we're not
    if (!loading && focusedElement === null) {
      console.log(`Loading complete. Movies count: ${movies.length}`);
      
      // If we have content and this was a filter change (not initial load)
      if (movies.length > 0 && isFilterChange) {
        // Wait a bit longer to ensure the DOM is updated
        setTimeout(() => {
          console.log('Focusing first movie after filter change');
          focusMovie(0);
        }, 500);
      } else if (movies.length === 0 && isFilterChange) {
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
  }, [loading, movies.length, activeFilter, isFilterChange, error]);
  
  // When movies are loaded, update the refs array
  useEffect(() => {
    // Reset refs array to match new content
    movieRefs.current = Array(movies.length);
    
    // Log the state for debugging
    console.log(`Movies updated: ${movies.length} items, focused element: ${focusedElement}`);
  }, [movies]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        console.log('Loading more movies, currently at page', page);
        // Add a maximum page check to prevent excessive API calls
        if (page < 20) { // Limit to a reasonable number of pages
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
    
    if (lastMovieElementRef.current) {
      observer.current.observe(lastMovieElementRef.current);
    }
    
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, page]);
  
  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadMovies(page, true);
    }
  }, [page, loadMovies]);

  // Helper function to get position from index
  const getPositionFromIndex = (index: number) => {
    const row = Math.floor(index / moviesPerRow);
    const col = index % moviesPerRow;
    return { row, col };
  };
  
  // Helper function to get index from position
  const getIndexFromPosition = (row: number, col: number) => {
    // Ensure col is within bounds
    if (col < 0) col = 0;
    if (col >= moviesPerRow) col = moviesPerRow - 1;
    
    const index = row * moviesPerRow + col;
    // Ensure index is within bounds of available movies
    if (index >= movies.length) {
      return movies.length - 1;
    }
    return index;
  };
  
  // Helpers to focus elements
  const focusMovie = (index: number) => {
    if (index >= movies.length) index = movies.length - 1;
    if (index < 0) index = 0;
    
    setFocusedElement('movie');
    setFocusedIndex(index);
    
    setTimeout(() => {
      movieRefs.current[index]?.focus();
      
      // Scroll into view if needed
      if (movieRefs.current[index]) {
        const element = movieRefs.current[index];
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
          console.log('User explicitly moving from sidebar to movies content');
          // Coming from sidebar, focus the first movie or filter
          if (movies.length > 0) {
            focusMovie(0);
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
  }, [focusedElement, movies.length]);
  
  // Keyboard handling logic
  const handleLeftArrow = () => {
    if (focusedElement === 'filter') {
      if (focusedIndex < filterOptions.length - 1) {
        focusFilter(focusedIndex + 1);
      } else {
        // Last filter, move to first movie
        focusMovie(0);
      }
    } else if (focusedElement === 'movie') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (col < moviesPerRow - 1) {
        const nextIndex = getIndexFromPosition(row, col + 1);
        if (nextIndex < movies.length) {
          focusMovie(nextIndex);
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
    } else if (focusedElement === 'movie') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (col > 0) {
        focusMovie(getIndexFromPosition(row, col - 1));
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
    if (focusedElement === 'movie') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (row > 0) {
        // Move to the row above
        focusMovie(getIndexFromPosition(row - 1, col));
      } else {
        // First row, move to filters
        const filterIndex = Math.min(col, filterOptions.length - 1);
        focusFilter(filterIndex);
      }
    }
  };
  
  const handleDownArrow = () => {
    if (focusedElement === 'filter') {
      // Move from filters to movies
      const col = Math.min(focusedIndex, moviesPerRow - 1);
      focusMovie(getIndexFromPosition(0, col));
    } else if (focusedElement === 'movie') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      const nextRowIndex = getIndexFromPosition(row + 1, col);
      
      if (nextRowIndex < movies.length) {
        // Move to the row below
        focusMovie(nextRowIndex);
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
    } else if (focusedElement === 'movie') {
      // Navigate to movie details page
      const selectedMovie = movies[focusedIndex];
      if (selectedMovie && movieRefs.current[focusedIndex]) {
        // Use the native click event to trigger the Link navigation
        movieRefs.current[focusedIndex]?.click();
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
  if (loading && movies.length === 0) {
    return (
      <div className="main-content">
        <div className="movies-container">
          <h2>فیلم‌ها</h2>
          <div className="loading-container">در حال بارگذاری فیلم‌ها...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && movies.length === 0) {
    return (
      <div className="main-content">
        <div className="movies-container">
          <h2>فیلم‌ها</h2>
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
      <div className="movies-container">
        <h2>فیلم‌ها</h2>
        
        {/* Filter buttons */}
        <div className="movies-filter">
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
        
        {/* Movies grid */}
        <div 
          className="movies-grid" 
          ref={gridRef}
          style={{ 
            gridTemplateColumns: `repeat(var(--movies-per-row, ${moviesPerRow}), 1fr)`,
            gap: 'var(--grid-gap, 15px)',
            width: '100%',
            marginLeft: '0',
            paddingLeft: '0'
          }}
        >
          {movies.map((movie, index) => {
            const isLastMovie = index === movies.length - 1;
            
            return (
              <div 
                key={movie.id} 
                ref={isLastMovie ? lastMovieElementRef : null}
              >
                <MediaTile
                  id={movie.id}
                  type={movie.type?.toLowerCase()}
                  title={movie.caption}
                  poster={movie.imageUrl}
                  year={movie.year ? movie.year.toString() : ''}
                  rating={movie.imdb}
                  ref={(el) => { movieRefs.current[index] = el as HTMLAnchorElement; }}
                  className={`media-tile ${focusedElement === 'movie' && focusedIndex === index ? 'focused' : ''}`}
                  onFocus={() => focusMovie(index)}
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
            در حال بارگذاری فیلم‌های بیشتر...
          </div>
        )}
        
        {/* End of list message */}
        {!hasMore && movies.length > 0 && (
          <div className="end-of-list">
            پایان فهرست فیلم‌ها
          </div>
        )}
      </div>
    </div>
  );
}

export default MoviesPage;