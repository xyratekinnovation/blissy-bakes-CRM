// API Configuration
// Uses environment variable in production, localhost in development
const getApiUrl = () => {
  // In production, use VITE_API_URL environment variable
  // In development, default to localhost:8000
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();
