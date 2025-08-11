// TVChannel API service for fetching TV channel data
import { authAxios } from './authService';
import { API_BASE_URL } from '../config/apiConfig';

export interface TVChannelType {
  id: number;
  name: string;
  latin_name?: string;
  logo?: string;
  stream_url: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  order: number;
  categories: {
    id: number;
    name: string;
  }[];
}

/**
 * Fetch all active TV channels
 * @returns Promise with all TV channels
 */
export async function fetchAllTVChannels(): Promise<TVChannelType[]> {
  try {
    const response = await authAxios.get(`${API_BASE_URL}/tv-channels/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all TV channels:', error);
    throw error;
  }
}

/**
 * Fetch featured TV channels (up to 10)
 * @returns Promise with featured TV channels
 */
export async function fetchFeaturedTVChannels(): Promise<TVChannelType[]> {
  try {
    const response = await authAxios.get(`${API_BASE_URL}/featured-tv-channels/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching featured TV channels:', error);
    throw error;
  }
}