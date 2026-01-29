/**
 * Polygon tool composable for creating custom shapes by clicking points.
 * Click to add points, double-click or close path to finish the shape.
 */

import type { PointerEvent } from 'leafer-ui';
import { Line, Path } from 'leafer-ui';
import type { Ref } from 'vue';
import { ref } from 'vue';
import { TOOL_TYPES } from '@/constants';
import type { useCanvasStore } from '@/stores/canvas';
import type { LeaferElement, Point, Tree } from '@/types';
import { addElementToContainer } from '@/utils/elementContainer';

const CLOSE_DISTANCE_THRESHOLD = 15;

export function usePolygonTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>
) {
  const points = ref<Point[]>([]);
  const previewLine = ref<Line | null>(null);
  const isDrawing = ref(false);

  function getPointsPath(): string {
    if (points.value.length === 0) return '';

    let pathStr = `M ${points.value[0].x} ${points.value[0].y}`;
    for (let i = 1; i < points.value.length; i++) {
      pathStr += ` L ${points.value[i].x} ${points.value[i].y}`;
    }
    return pathStr;
  }

  function updatePreviewPath(): void {
    if (!currentElement.value || points.value.length === 0) return;

    const pathStr = getPointsPath();
    (currentElement.value as Path).path = pathStr;
  }

  function updatePreviewLine(currentX: number, currentY: number): void {
    if (!tree || points.value.length === 0) return;

    const lastPoint = points.value[points.value.length - 1];

    if (previewLine.value) {
      previewLine.value.points = [lastPoint.x, lastPoint.y, currentX, currentY];
    } else {
      previewLine.value = new Line({
        points: [lastPoint.x, lastPoint.y, currentX, currentY],
        stroke: store.strokeColor,
        strokeWidth: store.strokeWidth,
        dashPattern: [5, 5],
        opacity: 0.5
      });
      tree.add(previewLine.value);
    }
  }

  function removePreviewLine(): void {
    if (previewLine.value && tree) {
      tree.remove(previewLine.value);
      previewLine.value = null;
    }
  }

  function isCloseToStart(x: number, y: number): boolean {
    if (points.value.length < 3) return false;

    const firstPoint = points.value[0];
    const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
    return distance < CLOSE_DISTANCE_THRESHOLD;
  }

  function handleTap(e: PointerEvent): void {
    if (!tree) return;

    const point = e.getPagePoint();
    const newPoint = { x: point.x, y: point.y };

    if (isCloseToStart(point.x, point.y) && points.value.length >= 3) {
      finishDrawing(true);
      return;
    }

    points.value.push(newPoint);

    if (points.value.length === 1) {
      isDrawing.value = true;

      const pathElement = new Path({
        path: `M ${point.x} ${point.y}`,
        stroke: store.strokeColor,
        strokeWidth: store.strokeWidth,
        fill: store.fillColor,
        editable: true
      });

      currentElement.value = pathElement;
      addElementToContainer(tree, pathElement);
    } else {
      updatePreviewPath();
    }
  }

  function handleMove(e: PointerEvent): void {
    if (!isDrawing.value || points.value.length === 0) return;

    const point = e.getPagePoint();
    updatePreviewLine(point.x, point.y);
  }

  function handleDoubleTap(): void {
    if (points.value.length >= 2) {
      finishDrawing(false);
    }
  }

  function finishDrawing(closePath: boolean): void {
    if (!currentElement.value || points.value.length < 2) {
      cancelDrawing();
      return;
    }

    removePreviewLine();

    let pathStr = getPointsPath();
    if (closePath && points.value.length >= 3) {
      pathStr += ' Z';
    }

    (currentElement.value as Path).path = pathStr;

    const id = `polygon-${Date.now()}`;
    store.addObject({
      id,
      type: 'polygon' as any,
      element: currentElement.value
    });

    store.setTool(TOOL_TYPES.SELECT);
    store.selectObject(id);

    resetState();
  }

  function cancelDrawing(): void {
    removePreviewLine();

    if (currentElement.value && tree) {
      tree.remove(currentElement.value);
    }

    resetState();
  }

  function resetState(): void {
    points.value = [];
    currentElement.value = null;
    isDrawing.value = false;
  }

  return {
    points,
    isDrawing,
    handleTap,
    handleMove,
    handleDoubleTap,
    finishDrawing,
    cancelDrawing
  };
}
