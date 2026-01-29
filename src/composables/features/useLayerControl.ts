/**
 * Layer control composable for managing element z-index and layer order
 */

import type { UI } from 'leafer-ui';
import { useHistory } from '@/plugins/composables/useHistory';
import type { LeaferElement } from '@/types';

export function useLayerControl() {
  const { addSnapshot } = useHistory();

  function getElementIndex(element: LeaferElement): number {
    if (!element?.parent) return -1;
    const children = element.parent.children as UI[];
    return children.indexOf(element as UI);
  }

  function getParentChildrenCount(element: LeaferElement): number {
    if (!element?.parent) return 0;
    return (element.parent.children as UI[]).length;
  }

  function bringForward(element: LeaferElement): boolean {
    if (!element?.parent) return false;

    const parent = element.parent;
    const children = parent.children as UI[];
    const currentIndex = children.indexOf(element as UI);

    if (currentIndex === -1 || currentIndex === children.length - 1) {
      return false;
    }

    parent.remove(element);
    parent.addAt(element, currentIndex + 1);
    addSnapshot();
    return true;
  }

  function sendBackward(element: LeaferElement): boolean {
    if (!element?.parent) return false;

    const parent = element.parent;
    const children = parent.children as UI[];
    const currentIndex = children.indexOf(element as UI);

    if (currentIndex <= 0) {
      return false;
    }

    parent.remove(element);
    parent.addAt(element, currentIndex - 1);
    addSnapshot();
    return true;
  }

  function bringToFront(element: LeaferElement): boolean {
    if (!element?.parent) return false;

    const parent = element.parent;
    const children = parent.children as UI[];
    const currentIndex = children.indexOf(element as UI);

    if (currentIndex === -1 || currentIndex === children.length - 1) {
      return false;
    }

    parent.remove(element);
    parent.add(element);
    addSnapshot();
    return true;
  }

  function sendToBack(element: LeaferElement): boolean {
    if (!element?.parent) return false;

    const parent = element.parent;
    const children = parent.children as UI[];
    const currentIndex = children.indexOf(element as UI);

    if (currentIndex <= 0) {
      return false;
    }

    parent.remove(element);
    parent.addAt(element, 0);
    addSnapshot();
    return true;
  }

  function canBringForward(element: LeaferElement): boolean {
    if (!element?.parent) return false;
    const index = getElementIndex(element);
    const count = getParentChildrenCount(element);
    return index >= 0 && index < count - 1;
  }

  function canSendBackward(element: LeaferElement): boolean {
    if (!element?.parent) return false;
    const index = getElementIndex(element);
    return index > 0;
  }

  return {
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    canBringForward,
    canSendBackward,
    getElementIndex,
    getParentChildrenCount
  };
}
