import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';

/** Semantic color tokens shared across screens and mapped to system appearance. */
export const palettes = {
  light: {
    primary: '#0B5D4B', primarySoft: '#E3F0EC', ink: '#17211E', muted: '#5B6762',
    canvas: '#F5F6F4', surface: '#FFFFFF', line: '#DDE2DF', warning: '#F2B544',
    danger: '#B42318', dangerSoft: '#FCE8E6', success: '#2E7D32', map: '#EAF0EC', warningSoft: '#FCEFCF',
    fieldBorder: '#B8C0BC', fieldSurface: '#FFFFFF', amberText: '#7A5200',
    onPrimary: '#FFFFFF', mapRoad: '#FFFFFF',
  },
  dark: {
    primary: '#73D6B4', primarySoft: '#183C33', ink: '#F0F5F2', muted: '#A8B5AF',
    canvas: '#101714', surface: '#19221E', line: '#2E3A34', warning: '#F2C66D',
    danger: '#FF8279', dangerSoft: '#472622', success: '#8AD39B', map: '#202B26', warningSoft: '#463719',
    fieldBorder: '#405048', fieldSurface: '#202B26', amberText: '#F2D18D',
    onPrimary: '#0D211A', mapRoad: '#34443B',
  },
} as const;

export type ColorPalette = (typeof palettes)[keyof typeof palettes];
export type AppTheme = { scheme: 'light' | 'dark'; colors: ColorPalette };
export const ThemeContext = createContext<AppTheme>({ scheme: 'light', colors: palettes.light });
export const useTheme = () => useContext(ThemeContext);

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };
export const shadow = Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 2 } });
