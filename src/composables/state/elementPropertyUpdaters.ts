/**
 * Utility functions for updating element properties in the popover
 */

import { Image, Line, Text } from 'leafer-ui';
import type { Ref } from 'vue';
import type { ArrowType } from '@/components/common/ArrowPicker.vue';
import type { LeaferElement } from '@/types';

type ElementType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null;

interface ElementPropertyUpdaters {
  selectedElement: Ref<LeaferElement>;
  selectedElementType: Ref<ElementType>;
  selectedElementFillColor: Ref<string>;
  selectedElementStrokeColor: Ref<string>;
  selectedElementStrokeWidth: Ref<number>;
  selectedElementDashPattern: Ref<number[] | undefined>;
  selectedElementStartArrow: Ref<ArrowType>;
  selectedElementEndArrow: Ref<ArrowType>;
  selectedElementTextColor: Ref<string>;
  selectedElementFontSize: Ref<number>;
  selectedElementImageWidth: Ref<number>;
  selectedElementImageHeight: Ref<number>;
  debouncedAddSnapshot: () => void;
}

function isArrowElement(selectedElement: LeaferElement | null, selectedElementType: ElementType): boolean {
  return selectedElement !== null && selectedElement instanceof Line && selectedElementType === 'arrow';
}

function isTextElement(selectedElement: LeaferElement | null): boolean {
  return selectedElement !== null && selectedElement instanceof Text;
}

function isImageElement(selectedElement: LeaferElement | null): boolean {
  return selectedElement !== null && selectedElement instanceof Image;
}

export function createElementPropertyUpdaters(updaters: ElementPropertyUpdaters) {
  function updateElementFillColor(color: string) {
    const element = updaters.selectedElement.value;
    if (element) {
      element.fill = color;
      updaters.selectedElementFillColor.value = color;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementStrokeColor(color: string) {
    const element = updaters.selectedElement.value;
    if (element) {
      element.stroke = color;
      updaters.selectedElementStrokeColor.value = color;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementStrokeWidth(width: number, dashPattern?: number[]) {
    const element = updaters.selectedElement.value;
    if (element) {
      element.strokeWidth = width;
      updaters.selectedElementStrokeWidth.value = width;

      if (dashPattern !== undefined) {
        element.dashPattern = dashPattern;
        updaters.selectedElementDashPattern.value = dashPattern;
      }

      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementDashPattern(pattern: number[] | undefined) {
    const element = updaters.selectedElement.value;
    if (element) {
      element.dashPattern = pattern;
      updaters.selectedElementDashPattern.value = pattern;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementStartArrow(arrowType: ArrowType) {
    const element = updaters.selectedElement.value;
    const isArrow = isArrowElement(element, updaters.selectedElementType.value);
    if (isArrow && element instanceof Line) {
      element.startArrow = arrowType;
      updaters.selectedElementStartArrow.value = arrowType;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementEndArrow(arrowType: ArrowType) {
    const element = updaters.selectedElement.value;
    const isArrow = isArrowElement(element, updaters.selectedElementType.value);
    if (isArrow && element instanceof Line) {
      element.endArrow = arrowType;
      updaters.selectedElementEndArrow.value = arrowType;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementTextColor(color: string) {
    const element = updaters.selectedElement.value;
    if (isTextElement(element) && element instanceof Text) {
      element.fill = color;
      updaters.selectedElementTextColor.value = color;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementFontSize(size: number) {
    const element = updaters.selectedElement.value;
    if (isTextElement(element) && element instanceof Text) {
      element.fontSize = size;
      updaters.selectedElementFontSize.value = size;
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementImageWidth(width: number, keepAspectRatio = false) {
    const element = updaters.selectedElement.value;
    if (isImageElement(element) && element instanceof Image) {
      if (keepAspectRatio && element.width && element.height) {
        const ratio = element.height / element.width;
        element.width = width;
        element.height = width * ratio;
        updaters.selectedElementImageWidth.value = width;
        updaters.selectedElementImageHeight.value = width * ratio;
      } else {
        element.width = width;
        updaters.selectedElementImageWidth.value = width;
      }
      updaters.debouncedAddSnapshot();
    }
  }

  function updateElementImageHeight(height: number, keepAspectRatio = false) {
    const element = updaters.selectedElement.value;
    if (isImageElement(element) && element instanceof Image) {
      if (keepAspectRatio && element.width && element.height) {
        const ratio = element.width / element.height;
        element.height = height;
        element.width = height * ratio;
        updaters.selectedElementImageHeight.value = height;
        updaters.selectedElementImageWidth.value = height * ratio;
      } else {
        element.height = height;
        updaters.selectedElementImageHeight.value = height;
      }
      updaters.debouncedAddSnapshot();
    }
  }

  function replaceImageSource(url: string) {
    const element = updaters.selectedElement.value;
    if (isImageElement(element) && element instanceof Image) {
      element.url = url;
      updaters.debouncedAddSnapshot();
    }
  }

  return {
    updateElementFillColor,
    updateElementStrokeColor,
    updateElementStrokeWidth,
    updateElementDashPattern,
    updateElementStartArrow,
    updateElementEndArrow,
    updateElementTextColor,
    updateElementFontSize,
    updateElementImageWidth,
    updateElementImageHeight,
    replaceImageSource
  };
}
