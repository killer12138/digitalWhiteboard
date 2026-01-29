/**
 * Theme color configuration for the application.
 * Unified color palette for consistent UI styling.
 */

export const themeColors = {
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySuppl: '#60A5FA',

  secondary: '#F59E0B',

  text: '#1F2937',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',

  background: '#F3F4F6',
  backgroundWhite: '#FFFFFF',
  backgroundHover: '#F9FAFB',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const layoutColors = {
  toolbar: {
    background: themeColors.backgroundWhite,
    border: themeColors.border
  },
  sidebar: {
    background: themeColors.backgroundWhite,
    border: themeColors.border
  },
  canvas: {
    background: themeColors.background
  }
};

export type ThemeColors = typeof themeColors;
export type LayoutColors = typeof layoutColors;
