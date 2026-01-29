<script setup lang="ts">
  import type { UI } from 'leafer-ui';
  import { App } from 'leafer-ui';
  import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useBoardConstraint } from '@/composables/features/useBoardConstraint';
  import { useContextMenu } from '@/composables/features/useContextMenu';
  import { useDeleteTool } from '@/composables/features/useDeleteTool';
  import { useGroupTool } from '@/composables/features/useGroupTool';
  import { getGuidelinesInstance } from '@/composables/features/useGuidelines';
  import { useElementPopover } from '@/composables/state/useElementPopover';
  import { useCanvasTools } from '@/composables/useCanvasTools';
  import { canvasConfig } from '@/config/canvas';
  import { useZoomTool } from '@/plugins/composables/useZoomTool';
  import { useCanvasStore } from '@/stores/canvas';
  import { useHistoryStore } from '@/stores/history';

  import '@leafer-in/editor';
  import '@leafer-in/export';
  import '@leafer-in/viewport';
  import '@leafer-in/view';
  import '@leafer-in/arrow';
  import '@leafer-in/text-editor';
  import { Snap } from 'leafer-x-easy-snap';
  import { Ruler } from 'leafer-x-ruler';

  const canvasContainer = ref<HTMLElement | null>(null);
  const store = useCanvasStore();
  const historyStore = useHistoryStore();
  const { setupZoomKeyboardPrevention } = useZoomTool();
  const elementPopover = inject<ReturnType<typeof useElementPopover>>('elementPopover', useElementPopover());
  const contextMenu = useContextMenu();
  const groupTool = useGroupTool();
  const boardConstraint = useBoardConstraint();
  const guidelinesManager = getGuidelinesInstance();

  let app: App | null = null;
  let ruler: Ruler | null = null;
  let deleteToolCleanup: (() => void) | null = null;
  let zoomKeyboardCleanup: (() => void) | null = null;
  let boardConstraintCleanup: (() => void) | null = null;

  const isDraggingFromRuler = ref(false);
  const dragGuidelineType = ref<'horizontal' | 'vertical' | null>(null);
  const dragGuidelinePreviewPos = ref(0);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();

    const currentApp = store.appInstance;
    if (!currentApp) return;

    const rect = canvasContainer.value?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (event.clientX - rect.left) / (currentApp.tree.scale as number);
    const canvasY = (event.clientY - rect.top) / (currentApp.tree.scale as number);

    contextMenu.showContextMenu(event.clientX, event.clientY, canvasX, canvasY);
  };

  const restoreCanvasFromHistory = () => {
    if (historyStore.snapshots.length > 0) {
      const lastSnapshot = historyStore.snapshots[historyStore.currentIndex];
      if (lastSnapshot) {
        store.fromSnapshot(lastSnapshot);
        store.setZoom(1);
      }
    }
  };

  const handleDoubleClick = () => {
    const currentApp = store.appInstance;
    if (!currentApp?.editor) return;

    const selectedElements = currentApp.editor.list || [];
    if (selectedElements.length !== 1) return;

    const selectedElement = selectedElements[0];
    if (selectedElement && groupTool.isGroup(selectedElement as any)) {
      groupTool.enterGroupEdit(selectedElement as any);

      const children = selectedElement.children || [];
      if (children.length > 0) {
        currentApp.editor.select(children[0] as UI);
      }
    }
  };

  const handleCanvasClick = (event: MouseEvent) => {
    if (groupTool.isEditingGroup()) {
      const currentApp = store.appInstance;
      if (!currentApp?.editor) return;

      const target = event.target as HTMLElement;
      if (target === canvasContainer.value) {
        groupTool.exitGroupEdit();
      }
    }
  };

  const handleRulerMouseDown = (event: MouseEvent) => {
    if (!canvasContainer.value || !store.rulerEnabled) return;

    const rect = canvasContainer.value.getBoundingClientRect();
    const rulerSize = canvasConfig.ruler.ruleSize;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (y < rulerSize && x >= rulerSize) {
      isDraggingFromRuler.value = true;
      dragGuidelineType.value = 'horizontal';
      dragGuidelinePreviewPos.value = y;
    } else if (x < rulerSize && y >= rulerSize) {
      isDraggingFromRuler.value = true;
      dragGuidelineType.value = 'vertical';
      dragGuidelinePreviewPos.value = x;
    }

    if (isDraggingFromRuler.value) {
      document.addEventListener('mousemove', handleRulerDrag);
      document.addEventListener('mouseup', handleRulerMouseUp);
    }
  };

  const handleRulerDrag = (event: MouseEvent) => {
    if (!isDraggingFromRuler.value || !canvasContainer.value) return;

    const rect = canvasContainer.value.getBoundingClientRect();
    const currentApp = store.appInstance;
    const scale = (currentApp?.tree.scale as number) || 1;

    if (dragGuidelineType.value === 'horizontal') {
      const y = event.clientY - rect.top;
      dragGuidelinePreviewPos.value = y / scale;
    } else if (dragGuidelineType.value === 'vertical') {
      const x = event.clientX - rect.left;
      dragGuidelinePreviewPos.value = x / scale;
    }
  };

  const handleRulerMouseUp = (event: MouseEvent) => {
    if (!isDraggingFromRuler.value || !canvasContainer.value) return;

    const rect = canvasContainer.value.getBoundingClientRect();
    const currentApp = store.appInstance;
    const scale = (currentApp?.tree.scale as number) || 1;
    const rulerSize = canvasConfig.ruler.ruleSize;

    if (dragGuidelineType.value === 'horizontal') {
      const y = event.clientY - rect.top;
      if (y > rulerSize) {
        guidelinesManager.addGuideline('horizontal', (y - rulerSize) / scale);
      }
    } else if (dragGuidelineType.value === 'vertical') {
      const x = event.clientX - rect.left;
      if (x > rulerSize) {
        guidelinesManager.addGuideline('vertical', (x - rulerSize) / scale);
      }
    }

    isDraggingFromRuler.value = false;
    dragGuidelineType.value = null;
    dragGuidelinePreviewPos.value = 0;

    document.removeEventListener('mousemove', handleRulerDrag);
    document.removeEventListener('mouseup', handleRulerMouseUp);
  };

  onMounted(() => {
    zoomKeyboardCleanup = setupZoomKeyboardPrevention();

    if (!canvasContainer.value) return;

    app = new App({
      view: canvasContainer.value,
      editor: {
        stroke: canvasConfig.theme.selectionBox,
        selectedStyle: {
          strokeWidth: 0
        },
        rect: {
          strokeWidth: 1,
          opacity: 0.5
        }
      },
      zoom: { min: canvasConfig.zoom.min, max: canvasConfig.zoom.max },
      wheel: {
        zoomSpeed: canvasConfig.wheel.zoomSpeed
      },
      move: {
        drag: false
      }
    });
    app.tree.fill = canvasConfig.theme.background;

    store.setAppInstance(app);

    const snap = new Snap(app, {
      attachEvents: [...canvasConfig.snap.attachEvents] as ('move' | 'scale')[],
      snapSize: canvasConfig.snap.snapSize,
      showDistanceLabels: canvasConfig.snap.showDistanceLabels,
      showLine: canvasConfig.snap.showLine,
      showLinePoints: canvasConfig.snap.showLinePoints,
      lineColor: canvasConfig.theme.snapLineColor,
      distanceLabelStyle: {
        text: {
          fill: canvasConfig.theme.snapLineColor
        }
      }
    });
    snap.enable(true);

    useCanvasTools(app, elementPopover, canvasContainer.value);
    deleteToolCleanup = useDeleteTool(app, store, elementPopover);

    ruler = new Ruler(app, {
      enabled: store.rulerEnabled,
      theme: store.rulerTheme,
      ruleSize: canvasConfig.ruler.ruleSize,
      fontSize: canvasConfig.ruler.fontSize,
      unit: canvasConfig.ruler.unit
    });

    guidelinesManager.initialize(app);

    app.tree.on('double_tap', handleDoubleClick);

    boardConstraintCleanup = boardConstraint.setupMoveConstraint(app);

    restoreCanvasFromHistory();
  });

  watch(
    () => store.rulerEnabled,
    enabled => {
      if (ruler) {
        ruler.enabled = enabled;
      }
    }
  );

  watch(
    () => store.rulerTheme,
    theme => {
      if (ruler) {
        ruler.changeTheme(theme);
      }
    }
  );

  watch(
    () => store.guidelinesEnabled,
    enabled => {
      guidelinesManager.setGuidelinesVisibility(enabled);
    }
  );

  onBeforeUnmount(() => {
    zoomKeyboardCleanup?.();
    deleteToolCleanup?.();
    boardConstraintCleanup?.();
    guidelinesManager.cleanup();

    document.removeEventListener('mousemove', handleRulerDrag);
    document.removeEventListener('mouseup', handleRulerMouseUp);

    ruler = null;

    if (app) {
      app.destroy();
      app = null;
    }
  });
</script>

<template>
  <div
    ref="canvasContainer"
    class="w-full h-full relative overflow-hidden bg-white"
    @contextmenu="handleContextMenu"
    @click="handleCanvasClick"
    @mousedown="handleRulerMouseDown"
  >
    <div
      v-if="groupTool.isEditingGroup()"
      class="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full shadow-md"
    >
      编辑组内元素 · 点击空白区域退出
    </div>
    <ContextMenu
      v-model:show="contextMenu.menuState.value.show"
      :x="contextMenu.menuState.value.x"
      :y="contextMenu.menuState.value.y"
      :has-selected-elements="contextMenu.hasSelectedElements.value"
      :selected-elements-count="contextMenu.selectedElementsCount.value"
      :can-group="contextMenu.canGroup.value"
      :can-ungroup="contextMenu.canUngroup.value"
      :can-bring-forward="contextMenu.canBringForward.value"
      :can-send-backward="contextMenu.canSendBackward.value"
      @copy="contextMenu.handleCopy"
      @paste="contextMenu.handlePaste"
      @delete="contextMenu.handleDelete"
      @group="contextMenu.handleGroup"
      @ungroup="contextMenu.handleUngroup"
      @bring-forward="contextMenu.handleBringForward"
      @send-backward="contextMenu.handleSendBackward"
      @bring-to-front="contextMenu.handleBringToFront"
      @send-to-back="contextMenu.handleSendToBack"
      @select-all="contextMenu.handleSelectAll"
    />

    <div
      v-if="isDraggingFromRuler && dragGuidelineType === 'horizontal'"
      class="absolute left-0 right-0 h-px bg-cyan-400 pointer-events-none z-50"
      :style="{ top: `${dragGuidelinePreviewPos}px` }"
    />
    <div
      v-if="isDraggingFromRuler && dragGuidelineType === 'vertical'"
      class="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50"
      :style="{ left: `${dragGuidelinePreviewPos}px` }"
    />
  </div>
</template>
