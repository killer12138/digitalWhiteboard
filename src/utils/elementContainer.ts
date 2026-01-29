/**
 * Utility for determining the correct container for new elements.
 * If there's an active board, elements should be added to its frame.
 */

import type { UI } from 'leafer-ui';
import { useBoardStore } from '@/stores/board';
import type { Tree } from '@/types';

export function getElementContainer(tree: Tree): Tree | UI {
  const boardStore = useBoardStore();
  const activeBoard = boardStore.activeBoard;

  if (activeBoard?.frame) {
    return activeBoard.frame;
  }

  return tree;
}

export function addElementToContainer(tree: Tree, element: UI): void {
  const container = getElementContainer(tree);
  container.add(element);
}

export function removeElementFromContainer(tree: Tree, element: UI): void {
  const container = getElementContainer(tree);
  container.remove(element);
}

export function convertToLocalCoordinates(
  tree: Tree,
  worldX: number,
  worldY: number
): { x: number; y: number } {
  const boardStore = useBoardStore();
  const activeBoard = boardStore.activeBoard;

  if (activeBoard?.frame) {
    const frameX = activeBoard.frame.x ?? 0;
    const frameY = activeBoard.frame.y ?? 0;
    return {
      x: worldX - frameX,
      y: worldY - frameY
    };
  }

  return { x: worldX, y: worldY };
}
