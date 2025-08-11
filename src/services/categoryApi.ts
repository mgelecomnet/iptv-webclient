// Category API service for fetching VOD categories and movies by category
import { authAxios } from './authService';
import { API_BASE_URL } from '../config/apiConfig';

export interface CategoryType {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  mainCategoryGroupId: number;
}

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

export interface CategoryMoviesResponse {
  category: CategoryType;
  movies: MovieType[];
}

/**
 * Fetch all VOD categories
 * @returns Promise with all categories
 */
export async function fetchAllCategories(): Promise<CategoryType[]> {
  try {
    const response = await authAxios.get('/vod-categories/');
    return response.data;
  } catch (error) {
    console.error('Error fetching VOD categories:', error);
    throw error;
  }
}

/**
 * Fetch movies by category ID
 * @param categoryId The ID of the category to fetch movies for
 * @returns Promise with the category and its movies
 */
export async function fetchMoviesByCategory(categoryId: number): Promise<CategoryMoviesResponse> {
  try {
    const response = await authAxios.get(`/category-movies/${categoryId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movies for category ${categoryId}:`, error);
    throw error;
  }
}