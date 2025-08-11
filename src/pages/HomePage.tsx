import React, { useRef, useEffect, useState } from 'react';
import '../App.css';
import './HomePage.css';
import MediaTile from '../components/MediaTile';
import MediaSlider, { MediaSliderHandles } from '../components/MediaSlider';
import { fetchLatestMoviesSeries } from '../services/api';
import { fetchFeaturedTVChannels, TVChannelType } from '../services/tvChannelApi';

// Define MovieType interface directly in HomePage to avoid import issues
interface MovieType {
  id: number;
  caption: string;
  movieLatinName: string;
  type: string;
  year: number;
  imdb: string;
  shortdescription: string;
  fullDescription: string;
  story: string;
  about: string;
  mediaDuration: number;
  imageUrl: string;
  coverLandscape: string;
  coverPortrait: string;
  logoImageUrl: string;
  trailerImageUrl: string;
  trailerVideoUrl: string;
  streamingUrl: string;
  publishDate: string;
  seasonCount: number | null;
  seriesStatus: string | null;
  episodeReleaseTime: string | null;
  cast: any[];
  category: any[];
  voiceList: any[];
  subtitleList: any[];
  ageRange: any[];
  slideImageList: any[];
}

// Import TV channel logos
import tv1Logo from '../image/logo/1.png';
import tv2Logo from '../image/logo/2.png';
import tv3Logo from '../image/logo/3.png';
import tv4Logo from '../image/logo/4.png';
import newsLogo from '../image/logo/خبر.png';
import documentaryLogo from '../image/logo/مستند.png';
import quranLogo from '../image/logo/قران.png';
import ifilmLogo from '../image/logo/ایفیلم.png';
import pouyaLogo from '../image/logo/پویا.png';
import namaeshLogo from '../image/logo/نمایش.png';

interface HomePageProps {
  onLeftArrowPress: () => void;
  onRightArrowPress: () => void;
}

function HomePage({ onLeftArrowPress, onRightArrowPress }: HomePageProps) {
  const [latestMovies, setLatestMovies] = useState<MovieType[]>([]);
  const [latestSeries, setLatestSeries] = useState<MovieType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sliderMedia, setSliderMedia] = useState<any[]>([]);
  const [liveChannels, setLiveChannels] = useState<TVChannelType[]>([]);
  const sliderRef = useRef<MediaSliderHandles>(null);

  // Handle left arrow press from sidebar
  const handleSliderNavigation = () => {
    // Navigate from sidebar to play button
    sliderRef.current?.handleLeftArrowFromHome();
  };

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // بررسی وجود داده‌های کش شده
        const cachedData = localStorage.getItem('homePageData');
        const cacheTimestamp = localStorage.getItem('homePageDataTimestamp');
        const now = new Date().getTime();
        
        // اگر داده‌های کش شده موجود باشد و کمتر از 30 دقیقه از آخرین درخواست گذشته باشد
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 30 * 60 * 1000) {
          const parsedData = JSON.parse(cachedData);
          setLatestMovies(parsedData.latestMovies);
          setLatestSeries(parsedData.latestSeries);
          setSliderMedia(parsedData.sliderMedia);
          setLiveChannels(parsedData.liveChannels);
          setLoading(false);
          console.log('Using cached data');
          return;
        }
        
        // Fetch movie and series data
        const moviesData = await fetchLatestMoviesSeries();
        
        setLatestMovies(moviesData.latest_movies);
        setLatestSeries(moviesData.latest_series);
        
        // Prepare slider data - 5 latest movies and 5 latest series
        const sliderItems = [
          ...moviesData.latest_movies.slice(0, 5).map(movie => ({
            id: movie.id,
            title: movie.caption,
            imageUrl: movie.coverLandscape,
            rating: `${movie.imdb} IMDb`,
            duration: movie.mediaDuration ? `${movie.mediaDuration} دقیقه` : '',
            year: movie.year ? `${movie.year}` : '',
            ageRating: movie.ageRange && movie.ageRange.length > 0 ? `+${movie.ageRange[0].value}` : '',
            type: 'movie',
            story: movie.story || movie.shortdescription,
            trailerVideoUrl: movie.trailerVideoUrl,
            streamingUrl: movie.streamingUrl,
          })),
          ...moviesData.latest_series.slice(0, 5).map(series => ({
            id: series.id,
            title: series.caption,
            imageUrl: series.coverLandscape,
            rating: `${series.imdb} IMDb`,
            duration: series.mediaDuration ? `${series.mediaDuration} دقیقه` : '',
            year: series.year ? `${series.year}` : '',
            ageRating: series.ageRange && series.ageRange.length > 0 ? `+${series.ageRange[0].value}` : '',
            type: 'series',
            story: series.story || series.shortdescription,
            trailerVideoUrl: series.trailerVideoUrl,
            streamingUrl: series.streamingUrl,
          }))
        ];
        
        setSliderMedia(sliderItems);
        
        // Fetch TV channel data
        const channelsData = await fetchFeaturedTVChannels();
        setLiveChannels(channelsData);
        
        // ذخیره داده‌ها در localStorage
        const dataToCache = {
          latestMovies: moviesData.latest_movies,
          latestSeries: moviesData.latest_series,
          sliderMedia: sliderItems,
          liveChannels: channelsData
        };
        
        localStorage.setItem('homePageData', JSON.stringify(dataToCache));
        localStorage.setItem('homePageDataTimestamp', now.toString());
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('خطا در دریافت اطلاعات. لطفا دوباره تلاش کنید.');
        setLoading(false);
        
        // در صورت خطا، از داده‌های کش شده استفاده کنید (اگر موجود باشند)
        const cachedData = localStorage.getItem('homePageData');
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            setLatestMovies(parsedData.latestMovies);
            setLatestSeries(parsedData.latestSeries);
            setSliderMedia(parsedData.sliderMedia);
            setLiveChannels(parsedData.liveChannels);
            setError(null); // حذف پیام خطا اگر داده‌های کش شده بارگذاری شدند
            console.log('Using cached data after error');
          } catch (cacheErr) {
            console.error('Error parsing cached data:', cacheErr);
          }
        }
      }
    };

    loadData();
  }, []);

  // Convert TV channels to tile format
  const liveChannelMedia = liveChannels.map(channel => ({
    id: channel.id,
    title: channel.name,
    poster: channel.logo || '', // Change imageUrl to poster
    streamUrl: channel.stream_url,
    isLive: true // Add isLive property
  }));

  // Convert API data to tile format
  const moviesForTiles = latestMovies.map(movie => ({
    id: movie.id,
    title: movie.caption,
    poster: movie.imageUrl,
    year: movie.year ? `${movie.year}` : '',
    rating: movie.imdb ? `${movie.imdb} IMDb` : '',
    linkPrefix: 'movie'
  }));

  const seriesForTiles = latestSeries.map(series => ({
    id: series.id,
    title: series.caption,
    poster: series.imageUrl,
    year: series.year ? `${series.year}` : '',
    rating: series.imdb ? `${series.imdb} IMDb` : '',
    linkPrefix: 'series'
  }));

  // React refs and states for navigation
  const tileRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [focusedTileIndex, setFocusedTileIndex] = useState<number | null>(null);
  const [actualTilesPerRow, setActualTilesPerRow] = useState([6, 6, 6]); // Tiles per row for each row
  const [isKeyHandlingEnabled, setIsKeyHandlingEnabled] = useState<boolean>(true);
  const [tileHasFocus, setTileHasFocus] = useState<boolean>(false);

  // Calculate the actual number of tiles per row after render
  useEffect(() => {
    const calculateActualTilesPerRow = () => {
      // Get the CSS variable or set default values based on screen width
      let tilesPerRow = 6; // Default for large screens
      
      if (window.innerWidth <= 576) {
        tilesPerRow = 2; // Small mobile screens
      } else if (window.innerWidth <= 768) {
        tilesPerRow = 3; // Larger mobile & small tablets
      } else if (window.innerWidth <= 992) {
        tilesPerRow = 4; // Tablets and small desktops
      } else if (window.innerWidth <= 1200) {
        tilesPerRow = 5; // Medium desktops
      } else {
        tilesPerRow = 6; // Large desktops
      }
      
      // Update CSS variable
      document.documentElement.style.setProperty('--movies-per-row', tilesPerRow.toString());
      
      // Set a reasonable grid gap based on screen size
      const gridGap = window.innerWidth <= 768 ? '10px' : '15px';
      document.documentElement.style.setProperty('--grid-gap', gridGap);
      
      // Update state
      setActualTilesPerRow([tilesPerRow, tilesPerRow, tilesPerRow]);
    };

    calculateActualTilesPerRow();
    window.addEventListener('resize', calculateActualTilesPerRow);

    return () => {
      window.removeEventListener('resize', calculateActualTilesPerRow);
    };
  }, []);

  // Handle focus events for tiles
  const handleTileFocus = (index: number) => {
    setFocusedTileIndex(index);
    setTileHasFocus(true);
  };

  // Refs for each row container
  const moviesRowRef = useRef<HTMLDivElement>(null);
  const seriesRowRef = useRef<HTMLDivElement>(null);
  const channelsRowRef = useRef<HTMLDivElement>(null);

  // Function to handle smooth scrolling when navigating
  const scrollRowToTile = (container: HTMLDivElement, tileIndex: number, totalInRow: number) => {
    const tileElements = container.querySelectorAll('.media-tile-wrapper');
    if (tileIndex >= 0 && tileIndex < tileElements.length) {
      const tileElement = tileElements[tileIndex] as HTMLElement;
      
      // Calculate scroll position - center the tile in the container
      const containerWidth = container.clientWidth;
      const tileLeft = tileElement.offsetLeft;
      const tileWidth = tileElement.clientWidth;
      
      // For RTL, we need to adjust the scroll logic
      const scrollPosition = tileLeft - (containerWidth / 2) + (tileWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleTileKeyDown = (e: React.KeyboardEvent<Element>, index: number) => {
    // Prevent double-firing
    if (!isKeyHandlingEnabled) {
      e.preventDefault();
      return;
    }

    // Set focus state when key is pressed
    setTileHasFocus(true);

    // In horizontal scroll layout, determine which row we're in
    let currentRow = 0;
    const moviesCount = moviesForTiles.length;
    const seriesCount = seriesForTiles.length;
    
    if (index < moviesCount) {
      currentRow = 0; // First row (movies)
    } else if (index < moviesCount + seriesCount) {
      currentRow = 1; // Second row (series)
    } else {
      currentRow = 2; // Third row (TV channels)
    }

    // ایجاد تابع کمکی برای تشخیص اینکه آیا در انتهای سمت راست ردیف هستیم یا خیر
    const isFirstInRow = () => {
      if (currentRow === 0) {
        return index === 0;
      } else if (currentRow === 1) {
        return index === moviesCount;
      } else {
        return index === moviesCount + seriesCount;
      }
    };

    // ایجاد تابع کمکی برای تشخیص اینکه آیا در انتهای سمت چپ ردیف هستیم یا خیر
    const isLastInRow = () => {
      if (currentRow === 0) {
        return index === moviesCount - 1;
      } else if (currentRow === 1) {
        return index === moviesCount + seriesCount - 1;
      } else {
        return index === moviesCount + seriesCount + liveChannelMedia.length - 1;
      }
    };

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        // In RTL, left arrow moves to the next tile (to the left)
        const nextIndex = index + 1;
        
        // اول بررسی می‌کنیم که آیا در انتهای سمت چپ ردیف هستیم یا خیر
        if (isLastInRow()) {
          // اگر در انتهای سمت چپ هستیم، کاری انجام نمی‌دهیم و اجازه می‌دهیم فوکوس همانجا بماند
          return;
        }
        
        // Check if we're still within the current row
        if ((currentRow === 0 && nextIndex < moviesCount) ||
            (currentRow === 1 && nextIndex < moviesCount + seriesCount) ||
            (currentRow === 2 && nextIndex < moviesCount + seriesCount + liveChannelMedia.length)) {
            tileRefs.current[nextIndex]?.focus();
            setFocusedTileIndex(nextIndex);
          
          // Scroll to the focused tile
          if (currentRow === 0 && moviesRowRef.current) {
            scrollRowToTile(moviesRowRef.current, nextIndex, moviesCount);
          } else if (currentRow === 1 && seriesRowRef.current) {
            scrollRowToTile(seriesRowRef.current, nextIndex - moviesCount, seriesCount);
          } else if (currentRow === 2 && channelsRowRef.current) {
            scrollRowToTile(channelsRowRef.current, nextIndex - moviesCount - seriesCount, liveChannelMedia.length);
          }
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        
        // اگر در اولین تایل سمت راست هستیم، به sidebar برمی‌گردیم
        if (isFirstInRow()) {
          onRightArrowPress();
          return;
        }
        
        // Otherwise move to the previous (right) tile
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          tileRefs.current[prevIndex]?.focus();
          setFocusedTileIndex(prevIndex);
          
          // Scroll to the focused tile
          if (currentRow === 0 && moviesRowRef.current) {
            scrollRowToTile(moviesRowRef.current, prevIndex, moviesCount);
          } else if (currentRow === 1 && seriesRowRef.current) {
            scrollRowToTile(seriesRowRef.current, prevIndex - moviesCount, seriesCount);
          } else if (currentRow === 2 && channelsRowRef.current) {
            scrollRowToTile(channelsRowRef.current, prevIndex - moviesCount - seriesCount, liveChannelMedia.length);
          }
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (currentRow === 0) {
          // If in first row, move focus to play button
          const playButton = document.querySelector('.play-button');
          if (playButton instanceof HTMLElement) {
            playButton.focus();
          }
        } else if (currentRow === 1) {
          // Move to same position in movies row
          const relativePosition = index - moviesCount;
          const targetIndex = Math.min(relativePosition, moviesCount - 1);
          tileRefs.current[targetIndex]?.focus();
          setFocusedTileIndex(targetIndex);
        } else if (currentRow === 2) {
          // Move to same position in series row
          const relativePosition = index - (moviesCount + seriesCount);
          const targetIndex = Math.min(relativePosition, seriesCount - 1) + moviesCount;
          tileRefs.current[targetIndex]?.focus();
          setFocusedTileIndex(targetIndex);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (currentRow === 0) {
          // Move from movies to series
          const targetIndex = Math.min(index, seriesCount - 1) + moviesCount;
          tileRefs.current[targetIndex]?.focus();
          setFocusedTileIndex(targetIndex);
        } else if (currentRow === 1) {
          // Move from series to channels
          const relativePosition = index - moviesCount;
          const targetIndex = Math.min(relativePosition, liveChannelMedia.length - 1) + moviesCount + seriesCount;
          tileRefs.current[targetIndex]?.focus();
          setFocusedTileIndex(targetIndex);
        }
        break;
    }
    
    // Debounce - کاهش زمان debounce برای پاسخگویی سریع‌تر
    setIsKeyHandlingEnabled(false);
    setTimeout(() => setIsKeyHandlingEnabled(true), 100);
  };

  return (
    <div className="main-content home-container">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">در حال بارگذاری محتوا...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="slider-section">
        <MediaSlider 
          items={sliderMedia} 
          onRightArrowPress={onRightArrowPress}
              onLeftArrowPress={handleSliderNavigation}
              ref={sliderRef}
        />
      </div>

          <h2>جدیدترین فیلم‌ها</h2>
          <div className="media-tiles-container" ref={moviesRowRef}>
            {moviesForTiles.map((media, index) => (
              <div className="media-tile-wrapper" key={`movie-${media.id}`}>
          <MediaTile
                  id={media.id}
            title={media.title}
                  poster={media.poster}
                  year={media.year}
                  rating={media.rating}
                  linkPrefix={media.linkPrefix}
                  ref={el => { tileRefs.current[index] = el; }}
                  onKeyDown={e => handleTileKeyDown(e, index)}
            onFocus={() => handleTileFocus(index)}
                  className={focusedTileIndex === index && tileHasFocus ? 'focused' : ''}
          />
              </div>
        ))}
      </div>

          <h2>جدیدترین سریال‌ها</h2>
          <div className="media-tiles-container" ref={seriesRowRef}>
            {seriesForTiles.map((media, index) => (
              <div className="media-tile-wrapper" key={`series-${media.id}`}>
          <MediaTile
                  id={media.id}
            title={media.title}
                  poster={media.poster}
                  year={media.year}
                  rating={media.rating}
                  linkPrefix={media.linkPrefix}
                  ref={el => { tileRefs.current[moviesForTiles.length + index] = el; }}
                  onKeyDown={e => handleTileKeyDown(e, moviesForTiles.length + index)}
                  onFocus={() => handleTileFocus(moviesForTiles.length + index)}
                  className={focusedTileIndex === (moviesForTiles.length + index) && tileHasFocus ? 'focused' : ''}
                />
              </div>
        ))}
      </div>

          <h2>شبکه‌های تلویزیونی زنده</h2>
          <div className="media-tiles-container" ref={channelsRowRef}>
            {liveChannelMedia.map((channel, index) => {
              const tileIndex = index + moviesForTiles.length + seriesForTiles.length;
              return (
                <div className="media-tile-wrapper" key={channel.id}>
                  <a
                    className={`media-tile ${focusedTileIndex === tileIndex ? 'focused' : ''}`}
                    href={channel.streamUrl}
                    ref={el => { tileRefs.current[tileIndex] = el; }}
                    onFocus={() => handleTileFocus(tileIndex)}
                    onKeyDown={e => handleTileKeyDown(e, tileIndex)}
                    tabIndex={0}
                  >
                    <div className="media-tile-inner">
                      <img 
                        src={channel.poster} 
                        alt={channel.title} 
                      />
                      {channel.isLive && <span className="live-indicator">زنده</span>}
                      <div className="media-info">
                        <p className="media-title">{channel.title}</p>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
      </div>
        </>
      )}
    </div>
  );
}

export default HomePage; 