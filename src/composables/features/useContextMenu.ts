/**
 * Context menu composable for managing right-click menu state and actions
 */

import type { UI } from 'leafer-ui';
import { ref, computed } from 'vue';
import { useGroupTool } from './useGroupTool';
import { useLayerControl } from './useLayerControl';
import { useHistory } from '@/plugins/composables/useHistory';
import { useBoardStore } from '@/stores/board';
import { useCanvasStore } from '@/stores/canvas';
import type { LeaferElement } from '@/types';

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  targetElement: LeaferElement | null;
  clickX: number;
  clickY: number;
  hasSelection: boolean;
  selectionCount: number;
  isLocked: boolean;
  allLocked: boolean;
  canGroup: boolean;
  canUngroup: boolean;
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
    targetElement: null,
    clickX: 0,
    clickY: 0,
    hasSelection: false,
    selectionCount: 0,
    isLocked: false,
    allLocked: false,
    canGroup: false,
    canUngroup: false
  });

  const hasSelectedElements = computed(() => menuState.value.hasSelection);

  const selectedElementsCount = computed(() => menuState.value.selectionCount);

  const isElementLocked = computed(() => menuState.value.isLocked);

  const allElementsLocked = computed(() => menuState.value.allLocked);

  const canGroup = computed(() => menuState.value.canGroup);
  const canUngroup = computed(() => menuState.value.canUngroup);

  const canBringForward = computed(() => {
    if (!menuState.value.targetElement) return false;
    return layerControl.canBringForward(menuState.value.targetElement);
  });

  const canSendBackward = computed(() => {
    if (!menuState.value.targetElement) return false;
    return layerControl.canSendBackward(menuState.value.targetElement);
  });

  function findElementAtPoint(x: number, y: number): UI | null {
    const app = store.appInstance;
    if (!app?.tree) return null;

    const point = { x, y };
    const elements = store.objects
      .map(obj => obj.element)
      .filter((el): el is NonNullable<typeof el> => el !== null);

    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element) {
        const bounds = element.getBounds();
        if (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        ) {
          return element as UI;
        }
      }
    }
    return null;
  }

  function showContextMenu(x: number, y: number, canvasX: number, canvasY: number) {
    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    let targetElement: LeaferElement | null = null;

    if (selectedElements.length > 0) {
      targetElement = selectedElements[0] as LeaferElement;
    } else {
      const elementAtPoint = findElementAtPoint(canvasX, canvasY);
      if (elementAtPoint) {
        targetElement = elementAtPoint as LeaferElement;
      }
    }

    const hasSelection = selectedElements.length > 0;
    const selectionCount = selectedElements.length;
    const isLocked = hasSelection && selectedElements.some(el => el.editable === false);
    const allLocked = hasSelection && selectedElements.every(el => el.editable === false);

    const canGroupValue = selectionCount >= 2;
    const canUngroupValue =
      selectionCount === 1 && selectedElements[0] && groupTool.isGroup(selectedElements[0]);

    menuState.value = {
      show: true,
      x,
      y,
      targetElement,
      clickX: canvasX,
      clickY: canvasY,
      hasSelection,
      selectionCount,
      isLocked,
      allLocked,
      canGroup: canGroupValue,
      canUngroup: canUngroupValue
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

    const boardStore = useBoardStore();
    const activeBoard = boardStore.activeBoard;
    const container = activeBoard?.frame || app.tree;

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
          container.add(element);
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

  function handleLock() {
    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    selectedElements.forEach(element => {
      element.editable = false;
    });

    app.editor.cancel();
    addSnapshot();
    hideContextMenu();
  }

  function handleUnlock() {
    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    selectedElements.forEach(element => {
      element.editable = true;
    });

    addSnapshot();
    hideContextMenu();
  }

  function handleUnlockElement(element: LeaferElement) {
    if (!element) return;

    element.editable = true;
    addSnapshot();
  }

  function getLockedElements(): LeaferElement[] {
    return store.objects
      .filter(obj => obj.element && obj.element.editable === false)
      .map(obj => obj.element) as LeaferElement[];
  }

  return {
    menuState,
    hasSelectedElements,
    selectedElementsCount,
    isElementLocked,
    allElementsLocked,
    canGroup,
    canUngroup,
    canBringForward,
    canSendBackward,

    showContextMenu,
    hideContextMenu,
    findElementAtPoint,

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
    handleLock,
    handleUnlock,
    handleUnlockElement,
    getLockedElements
  };
}
