import React, { createContext, useContext, useState } from 'react';

const light = {
  mode: 'light',
  bg:          '#FFFFFF',
  bgSecondary: '#F5F5F7',
  bgCard:      '#FFFFFF',
  border:      '#E0E0E0',
  text:        '#1A1A1A',
  textSub:     '#6B6B6B',
  navBg:       '#FFFFFF',
  navBorder:   '#E0E0E0',
  headerBg:    '#E24B4A',
  headerText:  '#FFFFFF',
  chipActive:  '#FCEBEB',
  chipActiveTxt:'#A32D2D',
  chipBorder:  '#E24B4A',
  primary:     '#E24B4A',
  callBtn:     '#1D9E75',
};

const dark = {
  mode: 'dark',
  bg:          '#111111',
  bgSecondary: '#1E1E1E',
  bgCard:      '#1E1E1E',
  border:      '#2C2C2C',
  text:        '#F0F0F0',
  textSub:     '#9A9A9A',
  navBg:       '#1A1A1A',
  navBorder:   '#2C2C2C',
  headerBg:    '#8B1A1A',
  headerText:  '#FFFFFF',
  chipActive:  '#3A1A1A',
  chipActiveTxt:'#F28B8B',
  chipBorder:  '#C23B3B',
  primary:     '#F28B8B',
  callBtn:     '#145E47',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? dark : light;
  const toggle = () => setIsDark(v => !v);
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);