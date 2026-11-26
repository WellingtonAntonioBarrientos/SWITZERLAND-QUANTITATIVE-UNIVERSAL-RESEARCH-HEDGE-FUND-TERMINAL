export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Dev-only error logger (silenced in production builds)
export const logError = (...args) => {
  if (process.env.NODE_ENV === 'development') console.error(...args);
};
