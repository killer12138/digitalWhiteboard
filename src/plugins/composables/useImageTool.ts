/**
 * Image tool composable for adding image elements on canvas
 */

import type { PointerEvent } from 'leafer-ui';
import { Image } from 'leafer-ui';
import { TOOL_TYPES } from '@/constants';
import { useHistory } from '@/plugins/composables/useHistory';
import type { useCanvasStore } from '@/stores/canvas';
import type { Tree } from '@/types';
import { addElementToContainer, convertToLocalCoordinates } from '@/utils/elementContainer';

export function useImageTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  const { addSnapshot } = useHistory();

  function handleTap(e: PointerEvent) {
    const point = e.getPagePoint();
    const localCoords = convertToLocalCoordinates(tree, point.x, point.y);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file || !tree) return;

      const url = URL.createObjectURL(file);

      const img = new Image({
        x: localCoords.x,
        y: localCoords.y,
        url,
        editable: true
      });

      addElementToContainer(tree, img);

      const id = `image-${Date.now()}`;
      store.addObject({
        id,
        type: 'image',
        element: img
      });

      store.setTool(TOOL_TYPES.SELECT);
      store.selectObject(id);

      addSnapshot();
    };
    input.click();
  }

  return {
    handleTap
  };
}
