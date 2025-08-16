import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import './MovieDetail.css';
import { updateGridLayout } from '../utils/deviceScaling';
import { fetchMovieById, Movie } from '../services/api';
import ShakaPlayerSimple from '../components/ShakaPlayerSimple';

// Sample similar movies to display (this would ideally come from an API)
const similarMoviesSample: Array<{id: number; poster: string; title: string;}> = [];

// Helper function to get director and actors from cast array
const getDirectorAndActors = (movie: Movie) => {
  const director = movie.cast.find(c => c.castRole.toLowerCase().includes('director') || c.castRole.includes('کارگردان'));
  const actors = movie.cast.filter(c => c.castRole.toLowerCase().includes('actor') || c.castRole.includes('بازیگر'));
  
  return {
    director: director ? {
      name: director.castName,
      image: director.castImageUrl
    } : {
      name: 'نامشخص',
      image: 'https://via.placeholder.com/150'
    },
    actors
  };
};

// کامپوننت اصلی صفحه جزئیات فیلم
function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedElement, setFocusedElement] = useState<string>('play');
  const [focusedSimilarMovieIndex, setFocusedSimilarMovieIndex] = useState<number>(-1);
  const [showVideoPlayer, setShowVideoPlayer] = useState<boolean>(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  
  // Refs برای دسترسی به المان‌ها
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const aboutSectionRef = useRef<HTMLHeadingElement>(null);
  const crewSectionRef = useRef<HTMLHeadingElement>(null);
  const similarSectionRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const similarMovieRefs = useRef<Array<HTMLDivElement | null>>([]);
  
  // بدست آوردن اطلاعات فیلم با استفاده از id
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const loadMovieData = async () => {
      try {
        if (id) {
          const movieId = parseInt(id);
          
          // ابتدا بررسی کنیم آیا داده‌های کش شده داریم
          const cachedData = localStorage.getItem(`movie_${movieId}`);
          const cacheTimestamp = localStorage.getItem(`movie_${movieId}_timestamp`);
          const now = new Date().getTime();
          
          // اگر داده‌های کش شده موجود باشد و کمتر از 30 دقیقه از آخرین درخواست گذشته باشد
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 30 * 60 * 1000) {
            setMovie(JSON.parse(cachedData));
            setIsLoading(false);
            console.log('Using cached movie data');
            return;
          }
          
          // اگر داده‌های کش شده نداریم یا منقضی شده‌اند، از API بخوانیم
          const movieData = await fetchMovieById(movieId);
          
          if (movieData) {
            setMovie(movieData);
            // ذخیره داده‌ها در localStorage
            localStorage.setItem(`movie_${movieId}`, JSON.stringify(movieData));
            localStorage.setItem(`movie_${movieId}_timestamp`, now.toString());
          } else {
            setError('فیلم مورد نظر یافت نشد.');
          }
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('خطا در دریافت اطلاعات فیلم. لطفا دوباره تلاش کنید.');
        
        // در صورت خطا، از داده‌های کش شده استفاده کنید (اگر موجود باشند)
        if (id) {
          const cachedData = localStorage.getItem(`movie_${id}`);
          if (cachedData) {
            try {
              setMovie(JSON.parse(cachedData));
              setError(null); // حذف پیام خطا اگر داده‌های کش شده بارگذاری شدند
              console.log('Using cached movie data after error');
            } catch (cacheErr) {
              console.error('Error parsing cached movie data:', cacheErr);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMovieData();
    
    // تنظیم متغیرهای مقیاس
    updateGridLayout();
    
  }, [id]);

  // فوکوس اولیه روی دکمه پخش
  useEffect(() => {
    if (!isLoading && movie) {
      setTimeout(() => {
        if (playButtonRef.current) {
          playButtonRef.current.focus();
          setFocusedElement('play');
        }
      }, 100);
    }
  }, [isLoading, movie]);
  
  // انتقال فوکوس به عنصر مورد نظر
  const focusElement = (elementId: string, index: number = -1) => {
    setFocusedElement(elementId);
    
    if (elementId === 'similar' && index >= 0) {
      setFocusedSimilarMovieIndex(index);
      setTimeout(() => {
        similarMovieRefs.current[index]?.focus();
        similarMovieRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 10);
      return;
    } else {
      setFocusedSimilarMovieIndex(-1);
    }
    
    setTimeout(() => {
      switch (elementId) {
        case 'play':
          playButtonRef.current?.focus();
          break;
        case 'preview':
          previewButtonRef.current?.focus();
          break;
        case 'about':
          aboutSectionRef.current?.focus();
          aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'crew':
          crewSectionRef.current?.focus();
          crewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'similar':
          similarSectionRef.current?.focus();
          similarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'back':
          backButtonRef.current?.focus();
          break;
      }
    }, 10);
  };
  
  // کنترل کلیدهای جهت‌دار کیبرد
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // جلوگیری از اسکرول صفحه با کلیدهای جهت‌دار
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
    }
    
    switch (e.key) {
      case 'ArrowLeft':
        handleLeftArrowNavigation();
        break;
      case 'ArrowRight':
        handleRightArrowNavigation();
        break;
      case 'ArrowDown':
        handleDownArrowNavigation();
        break;
      case 'ArrowUp':
        handleUpArrowNavigation();
        break;
      case 'Escape':
        handleBackClick();
        break;
      case 'Enter':
      case ' ':
        handleEnterKey();
        break;
      case 'Tab':
        // اجازه دهید Tab به طور عادی کار کند اما focusedElement را به‌روز کنید
        setTimeout(() => {
          // پیدا کردن المان فعال در صفحه
          const activeElement = document.activeElement;
          
          if (activeElement === backButtonRef.current) {
            setFocusedElement('back');
          } else if (activeElement === playButtonRef.current) {
            setFocusedElement('play');
          } else if (activeElement === previewButtonRef.current) {
            setFocusedElement('preview');
          } else if (activeElement === aboutSectionRef.current) {
            setFocusedElement('about');
          } else if (activeElement === crewSectionRef.current) {
            setFocusedElement('crew');
          } else if (activeElement === similarSectionRef.current) {
            setFocusedElement('similar');
          }
        }, 10);
        break;
    }
  };
  
  // مدیریت کلید Enter
  const handleEnterKey = () => {
    switch (focusedElement) {
      case 'play':
        handlePlayClick();
        break;
      case 'preview':
        handlePreviewClick();
        break;
      case 'back':
        handleBackClick();
        break;
      case 'about':
      case 'crew':
        // اسکرول به بخش مربوطه
        document.getElementById(focusedElement)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'similar':
        if (focusedSimilarMovieIndex >= 0 && focusedSimilarMovieIndex < similarMoviesSample.length) {
          handleSimilarMovieClick(similarMoviesSample[focusedSimilarMovieIndex].id);
        } else {
          // اسکرول به بخش مربوطه
          document.getElementById(focusedElement)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
    }
  };
  
  // مدیریت جهت‌های مختلف ناوبری با کیبرد
  const handleLeftArrowNavigation = () => {
    switch (focusedElement) {
      case 'play':
        focusElement('preview');
        break;
      case 'preview':
        focusElement('back');
        break;
      case 'back':
        // در انتهای بخش دکمه‌ها، باقی می‌ماند
        break;
      case 'about':
        // از بخش درباره به بخش عوامل
        focusElement('crew');
        break;
      case 'crew':
        // از بخش عوامل به بخش فیلم‌های مشابه
        focusElement('similar');
        break;
      case 'similar':
        if (focusedSimilarMovieIndex > 0) {
          // اگر روی یک فیلم مشابه هستیم، به فیلم قبلی برویم
          focusElement('similar', focusedSimilarMovieIndex - 1);
        } else if (focusedSimilarMovieIndex === 0) {
          // اگر روی اولین فیلم مشابه هستیم، به تیتر برویم
          setFocusedSimilarMovieIndex(-1);
          similarSectionRef.current?.focus();
        } else {
          // از بخش فیلم‌های مشابه به بخش درباره
          focusElement('about');
        }
        break;
    }
  };
  
  const handleRightArrowNavigation = () => {
    switch (focusedElement) {
      case 'back':
        focusElement('preview');
        break;
      case 'preview':
        focusElement('play');
        break;
      case 'play':
        // در دکمه پخش، باقی می‌ماند
        break;
      case 'about':
        // از بخش درباره به بخش فیلم‌های مشابه
        focusElement('similar');
        break;
      case 'crew':
        // از بخش عوامل به بخش درباره
        focusElement('about');
        break;
      case 'similar':
        if (focusedSimilarMovieIndex >= 0) {
          // اگر روی یک فیلم مشابه هستیم، به فیلم بعدی برویم
          const nextIndex = Math.min(focusedSimilarMovieIndex + 1, similarMoviesSample.length - 1);
          focusElement('similar', nextIndex);
        } else {
          // از بخش فیلم‌های مشابه به بخش عوامل
          focusElement('crew');
        }
        break;
    }
  };
  
  const handleDownArrowNavigation = () => {
    switch (focusedElement) {
      case 'play':
      case 'preview':
        // از دکمه‌های پخش و پیش‌نمایش به بخش درباره
        focusElement('about');
        break;
      case 'back':
        // از دکمه بازگشت به دکمه پخش فیلم
        focusElement('play');
        break;
      case 'about':
        // از بخش درباره به بخش عوامل
        focusElement('crew');
        break;
      case 'crew':
        // از بخش عوامل به بخش فیلم‌های مشابه
        focusElement('similar');
        break;
      case 'similar':
        if (focusedSimilarMovieIndex < 0 && similarMoviesSample.length > 0) {
          // اگر روی تیتر فیلم‌های مشابه هستیم، به اولین فیلم برویم
          focusElement('similar', 0);
        }
        // در بخش فیلم‌های مشابه، باقی می‌ماند
        break;
    }
  };
  
  const handleUpArrowNavigation = () => {
    switch (focusedElement) {
      case 'about':
        // از بخش درباره به دکمه‌های بالایی
        focusElement('play');
        break;
      case 'crew':
        // از بخش عوامل به بخش درباره
        focusElement('about');
        break;
      case 'similar':
        // از بخش فیلم‌های مشابه به بخش عوامل
        focusElement('crew');
        break;
      case 'play':
        // از دکمه پخش به دکمه بازگشت
        focusElement('back');
        break;
      case 'preview':
        // از دکمه پیش‌نمایش به دکمه بازگشت
        focusElement('back');
        break;
      case 'back':
        // در دکمه بازگشت، باقی می‌ماند
        break;
    }
  };
  
  const handlePlayClick = () => {
    if (movie?.streamingUrl) {
      console.log('پخش فیلم:', movie.caption);
      setCurrentVideoUrl(movie.streamingUrl);
      setCurrentVideoTitle(movie.caption);
      setShowVideoPlayer(true);
    } else {
      console.log('لینک پخش موجود نیست');
      // Could show a notification to the user
    }
  };
  
  const handlePreviewClick = () => {
    if (movie?.trailerVideoUrl) {
      console.log('پخش پیش‌نمایش:', movie.caption);
      setCurrentVideoUrl(movie.trailerVideoUrl);
      setCurrentVideoTitle(`پیش‌نمایش ${movie.caption}`);
      setShowVideoPlayer(true);
    } else {
      console.log('لینک پیش‌نمایش موجود نیست');
      // Could show a notification to the user
    }
  };
  
  const handleCloseVideo = () => {
    setShowVideoPlayer(false);
    // Return focus to appropriate button
    if (currentVideoUrl === movie?.streamingUrl) {
      setTimeout(() => playButtonRef.current?.focus(), 100);
    } else {
      setTimeout(() => previewButtonRef.current?.focus(), 100);
    }
  };
  
  const handleBackClick = () => {
    navigate('/movies');
  };
  
  const handleSectionClick = (sectionId: string) => {
    focusElement(sectionId);
  };
  
  const handleSimilarMovieClick = (movieId: number) => {
    navigate(`/movies/${movieId}`);
  };
  
  // نمایش صفحه بارگذاری
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }
  
  // اگر فیلم پیدا نشد
  if (!movie) {
    return (
      <div className="error-container">
        <h2>فیلم مورد نظر یافت نشد!</h2>
        <button className="back-button" onClick={handleBackClick}>بازگشت به صفحه فیلم‌ها</button>
      </div>
    );
  }

  // تنظیم آرایه‌ی رفرنس‌ها برای فیلم‌های مشابه
  similarMovieRefs.current = Array(similarMoviesSample.length).fill(null);
  
  // Extract director and actors from cast array
  const { director, actors } = movie ? getDirectorAndActors(movie) : { director: null, actors: [] };

  return (
    <div 
      className="movie-detail-page" 
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      ref={containerRef}
    >
      {/* بخش بنر و اطلاعات اصلی */}
      <div className="movie-detail-banner">
        <img src={movie.coverLandscape || movie.imageUrl} alt={movie.caption} className="banner-image" />
        <div className="banner-overlay"></div>
        
        <button 
          ref={backButtonRef}
          className={`back-button ${focusedElement === 'back' ? 'focused' : ''}`}
          onClick={handleBackClick}
          aria-label="بازگشت"
        ></button>
        
        <div className="banner-info">
          <div className="banner-info-top">
            <h1>{movie.caption}</h1>
            <div className="movie-meta">
              <span>{movie.year}</span>
              {movie.imdb && <span><span className="rating-star">★</span> {movie.imdb}</span>}
              {movie.mediaDuration && <span>{Math.floor(movie.mediaDuration / 60)} دقیقه</span>}
              {movie.ageRange && movie.ageRange.length > 0 && <span className="age-rating">+{movie.ageRange[0].value}</span>}
            </div>
            <div className="movie-genre">
              {movie.category && movie.category.map((cat, idx) => (
                <span key={cat.id}>{cat.categoryName}{idx < movie.category.length - 1 ? '، ' : ''}</span>
              ))}
            </div>
          </div>
          
          <div className="banner-buttons">
            <button 
              ref={playButtonRef}
              className={`play-button ${focusedElement === 'play' ? 'focused' : ''}`}
              onClick={handlePlayClick}
            >
              پخش فیلم
            </button>
            <button 
              ref={previewButtonRef}
              className={`preview-button ${focusedElement === 'preview' ? 'focused' : ''}`}
              onClick={handlePreviewClick}
            >
              پیش‌نمایش
            </button>
          </div>
        </div>
      </div>
      
      {/* بخش اطلاعات تفصیلی */}
      <div className="movie-detail-info">
        {/* بخش درباره فیلم */}
        <div id="about" className="detail-section">
          <h2 
            ref={aboutSectionRef}
            className={focusedElement === 'about' ? 'focused' : ''}
            onClick={() => handleSectionClick('about')}
            tabIndex={0}
          >
            درباره فیلم
          </h2>
          <div className="movie-about">
            <p>{movie.about || movie.shortdescription || movie.fullDescription}</p>
          </div>
        </div>
        
        {/* بخش عوامل فیلم */}
        {movie.cast && movie.cast.length > 0 && (
          <div id="crew" className="detail-section">
            <h2 
              ref={crewSectionRef}
              className={focusedElement === 'crew' ? 'focused' : ''}
              onClick={() => handleSectionClick('crew')}
              tabIndex={0}
            >
              عوامل فیلم
            </h2>
            <div className="movie-crew">
              {/* کارگردان */}
              {director && (
                <div className="crew-member">
                  <div className="crew-image-container">
                    <img src={director.image} alt={director.name} className="crew-image" />
                  </div>
                  <div className="crew-info">
                    <div className="crew-name">{director.name}</div>
                    <div className="crew-role">کارگردان</div>
                  </div>
                </div>
              )}
              
              {/* بازیگران */}
              {actors.map((actor, index) => (
                <div key={actor.id} className="crew-member">
                  <div className="crew-image-container">
                    <img src={actor.castImageUrl} alt={actor.castName} className="crew-image" />
                  </div>
                  <div className="crew-info">
                    <div className="crew-name">{actor.castName}</div>
                    <div className="crew-role">{actor.castRole}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* بخش فیلم‌های مشابه */}
        <div id="similar" className="detail-section">
          <h2 
            ref={similarSectionRef}
            className={focusedElement === 'similar' && focusedSimilarMovieIndex < 0 ? 'focused' : ''}
            onClick={() => handleSectionClick('similar')}
            tabIndex={0}
          >
            فیلم‌های مشابه
          </h2>
          <div className="similar-movies">
            {/* نمونه‌های فیلم مشابه */}
            {similarMoviesSample.map((similarMovie, index) => (
              <div 
                key={similarMovie.id}
                ref={(el) => { similarMovieRefs.current[index] = el; }}
                className={`similar-movie-tile ${focusedElement === 'similar' && focusedSimilarMovieIndex === index ? 'focused' : ''}`}
                onClick={() => handleSimilarMovieClick(similarMovie.id)}
                onFocus={() => {
                  setFocusedElement('similar');
                  setFocusedSimilarMovieIndex(index);
                }}
                tabIndex={0}
              >
                <img src={similarMovie.poster} alt={similarMovie.title} />
                <p>{similarMovie.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video player */}
      {showVideoPlayer && (
        <ShakaPlayerSimple
          url={currentVideoUrl}
          title={currentVideoTitle}
          onClose={handleCloseVideo}
          autoPlay={true}
        />
      )}
    </div>
  );
}

export default MovieDetail;