/**
 * Board type definitions for multi-board functionality
 */

import type { Frame } from 'leafer-ui';
import type { CanvasObject } from '@/stores/canvas';

export interface Board {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  backgroundColor: string;
  frame: Frame | null;
  objects: CanvasObject[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardCreateOptions {
  name: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  backgroundColor?: string;
}

export interface BoardUpdateOptions {
  name?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export const DEFAULT_BOARD_SIZE: { width: number; height: number } = {
  width: 800,
  height: 600
};

export interface BoardPreset {
  name: string;
  width: number;
  height: number;
}

export const BOARD_PRESETS: BoardPreset[] = [
  { name: 'A4 竖向', width: 595, height: 842 },
  { name: 'A4 横向', width: 842, height: 595 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '800x600', width: 800, height: 600 },
  { name: '自定义', width: 0, height: 0 }
];
