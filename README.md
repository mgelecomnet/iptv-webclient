
[![IPTV Web Client](src/image/logo/1.png)](https://github.com/mgelecomnet/iptv-webclient)

# IPTV Web Client

A modern web client for streaming IPTV channels, movies, and series. Built with React, TypeScript, Vite, and Tailwind CSS, this project provides a fast, responsive, and user-friendly interface for accessing live TV and video content.

## Features

- **Live TV Streaming:** Watch live TV channels with integrated Shaka Player.
- **Movies & Series:** Browse, search, and view details for movies and series.
- **User Authentication:** Secure login and protected routes using context-based authentication.
- **Responsive Design:** Optimized for desktop and mobile devices.
- **Category Browsing:** Explore content by categories.
- **Profile Management:** View and edit user profile information.
- **Search Functionality:** Quickly find channels, movies, or series.
- **Modern UI:** Built with Tailwind CSS for a clean and customizable look.

## Technologies Used

- **React** (TypeScript & JavaScript)
- **Vite** (for fast development and build)
- **Tailwind CSS** (for styling)
- **Shaka Player** (for video streaming)
- **Context API** (for state management)

## Project Structure

```
src/
  assets/         # Images, fonts, icons
  components/     # Reusable UI components
  config/         # API configuration
  contexts/       # React context providers (e.g., Auth)
  image/          # Channel and app images
  pages/          # Main app pages (Home, Live, Movies, Series, Profile, etc.)
  services/       # API service modules
  utils/          # Utility functions
public/           # Static files
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
  ```sh
  git clone https://github.com/mgelecomnet/iptv-webclient.git
  cd iptv-webclient
  ```
2. **Install dependencies:**
  ```sh
  npm install
  # or
  yarn install
  ```
3. **Start the development server:**
  ```sh
  npm run dev
  # or
  yarn dev
  ```
4. **Open in browser:**
  Visit `http://localhost:5173` (default Vite port)

## Configuration

- **API Endpoints:**
  - Configure API URLs in `src/config/apiConfig.ts`.
- **Environment Variables:**
  - Create a `.env` file for sensitive data (if needed).

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build

## Customization

- **Add Channels/Images:** Place new images in `src/image/` or `src/image/logo/`.
- **Update Styles:** Edit Tailwind config in `tailwind.config.js` and custom CSS files.
- **Add Pages/Components:** Create new files in `src/pages/` or `src/components/`.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, contact [mgelecomnet](https://github.com/mgelecomnet).
