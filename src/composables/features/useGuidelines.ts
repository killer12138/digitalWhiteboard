/**
 * Guidelines composable for managing PS-style reference lines on canvas
 */

import { Line } from 'leafer-ui';
import type { App } from 'leafer-ui';
import { computed, ref } from 'vue';

export interface Guideline {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  element: Line;
}

const GUIDELINE_COLOR = '#00d4ff';
const GUIDELINE_STROKE_WIDTH = 1;

export function useGuidelines() {
  const guidelines = ref<Guideline[]>([]);
  const guidelinesVisible = ref(true);
  const isDraggingGuideline = ref(false);
  const draggingGuidelineId = ref<string | null>(null);

  let appInstance: App | null = null;

  function initialize(app: App) {
    appInstance = app;
  }

  function createGuidelineElement(type: 'horizontal' | 'vertical', position: number): Line {
    const isHorizontal = type === 'horizontal';

    const line = new Line({
      x: isHorizontal ? -100000 : position,
      y: isHorizontal ? position : -100000,
      toPoint: isHorizontal ? { x: 200000, y: 0 } : { x: 0, y: 200000 },
      stroke: GUIDELINE_COLOR,
      strokeWidth: GUIDELINE_STROKE_WIDTH,
      dashPattern: [4, 4],
      editable: false,
      draggable: true,
      hitFill: 'all',
      cursor: isHorizontal ? 'row-resize' : 'col-resize'
    });

    return line;
  }

  function addGuideline(type: 'horizontal' | 'vertical', position: number): string {
    if (!appInstance?.tree) return '';

    const id = `guideline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const element = createGuidelineElement(type, position);

    element.on('drag', (e: any) => {
      const guideline = guidelines.value.find(g => g.id === id);
      if (!guideline) return;

      if (type === 'horizontal') {
        guideline.position = e.target.y;
        element.y = e.target.y;
      } else {
        guideline.position = e.target.x;
        element.x = e.target.x;
      }
    });

    element.on('double_tap', () => {
      removeGuideline(id);
    });

    appInstance.tree.add(element);

    guidelines.value.push({
      id,
      type,
      position,
      element
    });

    return id;
  }

  function removeGuideline(id: string) {
    const index = guidelines.value.findIndex(g => g.id === id);
    if (index === -1) return;

    const guideline = guidelines.value[index];
    if (guideline && appInstance?.tree) {
      appInstance.tree.remove(guideline.element);
    }

    guidelines.value.splice(index, 1);
  }

  function clearAllGuidelines() {
    guidelines.value.forEach(guideline => {
      if (appInstance?.tree) {
        appInstance.tree.remove(guideline.element);
      }
    });
    guidelines.value = [];
  }

  function toggleGuidelinesVisibility() {
    guidelinesVisible.value = !guidelinesVisible.value;
    guidelines.value.forEach(guideline => {
      guideline.element.visible = guidelinesVisible.value;
    });
  }

  function setGuidelinesVisibility(visible: boolean) {
    guidelinesVisible.value = visible;
    guidelines.value.forEach(guideline => {
      guideline.element.visible = visible;
    });
  }

  function updateGuidelinePosition(id: string, position: number) {
    const guideline = guidelines.value.find(g => g.id === id);
    if (!guideline) return;

    guideline.position = position;
    if (guideline.type === 'horizontal') {
      guideline.element.y = position;
    } else {
      guideline.element.x = position;
    }
  }

  const horizontalGuidelines = computed(() => guidelines.value.filter(g => g.type === 'horizontal'));

  const verticalGuidelines = computed(() => guidelines.value.filter(g => g.type === 'vertical'));

  const guidelinePositions = computed(() => ({
    horizontal: horizontalGuidelines.value.map(g => g.position),
    vertical: verticalGuidelines.value.map(g => g.position)
  }));

  function getSnapPositions() {
    if (!guidelinesVisible.value) return { horizontal: [], vertical: [] };
    return guidelinePositions.value;
  }

  function cleanup() {
    clearAllGuidelines();
    appInstance = null;
  }

  return {
    guidelines,
    guidelinesVisible,
    isDraggingGuideline,
    draggingGuidelineId,
    horizontalGuidelines,
    verticalGuidelines,
    guidelinePositions,

    initialize,
    addGuideline,
    removeGuideline,
    clearAllGuidelines,
    toggleGuidelinesVisibility,
    setGuidelinesVisibility,
    updateGuidelinePosition,
    getSnapPositions,
    cleanup
  };
}

let guidelinesInstance: ReturnType<typeof useGuidelines> | null = null;

export function getGuidelinesInstance() {
  if (!guidelinesInstance) {
    guidelinesInstance = useGuidelines();
  }
  return guidelinesInstance;
}
