// Series API service for fetching series with pagination
import { authAxios } from './authService';
import { API_BASE_URL } from '../config/apiConfig';

export interface SeriesType {
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

export interface SeriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SeriesType[];
}

/**
 * Fetch series with pagination and optional filters
 * @param page Page number to fetch
 * @param pageSize Number of items per page
 * @param ordering Field to order by (e.g. 'publishDate', '-publishDate', 'imdb', '-imdb')
 * @param category Category slug to filter by
 * @param search Search query
 * @returns Promise with paginated series response
 */
export async function fetchSeries(
  page: number = 1, 
  pageSize: number = 10,
  ordering: string = '-publishDate',
  category?: string,
  search?: string
): Promise<SeriesResponse> {
  try {
    // Hard limit - if we know page 3 doesn't exist, return empty results immediately
    if (page >= 3) {
      console.log(`Page ${page} is beyond known available data, returning empty results`);
      return {
        count: (page - 1) * pageSize, // Estimate the count based on previous pages
        next: null,
        previous: `${API_BASE_URL}/movies/?page=${page-1}`,
        results: []
      };
    }
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    params.append('type', 'series'); // Always fetch series
    
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
    
    try {
      const response = await authAxios.get(`/movies/?${params.toString()}`);
      return response.data;
    } catch (error) {
      // If we get an error on a page > 1, return empty results
      if (page > 1) {
        console.log(`Error for page ${page}, returning empty results`);
        return {
          count: (page - 1) * pageSize, // Estimate the count based on previous pages
          next: null,
          previous: `${API_BASE_URL}/movies/?page=${page-1}`,
          results: []
        };
      }
      
      // Only throw errors for page 1
      throw error;
    }
  } catch (error) {
    console.error('Error fetching series:', error);
    throw error;
  }
}