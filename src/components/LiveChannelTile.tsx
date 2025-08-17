import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface LiveChannelTileProps {
  id: number;
  title: string;
  poster: string;
  isLive?: boolean;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onPlay?: () => void;
  className?: string;
  tabIndex?: number;
}

const LiveChannelTile = forwardRef<HTMLDivElement, LiveChannelTileProps>(
  ({ id, title, poster, isLive, onFocus, onKeyDown, onPlay, className = '', tabIndex }, ref) => {
    const handleClick = () => {
      if (onPlay) onPlay();
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) onKeyDown(e);
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };
    return (
      <div
        className={`media-tile ${className}`}
        ref={ref}
        onClick={handleClick}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        role="button"
        aria-label={title}
        style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'block' }}
      >
        <div className="media-tile-inner">
          <img src={poster} alt={title} />
          {isLive && <span className="live-indicator">زنده</span>}
          <div className="media-info">
            <p className="media-title">{title}</p>
          </div>
        </div>
      </div>
    );
  }
);
LiveChannelTile.displayName = 'LiveChannelTile';

export default LiveChannelTile;
