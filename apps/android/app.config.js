/** Inject the Android Maps key at build time; never commit the university's provider key. */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? [['react-native-maps', {
      androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    }]] : []),
  ],
});
