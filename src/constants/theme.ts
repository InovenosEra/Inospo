import { moderateScale, scale } from '@/utils/responsive';

export const Colors = {
  // Backgrounds
  background: '#0B1124',
  surface: '#111827',
  card: '#1A2340',
  cardElevated: '#1E2D4A',
  overlay: 'rgba(11, 17, 36, 0.9)',

  // Brand
  primary: '#D4AF37',       // Gold
  primaryLight: '#F5C518',
  primaryDim: 'rgba(212, 175, 55, 0.15)',
  accent: '#22C55E',        // Green
  accentDim: 'rgba(34, 197, 94, 0.15)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B1124',

  // Status
  live: '#EF4444',
  liveDim: 'rgba(239, 68, 68, 0.15)',
  win: '#22C55E',
  draw: '#F59E0B',
  loss: '#EF4444',

  // Borders
  border: '#1E2D4A',
  borderLight: '#2A3A5A',

  // Tabs
  tabActive: '#D4AF37',
  tabInactive: '#64748B',
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  xs: moderateScale(11),
  sm: moderateScale(13),
  base: moderateScale(15),
  md: moderateScale(17),
  lg: moderateScale(20),
  xl: moderateScale(24),
  xxl: moderateScale(30),
  xxxl: moderateScale(36),
};

export const Shadows = {
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
