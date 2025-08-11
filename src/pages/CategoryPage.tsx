import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import './CategoryPage.css';
import { fetchAllCategories, fetchMoviesByCategory, CategoryType, MovieType } from '../services/categoryApi';

interface CategoryPageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

// دسته‌بندی‌های محتوا بر اساس سایت نماوا
const contentCategories = [
  { id: 'all', label: 'همه' },
  { id: 'movie', label: 'فیلم‌های سینمایی' },
  { id: 'series', label: 'سریال‌ها' }
];

const CategoryPage = ({ onLeftArrowPress, onRightArrowPress }: CategoryPageProps) => {
  // State for VOD categories
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for movies/series in selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryMovies, setCategoryMovies] = useState<MovieType[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(false);
  
  // State for UI focus and navigation
  const [focusedSection, setFocusedSection] = useState<'main' | 'genre' | 'country' | 'content'>('main');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [activeMainCategory, setActiveMainCategory] = useState<string>('all');
  const [activeGenre, setActiveGenre] = useState<string>('all');
  const [activeCountry, setActiveCountry] = useState<string>('all');
  
  // Refs for focus management
  const mainCategoryRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const genreCategoryRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const countryCategoryRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const contentRefs = useRef<Array<HTMLDivElement | null>>([]);
  
  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchAllCategories();
        setCategories(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('خطا در دریافت دسته‌بندی‌ها. لطفا دوباره تلاش کنید.');
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);
  
  // Fetch movies when a category is selected
  useEffect(() => {
    if (selectedCategoryId === null) return;
    
    const loadCategoryMovies = async () => {
      try {
        setLoadingMovies(true);
        const data = await fetchMoviesByCategory(selectedCategoryId);
        setCategoryMovies(data.movies);
        setLoadingMovies(false);
      } catch (err) {
        console.error(`Error fetching movies for category ${selectedCategoryId}:`, err);
        setCategoryMovies([]);
        setLoadingMovies(false);
      }
    };
    
    loadCategoryMovies();
  }, [selectedCategoryId]);
  
  // Focus management functions
  const focusMainCategory = (index: number) => {
    if (index < 0 || index >= contentCategories.length) return;
    
    setFocusedSection('main');
    setFocusedIndex(index);
    
    setTimeout(() => {
      mainCategoryRefs.current[index]?.focus();
    }, 0);
  };
  
  const focusGenreCategory = (index: number) => {
    if (index < 0 || index >= categories.length + 1) return;
    
    setFocusedSection('genre');
    setFocusedIndex(index);
    
    setTimeout(() => {
      genreCategoryRefs.current[index]?.focus();
    }, 0);
  };
  
  const focusCountryCategory = (index: number) => {
    // This is preserved for compatibility but not used with the API approach
    setFocusedSection('country');
    setFocusedIndex(index);
    
    setTimeout(() => {
      countryCategoryRefs.current[index]?.focus();
    }, 0);
  };
  
  const focusContent = (index: number) => {
    if (index < 0 || index >= categoryMovies.length) return;
    
    setFocusedSection('content');
    setFocusedIndex(index);
    
    setTimeout(() => {
      contentRefs.current[index]?.focus();
    }, 0);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        handleRightArrow();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleLeftArrow();
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
  
  // Navigation functions
  const handleRightArrow = () => {
    if (focusedSection === 'main') {
      if (focusedIndex > 0) {
        focusMainCategory(focusedIndex - 1);
      } else {
        // اولین دکمه، رفتن به سایدبار
        if (onRightArrowPress) {
          onRightArrowPress();
        }
      }
    } else if (focusedSection === 'genre') {
      if (focusedIndex > 0) {
        focusGenreCategory(focusedIndex - 1);
      } else {
        focusMainCategory(0);
      }
    } else if (focusedSection === 'content') {
      const row = Math.floor(focusedIndex / 4);
      const col = focusedIndex % 4;
      
      if (col > 0) {
        focusContent(row * 4 + (col - 1));
      } else {
        // اولین آیتم در ردیف، رفتن به دسته‌بندی‌ها
        focusGenreCategory(0);
      }
    }
  };
  
  const handleLeftArrow = () => {
    if (focusedSection === 'main') {
      if (focusedIndex < contentCategories.length - 1) {
        focusMainCategory(focusedIndex + 1);
      } else {
        focusGenreCategory(0);
      }
    } else if (focusedSection === 'genre') {
      if (focusedIndex < categories.length) {
        focusGenreCategory(focusedIndex + 1);
      } else if (filteredMovies.length > 0) {
        focusContent(0);
      }
    } else if (focusedSection === 'content') {
      const row = Math.floor(focusedIndex / 4);
      const col = focusedIndex % 4;
      
      if (col < 3) {
        const nextIndex = row * 4 + (col + 1);
        if (nextIndex < filteredMovies.length) {
          focusContent(nextIndex);
        }
      }
    }
  };
  
  const handleUpArrow = () => {
    if (focusedSection === 'content') {
      const row = Math.floor(focusedIndex / 4);
      const col = focusedIndex % 4;
      
      if (row > 0) {
        // رفتن به ردیف بالاتر
        focusContent((row - 1) * 4 + col);
      } else {
        // اولین ردیف، رفتن به دسته‌بندی‌ها
        focusGenreCategory(0);
      }
    } else if (focusedSection === 'genre') {
      focusMainCategory(0);
    }
  };
  
  const handleDownArrow = () => {
    if (focusedSection === 'main') {
      focusGenreCategory(0);
    } else if (focusedSection === 'genre') {
      if (filteredMovies.length > 0) {
        focusContent(0);
      }
    } else if (focusedSection === 'content') {
      const row = Math.floor(focusedIndex / 4);
      const col = focusedIndex % 4;
      const nextRowIndex = (row + 1) * 4 + col;
      
      if (nextRowIndex < filteredMovies.length) {
        // رفتن به ردیف پایین‌تر
        focusContent(nextRowIndex);
      }
    }
  };
  
  const handleSelect = () => {
    if (focusedSection === 'main') {
      setActiveMainCategory(contentCategories[focusedIndex].id);
    } else if (focusedSection === 'genre') {
      if (focusedIndex === 0) {
        // All categories selected
        setActiveGenre('all');
        setSelectedCategoryId(null);
      } else {
        const selectedCategory = categories[focusedIndex - 1];
        setActiveGenre(selectedCategory.categorySlug);
        setSelectedCategoryId(selectedCategory.id);
      }
    } else if (focusedSection === 'content') {
      const selectedItem = filteredMovies[focusedIndex];
      // Navigate to detail page
      window.location.href = `/${selectedItem.type?.toLowerCase() === 'series' ? 'series' : 'movie'}/${selectedItem.id}`;
    }
  };
  
  // Filter movies by type if a main category is selected
  const filteredMovies = categoryMovies.filter(movie => {
    if (activeMainCategory === 'all') return true;
    if (activeMainCategory === 'movie') return movie.type?.toLowerCase() === 'movie';
    if (activeMainCategory === 'series') return movie.type?.toLowerCase() === 'series';
    return true;
  });
  
  // Return loading state if fetching categories
  if (loading) {
    return <div className="loading-container">در حال بارگذاری دسته‌بندی‌ها...</div>;
  }
  
  // Return error state if there was an error
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  return (
    <div className="category-page main-content">
      <div className="category-container">
        <h1 className="category-title">دسته‌بندی‌ها</h1>
        
        {/* دسته‌بندی اصلی */}
        <div className="category-section">
          <h2 className="category-section-title">نوع محتوا</h2>
          <div className="category-buttons">
            {contentCategories.map((category, index) => (
              <button
                key={category.id}
                ref={(el) => { mainCategoryRefs.current[index] = el; }}
                className={`category-button ${activeMainCategory === category.id ? 'active' : ''} ${focusedSection === 'main' && focusedIndex === index ? 'focused' : ''}`}
                onClick={() => {
                  setActiveMainCategory(category.id);
                  focusMainCategory(index);
                }}
                onFocus={() => focusMainCategory(index)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* دسته‌بندی ژانر (از API) */}
        <div className="category-section">
          <h2 className="category-section-title">ژانر</h2>
          <div className="category-buttons">
            <button
              ref={(el) => { genreCategoryRefs.current[0] = el; }}
              className={`category-button ${activeGenre === 'all' ? 'active' : ''} ${focusedSection === 'genre' && focusedIndex === 0 ? 'focused' : ''}`}
              onClick={() => {
                setActiveGenre('all');
                setSelectedCategoryId(null);
                focusGenreCategory(0);
              }}
              onFocus={() => focusGenreCategory(0)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              همه
            </button>
            {categories.map((category, index) => (
              <button
                key={category.id}
                ref={(el) => { genreCategoryRefs.current[index + 1] = el; }}
                className={`category-button ${selectedCategoryId === category.id ? 'active' : ''} ${focusedSection === 'genre' && focusedIndex === index + 1 ? 'focused' : ''}`}
                onClick={() => {
                  setActiveGenre(category.categorySlug);
                  setSelectedCategoryId(category.id);
                  focusGenreCategory(index + 1);
                }}
                onFocus={() => focusGenreCategory(index + 1)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                {category.categoryName}
              </button>
            ))}
          </div>
        </div>
        
        {/* نمایش محتوا */}
        <div className="category-content">
          <h2 className="category-content-title">
            {loadingMovies ? 'در حال بارگذاری...' : 
             selectedCategoryId ? `محتوای ${categories.find(c => c.id === selectedCategoryId)?.categoryName || ''}` : 
             'همه محتوا'}
          </h2>
          
          {loadingMovies ? (
            <div className="content-loading">در حال بارگذاری محتوا...</div>
          ) : filteredMovies.length > 0 ? (
            <div className="content-grid">
              {filteredMovies.map((item, index) => (
                <div
                  key={item.id}
                  ref={(el) => { contentRefs.current[index] = el; }}
                  className={`content-item ${focusedSection === 'content' && focusedIndex === index ? 'focused' : ''}`}
                  onClick={() => {
                    // Navigate to movie/series detail page
                    window.location.href = `/${item.type?.toLowerCase() === 'series' ? 'series' : 'movie'}/${item.id}`;
                  }}
                  onFocus={() => focusContent(index)}
                  onKeyDown={handleKeyDown}
                  tabIndex={0}
                >
                  <div className="content-poster">
                    <img src={item.coverPortrait || item.imageUrl} alt={item.caption} />
                    {item.type?.toLowerCase() === 'series' && (
                      <span className="content-type series">سریال</span>
                    )}
                    {item.type?.toLowerCase() === 'movie' && (
                      <span className="content-type movie">فیلم</span>
                    )}
                  </div>
                  <div className="content-details">
                    <h3 className="content-title">{item.caption}</h3>
                    <div className="content-meta">
                      {item.year && <span className="year">{item.year}</span>}
                      {item.imdb && <span className="imdb">{item.imdb} IMDB</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-content">
              {selectedCategoryId ? 'محتوایی در این دسته‌بندی یافت نشد.' : 'لطفا یک دسته‌بندی انتخاب کنید.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage; 