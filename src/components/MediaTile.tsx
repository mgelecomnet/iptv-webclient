import React, { forwardRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import './../App.css'; // Ensure App.css styles are applied
import '../pages/HomePage.css'; // Import HomePage styles for media tiles
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate

interface MediaTileProps {
  poster: string;
  title: string;
  id: number;
  type?: string; // Type of content (movie, series, etc.)
  linkPrefix?: string;
  extraInfo?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  className?: string;
  year?: string;
  rating?: string;
  tabIndex?: number;
}

const MediaTile = forwardRef<HTMLAnchorElement, MediaTileProps>(
  ({ poster, title, id, type = 'movie', linkPrefix, extraInfo, year, rating, onKeyDown, onFocus, className = '', tabIndex }, ref) => {
    // Use type for linkPrefix if not explicitly provided
    const actualLinkPrefix = linkPrefix || type;
    
    // Combine extra info or use year and rating if provided
    const displayExtraInfo = extraInfo || (year && rating ? `${year} • ${rating}` : (year || rating || ''));
    
    // Format rating for data attribute (remove "IMDb" text if present)
    const formattedRating = rating ? rating.replace(' IMDb', '') : '';
    
    // State to track hover and focus
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    // Custom key handler to ensure Enter key works properly
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Call the parent's onKeyDown handler if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
      
      // Handle Enter key specifically for navigation
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        
        // Simulate a click on the link
        if (ref && 'current' in ref && ref.current) {
          ref.current.click();
        }
      }
    };
    
    // Handle focus events
    const handleFocus = () => {
      setIsFocused(true);
      if (onFocus) {
        onFocus();
      }
    };
    
    const handleBlur = () => {
      setIsFocused(false);
    };
    
    // Handle mouse events
    const handleMouseEnter = () => {
      setIsHovered(true);
    };
    
    const handleMouseLeave = () => {
      setIsHovered(false);
    };
    
    // Determine if overlay should be visible
    const isOverlayVisible = isHovered || isFocused;
    
    return (
      // Wrap the tile content in a Link for keyboard focus and navigation
      <Link 
        to={`/${actualLinkPrefix}/${id}`}
        className={`media-tile ${className} ${isOverlayVisible ? 'focused' : ''}`} 
        ref={ref}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={tabIndex}
        aria-label={`${title} ${displayExtraInfo ? `- ${displayExtraInfo}` : ''}`}
        data-rating={formattedRating}
        style={{ 
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'block'
        }}
      >
        <div className="media-tile-inner">
          <div className="media-image-container" style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden',
            borderRadius: 'calc(8px * var(--scale-factor, 1))'
          }}>
            <img 
              src={poster} 
              alt={title} 
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                aspectRatio: '2/3',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                transform: isOverlayVisible ? 'scale(1.05)' : 'scale(1)',
                borderRadius: 'calc(8px * var(--scale-factor, 1))'
              }}
            />
            <div className="media-overlay" style={{ 
              position: 'absolute', 
              bottom: '0', 
              left: '0', 
              right: '0',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.9))',
              padding: 'calc(12px * var(--scale-factor, 1)) calc(15px * var(--scale-factor, 1))',
              opacity: isOverlayVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
              borderRadius: '0 0 calc(8px * var(--scale-factor, 1)) calc(8px * var(--scale-factor, 1))',
              zIndex: 2
            }}>
              <p className="media-title" style={{ 
                fontSize: 'calc(1em * var(--text-scale, var(--scale-factor, 1)))',
                fontWeight: '500',
                margin: '0 0 calc(5px * var(--scale-factor, 1))',
                color: 'white',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'right'
              }}>{title}</p>
              {displayExtraInfo && <p className="media-extra-info" style={{
                fontSize: 'calc(0.8em * var(--text-scale, var(--scale-factor, 1)))',
                color: '#bbb',
                margin: '0',
                textAlign: 'right',
                display: 'flex',
                justifyContent: 'flex-start',
                flexDirection: 'row-reverse'
              }}>{displayExtraInfo}</p>}
            </div>
          </div>
        </div>
      </Link>
    );
  }
);

// Add display name for debugging purposes
MediaTile.displayName = 'MediaTile';

export default MediaTile;