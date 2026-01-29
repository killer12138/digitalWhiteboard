/**
 * Canvas configuration constants for zoom, wheel, ruler, snap, and other canvas settings
 */

import { themeColors } from './theme';

export const canvasConfig = {
  theme: {
    fill: themeColors.primary,
    stroke: themeColors.primary,
    text: themeColors.text,
    background: themeColors.background,
    selectionBox: themeColors.secondary,
    controlPoint: themeColors.secondary,
    snapLineColor: themeColors.secondary
  },
  zoom: {
    min: 0.02,
    max: 256,
    default: 1 as number,
    step: 0.1
  },
  wheel: {
    zoomSpeed: 0.1
  },
  ruler: {
    enabled: true as boolean,
    theme: 'light' as 'light' | 'dark',
    unit: 'px' as string,
    ruleSize: 20,
    fontSize: 10
  },
  snap: {
    snapSize: 8,
    showDistanceLabels: true,
    showLine: true,
    showLinePoints: true,
    attachEvents: ['move', 'scale', 'resize'] as const
  }
} as const;

export type CanvasConfig = typeof canvasConfig;
