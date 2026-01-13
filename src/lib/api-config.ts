// API Configuration
// Uses environment variable in production, localhost in development
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If no environment variable, use localhost for development
  if (!envUrl) {
    return 'http://localhost:8000';
  }
  
  // Ensure the URL has a protocol (http:// or https://)
  // If it doesn't start with http:// or https://, add https://
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    console.warn('VITE_API_URL missing protocol, adding https://');
    return `https://${envUrl}`;
  }
  
  // Remove trailing slash if present
  return envUrl.replace(/\/$/, '');
};

export const API_BASE_URL = getApiUrl();

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}
