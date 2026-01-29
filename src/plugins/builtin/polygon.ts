/**
 * Polygon tool plugin for creating custom shapes by clicking points
 */

import { usePolygonTool } from '../composables/usePolygonTool';
import type { ToolPlugin } from '../types';

export const polygonPlugin: ToolPlugin = {
  id: 'polygon',
  name: 'Polygon Tool',
  type: 'polygon',
  metadata: {
    version: '1.0.0',
    description: 'Create custom polygon shapes by clicking to add points'
  },
  category: 'drawing',
  capabilities: {
    requiresDrawMode: true,
    handlesTap: true,
    handlesMove: true,
    handlesDoubleTap: true
  },
  ui: {
    label: '多边形工具',
    iconComponent: 'i-lucide-pentagon'
  },
  shortcut: 'KeyG',
  createTool: context => {
    const polygonTool = usePolygonTool(
      context.tree,
      context.store,
      context.startPoint,
      context.currentElement
    );

    return {
      onActivate: () => {
        // Reset state when tool is activated
      },
      onDeactivate: () => {
        polygonTool.cancelDrawing();
      },
      handleTap: polygonTool.handleTap,
      handleMove: polygonTool.handleMove,
      handleDoubleTap: polygonTool.handleDoubleTap
    };
  }
};
