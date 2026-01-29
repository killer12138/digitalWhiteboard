/**
 * Context menu composable for managing right-click menu state and actions
 */

import { ref, computed } from 'vue';
import { useGroupTool } from './useGroupTool';
import { useLayerControl } from './useLayerControl';
import { useHistory } from '@/plugins/composables/useHistory';
import { useCanvasStore } from '@/stores/canvas';
import type { LeaferElement } from '@/types';

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  targetElement: LeaferElement | null;
}

export function useContextMenu() {
  const store = useCanvasStore();
  const { addSnapshot } = useHistory();
  const groupTool = useGroupTool();
  const layerControl = useLayerControl();

  const menuState = ref<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    targetElement: null
  });

  const hasSelectedElements = computed(() => {
    const app = store.appInstance;
    if (!app?.editor) return false;
    return (app.editor.list?.length ?? 0) > 0;
  });

  const selectedElementsCount = computed(() => {
    const app = store.appInstance;
    if (!app?.editor) return 0;
    return app.editor.list?.length ?? 0;
  });

  const canGroup = computed(() => groupTool.canGroup());
  const canUngroup = computed(() => groupTool.canUngroup());

  const canBringForward = computed(() => {
    if (!menuState.value.targetElement) return false;
    return layerControl.canBringForward(menuState.value.targetElement);
  });

  const canSendBackward = computed(() => {
    if (!menuState.value.targetElement) return false;
    return layerControl.canSendBackward(menuState.value.targetElement);
  });

  function showContextMenu(x: number, y: number, element: LeaferElement | null = null) {
    menuState.value = {
      show: true,
      x,
      y,
      targetElement: element
    };
  }

  function hideContextMenu() {
    menuState.value.show = false;
  }

  function handleCopy() {
    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    if (selectedElements.length === 0) return;

    const jsonData = selectedElements.map(el => el.toJSON());
    localStorage.setItem('wl-draw-clipboard', JSON.stringify(jsonData));

    hideContextMenu();
  }

  function handlePaste() {
    const app = store.appInstance;
    if (!app?.tree) return;

    const clipboardData = localStorage.getItem('wl-draw-clipboard');
    if (!clipboardData) return;

    try {
      const elements = JSON.parse(clipboardData) as Record<string, unknown>[];
      elements.forEach(elementData => {
        const offsetElementData = {
          ...elementData,
          x: ((elementData.x as number) || 0) + 20,
          y: ((elementData.y as number) || 0) + 20
        };

        const element = store.createElementFromData(elementData.tag as string, offsetElementData);

        if (element) {
          app.tree.add(element);
          const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const elementTag = (elementData.tag as string)?.toLowerCase() || 'rect';
          store.addObject({
            id: elementId,
            type: elementTag as any,
            element: element as any
          });
        }
      });

      addSnapshot();
    } catch (error) {
      console.error('Failed to paste elements:', error);
    }

    hideContextMenu();
  }

  function handleDelete() {
    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    if (selectedElements.length === 0) return;

    selectedElements.forEach(selectedElement => {
      const objectToDelete = store.objects.find(
        canvasObject => canvasObject.element?.innerId === selectedElement.innerId
      );
      if (objectToDelete) {
        store.removeObject(objectToDelete.id);
      }
    });

    addSnapshot();
    hideContextMenu();
  }

  function handleGroup() {
    groupTool.groupElements();
    hideContextMenu();
  }

  function handleUngroup() {
    groupTool.ungroupElements();
    hideContextMenu();
  }

  function handleBringForward() {
    if (menuState.value.targetElement) {
      layerControl.bringForward(menuState.value.targetElement);
    }
    hideContextMenu();
  }

  function handleSendBackward() {
    if (menuState.value.targetElement) {
      layerControl.sendBackward(menuState.value.targetElement);
    }
    hideContextMenu();
  }

  function handleBringToFront() {
    if (menuState.value.targetElement) {
      layerControl.bringToFront(menuState.value.targetElement);
    }
    hideContextMenu();
  }

  function handleSendToBack() {
    if (menuState.value.targetElement) {
      layerControl.sendToBack(menuState.value.targetElement);
    }
    hideContextMenu();
  }

  function handleSelectAll() {
    const app = store.appInstance;
    if (!app?.editor || !app.tree) return;

    const allElements = store.objects.map(obj => obj.element).filter(Boolean);
    if (allElements.length > 0) {
      app.editor.select(allElements as any);
    }

    hideContextMenu();
  }

  function handleLockToggle() {
    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    selectedElements.forEach(element => {
      element.locked = !element.locked;
    });

    addSnapshot();
    hideContextMenu();
  }

  return {
    menuState,
    hasSelectedElements,
    selectedElementsCount,
    canGroup,
    canUngroup,
    canBringForward,
    canSendBackward,

    showContextMenu,
    hideContextMenu,

    handleCopy,
    handlePaste,
    handleDelete,
    handleGroup,
    handleUngroup,
    handleBringForward,
    handleSendBackward,
    handleBringToFront,
    handleSendToBack,
    handleSelectAll,
    handleLockToggle
  };
}
