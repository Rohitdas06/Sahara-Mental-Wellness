// // Configuration for different environments
// const config = {
//   development: {
//     BACKEND_URL: "http://localhost:3001"
//   },
//   production: {
//     BACKEND_URL: "https://sahara-mental-wellness.onrender.com/api"
//   }
// };

// // Get the current environment
// const environment = import.meta.env.MODE || 'development';

// // Export the appropriate config
// export const BACKEND_URL = config[environment].BACKEND_URL;

// // For Vercel deployment, use the full URL
// export const CURRENT_BACKEND_URL = environment === 'production' ? "https://sahara-mental-wellness.onrender1.com/api" : "http://localhost:3001";




// src/config.js

// Use backend URL environment variable from Vite (VITE_BACKEND_URL), or fallback to localhost for development
export const CURRENT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Optionally export app info from env variables
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sahara Mental Wellness';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

