import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import './LivePage.css';
import { updateGridLayout } from '../utils/deviceScaling'; // Import the grid layout function
import { fetchAllTVChannels, TVChannelType } from '../services/tvChannelApi';
import ShakaPlayerSimple from '../components/ShakaPlayerSimple'; // Import ShakaPlayerSimple

// وارد کردن تصاویر لوگوی شبکه‌ها
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
import nasimLogo from '../image/logo/نسیم.png';
import tamashLogo from '../image/logo/تماشا.png';
import sportLogo from '../image/logo/ورزش.png';
import news2Logo from '../image/logo/خبر2.png';
import amouzeshLogo from '../image/logo/آموزش.png';
import salamatLogo from '../image/logo/سلامت.png';
import ofoghLogo from '../image/logo/افق.png';
import omidLogo from '../image/logo/امید.png';
import tehranLogo from '../image/logo/تهران.png';
import sepehrLogo from '../image/logo/سپهر.png';
import faraterLogo from '../image/logo/فراتر.png';

// تعریف انواع برای پراپس و داده‌ها
interface LivePageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

// Define Channel type based on TVChannelType but adding some UI-specific properties
interface Channel extends TVChannelType {
  isLive: boolean;
  category: string;
}

const LivePage: React.FC<LivePageProps> = ({ onLeftArrowPress, onRightArrowPress }) => {
  // State for storing channels data from API
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for video player
  const [showVideoPlayer, setShowVideoPlayer] = useState<boolean>(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('');
  const [currentChannelName, setCurrentChannelName] = useState<string>('');

  // Fetch channels data from API
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const data = await fetchAllTVChannels();
        
        // Transform API data to match our Channel interface
        // Add UI-specific properties using category info from the API
        const transformedData = data.map(channel => ({
          ...channel,
          isLive: true, // Assume all channels are live
          // Use the first category if available, otherwise assign a default category
          category: channel.categories && channel.categories.length > 0 
            ? channel.categories[0].name.toLowerCase() 
            : 'general'
        }));
        
        setChannels(transformedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching TV channels:', err);
        setError('خطا در دریافت اطلاعات شبکه‌های تلویزیونی. لطفا دوباره تلاش کنید.');
        setLoading(false);
      }
    };
    
    loadChannels();
  }, []);

  // Generate categories based on available channel categories
  const generateCategories = () => {
    // Always start with 'all' category
    const categoryList = [{ id: 'all', name: 'همه' }];
    
    // Create a set of unique categories from channels
    const uniqueCategories = new Set<string>();
    channels.forEach(channel => {
      if (channel.category) {
        uniqueCategories.add(channel.category);
      }
    });
    
    // Map category names to proper Persian names
    const categoryMapping: Record<string, string> = {
      'general': 'شبکه‌های اصلی',
      'news': 'خبری',
      'movie': 'فیلم و سریال',
      'kids': 'کودک',
      'sports': 'ورزشی',
      'documentary': 'مستند',
      'religious': 'مذهبی',
      'entertainment': 'سرگرمی',
      'educational': 'آموزشی',
      'health': 'سلامت',
      'local': 'استانی'
    };
    
    // Add unique categories with proper names
    [...uniqueCategories].forEach(category => {
      categoryList.push({
        id: category,
        name: categoryMapping[category] || category // Use mapping or original if not found
      });
    });
    
    return categoryList;
  };
  
  const categories = generateCategories();
  
  // حالت‌های کامپوننت
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [focusedElement, setFocusedElement] = useState<'category' | 'channel' | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [channelsPerRow, setChannelsPerRow] = useState<number>(4);
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, cols: 0 });
  
  // رفرنس‌ها برای مدیریت فوکوس
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const categoryRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // فیلتر کانال‌ها بر اساس دسته‌بندی انتخاب شده
  const filteredChannels = selectedCategory === 'all' 
    ? channels 
    : channels.filter(channel => channel.category === selectedCategory);

  // Calculate grid dimensions based on channels count and channels per row
  useEffect(() => {
    const totalChannels = filteredChannels.length;
    const rows = Math.ceil(totalChannels / channelsPerRow);
    setGridDimensions({ rows, cols: channelsPerRow });
    
    // Update CSS variables for grid layout
    if (gridRef.current) {
      gridRef.current.style.setProperty('--grid-columns', channelsPerRow.toString());
    }
    
    // Reset refs array to match the new layout
    channelRefs.current = Array(totalChannels);
    
    console.log(`Grid dimensions updated: ${rows} rows x ${channelsPerRow} columns`);
  }, [channelsPerRow, filteredChannels.length]);
  
  // Determine channels per row based on screen width
  useEffect(() => {
    function calculateChannelsPerRow() {
      // Get CSS variable for channels per row if available
      const cssChannelsPerRow = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--movies-per-row'));
      
      if (!isNaN(cssChannelsPerRow) && cssChannelsPerRow > 0) {
        setChannelsPerRow(cssChannelsPerRow);
        return;
      }
      
      const width = window.innerWidth;
      const scaleFactor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-factor')) || 1;
      
      // Calculate based on screen width and scale factor
      let count;
      if (width > 1400) {
        count = 6;
      } else if (width > 1100) {
        count = 5;
      } else if (width > 768) {
        count = 4;
      } else if (width > 576) {
        count = 3;
      } else {
        count = 2;
      }
      
      // Adjust based on TV detection
      const isTVDevice = document.body.classList.contains('tv-device');
      if (isTVDevice) {
        count = Math.max(3, count - 1); // Reduce count by 1 for TV but ensure minimum of 3
      }
      
      if (count !== channelsPerRow) {
        setChannelsPerRow(count);
      }
    }
    
    calculateChannelsPerRow();
    window.addEventListener('resize', calculateChannelsPerRow);
    
    // Call updateGridLayout to set CSS variables
    updateGridLayout();

    return () => {
      window.removeEventListener('resize', calculateChannelsPerRow);
    };
  }, [channelsPerRow]);
  
  // Helper function to get position from index
  const getPositionFromIndex = (index: number) => {
    const row = Math.floor(index / channelsPerRow);
    const col = index % channelsPerRow;
    return { row, col };
  };
  
  // Helper function to get index from position
  const getIndexFromPosition = (row: number, col: number) => {
    // Ensure col is within bounds
    if (col < 0) col = 0;
    if (col >= channelsPerRow) col = channelsPerRow - 1;
    
    const index = row * channelsPerRow + col;
    // Ensure index is within bounds of available channels
    if (index >= filteredChannels.length) {
      return filteredChannels.length - 1;
    }
    return index;
  };
  
  // توابع مربوط به فوکوس عناصر
  const focusChannel = (index: number) => {
    if (index >= filteredChannels.length) index = filteredChannels.length - 1;
    if (index < 0) index = 0;
    
    setFocusedElement('channel');
    setFocusedIndex(index);
    
    setTimeout(() => {
      channelRefs.current[index]?.focus();
      
      // Scroll into view if needed
      if (channelRefs.current[index]) {
        const element = channelRefs.current[index];
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
  
  const focusCategory = (index: number) => {
    if (index >= categories.length) index = categories.length - 1;
    if (index < 0) index = 0;
    
    setFocusedElement('category');
    setFocusedIndex(index);
    
    setTimeout(() => {
      categoryRefs.current[index]?.focus();
      categoryRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  };
  
  // مدیریت کلیدهای کیبورد
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
  
  // تنظیم لیسنرهای کیبورد در سطح داکیومنت
  useEffect(() => {
    function handleDocumentKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && !focusedElement) {
        e.preventDefault();
        // آمدن از سایدبار، فوکوس روی اولین کانال
        focusChannel(0);
      }
    }
    
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [focusedElement]);
  
  // منطق مدیریت کلیدهای جهت‌دار
  const handleRightArrow = () => {
    if (focusedElement === 'category') {
      if (focusedIndex > 0) {
        focusCategory(focusedIndex - 1);
      } else {
        // اولین دکمه، رفتن به سایدبار
        if (onRightArrowPress) {
          setFocusedElement(null);
          onRightArrowPress();
        }
      }
    } else if (focusedElement === 'channel') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (col > 0) {
        focusChannel(getIndexFromPosition(row, col - 1));
      } else {
        // اولین آیتم در ردیف، رفتن به سایدبار
        if (onRightArrowPress) {
          setFocusedElement(null);
          onRightArrowPress();
        }
      }
    }
  };
  
  const handleLeftArrow = () => {
    if (focusedElement === 'category') {
      if (focusedIndex < categories.length - 1) {
        focusCategory(focusedIndex + 1);
      } else {
        // آخرین دکمه، رفتن به اولین کانال
        focusChannel(0);
      }
    } else if (focusedElement === 'channel') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (col < channelsPerRow - 1) {
        const nextIndex = getIndexFromPosition(row, col + 1);
        if (nextIndex < filteredChannels.length) {
          focusChannel(nextIndex);
        }
      }
    }
  };
  
  const handleUpArrow = () => {
    if (focusedElement === 'channel') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      
      if (row > 0) {
        // رفتن به ردیف بالایی
        focusChannel(getIndexFromPosition(row - 1, col));
      } else {
        // اولین ردیف، رفتن به دکمه‌های دسته‌بندی
        const categoryIndex = Math.min(col, categories.length - 1);
        focusCategory(categoryIndex);
      }
    }
  };
  
  const handleDownArrow = () => {
    if (focusedElement === 'category') {
      // رفتن از دکمه‌های دسته‌بندی به کانال‌ها
      const col = Math.min(focusedIndex, channelsPerRow - 1);
      focusChannel(getIndexFromPosition(0, col));
    } else if (focusedElement === 'channel') {
      const { row, col } = getPositionFromIndex(focusedIndex);
      const nextRowIndex = getIndexFromPosition(row + 1, col);
      
      if (nextRowIndex < filteredChannels.length) {
        // رفتن به ردیف پایین‌تر
        focusChannel(nextRowIndex);
      }
    }
  };
  
  const handleSelect = () => {
    if (focusedElement === 'category') {
      setSelectedCategory(categories[focusedIndex].id);
      // بعد از انتخاب دسته‌بندی، فوکوس روی اولین کانال
      setTimeout(() => {
        if (filteredChannels.length > 0) {
          focusChannel(0);
        }
      }, 100);
    } else if (focusedElement === 'channel') {
      console.log('Selected channel:', filteredChannels[focusedIndex]);
      // Navigate to the stream URL if available
      const selectedChannel = filteredChannels[focusedIndex];
      if (selectedChannel && selectedChannel.stream_url) {
        console.log(`Playing channel: ${selectedChannel.name}`);
        setCurrentStreamUrl(selectedChannel.stream_url);
        setCurrentChannelName(selectedChannel.name);
        setShowVideoPlayer(true);
      }
    }
  };
  
  // Clear focus when moving to sidebar
  useEffect(() => {
    return () => {
      setFocusedElement(null);
    };
  }, []);

  // Update the render method to handle loading and error states
  if (loading) {
    return <div className="loading-container">در حال بارگذاری شبکه‌های تلویزیونی...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div 
      className="main-content" 
      ref={containerRef}
      tabIndex={-1}
    >
      <div className="live-container">
        <h2>پخش زنده</h2>
        
        {/* دکمه‌های دسته‌بندی */}
        <div className="live-categories">
          {categories.map((category, index) => (
            <button
              key={category.id}
              ref={(el) => { categoryRefs.current[index] = el; }}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''} ${focusedElement === 'category' && focusedIndex === index ? 'focused' : ''}`}
              onClick={() => {
                setSelectedCategory(category.id);
                focusCategory(index);
              }}
              onFocus={() => focusCategory(index)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* گرید کانال‌ها */}
        <div 
          ref={gridRef}
          className="channels-grid"
          style={{
            gridTemplateColumns: `repeat(${channelsPerRow}, 1fr)`,
            gap: `calc(12px * var(--scale-factor, 1))`
          }}
        >
          {filteredChannels.length > 0 ? (
            filteredChannels.map((channel, index) => (
              <div
                key={channel.id}
                ref={(el) => { channelRefs.current[index] = el; }}
                className={`channel-card ${focusedElement === 'channel' && focusedIndex === index ? 'focused' : ''}`}
                onClick={() => {
                  focusChannel(index);
                  handleSelect();
                }}
                onFocus={() => focusChannel(index)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                data-row={Math.floor(index / channelsPerRow)}
                data-col={index % channelsPerRow}
              >
                <div className="channel-logo">
                  <img 
                    src={channel.logo || `https://via.placeholder.com/100x100?text=${channel.name}`} 
                    alt={channel.name} 
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/100x100?text=${channel.name}`;
                    }}
                  />
                </div>
                {channel.isLive && <span className="live-indicator">زنده</span>}
                <div className="channel-info">
                  <h3>{channel.name}</h3>
                </div>
              </div>
            ))
          ) : (
            <div className="no-channels">هیچ شبکه‌ای در این دسته‌بندی یافت نشد</div>
          )}
        </div>
      </div>

      {/* Video player */}
      {showVideoPlayer && (
        <ShakaPlayerSimple
          url={currentStreamUrl}
          title={currentChannelName}
          onClose={() => {
            setShowVideoPlayer(false);
            // Return focus to the selected channel
            setTimeout(() => {
              if (focusedElement === 'channel' && channelRefs.current[focusedIndex]) {
                channelRefs.current[focusedIndex]?.focus();
              }
            }, 100);
          }}
          autoPlay={true}
        />
      )}
    </div>
  );
};

export default LivePage; 