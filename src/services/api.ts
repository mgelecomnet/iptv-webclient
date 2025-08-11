import axios from 'axios';
import { authAxios } from './authService';
import { API_BASE_URL } from '../config/apiConfig';

// Define types for API responses
export interface Movie {
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
  cast: Cast[];
  category: Category[];
  voiceList: Voice[];
  subtitleList: Subtitle[];
  ageRange: AgeRange[];
  slideImageList: SlideImage[];
}

export interface Cast {
  id: number;
  castName: string;
  castRole: string;
  castSlug: string | null;
  castImageUrl: string;
}

export interface Category {
  id: number;
  categoryName: string;
  categorySlug: string;
}

export interface Voice {
  id: number;
  name: string;
  displayLabel: string | null;
  languageCode: string;
}

export interface Subtitle {
  id: number;
  name: string;
  displayLabel: string | null;
  languageCode: string;
}

export interface AgeRange {
  id: number;
  caption: string;
  value: number;
  isKid: boolean;
}

export interface SlideImage {
  id: number;
  url: string;
  title: string;
}

export interface LatestMoviesSeries {
  latest_movies: Movie[];
  latest_series: Movie[];
}

export interface SearchResults {
  movies: Movie[];
  series: Movie[];
  tvchannels: any[];
}

// API functions
export const fetchLatestMoviesSeries = async (): Promise<LatestMoviesSeries> => {
  try {
    const response = await authAxios.get<LatestMoviesSeries>(`${API_BASE_URL}/latest-movies-series/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest movies and series:', error);
    throw error;
  }
};

export const searchContent = async (query: string): Promise<SearchResults> => {
  try {
    const response = await authAxios.get<SearchResults>(`${API_BASE_URL}/search-object/`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
};

export const fetchMovieById = async (id: number): Promise<Movie> => {
  try {
    const response = await authAxios.get<Movie>(`${API_BASE_URL}/movies/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch all details for a movie or series by ID
 * This function handles both movies and series types
 * For series, it will include seasons and episodes data
 * 
 * The API uses the same endpoint for both movies and series:
 * - You can identify series by checking response.type === 'Series'
 * - Series data includes seasons and episodes in the response.seasons array
 * - Each season contains an episodes array with detailed episode information
 */
export const fetchContentById = async (id: number): Promise<any> => {
  try {
    const response = await authAxios.get(`${API_BASE_URL}/movies/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching content with ID ${id}:`, error);
    throw error;
  }
};

export default {
  fetchLatestMoviesSeries,
  searchContent,
  fetchMovieById,
  fetchContentById
};