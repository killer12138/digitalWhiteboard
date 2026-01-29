<script setup lang="ts">
  import type { Group } from 'leafer-ui';
  import { App } from 'leafer-ui';
  import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useBoardConstraint } from '@/composables/features/useBoardConstraint';
  import { useContextMenu } from '@/composables/features/useContextMenu';
  import { useDeleteTool } from '@/composables/features/useDeleteTool';
  import { useGroupTool } from '@/composables/features/useGroupTool';
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

  let app: App | null = null;
  let ruler: Ruler | null = null;
  let deleteToolCleanup: (() => void) | null = null;
  let zoomKeyboardCleanup: (() => void) | null = null;
  let boardConstraintCleanup: (() => void) | null = null;

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
      }
    }
  };

  const handleDoubleClick = () => {
    const currentApp = store.appInstance;
    if (!currentApp?.editor) return;

    const selectedElements = currentApp.editor.list || [];
    if (selectedElements.length !== 1) return;

    const selectedElement = selectedElements[0];
    if (selectedElement && groupTool.isGroup(selectedElement)) {
      groupTool.enterGroupEdit(selectedElement as Group);

      const children = selectedElement.children || [];
      if (children.length > 0) {
        currentApp.editor.select(children[0]);
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
      attachEvents: ['move', 'scale'],
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

  onBeforeUnmount(() => {
    zoomKeyboardCleanup?.();
    deleteToolCleanup?.();
    boardConstraintCleanup?.();

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
  </div>
</template>
