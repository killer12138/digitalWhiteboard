/**
 * Composable for constraining elements within board boundaries.
 * Prevents elements from being dragged outside their parent board.
 */

import type { App, UI } from 'leafer-ui';
import { useBoardStore } from '@/stores/board';
import type { Board } from '@/types/board';

export function useBoardConstraint() {
  const boardStore = useBoardStore();

  function getElementParentBoard(element: UI): Board | null {
    let current = element.parent;
    while (current) {
      const board = boardStore.boards.find(b => b.frame && b.frame.innerId === current?.innerId);
      if (board) {
        return board;
      }
      current = current.parent;
    }
    return null;
  }

  function constrainElementToBoard(element: UI, board: Board): void {
    if (!board.frame) return;

    const bounds = element.getBounds();
    const elementWidth = bounds.width;
    const elementHeight = bounds.height;

    const minX = 0;
    const minY = 0;
    const maxX = board.width - elementWidth;
    const maxY = board.height - elementHeight;

    const currentX = element.x ?? 0;
    const currentY = element.y ?? 0;

    let newX = currentX;
    let newY = currentY;

    if (currentX < minX) newX = minX;
    if (currentX > maxX) newX = Math.max(minX, maxX);
    if (currentY < minY) newY = minY;
    if (currentY > maxY) newY = Math.max(minY, maxY);

    if (newX !== currentX || newY !== currentY) {
      element.x = newX;
      element.y = newY;
    }
  }

  function setupMoveConstraint(app: App): () => void {
    const handleMove = () => {
      const selectedElements = app.editor?.list || [];

      selectedElements.forEach((element: UI) => {
        const parentBoard = getElementParentBoard(element);
        if (parentBoard) {
          constrainElementToBoard(element, parentBoard);
        }
      });
    };

    const eventId = app.editor?.on('move', handleMove);

    return () => {
      if (eventId !== undefined) {
        app.editor?.off('move', handleMove);
      }
    };
  }

  function isElementInBoard(element: UI): boolean {
    return getElementParentBoard(element) !== null;
  }

  function getActiveBoard(): Board | null {
    return boardStore.activeBoard;
  }

  return {
    getElementParentBoard,
    constrainElementToBoard,
    setupMoveConstraint,
    isElementInBoard,
    getActiveBoard
  };
}
