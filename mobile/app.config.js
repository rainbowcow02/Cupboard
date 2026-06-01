// app.config.js replaces app.json so we can add runtime `extra` values.
// Read in code via: import Constants from 'expo-constants'; Constants.expoConfig.extra.apiUrl
export default {
  expo: {
    name: 'Cupboard',
    slug: 'cupboard',
    scheme: 'cupboard',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.rainbowcow02.cupboard',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      '@react-native-community/datetimepicker',
      [
        '@rnmapbox/maps',
        {
          // Secret (sk.) token — only needed at EAS build time to download the Mapbox iOS SDK.
          // Set MAPBOX_SECRET_TOKEN in your EAS environment (eas secret:create) or local .env.
          RNMapboxMapsDownloadToken: process.env.MAPBOX_SECRET_TOKEN || '',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '2eda056f-6c2c-4254-af4d-2fcd3c89114b',
      },
      // Replace with your Vercel deployment URL (no trailing slash).
      apiUrl: process.env.API_URL || 'https://cupboard-coffee.vercel.app',
      // Public (pk.) Mapbox token — safe to commit, controls map tile access.
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoicmFpbmJvd2NvdzAyIiwiYSI6ImNtcGQ1ZnQ5ZjA3eHQydHBxenlnc29vbHcifQ.MsNu44eNhrXkFPRTVoj46g',
    },
  },
};
