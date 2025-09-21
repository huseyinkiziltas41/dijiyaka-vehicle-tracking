import Constants from 'expo-constants';

// Environment configuration
const ENV = {
  dev: {
    API_BASE_URL: 'http://192.168.1.126:3000/api', // Local development
  },
  staging: {
    API_BASE_URL: 'https://dijiyaka-vehicle-tracking.onrender.com/api', // Staging server
  },
  prod: {
    API_BASE_URL: 'https://dijiyaka-vehicle-tracking.onrender.com/api', // Production server
  }
};

// Determine current environment
const getEnvVars = (env = Constants.releaseChannel) => {
  // What is __DEV__ ?
  // This variable is set to true when react-native is running in Dev mode.
  // __DEV__ is true when run locally, but false when published.
  if (__DEV__) {
    return ENV.dev;
  } else if (env === 'staging') {
    return ENV.staging;
  } else if (env === 'prod') {
    return ENV.prod;
  } else {
    return ENV.prod; // Default to production
  }
};

export default getEnvVars;
