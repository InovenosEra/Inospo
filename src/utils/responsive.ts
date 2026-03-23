import { Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const BASE_W = 375; // iPhone SE / standard baseline
const BASE_H = 812; // iPhone X/11 baseline

export const SCREEN_W = W;
export const SCREEN_H = H;

export const isSmallDevice = W < 380;
export const isLargeDevice = W >= 428;

/** Proportional scale based on screen width */
export const scale = (size: number) => Math.round((W / BASE_W) * size);

/** Proportional scale based on screen height */
export const verticalScale = (size: number) => Math.round((H / BASE_H) * size);

/**
 * Moderate scale — blends fixed and proportional.
 * factor=0: no scaling. factor=1: full proportional scale.
 * Default 0.4 works well for font sizes.
 */
export const moderateScale = (size: number, factor = 0.4) =>
  Math.round(size + (scale(size) - size) * factor);
