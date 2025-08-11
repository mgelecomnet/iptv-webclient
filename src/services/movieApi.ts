// Movie API service for fetching movies with pagination
import { authAxios } from './authService';
import { API_BASE_URL } from '../config/apiConfig';

export interface MovieType {
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

export interface MoviesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MovieType[];
}

/**
 * Fetch movies with pagination and optional filters
 * @param page Page number to fetch
 * @param pageSize Number of items per page
 * @param type Type of content ('movie' or 'series')
 * @param ordering Field to order by (e.g. 'publishDate', '-publishDate', 'imdb', '-imdb')
 * @param category Category slug to filter by
 * @param search Search query
 * @returns Promise with paginated movies response
 */
export async function fetchMovies(
  page: number = 1, 
  pageSize: number = 10, 
  type: string = 'movie',
  ordering: string = '-publishDate',
  category?: string,
  search?: string
): Promise<MoviesResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (type) {
      params.append('type', type);
    }
    
    if (ordering) {
      params.append('ordering', ordering);
    }
    
    if (category) {
      params.append('category', category);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    // Add a timestamp to prevent caching
    params.append('_nocache', Date.now().toString());
    
    // Use authAxios instead of fetch to include authentication token
    const response = await authAxios.get(`/movies/?${params.toString()}`);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
}