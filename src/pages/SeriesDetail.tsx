import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import './SeriesDetail.css';
import { fetchContentById } from '../services/api';
import { updateGridLayout } from '../utils/deviceScaling';
import ShakaPlayerSimple from '../components/ShakaPlayerSimple';
import axios from 'axios';

// Define interfaces for API data
interface Episode {
  id: number;
  episodeId: number;
  episodeCaption: string;
  episodeSlug: string | null;
  episodeImageUrl: string | null;
  episodeCoverImage: string | null;
  episodeShortDescription: string;
  episodeOrderId: number;
  episodeSlideImageList: {
    id: number;
    title: string | null;
    type: string | null;
    url: string;
    link: string | null;
  }[];
  streamingUrl: string | null;
  mediaDuration: number | null;
}

interface Season {
  id: number;
  seasonId: number;
  seasonName: string;
  seasonCaption: string;
  episodes: Episode[];
}

interface Series {
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
  mediaDuration: number | null;
  imageUrl: string;
  coverLandscape: string;
  coverPortrait: string;
  logoImageUrl: string;
  trailerImageUrl: string;
  trailerVideoUrl: string;
  streamingUrl: string | null;
  publishDate: string;
  seasonCount: number;
  seriesStatus: string | null;
  episodeReleaseTime: string | null;
  cast: {
    id: number;
    castName: string;
    castRole: string;
    castSlug: string | null;
    castImageUrl: string;
  }[];
  category: {
    id: number;
    categoryName: string;
    categorySlug: string;
  }[];
  seasons: Season[];
  ageRange: {
    id: number;
    caption: string;
    value: number;
    isKid: boolean;
  }[];
}

// Helper function to get director and actors from cast array
const getDirectorAndActors = (series: Series) => {
  if (!series || !series.cast) return { director: null, actors: [] };
  
  const director = series.cast.find(c => 
    c.castRole.toLowerCase().includes('director') || 
    c.castRole.includes('کارگردان')
  );
  
  const actors = series.cast.filter(c => 
    c.castRole.toLowerCase().includes('actor') || 
    c.castRole.includes('بازیگر')
  );
  
  return {
    director: director ? {
      id: director.id,
      name: director.castName,
      image: director.castImageUrl
    } : null,
    actors
  };
};

// Calculate grid dimensions for keyboard navigation
const calculateGridDimensions = (totalItems: number, containerWidth: number, itemWidth: number) => {
  const columns = Math.max(1, Math.floor(containerWidth / itemWidth));
  const rows = Math.ceil(totalItems / columns);
  return { rows, columns };
};

// Convert 1D index to 2D grid position
const indexToGridPosition = (index: number, columns: number) => {
  const row = Math.floor(index / columns);
  const col = index % columns;
  return { row, col };
};

// Convert 2D grid position to 1D index
const gridPositionToIndex = (row: number, col: number, columns: number, totalItems: number) => {
  const index = row * columns + col;
  return index < totalItems ? index : totalItems - 1;
};

// Helper to ensure element is visible in viewport
const ensureElementInView = (element: HTMLElement | null) => {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const isInView = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
  
  if (!isInView) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
};

// کامپوننت اصلی صفحه جزئیات سریال
function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedElement, setFocusedElement] = useState<string>('episodes');
  const [activeSeason, setActiveSeason] = useState<number>(0);
  const [focusedSeason, setFocusedSeason] = useState<number>(0);
  const [focusedEpisode, setFocusedEpisode] = useState<number>(0);
  const [episodeDetails, setEpisodeDetails] = useState<any | null>(null);
  const [gridDimensions, setGridDimensions] = useState({ rows: 1, columns: 3 });
  const [showVideoPlayer, setShowVideoPlayer] = useState<boolean>(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  
  // Refs برای دسترسی به المان‌ها
  const episodesButtonRef = useRef<HTMLButtonElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const aboutSectionRef = useRef<HTMLHeadingElement>(null);
  const crewSectionRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const episodesListRef = useRef<HTMLDivElement>(null);
  const seasonTabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const episodeItemsRef = useRef<Array<HTMLDivElement | null>>([]);
  
  // بدست آوردن اطلاعات سریال با استفاده از id
  useEffect(() => {
    const fetchSeriesData = async () => {
      if (!id) return;
      
    setIsLoading(true);
      setError(null);
    
      try {
        const seriesId = parseInt(id);
        const data = await fetchContentById(seriesId);
        
        // Check if it's actually a series
        if (data && data.type === 'Series') {
          setSeries(data);
        } else {
          // If it's not a series, navigate back
          setError('این محتوا یک سریال نیست');
          setTimeout(() => navigate('/series'), 2000);
        }
      } catch (err) {
        console.error('Error fetching series:', err);
        setError('خطا در بارگذاری اطلاعات سریال');
      } finally {
        setIsLoading(false);
      }
    };
      
    fetchSeriesData();
  }, [id, navigate]);

  // فوکوس اولیه روی دکمه قسمت‌ها
  useEffect(() => {
    if (!isLoading && series) {
      setTimeout(() => {
        if (episodesButtonRef.current) {
          episodesButtonRef.current.focus();
          setFocusedElement('episodes');
        }
      }, 100);
    }
  }, [isLoading, series]);
  
  // Update grid dimensions whenever episodes list changes
  useEffect(() => {
    if (series && episodesListRef.current) {
      const updateGrid = () => {
        const containerWidth = episodesListRef.current?.clientWidth || 0;
        const itemWidth = 320; // Approximate item width including gap
        const episodes = series.seasons[activeSeason]?.episodes || [];
        const dimensions = calculateGridDimensions(episodes.length, containerWidth, itemWidth);
        setGridDimensions(dimensions);
      };

      updateGrid();
      window.addEventListener('resize', updateGrid);
      return () => window.removeEventListener('resize', updateGrid);
    }
  }, [series, activeSeason]);
  
  // مدیریت گرید آیتم‌ها و مقیاس‌پذیری
  useEffect(() => {
    const updateScale = () => {
      if (document.querySelector('.movie-detail-page')) {
        updateGridLayout();
      }
    };
    
    // اجرای اولیه
    updateScale();
    
    // تنظیم مجدد در هنگام تغییر اندازه صفحه
    window.addEventListener('resize', updateScale);
    
    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Get episode details from API
  const fetchEpisodeDetails = async (episodeId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/episodes/${episodeId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching episode details for ID ${episodeId}:`, error);
      return null;
    }
  };
  
  // انتقال فوکوس به عنصر مورد نظر
  const focusElement = useCallback((elementId: string, index: number = 0) => {
    setFocusedElement(elementId);
    
    setTimeout(() => {
      switch (elementId) {
        case 'episodes':
          episodesButtonRef.current?.focus();
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
          const crewSection = document.getElementById('crew');
          if (crewSection) {
            crewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (crewSectionRef.current) {
            crewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          break;
        case 'back':
          backButtonRef.current?.focus();
          break;
        case 'season':
          setFocusedSeason(index);
          if (seasonTabsRef.current[index]) {
            seasonTabsRef.current[index]?.focus();
            seasonTabsRef.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          break;
        case 'episode':
          console.log(`Setting focused episode to ${index}`);
          setFocusedEpisode(index);
          
          // Try to find the episode element directly from DOM
          if (episodesListRef.current) {
            const episodeElements = episodesListRef.current.querySelectorAll('.episode-item');
            if (episodeElements && episodeElements.length > index) {
              const episodeElement = episodeElements[index] as HTMLElement;
              if (episodeElement) {
                console.log(`Focusing episode element at index ${index}`);
                episodeElement.focus();
                
                // Scroll element into view after a short delay
                setTimeout(() => {
                  ensureElementInView(episodeElement);
                }, 50);
                return;
              }
            }
          }
          
          // Fallback to using refs if DOM approach doesn't work
          if (episodeItemsRef.current[index]) {
            episodeItemsRef.current[index]?.focus();
            
            // Delayed scrolling for better visibility
            setTimeout(() => {
              ensureElementInView(episodeItemsRef.current[index]);
            }, 50);
          }
          break;
      }
    }, 10);
  }, []);
  
  // کنترل کلیدهای جهت‌دار کیبرد
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!series) return;
    
    const seasons = series.seasons || [];
    const currentSeason = seasons[activeSeason] || { episodes: [] };
    const episodeCount = currentSeason?.episodes?.length || 0;
    const seasonCount = seasons.length;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        handleLeftArrowNavigation(seasonCount, episodeCount);
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleRightArrowNavigation(seasonCount, episodeCount);
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleDownArrowNavigation(seasonCount, episodeCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleUpArrowNavigation(seasonCount, episodeCount);
        break;
      case 'Escape':
        handleBackClick();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleEnterKey();
        break;
    }
  };
  
  // مدیریت کلید Enter یا Space
  const handleEnterKey = () => {
    if (focusedElement === 'episodes') {
      // اسکرول به بخش قسمت‌ها و فوکوس روی اولین فصل
      const episodesSection = document.getElementById('episodes-section');
      if (episodesSection) {
        episodesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          focusElement('season', 0);
        }, 300);
      }
    } else if (focusedElement === 'preview') {
      handlePreviewClick();
    } else if (focusedElement === 'back') {
      handleBackClick();
    } else if (focusedElement === 'season') {
      // تغییر فصل فعال
      handleSeasonChange(focusedSeason);
    } else if (focusedElement === 'episode') {
      // پخش قسمت
      const seasons = series?.seasons || [];
      const currentSeason = seasons[activeSeason];
      if (currentSeason && currentSeason.episodes && currentSeason.episodes[focusedEpisode]) {
        handleEpisodeClick(currentSeason.episodes[focusedEpisode].episodeId);
      }
    }
  };
  
  // Handle grid navigation for episodes
  const handleEpisodeGridNavigation = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!series || !episodesListRef.current) return;
    
    // Get all episode elements directly from the DOM
    const allEpisodeElements = episodesListRef.current.querySelectorAll('.episode-item');
    if (!allEpisodeElements || allEpisodeElements.length === 0) {
      console.log("No episode elements found");
      return;
    }
    
    // Convert NodeList to Array for easier handling
    const episodeElements = Array.from(allEpisodeElements);
    
    // Find the currently focused element
    const focusedElementIndex = focusedEpisode;
    const currentElement = episodeElements[focusedElementIndex];
    
    if (!currentElement) {
      console.log(`Cannot find current element at index ${focusedElementIndex}`);
      return;
    }
    
    console.log(`Navigating ${direction} from episode ${focusedElementIndex}`);
    
    // Get current element's position
    const currentRect = currentElement.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;
    
    // Variables to track best candidate
    let bestCandidateIndex = -1;
    let bestDistance = Infinity;
    
    // Examine all other elements
    episodeElements.forEach((element, idx) => {
      if (idx === focusedElementIndex) return; // Skip current element
      
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Vector from current to this element
      const vectorX = centerX - currentCenterX;
      const vectorY = centerY - currentCenterY;
      const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
      
      // Determine if the element is in the specified direction
      let isInDirection = false;
      
      // Use angles for more accurate direction detection
      const angle = Math.atan2(vectorY, vectorX) * 180 / Math.PI;
      
      switch (direction) {
        case 'left': // Left arrow should move to left (which is negative X in LTR but used as "back" in RTL)
          isInDirection = (angle > 135 || angle < -135);
          break;
        case 'right': // Right arrow should move to right (which is positive X in LTR but used as "forward" in RTL)
          isInDirection = (angle > -45 && angle < 45);
          break;
        case 'up':
          isInDirection = (angle > -135 && angle < -45);
          break;
        case 'down':
          isInDirection = (angle > 45 && angle < 135);
          break;
      }
      
      console.log(`Element ${idx}: angle=${angle.toFixed(2)}, distance=${distance.toFixed(2)}, inDirection=${isInDirection}`);
      
      if (isInDirection && distance < bestDistance) {
        bestDistance = distance;
        bestCandidateIndex = idx;
      }
    });
    
    // If found a candidate, focus it
    if (bestCandidateIndex !== -1) {
      console.log(`Moving from episode ${focusedElementIndex} to ${bestCandidateIndex}`);
      focusElement('episode', bestCandidateIndex);
      
      // Scroll to ensure visibility
      setTimeout(() => {
        const target = episodeElements[bestCandidateIndex];
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 50);
    } else if (direction === 'up' && focusedElement === 'episode') {
      // If moving up with no candidates, go to seasons
      console.log("No candidates found going up, going to seasons");
      focusElement('season', focusedSeason);
    } else {
      console.log(`No candidate found for direction ${direction}`);
    }
  };
  
  // مدیریت جهت‌های مختلف ناوبری با کیبرد
  const handleLeftArrowNavigation = (seasonCount: number, episodeCount: number) => {
    switch (focusedElement) {
      case 'episodes':
        focusElement('preview');
        break;
      case 'preview':
        // در انتهای بخش دکمه‌ها، باقی می‌ماند
        break;
      case 'back':
        focusElement('episodes');
        break;
      case 'about':
      case 'crew':
        // در بخش‌های محتوا، باقی می‌ماند
        break;
      case 'season':
        // حرکت به سمت چپ در فصل‌ها (در جهت RTL به فصل بعدی)
        if (focusedSeason < seasonCount - 1) {
          focusElement('season', focusedSeason + 1);
        }
        break;
      case 'episode':
        // Use grid navigation for episodes
        handleEpisodeGridNavigation('left');
        break;
    }
  };
  
  const handleRightArrowNavigation = (seasonCount: number, episodeCount: number) => {
    switch (focusedElement) {
      case 'preview':
        focusElement('episodes');
        break;
      case 'episodes':
        focusElement('back');
        break;
      case 'back':
        // در دکمه بازگشت، باقی می‌ماند
        break;
      case 'about':
      case 'crew':
        // در بخش‌های محتوا، باقی می‌ماند
        break;
      case 'season':
        // حرکت به سمت راست در فصل‌ها (در جهت RTL به فصل قبلی)
        if (focusedSeason > 0) {
          focusElement('season', focusedSeason - 1);
        }
        break;
      case 'episode':
        // Use grid navigation for episodes
        handleEpisodeGridNavigation('right');
        break;
    }
  };
  
  const handleDownArrowNavigation = (seasonCount: number, episodeCount: number) => {
    switch (focusedElement) {
      case 'episodes':
      case 'preview':
        focusElement('about');
        break;
      case 'back':
        focusElement('episodes');
        break;
      case 'about':
        // Navigate to seasons section
        const episodesSection = document.getElementById('episodes-section');
        if (episodesSection) {
          episodesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            focusElement('season', 0);
          }, 300);
        } else {
          focusElement('crew');
        }
        break;
      case 'crew':
        // Stay in the last section
        break;
      case 'season':
        // From seasons to episodes - directly navigate to first episode
        console.log("Moving from season to first episode");
        if (episodeCount > 0) {
        focusElement('episode', 0);
        }
        break;
      case 'episode':
        // First get the current episode element
        if (episodesListRef.current) {
          const allEpisodes = Array.from(episodesListRef.current.querySelectorAll('.episode-item'));
          const currentElement = allEpisodes[focusedEpisode];
          
          if (currentElement) {
            // Get the current row and determine the max row
            const currentRow = parseInt(currentElement.getAttribute('data-grid-row') || '0', 10);
            let maxRow = 0;
            
            allEpisodes.forEach(ep => {
              const row = parseInt(ep.getAttribute('data-grid-row') || '0', 10);
              maxRow = Math.max(maxRow, row);
            });
            
            console.log(`Current row: ${currentRow}, Max row: ${maxRow}`);
            
            // If we're on the last row, try to navigate to crew
            if (currentRow >= maxRow) {
              console.log("On last row, checking for crew section");
              const crewSection = document.getElementById('crew');
              if (crewSection) {
                console.log("Found crew section, navigating to it");
        focusElement('crew');
                return;
              }
            }
          }
        }
        
        // If we're not on the last row or there's no crew section, use grid navigation
        handleEpisodeGridNavigation('down');
        break;
    }
  };
  
  const handleUpArrowNavigation = (seasonCount: number, episodeCount: number) => {
    switch (focusedElement) {
      case 'about':
        focusElement('episodes');
        break;
      case 'crew':
        // From crew to last row of episodes
        if (episodesListRef.current && episodeCount > 0) {
          console.log("Navigating from crew to last row of episodes");
          const allEpisodes = Array.from(episodesListRef.current.querySelectorAll('.episode-item'));
          
          if (allEpisodes.length > 0) {
            // Find the maximum row
            let maxRow = 0;
            let lastRowEpisodes: number[] = [];
            
            // First pass to find max row
            allEpisodes.forEach(ep => {
              const row = parseInt(ep.getAttribute('data-grid-row') || '0', 10);
              maxRow = Math.max(maxRow, row);
            });
            
            // Second pass to find episodes in the last row
            allEpisodes.forEach((ep, idx) => {
              const row = parseInt(ep.getAttribute('data-grid-row') || '0', 10);
              if (row === maxRow) {
                lastRowEpisodes.push(idx);
              }
            });
            
            console.log(`Found ${lastRowEpisodes.length} episodes in last row (row ${maxRow})`);
            
            // Go to the first episode in the last row
            if (lastRowEpisodes.length > 0) {
              focusElement('episode', lastRowEpisodes[0]);
              return;
            }
          }
          
          // Fallback: if we can't determine the last row, go to the last episode
          if (allEpisodes.length > 0) {
            focusElement('episode', allEpisodes.length - 1);
            return;
          }
        }
        
        // If we can't navigate to episodes, go to about section as fallback
        focusElement('about');
        break;
      case 'episodes':
      case 'preview':
        focusElement('back');
        break;
      case 'back':
        // از back به سمت پایین میرویم
        focusElement('episodes');
        break;
      case 'season':
        // از فصل‌ها به دکمه‌های بالا
        focusElement('about');
        break;
      case 'episode':
        // Check if we're in the first row by looking at DOM
        if (episodesListRef.current) {
          const allEpisodes = Array.from(episodesListRef.current.querySelectorAll('.episode-item'));
          const currentElement = allEpisodes[focusedEpisode];
          
          if (currentElement) {
            const row = parseInt(currentElement.getAttribute('data-grid-row') || '0', 10);
            console.log(`Current episode is in row ${row}`);
            
            if (row === 0) {
              // If we're in the first row, go up to seasons
              console.log("First row, going to seasons");
        focusElement('season', focusedSeason);
            } else {
              // Otherwise navigate up within episodes
              handleEpisodeGridNavigation('up');
            }
          } else {
            // Fallback if element not found
            handleEpisodeGridNavigation('up');
          }
        } else {
          // Use grid navigation for episodes
          const { row } = indexToGridPosition(focusedEpisode, gridDimensions.columns);
          if (row === 0) {
            // If we're in the first row, go up to seasons
            focusElement('season', focusedSeason);
          } else {
            handleEpisodeGridNavigation('up');
          }
        }
        break;
    }
  };
  
  const handleEpisodesClick = () => {
    // اسکرول به بخش قسمت‌ها و فوکوس روی اولین فصل
    const episodesSection = document.getElementById('episodes-section');
    if (episodesSection) {
      episodesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        focusElement('season', 0);
      }, 300);
    }
  };
  
  const handlePreviewClick = () => {
    if (series?.trailerVideoUrl) {
      console.log('پیش‌نمایش سریال:', series.caption);
      setCurrentVideoUrl(series.trailerVideoUrl);
      setCurrentVideoTitle(`پیش‌نمایش ${series.caption}`);
      setShowVideoPlayer(true);
    } else {
      console.log('لینک پیش‌نمایش موجود نیست');
    }
  };
  
  const handleBackClick = () => {
    navigate('/series');
  };

  const handleSectionClick = (sectionId: string) => {
    focusElement(sectionId);
  };
  
  const handleSeasonChange = (index: number) => {
    setActiveSeason(index);
    setFocusedSeason(index);
    
    // Reset episode focus to first episode of the new season
    setTimeout(() => {
      const episodes = series?.seasons[index]?.episodes || [];
      if (episodes.length > 0) {
        focusElement('episode', 0);
      }
    }, 100);
  };
  
  const handleEpisodeClick = async (episodeId: number) => {
    console.log(`Fetching details for episode with ID: ${episodeId}`);
    
    // Get the episode directly from the current season
    const currentSeason = series?.seasons[activeSeason];
    const episode = currentSeason?.episodes.find(ep => ep.episodeId === episodeId);
    
    if (episode && episode.streamingUrl) {
      console.log("Playing episode:", episode.episodeCaption);
      setCurrentVideoUrl(episode.streamingUrl);
      setCurrentVideoTitle(episode.episodeCaption);
      setShowVideoPlayer(true);
    } else {
      console.log("No streaming URL available for this episode");
    }
  };
  
  const handleCloseVideo = () => {
    setShowVideoPlayer(false);
    // Return focus to appropriate button
    if (focusedElement === 'preview') {
      setTimeout(() => previewButtonRef.current?.focus(), 100);
    } else {
      // If we were watching an episode, focus back on that episode item
      setTimeout(() => {
        const episodeElement = episodeItemsRef.current[focusedEpisode];
        if (episodeElement) {
          episodeElement.focus();
        } else {
          episodesButtonRef.current?.focus();
        }
      }, 100);
    }
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
  
  // نمایش خطا
  if (error) {
    return (
      <div className="error-container">
        <h2>خطا در بارگذاری سریال</h2>
        <p>{error}</p>
        <button className="back-button" onClick={handleBackClick}>بازگشت به صفحه سریال‌ها</button>
      </div>
    );
  }
  
  // اگر سریال پیدا نشد
  if (!series) {
    return (
      <div className="error-container">
        <h2>سریال مورد نظر یافت نشد!</h2>
        <button className="back-button" onClick={handleBackClick}>بازگشت به صفحه سریال‌ها</button>
      </div>
    );
  }
  
  // استخراج اطلاعات کارگردان و بازیگران
  const { director, actors } = getDirectorAndActors(series);

  // تنظیم سیستم ارجاع برای فصل‌ها و قسمت‌ها
  const seasons = series?.seasons || [];
  const currentSeason = seasons[activeSeason] || { episodes: [] };
  const episodes = currentSeason.episodes || [];
  
  // تنظیم ارجاع‌ها
  seasonTabsRef.current = seasons.map(() => null);
  episodeItemsRef.current = episodes.map(() => null);
  
  return (
    <div 
      className="movie-detail-page" 
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      ref={containerRef}
    >
      {/* بخش بنر و اطلاعات اصلی */}
      <div className="movie-detail-banner">
        <img src={series.coverLandscape || series.imageUrl} alt={series.caption} className="banner-image" />
        <div className="banner-overlay"></div>
        
        <button 
          ref={backButtonRef}
          className={`back-button ${focusedElement === 'back' ? 'focused' : ''}`}
          onClick={handleBackClick}
          aria-label="بازگشت"
        ></button>
        
        <div className="banner-info">
          <div className="banner-info-top">
            <h1>{series.caption}</h1>
            <div className="movie-meta">
              <span>{series.year}</span>
              {series.imdb && <span><span className="rating-star">★</span> {series.imdb}</span>}
              {series.seasonCount && <span>{series.seasonCount} فصل</span>}
              {series.ageRange && series.ageRange.length > 0 && <span className="age-rating">+{series.ageRange[0].value}</span>}
            </div>
            <div className="movie-genre">
              {series.category && series.category.map((cat, idx) => (
                <span key={cat.id}>{cat.categoryName}{idx < series.category.length - 1 ? '، ' : ''}</span>
              ))}
            </div>
            </div>
            
          <div className="movie-plot">
            <p>{series.story || series.shortdescription || ''}</p>
          </div>
          
          <div className="banner-buttons">
            <button 
              ref={episodesButtonRef}
              className={`banner-button play-button ${focusedElement === 'episodes' ? 'focused' : ''}`}
              onClick={handleEpisodesClick}
            >
              قسمت‌ها
            </button>
            
            {series.trailerVideoUrl && (
            <button 
              ref={previewButtonRef}
                className={`banner-button preview-button ${focusedElement === 'preview' ? 'focused' : ''}`}
              onClick={handlePreviewClick}
            >
              پیش‌نمایش
            </button>
            )}
          </div>
          </div>
      </div>
      
      {/* بخش اطلاعات تفصیلی */}
      <div className="movie-detail-info">
        {/* درباره سریال */}
        <div id="about" className="detail-section">
          <h2 
            ref={aboutSectionRef}
            className={focusedElement === 'about' ? 'focused' : ''}
            onClick={() => handleSectionClick('about')}
            tabIndex={0}
          >
            درباره سریال
          </h2>
          <div className="movie-about">
            <p>{series.about || series.fullDescription || series.shortdescription || ''}</p>
          </div>
        </div>
        
        {/* بخش قسمت‌های سریال */}
        <div className="detail-section" id="episodes-section">
          <h2>قسمت‌های سریال</h2>
          
          {/* نشانگر فصل‌ها */}
          <div className="season-tabs">
            {seasons.map((season, index) => (
              <button 
                key={season.id}
                ref={(el: HTMLButtonElement | null) => { 
                  if (seasonTabsRef.current) {
                    seasonTabsRef.current[index] = el;
                  }
                }}
                className={`season-tab ${activeSeason === index ? 'active' : ''} ${focusedElement === 'season' && focusedSeason === index ? 'focused' : ''}`}
                onClick={() => handleSeasonChange(index)}
                onFocus={() => focusElement('season', index)}
                tabIndex={0}
              >
                {season.seasonName || `فصل ${index + 1}`}
              </button>
            ))}
          </div>
          
          {/* لیست قسمت‌ها */}
          <div className="episodes-list" ref={episodesListRef}>
            {episodes.length > 0 ? (
              episodes.map((episode, index) => (
              <div 
                key={episode.id} 
                  ref={(el: HTMLDivElement | null) => {
                    if (episodeItemsRef.current) {
                      episodeItemsRef.current[index] = el;
                    }
                  }}
                  className={`episode-item ${focusedElement === 'episode' && focusedEpisode === index ? 'focused' : ''}`}
                  onClick={() => handleEpisodeClick(episode.episodeId)}
                  onFocus={() => focusElement('episode', index)}
                tabIndex={0}
                  data-grid-row={Math.floor(index / gridDimensions.columns)}
                  data-grid-col={index % gridDimensions.columns}
                  data-episode-id={episode.id}
                  data-episode-index={index}
                >
                  <div className="episode-thumbnail">
                    {episode.episodeSlideImageList && episode.episodeSlideImageList.length > 0 ? (
                      <img src={episode.episodeSlideImageList[0].url} alt={episode.episodeCaption} />
                    ) : (
                      <img src={series!.imageUrl} alt={episode.episodeCaption} />
                    )}
                    <div className="play-icon">▶</div>
                </div>
                <div className="episode-info">
                    <h3 className="episode-title">{episode.episodeCaption}</h3>
                    <p className="episode-summary">{episode.episodeShortDescription || ''}</p>
                    {episode.mediaDuration && (
                      <span className="episode-duration">مدت زمان: {episode.mediaDuration} دقیقه</span>
                    )}
                </div>
              </div>
              ))
            ) : (
              <div className="no-episodes">هیچ قسمتی برای این فصل موجود نیست.</div>
            )}
          </div>
        </div>
        
        {/* بخش عوامل سریال */}
        {(director || (actors && actors.length > 0)) && (
          <div id="crew" className="detail-section">
          <h2 
            ref={crewSectionRef}
            className={focusedElement === 'crew' ? 'focused' : ''}
            onClick={() => handleSectionClick('crew')}
            tabIndex={0}
          >
            عوامل سریال
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
              {actors.map((actor) => (
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

export default SeriesDetail; 