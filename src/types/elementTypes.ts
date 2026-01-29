/**
 * Element type definitions and type guards
 */

import { ELEMENT_TYPES } from '@/constants';

export type ElementType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | 'group';

const VALID_ELEMENT_TYPES: readonly ElementType[] = [
  ELEMENT_TYPES.RECT,
  ELEMENT_TYPES.CIRCLE,
  ELEMENT_TYPES.LINE,
  ELEMENT_TYPES.ARROW,
  ELEMENT_TYPES.PEN,
  ELEMENT_TYPES.TEXT,
  ELEMENT_TYPES.IMAGE,
  ELEMENT_TYPES.GROUP
] as const;

export function isValidElementType(type: string): type is ElementType {
  return VALID_ELEMENT_TYPES.includes(type as ElementType);
}
