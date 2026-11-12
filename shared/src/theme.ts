import { Platform } from 'react-native';

/** Shared visual tokens keep screens consistent and allow a future brand refresh in one place. */
export const colors = {
  primary: '#0B5D4B', primarySoft: '#E3F0EC', ink: '#17211E', muted: '#5B6762',
  canvas: '#F5F6F4', surface: '#FFFFFF', line: '#DDE2DF', warning: '#F2B544',
  danger: '#B42318', dangerSoft: '#FCE8E6', success: '#2E7D32', map: '#EAF0EC',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };
export const shadow = Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 2 } });
