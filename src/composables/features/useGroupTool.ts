/**
 * Group tool composable for grouping and ungrouping elements.
 * Supports nested groups (group of groups) like Photoshop.
 */

import { Group, type UI } from 'leafer-ui';
import { ref } from 'vue';
import { useHistory } from '@/plugins/composables/useHistory';
import { useCanvasStore } from '@/stores/canvas';
import type { LeaferElement } from '@/types';

const editingGroup = ref<Group | null>(null);

export function useGroupTool() {
  const store = useCanvasStore();
  const { addSnapshot } = useHistory();

  function isGroup(element: LeaferElement | UI | null | undefined): element is Group {
    if (!element) return false;
    return element.tag === 'Group';
  }

  function getGroupDepth(element: UI | null): number {
    if (!element) return 0;
    let depth = 0;
    let current = element.parent;
    while (current) {
      if (isGroup(current as UI)) {
        depth++;
      }
      current = current.parent;
    }
    return depth;
  }

  function getSelectedElements(): UI[] {
    const app = store.appInstance;
    if (!app?.editor) return [];
    return (app.editor.list as UI[]) || [];
  }

  function getParentGroup(element: UI): Group | null {
    if (!element.parent) return null;
    if (isGroup(element.parent as UI)) {
      return element.parent as Group;
    }
    return null;
  }

  function groupElements(): Group | null {
    const app = store.appInstance;
    if (!app?.tree || !app.editor) return null;

    const selectedElements = getSelectedElements();
    if (selectedElements.length < 2) return null;

    const group = new Group({
      editable: true
    });

    const elementsToGroup = [...selectedElements];

    const bounds = {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    };

    elementsToGroup.forEach(element => {
      const elementBounds = element.getBounds();
      bounds.minX = Math.min(bounds.minX, elementBounds.x);
      bounds.minY = Math.min(bounds.minY, elementBounds.y);
      bounds.maxX = Math.max(bounds.maxX, elementBounds.x + elementBounds.width);
      bounds.maxY = Math.max(bounds.maxY, elementBounds.y + elementBounds.height);
    });

    group.x = bounds.minX;
    group.y = bounds.minY;

    app.editor.cancel();

    const parentContainer = elementsToGroup[0]?.parent || app.tree;

    elementsToGroup.forEach(element => {
      const worldX = element.x ?? 0;
      const worldY = element.y ?? 0;

      element.parent?.remove(element);

      element.x = worldX - bounds.minX;
      element.y = worldY - bounds.minY;

      group.add(element);
    });

    parentContainer.add(group);

    const groupId = `group-${Date.now()}`;
    store.addObject({
      id: groupId,
      type: 'group' as any,
      element: group as any
    });

    elementsToGroup.forEach(element => {
      const objIndex = store.objects.findIndex(obj => obj.element && obj.element.innerId === element.innerId);
      if (objIndex !== -1) {
        store.objects.splice(objIndex, 1);
      }
    });

    app.editor.select(group);

    addSnapshot();

    return group;
  }

  function ungroupElements(): UI[] | null {
    const app = store.appInstance;
    if (!app?.tree || !app.editor) return null;

    const selectedElements = getSelectedElements();
    if (selectedElements.length !== 1) return null;

    const selectedElement = selectedElements[0];
    if (!selectedElement || !isGroup(selectedElement)) return null;

    const group = selectedElement;
    const children = [...(group.children as UI[])];

    if (children.length === 0) return null;

    const groupX = group.x ?? 0;
    const groupY = group.y ?? 0;

    app.editor.cancel();

    const parentContainer = group.parent || app.tree;

    const restoredElements: UI[] = [];

    children.forEach(child => {
      const childX = child.x ?? 0;
      const childY = child.y ?? 0;

      group.remove(child);

      child.x = childX + groupX;
      child.y = childY + groupY;

      parentContainer.add(child);
      restoredElements.push(child);

      const childId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const elementTag = child.tag?.toLowerCase() || 'rect';
      store.addObject({
        id: childId,
        type: elementTag as any,
        element: child as any
      });
    });

    const groupObjIndex = store.objects.findIndex(
      obj => obj.element && obj.element.innerId === group.innerId
    );
    if (groupObjIndex !== -1) {
      store.objects.splice(groupObjIndex, 1);
    }

    parentContainer.remove(group);

    if (restoredElements.length > 0) {
      app.editor.select(restoredElements);
    }

    addSnapshot();

    return restoredElements;
  }

  function enterGroupEdit(group: Group): void {
    if (!isGroup(group)) return;
    editingGroup.value = group;
  }

  function exitGroupEdit(): void {
    editingGroup.value = null;
  }

  function isEditingGroup(): boolean {
    return editingGroup.value !== null;
  }

  function getEditingGroup(): Group | null {
    return editingGroup.value;
  }

  function canGroup(): boolean {
    const selectedElements = getSelectedElements();
    return selectedElements.length >= 2;
  }

  function canUngroup(): boolean {
    const selectedElements = getSelectedElements();
    if (selectedElements.length !== 1) return false;
    const firstElement = selectedElements[0];
    return firstElement !== undefined && isGroup(firstElement);
  }

  return {
    isGroup,
    groupElements,
    ungroupElements,
    canGroup,
    canUngroup,
    getSelectedElements,
    getGroupDepth,
    getParentGroup,
    enterGroupEdit,
    exitGroupEdit,
    isEditingGroup,
    getEditingGroup,
    editingGroup
  };
}
