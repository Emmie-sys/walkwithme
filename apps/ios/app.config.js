/** Keep release builds pointed at a reachable HTTPS API; iOS uses the native map provider. */
const appVersion = require('../../app-version.json');

module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT || 'development';
  const release = variant === 'preview' || variant === 'production';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (release && (!apiUrl || !apiUrl.startsWith('https://'))) {
    throw new Error('Set EXPO_PUBLIC_API_URL to an HTTPS API before creating an iOS preview or production build. iOS does not allow the local HTTP API in release builds.');
  }

  return {
    ...config,
    version: appVersion.version,
    name: variant === 'preview' ? 'Walk with Me Preview' : 'Walk with Me',
  };
};
