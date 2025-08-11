/**
 * Utility to handle device pixel ratio scaling
 * This helps with proper scaling on Android TV and other high DPR devices
 */

export function setupDeviceScaling(): void {
  // Get the device pixel ratio
  const pixelRatio: number = window.devicePixelRatio || 1;
  
  // Calculate the scaling factor based on the pixel ratio
  let scaleFactor: number = 1;
  let uiScaleFactor: number = 1; // مقیاس جداگانه برای المان‌های رابط کاربری
  
  if (pixelRatio >= 2) {
    // For very high pixel ratios (like 2 or more)
    scaleFactor = 0.5;
    uiScaleFactor = 0.6; // کمی بزرگتر از مقیاس اصلی برای خوانایی بهتر
  } else if (pixelRatio >= 1.7) {
    // For high pixel ratios (like 1.7 on many Android TVs)
    scaleFactor = 0.65; // Reduced from 0.6 for better filling of screen
    uiScaleFactor = 0.65;
  } else if (pixelRatio >= 1.5) {
    // For medium-high pixel ratios
    scaleFactor = 0.65; // Reduced from 0.7 for better filling of screen
    uiScaleFactor = 0.75;
  } else if (pixelRatio >= 1.2) {
    // For slightly higher than normal pixel ratios
    scaleFactor = 0.85;
    uiScaleFactor = 0.9;
  }
  
  // Apply the scaling factors to CSS variables
  document.documentElement.style.setProperty('--scale-factor', scaleFactor.toString());
  document.documentElement.style.setProperty('--ui-scale-factor', uiScaleFactor.toString());
  
  console.log(`Device pixel ratio: ${pixelRatio}, Applied scale factor: ${scaleFactor}, UI scale: ${uiScaleFactor}`);
  
  // Listen for changes in orientation or window size
  window.addEventListener('resize', () => {
    // Re-check the pixel ratio (in case of orientation change on some devices)
    const updatedPixelRatio: number = window.devicePixelRatio || 1;
    
    // If it changed, update the scaling factor
    if (updatedPixelRatio !== pixelRatio) {
      setupDeviceScaling();
    }
    
    // Update movies per row calculation if needed
    updateGridLayout();
  });
}

// Function to detect if the device is likely an Android TV
export function isAndroidTV(): boolean {
  const userAgent: string = navigator.userAgent.toLowerCase();
  
  // Common Android TV identifiers in user agent
  const androidTVIdentifiers: string[] = [
    'android tv',
    'androidtv',
    'smart-tv',
    'googletv',
    'nexus player',
    'nvidia shield',
    'bravia',
    'philips tv',
    'hisense tv',
    'mibox',
    'mi box',
    'fire tv'
  ];
  
  // Check for Android TV identifiers
  const isTV: boolean = androidTVIdentifiers.some(identifier => userAgent.includes(identifier));
  
  // Additional check for large screen and Android
  const isAndroid: boolean = userAgent.includes('android');
  const hasLargeScreen: boolean = window.innerWidth >= 1280 && window.innerHeight >= 720;
  const hasHighDPR: boolean = window.devicePixelRatio >= 1.5;
  
  // Check for TV mode based on screen size and orientation
  const isLikelyTV: boolean = window.innerWidth > window.innerHeight && 
                              window.innerWidth >= 1280 && 
                              window.innerHeight >= 720;
  
  return isTV || (isAndroid && hasLargeScreen) || (isAndroid && hasHighDPR && isLikelyTV);
}

// Function to apply specific TV optimizations
export function applyTVOptimizations(): void {
  if (isAndroidTV()) {
    // Add a class to the body for TV-specific CSS
    document.body.classList.add('tv-device');
    
    // Additional TV-specific adjustments
    document.documentElement.style.setProperty('--tv-navigation-focus-color', '#007bff');
    document.documentElement.style.setProperty('--tv-focus-scale', '1.1');
    
    // Ensure the content fills the entire screen on TV
    document.documentElement.style.setProperty('--content-fill', '1');
    
    console.log('Android TV detected, applying TV optimizations');
    
    // Force full screen mode for TV
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Error attempting to enable full-screen mode:', err);
      });
    }
  }
}

// Function to calculate and update grid layout variables
export function updateGridLayout(): void {
  const width = window.innerWidth;
  const scaleFactor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale-factor')) || 1;
  const uiScaleFactor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale-factor')) || scaleFactor;
  
  // Calculate the available content width (90% of viewport width)
  const contentWidth = width * 0.9; // 90% of viewport width
  
  // Calculate gap and base tile width - increased tile width for better visibility
  const tileGap = 15 * scaleFactor; // Gap between tiles
  const optimalTileWidth = 180 * scaleFactor; // Increased from 160 for larger tiles
  
  // Calculate how many tiles can fit in the content area
  // Account for the gap between tiles by subtracting one gap width from total space
  // and adding a gap to each tile's effective width
  const availableWidth = contentWidth - tileGap; // Account for edge gap
  const effectiveTileWidth = optimalTileWidth + tileGap;
  const tilesPerRow = Math.max(1, Math.floor(availableWidth / effectiveTileWidth));
  
  // Calculate actual tile width to distribute space evenly
  // Subtract total gap space, then divide by number of tiles
  const totalGapWidth = (tilesPerRow - 1) * tileGap;
  const actualTileWidth = (contentWidth - totalGapWidth) / tilesPerRow;
  
  // Set CSS variables for grid layout
  document.documentElement.style.setProperty('--movies-per-row', tilesPerRow.toString());
  document.documentElement.style.setProperty('--tile-base-width', `${actualTileWidth}px`);
  document.documentElement.style.setProperty('--grid-gap', `${tileGap}px`);
  document.documentElement.style.setProperty('--content-width', `${contentWidth}px`);
  
  // Set sidebar width proportional to screen size
  const sidebarWidth = Math.max(80, Math.min(120, width * 0.1)); // Between 80px and 120px
  document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  
  // Set UI element sizes based on UI scale factor
  document.documentElement.style.setProperty('--button-scale', uiScaleFactor.toString());
  document.documentElement.style.setProperty('--text-scale', uiScaleFactor.toString());
  
  console.log(`Screen width: ${width}px, Content width: ${contentWidth}px, Tiles per row: ${tilesPerRow}, Tile width: ${actualTileWidth.toFixed(2)}px, Gap: ${tileGap}px`);
}

// Export a combined initialization function
export function initDeviceOptimizations(): void {
  setupDeviceScaling();
  applyTVOptimizations();
  updateGridLayout();
}