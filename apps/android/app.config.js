/** Release builds use a reachable API (LAN HTTP for preview, HTTPS for production) and a restricted Maps key. */
const appVersion = require('../../app-version.json');

module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT || 'development';
  const release = variant === 'preview' || variant === 'production';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (release && (!apiUrl || !/^https?:\/\//i.test(apiUrl))) {
    throw new Error('Set EXPO_PUBLIC_API_URL before creating an Android preview or production build.');
  }
  if (variant === 'production' && !apiUrl.startsWith('https://')) {
    throw new Error('Production Android builds require an HTTPS API URL.');
  }
  if (variant === 'production' && !mapsKey) {
    throw new Error('Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in the production EAS environment before building Android.');
  }
  if (variant === 'preview' && !mapsKey) {
    console.warn('Building Android preview without a Google Maps key; native map tiles may not load.');
  }

  return {
    ...config,
    version: appVersion.version,
    name: variant === 'preview' ? 'Walk with Me Preview' : 'Walk with Me',
    android: {
      ...config.android,
      usesCleartextTraffic: variant === 'preview' && apiUrl?.startsWith('http://'),
    },
    plugins: [
      ...(config.plugins || []),
      ...(mapsKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsKey }]] : []),
    ],
  };
};
