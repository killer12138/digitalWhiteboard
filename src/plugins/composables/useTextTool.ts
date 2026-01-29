/**
 * Text tool composable for adding text elements on canvas
 */

import type { PointerEvent } from 'leafer-ui';
import { Text } from 'leafer-ui';
import { TOOL_TYPES } from '@/constants';
import type { useCanvasStore } from '@/stores/canvas';
import type { Tree } from '@/types';
import { addElementToContainer, convertToLocalCoordinates } from '@/utils/elementContainer';

export function useTextTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  function handleTap(e: PointerEvent) {
    if (!tree) return;
    const point = e.getPagePoint();
    const localCoords = convertToLocalCoordinates(tree, point.x, point.y);

    const text = new Text({
      x: localCoords.x,
      y: localCoords.y,
      text: '双击编辑文本',
      fontSize: store.fontSize,
      fill: store.textColor,
      editable: true
    });

    addElementToContainer(tree, text);

    const id = `text-${Date.now()}`;
    store.addObject({
      id,
      type: 'text',
      element: text
    });

    store.setTool(TOOL_TYPES.SELECT);
    store.selectObject(id);
  }

  return {
    handleTap
  };
}
