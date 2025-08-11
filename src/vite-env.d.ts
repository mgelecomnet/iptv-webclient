/// <reference types="vite/client" />

// Declare module for shaka-player
declare module 'shaka-player/dist/shaka-player.ui.js' {
  const shaka: any;
  export default shaka;
}

declare module 'shaka-player' {
  const shaka: any;
  export default shaka;
}
