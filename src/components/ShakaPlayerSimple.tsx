import React, { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';
import { FaBackward, FaForward, FaPlay, FaPause, FaExpand, FaCompress, FaTimes, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import './ShakaPlayer.css';

interface ShakaPlayerSimpleProps {
  url: string;
  onClose: () => void;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  liveChannels?: Array<{id: string, name: string, url: string, logo?: string}>; // لیست کانال‌های پخش زنده
}

const ShakaPlayerSimple: React.FC<ShakaPlayerSimpleProps> = ({
  url,
  onClose,
  title,
  poster,
  autoPlay = true,
  liveChannels,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const backwardButtonRef = useRef<HTMLButtonElement>(null);
  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const seekbarHandleRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const liveButtonRef = useRef<HTMLButtonElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipOverlayVisible, setSkipOverlayVisible] = useState(false);
  const [skipDirection, setSkipDirection] = useState<'forward' | 'backward'>('forward');
  const [isMuted, setIsMuted] = useState(false);
  const [seekingWithKeyboard, setSeekingWithKeyboard] = useState(false);
  const [tempSeekPosition, setTempSeekPosition] = useState<number | null>(null);
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [focusedControl, setFocusedControl] = useState<'play' | 'backward' | 'forward' | 'mute' | 'close' | 'seekbar' | 'live' | 'channelList' | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);
  
  // لیست پخش کانال‌ها
  const [showChannelList, setShowChannelList] = useState(false);
  const [channels, setChannels] = useState<Array<{id: string, name: string, url: string, logo?: string}>>(() => {
    // کانال‌های پیش‌فرض برای تست
    const defaultChannels = [
      { id: '1', name: 'شبکه یک', url: 'https://cdn.livehls.ir/hls/tv1/index.m3u8', logo: 'https://static.televebion.net/web/content_images/channel_images/sources/tv1/logo.png' },
      { id: '2', name: 'شبکه دو', url: 'https://cdn.livehls.ir/hls/tv2/index.m3u8', logo: 'https://static.televebion.net/web/content_images/channel_images/sources/tv2/logo.png' },
      { id: '3', name: 'شبکه سه', url: 'https://cdn.livehls.ir/hls/tv3/index.m3u8', logo: 'https://static.televebion.net/web/content_images/channel_images/sources/tv3/logo.png' }
    ];
    
    return liveChannels?.length ? liveChannels : defaultChannels;
  });
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Shaka Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Always use black background for video element and container
    video.style.backgroundColor = 'black';
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = 'black';
    }

    // Install polyfills
    shaka.polyfill.installAll();

    // Check browser support
    if (!shaka.Player.isBrowserSupported()) {
      setError('Your browser is not supported');
      return;
    }

    // Create player
    const player = new shaka.Player(video);
    playerRef.current = player;

    // Listen for errors
    player.addEventListener('error', (event: { detail: shaka.util.Error }) => {
      const error = event.detail;
      
      let errorMessage = `Error: ${error.code} - ${error.message}`;
      
      // Better error handling for different error types
      if (error.code === 7002) {
        errorMessage = 'Cannot connect to video server. Please check your network connection or try again later.';
      } else if (error.code === 3016) {
        errorMessage = 'Failed to load video content. The video may be unavailable or in an unsupported format.';
      }
      
      setError(errorMessage);
      setLoading(false);
    });

    // Configure player with enhanced settings for better live stream performance
    player.configure({
      streaming: {
        // Increase buffer sizes significantly for better live stream experience
        bufferingGoal: 90,          // 90 seconds forward buffer (was 60)
        rebufferingGoal: 5,         // 5 seconds before resuming playback after buffering (was 2)
        bufferBehind: 180,          // 3 minutes of backward buffer (was 30)
        
        // Add more robust network settings
        retryParameters: {
          maxAttempts: 5,           // More retry attempts for better reliability 
          baseDelay: 1000,          // Start with 1 second between retries
          backoffFactor: 2,         // Double the delay each time
          fuzzFactor: 0.5           // Add randomness to the delay
        },
        
        // Additional settings to improve performance
        stallEnabled: false,        // Disable stall detection for smoother playback
        stallThreshold: 5,          // Higher threshold before considering stream stalled
        stallSkip: 0.1              // Small skip amount if stall happens
      }
    });

    const initializePlayer = async () => {
      try {
        // First go fullscreen if autoplay is enabled
        if (autoPlay && containerRef.current) {
          try {
            if (containerRef.current.requestFullscreen) {
              await containerRef.current.requestFullscreen();
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
              await (containerRef.current as any).webkitRequestFullscreen();
            } else if ((containerRef.current as any).mozRequestFullScreen) {
              await (containerRef.current as any).mozRequestFullScreen();
            } else if ((containerRef.current as any).msRequestFullscreen) {
              await (containerRef.current as any).msRequestFullscreen();
            }
          } catch (error) {
            console.log('Fullscreen request failed:', error);
          }
        }

        // Then load content
        await player.load(url);
        setLoading(false);
        
        // Check if the stream is live
        const isLiveStream = player.isLive();
        
        // Also try to detect live streams from URL if Shaka's detection fails
        // Many live streams contain indicators in their URLs
        const liveUrlIndicators = ['live', 'stream', 'dvr', 'manifest.m3u8', 'playlist.m3u8'];
        const isLiveByUrl = liveUrlIndicators.some(indicator => 
          url.toLowerCase().includes(indicator.toLowerCase())
        );
        
        setIsLive(isLiveStream || isLiveByUrl);
        setIsAtLiveEdge(isLiveStream || isLiveByUrl); // Initially at live edge if it's a live stream
        
        // Finally play the video
        if (autoPlay) {
          try {
            await video.play();
          } catch (e) {
            setIsPlaying(false);
            console.log('Autoplay failed:', e);
          }
        }
      } catch (error: any) {
        let errorMessage = `Failed to load video: ${error.message}`;
        
        // Better error handling for different error types
        if (error instanceof shaka.util.Error) {
          if (error.code === 7002) {
            errorMessage = 'Cannot connect to video server. Please check your network connection or try again later.';
          } else if (error.code === 3016) {
            errorMessage = 'Failed to load video content. The video may be unavailable or in an unsupported format.';
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [url, autoPlay, liveChannels]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check if we are at the live edge (for live streams)
      if (isLive && video.seekable && video.seekable.length > 0) {
        const liveEdgeThreshold = 30; // seconds - increased from 10 to 30 to allow more navigation freedom
        const seekableEnd = video.seekable.end(video.seekable.length - 1);
        const isAtEdge = (seekableEnd - video.currentTime) < liveEdgeThreshold;
        setIsAtLiveEdge(isAtEdge);
      }
    };
    
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const onLoadedData = () => {
      setLoading(false);
      setDuration(video.duration);
    };
    const onPlaying = () => {
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);

    // Cleanup
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
    };
  }, [isLive]);

  // Handle fullscreen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      const isCurrentlyFullscreen = 
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Close the player when exiting fullscreen
      if (!isCurrentlyFullscreen && isFullscreen) {
        setTimeout(() => onClose(), 100);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, [isFullscreen, onClose]);

  // Show/hide controls
  const handleShowControls = () => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    // Only start hide timer if video is playing
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      if (isPlaying) {
        video.pause();
        // When pausing, clear any existing hide timer
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        // Always show controls when paused
        setShowControls(true);
      } else {
        video.play().catch(e => {
          setIsPlaying(false);
        });
        
        // Restart hide controls timer when playing
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        controlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  // Toggle mute
  const toggleMute = () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      
      // Toggle mute state directly
      video.muted = !video.muted;
      setIsMuted(video.muted);
      handleShowControls();
    } catch (error) {
      // Silently handle errors
    }
  };

  // Toggle channel list visibility
  const toggleChannelList = () => {
    console.log("Toggle Channel List called, current state:", showChannelList);
    console.log("Channels available:", channels.length, channels);
    
    // Check if we have channels to show
    if (!showChannelList && (!channels || channels.length === 0)) {
      console.log("No channels available to show in list");
      return;
    }
    
    // When opening channel list, hide controls to prevent focus issues
    if (!showChannelList) {
      setShowControls(false);
      
      // Set focus to the channel list
      setFocusedControl('channelList');
      
      // Toggle the channel list state
      setShowChannelList(true);
      console.log("Channel list opened");
    } else {
      // When closing, show controls again
      setShowControls(true);
      
      // Return focus to play button
      setFocusedControl('play');
      if (playButtonRef.current) {
        playButtonRef.current.focus();
      }
      
      // Toggle the channel list state
      setShowChannelList(false);
      console.log("Channel list closed");
    }
  };
  
  // Change channel
  const changeChannel = async (channelIndex: number) => {
    try {
      console.log('========== CHANGE CHANNEL STARTED ==========');
      console.log('Changing to channel index:', channelIndex);
      
      const player = playerRef.current;
      const video = videoRef.current;
      if (!player || !video) {
        console.error('Player or video element not available');
        return;
      }
      
      // Only change if different channel and channel exists
      if (channelIndex < 0 || channelIndex >= channels.length) {
        console.error('Invalid channel index:', channelIndex);
        return;
      }

      const newChannel = channels[channelIndex];
      console.log('Changing to channel:', newChannel);
      
      if (newChannel.id === currentChannelId) {
        console.log('Already on this channel');
        return;
      }
      
      setLoading(true);
      setError(null); // Reset any previous errors
      
      // Unload current content
      try {
        console.log('Unloading current content');
        await player.unload();
        console.log('Player unloaded successfully');
      } catch (error) {
        console.error('Error unloading player:', error);
      }
      
      // Load new channel
      try {
        // Ensure the URL is valid
        if (!newChannel.url) {
          throw new Error('Channel URL is empty or invalid');
        }
        
        console.log('Loading new channel URL:', newChannel.url);
        
        // Create a new src for the video to force reload
        video.src = ''; // Clear the source first
        
        // Use Shaka Player to load the new URL
        await player.load(newChannel.url);
        console.log('Channel loaded successfully');
        
        setCurrentChannelId(newChannel.id);
        setSelectedChannelIndex(channelIndex);
        
        // Hide channel list after selection
        setShowChannelList(false);
        setShowControls(true);
        
        // Check if the stream is live
        const isLiveStream = player.isLive();
        console.log('Is channel live stream:', isLiveStream);
        setIsLive(isLiveStream);
        setIsAtLiveEdge(isLiveStream);
        
        // Play the video
        console.log('Playing video');
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video playback started successfully');
              setIsPlaying(true);
            })
            .catch(e => {
              console.error('Error playing video:', e);
              setIsPlaying(false);
            });
        }
      } catch (error) {
        console.error('Error loading channel:', error);
        setError(`خطا در بارگذاری کانال: ${newChannel.name}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Channel change error:', error);
      setLoading(false);
    } finally {
      console.log('========== CHANGE CHANNEL COMPLETED ==========');
    }
  };

  // Skip forward with special handling for live streams
  const skipForward = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        return;
      }
      
      // Update the UI first
      setSkipDirection('forward');
      setSkipOverlayVisible(true);
      setTimeout(() => setSkipOverlayVisible(false), 1000);
      
      // Special handling for live streams
      if (isLive) {
        // For live streams, forward skip should go to live edge
        if (!isAtLiveEdge) {
          seekToLiveEdge();
        }
        return;
      }
      
      // For VOD content, use standard skip
      // Get current values
      const currentTime = video.currentTime || 0;
      const videoDuration = video.duration || 0;
      
      // Calculate new time (don't go past the video end)
      const skipAmount = 10;
      const newTime = Math.min(videoDuration, currentTime + skipAmount);
      
      // Set the new time
      video.currentTime = newTime;
      
      // Show controls
      handleShowControls();
    } catch (err) {
      // Silently handle errors
    }
  };
  
  // Skip backward with special handling for live streams
  const skipBackward = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        return;
      }
      
      // Update the UI first
      setSkipDirection('backward');
      setSkipOverlayVisible(true);
      setTimeout(() => setSkipOverlayVisible(false), 1000);
      
      // Special handling for live streams - use a smaller skip amount
      const skipAmount = isLive ? 5 : 10;
      
      // Get current value
      const currentTime = video.currentTime || 0;
      
      // Calculate new time (don't go below 0)
      const newTime = Math.max(0, currentTime - skipAmount);
      
      // Set the new time
      video.currentTime = newTime;
      
      // For live streams, check if we are moving away from live edge
      if (isLive && isAtLiveEdge) {
        setIsAtLiveEdge(false);
      }
      
      // Show controls
      handleShowControls();
    } catch (err) {
      // Silently handle errors
    }
  };

  // Seek to specific position
  const seekTo = (position: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const targetTime = Math.max(0, Math.min(duration, position));
    video.currentTime = targetTime;
    handleShowControls();
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  // Seek to live edge
  const seekToLiveEdge = () => {
    const video = videoRef.current;
    if (!video || !isLive) return;
    
    try {
      if (video.seekable && video.seekable.length > 0) {
        const liveEdge = video.seekable.end(video.seekable.length - 1);
        video.currentTime = liveEdge;
        setIsAtLiveEdge(true);
      }
      
      // If paused, also start playing
      if (!isPlaying) {
        video.play().catch(e => {
          console.error('Failed to play after seeking to live edge:', e);
        });
      }
    } catch (error) {
      console.error('Error seeking to live edge:', error);
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seekbar drag
  const handleSeekbarDrag = (increment: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    // Reset the timer when using the seekbar
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    // Only restart timer if video is playing
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    // Use a larger increment for the seekbar handle
    const seekIncrement = increment * 5; // 5 seconds per arrow key press
    const newTime = Math.max(0, Math.min(duration, currentTime + seekIncrement));
    
    seekTo(newTime);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    // Create our own keyboard handler that won't conflict with Shaka's internal handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in form elements
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Get video element
      const video = videoRef.current;
      if (!video) return;
        
      // Only manage Tab key for focus trapping
      if (e.key === 'Tab') {
        e.preventDefault();
        
        // Define tab order based on available controls
        let tabOrder = ['forward', 'play', 'backward', 'mute'];
        
        // Add live button to tab order if available
        if (isLive) {
          console.log('Live button available, adding to tab order');
          tabOrder.push('live');
        }
        
        // Complete the tab order
        tabOrder = [...tabOrder, 'close', 'seekbar'];
        
        console.log('Current Tab Order:', tabOrder);
        console.log('Current focused control:', focusedControl);
        
        // Find current index
        const currentIndex = tabOrder.findIndex(control => control === focusedControl);
        let nextIndex;
        
        if (e.shiftKey) {
          // Reverse tab order
          nextIndex = currentIndex <= 0 ? tabOrder.length - 1 : currentIndex - 1;
        } else {
          // Forward tab order
          nextIndex = currentIndex >= tabOrder.length - 1 || currentIndex === -1 ? 0 : currentIndex + 1;
        }
        
        // Set focus to the next control
        const nextControl = tabOrder[nextIndex] as 'play' | 'backward' | 'forward' | 'mute' | 'close' | 'seekbar' | 'live' | null;
        setFocusedControl(nextControl);
        
        // Focus the correct element
        switch (nextControl) {
          case 'play':
            playButtonRef.current?.focus();
            break;
          case 'forward':
            forwardButtonRef.current?.focus();
            break;
          case 'backward':
            backwardButtonRef.current?.focus();
            break;
          case 'mute':
            muteButtonRef.current?.focus();
            break;
          case 'close':
            closeButtonRef.current?.focus();
            break;
          case 'seekbar':
            seekbarHandleRef.current?.focus();
            break;
          case 'live':
            liveButtonRef.current?.focus();
            break;
          default:
            // Default to play button
            playButtonRef.current?.focus();
            break;
        }
        
        return;
      }
      
      // Handle arrow keys for navigation between controls
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); // Prevent default scrolling behavior
        e.stopPropagation(); // Prevent event from reaching Shaka controls
        
        // If channel list is open, handle only list navigation and ignore other controls
        if (showChannelList) {
          if (e.key === 'ArrowDown') {
            // Move to next channel
            const newIndex = Math.min(channels.length - 1, selectedChannelIndex + 1);
            setSelectedChannelIndex(newIndex);
            return;
          } else if (e.key === 'ArrowUp') {
            // Move to previous channel
            const newIndex = Math.max(0, selectedChannelIndex - 1);
            setSelectedChannelIndex(newIndex);
            return;
          }
          // Ignore other keys when channel list is open
          return;
        }
        
        // First ensure controls are visible
        if (!showControls) {
          handleShowControls();
          
          // Set initial focus based on which key was pressed
          if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
            // Left/Right keys should focus on seekbar initially
            setFocusedControl('seekbar');
            seekbarHandleRef.current?.focus();
          } else {
            // Up/Down keys should focus on play button
            setFocusedControl('play');
            playButtonRef.current?.focus();
          }
          return;
        }
        
        // Navigation based on arrow keys
        if (e.key === 'ArrowRight') {
          // Right arrow - Move focus to the right
          if (focusedControl === 'forward') {
            if (isLive) {
              setFocusedControl('live');
              liveButtonRef.current?.focus();
            } else {
              setFocusedControl('close');
              closeButtonRef.current?.focus();
            }
          } else if (focusedControl === 'play') {
            setFocusedControl('forward');
            forwardButtonRef.current?.focus();
          } else if (focusedControl === 'backward') {
            setFocusedControl('play');
            playButtonRef.current?.focus();
          } else if (focusedControl === 'mute') {
            setFocusedControl('backward');
            backwardButtonRef.current?.focus();
          } else if (focusedControl === 'live') {
            setFocusedControl('close');
            closeButtonRef.current?.focus();
          } else if (focusedControl === 'close') {
            setFocusedControl('mute');
            muteButtonRef.current?.focus();
          } else if (focusedControl === 'seekbar') {
            // Only update on keydown if we're not already seeking
            if (!seekingWithKeyboard) {
              setSeekingWithKeyboard(true);
              
              // Initialize temp position with current time if not set
              const increment = 5; // 5 seconds per keypress
              const newPosition = currentTime + increment;
              setTempSeekPosition(newPosition);
              setPreviewTime(newPosition);
              
              // Update seekbar handle visually
              const seekbarElement = document.querySelector('.seekbar-handle');
              if (seekbarElement) {
                const percent = (newPosition / duration) * 100;
                (seekbarElement as HTMLElement).style.left = `${percent}%`;
                (seekbarElement as HTMLElement).style.transition = 'left 0.15s ease-out';
              }
            } else if (tempSeekPosition !== null) {
              // If already seeking, just update the temp position
              const increment = 5; // 5 seconds per keypress
              const newPosition = Math.max(0, Math.min(duration, tempSeekPosition + increment));
              setTempSeekPosition(newPosition);
              setPreviewTime(newPosition);
              
              // Update seekbar handle visually
              const seekbarElement = document.querySelector('.seekbar-handle');
              if (seekbarElement) {
                const percent = (newPosition / duration) * 100;
                (seekbarElement as HTMLElement).style.left = `${percent}%`;
                (seekbarElement as HTMLElement).style.transition = 'left 0.15s ease-out';
              }
            }
          } else {
            // Default focus
            setFocusedControl('play');
            playButtonRef.current?.focus();
          }
        } else if (e.key === 'ArrowLeft') {
          // Left arrow - Move focus to the left
          if (focusedControl === 'forward') {
            setFocusedControl('play');
            playButtonRef.current?.focus();
          } else if (focusedControl === 'play') {
            setFocusedControl('backward');
            backwardButtonRef.current?.focus();
          } else if (focusedControl === 'backward') {
            setFocusedControl('mute');
            muteButtonRef.current?.focus();
          } else if (focusedControl === 'mute') {
            setFocusedControl('close');
            closeButtonRef.current?.focus();
          } else if (focusedControl === 'close') {
            if (isLive) {
              setFocusedControl('live');
              liveButtonRef.current?.focus();
            } else {
              setFocusedControl('forward');
              forwardButtonRef.current?.focus();
            }
          } else if (focusedControl === 'live') {
            setFocusedControl('forward');
            forwardButtonRef.current?.focus();
          } else if (focusedControl === 'seekbar') {
            // Only update on keydown if we're not already seeking
            if (!seekingWithKeyboard) {
              setSeekingWithKeyboard(true);
              
              // Initialize temp position with current time if not set
              const increment = 5; // 5 seconds per keypress
              const newPosition = Math.max(0, currentTime - increment);
              setTempSeekPosition(newPosition);
              setPreviewTime(newPosition);
              
              // Update seekbar handle visually
              const seekbarElement = document.querySelector('.seekbar-handle');
              if (seekbarElement) {
                const percent = (newPosition / duration) * 100;
                (seekbarElement as HTMLElement).style.left = `${percent}%`;
                (seekbarElement as HTMLElement).style.transition = 'left 0.15s ease-out';
              }
            } else if (tempSeekPosition !== null) {
              // If already seeking, just update the temp position
              const increment = 5; // 5 seconds per keypress
              const newPosition = Math.max(0, Math.min(duration, tempSeekPosition - increment));
              setTempSeekPosition(newPosition);
              setPreviewTime(newPosition);
              
              // Update seekbar handle visually
              const seekbarElement = document.querySelector('.seekbar-handle');
              if (seekbarElement) {
                const percent = (newPosition / duration) * 100;
                (seekbarElement as HTMLElement).style.left = `${percent}%`;
                (seekbarElement as HTMLElement).style.transition = 'left 0.15s ease-out';
              }
            }
          } else {
            // Default focus
            setFocusedControl('play');
            playButtonRef.current?.focus();
          }
        } else if (e.key === 'ArrowDown') {
          // Channel list navigation - move to next channel
          if (showChannelList && focusedControl === 'channelList') {
            e.preventDefault();
            const newIndex = Math.min(channels.length - 1, selectedChannelIndex + 1);
            setSelectedChannelIndex(newIndex);
            return;
          }
          
          // Down arrow - Move focus down to seekbar
          if (focusedControl !== 'seekbar') {
            setFocusedControl('seekbar');
            seekbarHandleRef.current?.focus();
          }
        } else if (e.key === 'ArrowUp') {
          // Channel list navigation - move to previous channel
          if (showChannelList && focusedControl === 'channelList') {
            e.preventDefault();
            const newIndex = Math.max(0, selectedChannelIndex - 1);
            setSelectedChannelIndex(newIndex);
            return;
          }
          
          // Up arrow - Move focus up from seekbar to play button
          if (focusedControl === 'seekbar') {
            setFocusedControl('play');
            playButtonRef.current?.focus();
          }
        }
        
        // Reset and restart the controls timer
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        
        if (isPlaying) {
          controlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
        
        return;
      }
      
      // Handle showing controls for other keys
      if (['Enter', ' '].includes(e.key)) {
        // For Enter key, toggle channel list when no specific control has focus (only in live mode)
        if (e.key === 'Enter') {
          console.log('Enter key pressed, checking conditions:',
            'isLive:', isLive,
            'focusedControl:', focusedControl,
            'channels.length:', channels.length);
            
            // Check if channel list is already open, if yes, select the channel
            if (showChannelList) {
              console.log('Channel list is open, selecting channel:', selectedChannelIndex);
              e.preventDefault();
              changeChannel(selectedChannelIndex);
              return;
            }
            
            // If live and we have channels, toggle the channel list
            if (isLive && channels.length > 0) {
              console.log('Toggling channel list because we have live content with channels');
              toggleChannelList();
              e.preventDefault();
              return;
            }
        }
        
        // For Space key or other cases, show controls if not showing channel list
        if (!showControls && !showChannelList) {
          handleShowControls();
          
          // For Enter and Space, always focus on play button
          setFocusedControl('play');
          playButtonRef.current?.focus();
          
          // Prevent default action like page scrolling on space
          e.preventDefault();
        }
        
        // Reset the hide controls timer
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        
        // Only start a new timer if the video is playing and not showing channel list
        if (isPlaying && !showChannelList) {
          controlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }
      
      // Escape key should close channel list if open, otherwise close the player if not in fullscreen
      if (e.key === 'Escape') {
        e.preventDefault();
        console.log("Escape key pressed, showChannelList:", showChannelList, "isFullscreen:", isFullscreen);
        
        if (showChannelList) {
          // If channel list is open, just close it and STOP processing
          console.log("Closing channel list");
          toggleChannelList();
          return; // این خط کلیدی است - جلوی بستن پلیر را می‌گیرد
        } 
        
        // این قسمت فقط اجرا می‌شود اگر لیست کانال باز نباشد
        if (!isFullscreen) {
          // Only close player if channel list is already closed and not in fullscreen
          console.log("Closing player");
          onClose();
        }
      }
    };
    
    // Handle keyup for seekbar seeking
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && 
          focusedControl === 'seekbar' && 
          tempSeekPosition !== null && 
          seekingWithKeyboard) {
        
        // Apply the seek when key is released
        seekTo(tempSeekPosition);
        
        // Reset seeking state
        setSeekingWithKeyboard(false);
        setTempSeekPosition(null);
        setPreviewTime(null);
      }
    };
    
    // Add our keyboard event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [isPlaying, isFullscreen, onClose, showControls, focusedControl, currentTime, duration, seekingWithKeyboard, tempSeekPosition, isLive, showChannelList, selectedChannelIndex, channels]);

  // Handle seekbar click
  const handleSeekbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percent = offsetX / width;
    const newTime = percent * duration;
    
    seekTo(newTime);
    
    // Reset and restart the controls timer
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Create a trap focus system
  useEffect(() => {
    // Save the previously focused element
    const previousActiveElement = document.activeElement;
    
    // Create a style element to hide outline on body focus
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      body * {
        outline: none !important;
      }
      .player-modal * {
        outline: auto;
      }
      .player-modal .focused-control {
        outline: none !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Focus the container first to steal focus from any background element
    if (containerRef.current) {
      containerRef.current.focus();
      
      // Then move focus to the play button with a short delay
      setTimeout(() => {
        if (playButtonRef.current) {
          setFocusedControl('play');
          playButtonRef.current.focus();
        }
      }, 100);
    }
    
    // On cleanup, return focus to the previous element
    return () => {
      document.head.removeChild(styleElement);
      if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, []);

  // Set initial focus on play button when player opens
  useEffect(() => {
    // Short delay to ensure the button is rendered
    const timer = setTimeout(() => {
      if (playButtonRef.current) {
        setFocusedControl('play');
        playButtonRef.current.focus();
        
        // Ensure all keyboard events are captured within player
        if (containerRef.current) {
          containerRef.current.setAttribute('tabIndex', '-1');
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle clicks outside the player modal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // If click was outside the player modal
      const playerElement = document.querySelector('.player-modal');
      if (playerElement && !playerElement.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Refocus inside player
        if (focusedControl && focusedControl !== null) {
          switch(focusedControl) {
            case 'play':
              playButtonRef.current?.focus();
              break;
            case 'forward':
              forwardButtonRef.current?.focus();
              break;
            case 'backward':
              backwardButtonRef.current?.focus();
              break;
            case 'mute':
              muteButtonRef.current?.focus();
              break;
            case 'close':
              closeButtonRef.current?.focus();
              break;
            case 'seekbar':
              seekbarHandleRef.current?.focus();
              break;
            case 'live':
              liveButtonRef.current?.focus();
              break;
            default:
              // Default to play button
              setFocusedControl('play');
              playButtonRef.current?.focus();
              break;
          }
        } else {
          // If no focused control, focus the play button
          setFocusedControl('play');
          playButtonRef.current?.focus();
        }
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleOutsideClick, true);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
    };
  }, [focusedControl, isLive]);

  // به‌روزرسانی کانال‌ها هر زمان که از بیرون تغییر کنند
  useEffect(() => {
    if (liveChannels && liveChannels.length > 0) {
      console.log('Live channels updated:', liveChannels);
      setChannels(liveChannels);
      
      // اگر کانالی انتخاب نشده و یک کانال فعلی وجود دارد، آن را پیدا کنید
      if (!currentChannelId && url) {
        const currentChannelIndex = liveChannels.findIndex(channel => channel.url === url);
        if (currentChannelIndex >= 0) {
          setCurrentChannelId(liveChannels[currentChannelIndex].id);
          setSelectedChannelIndex(currentChannelIndex);
        }
      }
    }
  }, [liveChannels, currentChannelId, url]);

  return (
    <div 
      className="player-modal"
      onMouseDown={(e) => {
        // Prevent clicks from propagating outside player
        e.stopPropagation();
      }}
    >
      <div 
        ref={containerRef}
        className="video-container"
        tabIndex={-1}
        onMouseMove={handleShowControls}
        onClick={(e) => {
          // Check if the click is directly on the container (not a child)
          if (e.currentTarget === e.target) {
            togglePlayPause();
          }
        }}
        style={{ backgroundColor: 'black' }}
      >
        <video
          ref={videoRef}
          poster={poster}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            backgroundColor: 'black',
            visibility: 'visible'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlayPause();
          }}
          playsInline
          preload="auto"
          muted={isMuted}
          controls={false}
        />

        {/* Poster overlay for better visual during loading */}
        {loading && poster && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.8)',
            zIndex: 1,
            transition: 'opacity 0.3s ease'
          }} />
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="player-loading-overlay" style={{ zIndex: 2 }}>
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Skip overlay */}
        <div className={`skip-overlay ${skipOverlayVisible ? 'visible' : 'hidden'}`}>
          {skipDirection === 'forward' ? (
            <><FaForward /> 10s</>
          ) : (
            <><FaBackward /> 10s</>
          )}
        </div>

        {/* Custom controls */}
        {showControls && (
          <div 
            className="custom-controls" 
            onClick={(e) => {
              // Prevent clicks on the controls from propagating
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Prevent mousedown on the controls from propagating
              e.stopPropagation();
            }}
            style={{ 
              position: 'absolute', 
              bottom: '20px',
              left: '0',
              width: '100%',
              padding: '0 20px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10000
            }}
          >
            {/* Video title and close button */}
            <div style={{ 
              position: 'absolute',
              top: '20px',
              left: '0',
              width: '100%',
              padding: '0 20px',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>{title}</h3>
              <button 
                ref={closeButtonRef}
                className={`custom-control-button ${focusedControl === 'close' ? 'focused-control' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    onClose();
                  } catch (error) {
                    // Silently handle errors
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }
                }}
                onFocus={() => setFocusedControl('close')}
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  margin: 0, 
                  backgroundColor: '#ff3333',
                  color: 'white'
                }}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Main controls container */}
            <div style={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Control buttons - now above seekbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
                <button 
                  ref={forwardButtonRef}
                  className={`custom-control-button ${focusedControl === 'forward' ? 'focused-control' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    skipForward();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      skipForward();
                    }
                  }}
                  onFocus={() => setFocusedControl('forward')}
                  aria-label="Skip forward 10 seconds"
                >
                  <FaForward />
                </button>
                
                <button 
                  ref={playButtonRef}
                  className={`custom-control-button ${focusedControl === 'play' ? 'focused-control' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePlayPause();
                    }
                  }}
                  onFocus={() => setFocusedControl('play')}
                  style={{ width: '80px', height: '80px' }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                
                <button 
                  ref={backwardButtonRef}
                  className={`custom-control-button ${focusedControl === 'backward' ? 'focused-control' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    skipBackward();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      skipBackward();
                    }
                  }}
                  onFocus={() => setFocusedControl('backward')}
                  aria-label="Skip backward 10 seconds"
                >
                  <FaBackward />
                </button>
                
                {/* Mute button */}
                <button 
                  ref={muteButtonRef}
                  className={`custom-control-button ${focusedControl === 'mute' ? 'focused-control' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMute();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMute();
                    }
                  }}
                  onFocus={() => setFocusedControl('mute')}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                
                {/* Live button - only show for live streams */}
                {isLive && (
                  <button 
                    ref={liveButtonRef}
                    className={`custom-control-button ${focusedControl === 'live' ? 'focused-control' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Live button clicked');
                      seekToLiveEdge();
                    }}
                    onKeyDown={(e) => {
                      console.log('Live button key down:', e.key);
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        seekToLiveEdge();
                      }
                    }}
                    onFocus={() => {
                      console.log('Live button focused');
                      setFocusedControl('live');
                    }}
                    tabIndex={0}
                    data-testid="live-button"
                    style={{
                      backgroundColor: isAtLiveEdge ? '#ff0000' : 'rgba(255, 0, 0, 0.5)',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '0 10px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: 'none',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    aria-label="Go to live edge"
                  >
                    <span style={{ 
                      display: 'inline-block', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: isAtLiveEdge ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                      marginRight: '5px' 
                    }}></span>
                    LIVE
                  </button>
                )}
              </div>
              
              {/* Video progress bar */}
              <div style={{
                width: '100%',
                padding: '0',
                boxSizing: 'border-box',
                marginBottom: '5px',
                position: 'relative'
              }}>
                <div style={{
                  width: '100%',
                  height: '8px', /* Slightly taller for better visibility */
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  overflow: 'visible', /* Allow handle to overflow */
                  direction: 'ltr', /* Set direction explicitly to LTR */
                  position: 'relative'
                }}>
                  {/* Progress fill */}
                  <div style={{
                    width: `${(duration > 0) ? (currentTime / duration) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: '#3f75ff',
                    transition: 'width 0.1s',
                    float: 'left', /* Ensure progress bar fills from left to right */
                    borderRadius: '4px'
                  }}></div>
                  
                  {/* Seekbar handle */}
                  <div
                    ref={seekbarHandleRef}
                    className={`seekbar-handle ${focusedControl === 'seekbar' ? 'focused-control' : ''}`}
                    tabIndex={0}
                    style={{
                      position: 'absolute',
                      left: `${(duration > 0) ? (currentTime / duration) * 100 : 0}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '20px',
                      height: '20px',
                      backgroundColor: seekingWithKeyboard ? '#3f75ff' : 'white',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      boxShadow: seekingWithKeyboard ? '0 0 10px rgba(63, 117, 255, 0.8)' : '0 0 5px rgba(0, 0, 0, 0.5)',
                      border: `2px solid ${seekingWithKeyboard ? '#3f75ff' : 'white'}`,
                      transition: 'left 0.15s ease-out, background-color 0.2s, box-shadow 0.2s, border 0.2s'
                    }}
                    onFocus={() => setFocusedControl('seekbar')}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        handleSeekbarDrag(1);
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        handleSeekbarDrag(-1);
                      }
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Time display */}
              <div style={{ 
                width: '100%',
                padding: '0',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                fontSize: '14px',
                direction: 'ltr' /* Set time display direction to LTR */
              }}>
                <span>
                  {isLive ? (
                    seekingWithKeyboard && previewTime !== null ? (
                      <><span style={{color: '#3f75ff'}}>{formatTime(previewTime)}</span> / LIVE</>
                    ) : (
                      <>
                        {formatTime(currentTime)} / 
                        <span style={{color: isAtLiveEdge ? '#ff0000' : 'white'}}>LIVE</span>
                      </>
                    )
                  ) : (
                    seekingWithKeyboard && previewTime !== null ? (
                      <><span style={{color: '#3f75ff'}}>{formatTime(previewTime)}</span> / {formatTime(duration)}</>
                    ) : (
                      <>{formatTime(currentTime)} / {formatTime(duration)}</>
                    )
                  )}
                </span>
                <span>
                  {seekingWithKeyboard && previewTime !== null ? 
                    `→ ${previewTime > currentTime ? '+' : ''}${Math.round(previewTime - currentTime)}s` : 
                    (isLive && !isAtLiveEdge ? 'Behind live' : '')
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Channel List Overlay */}
        {showChannelList && (
          <div className="channel-list-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '60%',
              maxHeight: '80%',
              overflowY: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(5px)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                کانال‌های پخش زنده
              </h2>
              
              {/* Channel list items */}
              {channels.map((channel, index) => (
                <div
                  key={channel.id}
                  onClick={() => changeChannel(index)}
                  style={{
                    backgroundColor: selectedChannelIndex === index ? '#3f75ff' : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    margin: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    boxShadow: selectedChannelIndex === index ? '0 0 10px rgba(63, 117, 255, 0.5)' : 'none'
                  }}
                >
                  <img
                    src={channel.logo || 'https://via.placeholder.com/40'}
                    alt=""
                    style={{ 
                      width: '50px', 
                      height: '50px', 
                      marginRight: '15px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                  <span style={{ 
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: selectedChannelIndex === index ? 'bold' : 'normal'
                  }}>{channel.name}</span>
                </div>
              ))}
              
              <p style={{ 
                color: '#aaa', 
                fontSize: '14px', 
                textAlign: 'center', 
                marginTop: '20px',
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                lineHeight: '1.5'
              }}>
                با کلیدهای <strong style={{color: 'white'}}>↑</strong> و <strong style={{color: 'white'}}>↓</strong> یک کانال را انتخاب کنید<br/>
                با کلید <strong style={{color: 'white'}}>Enter</strong> کانال را پخش کنید<br/>
                با کلید <strong style={{color: 'white'}}>Esc</strong> از این منو خارج شوید
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShakaPlayerSimple;