<script setup lang="ts">
  import { App } from 'leafer-ui';
  import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { ArrowType } from '@/components/common/ArrowPicker.vue';
  import { useContextMenu } from '@/composables/features/useContextMenu';
  import { useDeleteTool } from '@/composables/features/useDeleteTool';
  import { useElementPopover } from '@/composables/state/useElementPopover';
  import { useCanvasTools } from '@/composables/useCanvasTools';
  import { canvasConfig } from '@/config/canvas';
  import { useZoomTool } from '@/plugins/composables/useZoomTool';
  import { useCanvasStore } from '@/stores/canvas';
  import { useHistoryStore } from '@/stores/history';
  import { calculateDashPattern } from '@/utils/stroke';

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

  let app: App | null = null;
  let ruler: Ruler | null = null;
  let deleteToolCleanup: (() => void) | null = null;
  let zoomKeyboardCleanup: (() => void) | null = null;

  const handleStrokeTypeChange = (type: 'solid' | 'dashed') => {
    if (type === 'dashed') {
      const currentStrokeWidth = elementPopover.selectedElementStrokeWidth.value;
      elementPopover.updateElementDashPattern(calculateDashPattern(currentStrokeWidth));
    } else {
      elementPopover.updateElementDashPattern(undefined);
    }
  };

  const handleFillColorUpdate = (color: string) => {
    elementPopover.updateElementFillColor(color);
  };

  const handleStrokeColorUpdate = (color: string) => {
    elementPopover.updateElementStrokeColor(color);
  };

  const handleStrokeWidthUpdate = (width: number) => {
    const hasDashedStroke = elementPopover.selectedElementDashPattern.value;
    const dashPattern = hasDashedStroke ? calculateDashPattern(width) : undefined;
    elementPopover.updateElementStrokeWidth(width, dashPattern);
  };

  const handleStartArrowUpdate = (arrowType: ArrowType) => {
    elementPopover.updateElementStartArrow(arrowType);
  };

  const handleEndArrowUpdate = (arrowType: ArrowType) => {
    elementPopover.updateElementEndArrow(arrowType);
  };

  const handleTextColorUpdate = (color: string) => {
    elementPopover.updateElementTextColor(color);
  };

  const handleFontSizeUpdate = (size: number) => {
    elementPopover.updateElementFontSize(size);
  };

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();

    const app = store.appInstance;
    if (!app?.editor) return;

    const selectedElements = app.editor.list || [];
    const targetElement = selectedElements.length > 0 ? selectedElements[0] : null;

    contextMenu.showContextMenu(event.clientX, event.clientY, targetElement as any);
  };

  const restoreCanvasFromHistory = () => {
    if (historyStore.snapshots.length > 0) {
      const lastSnapshot = historyStore.snapshots[historyStore.currentIndex];
      if (lastSnapshot) {
        store.fromSnapshot(lastSnapshot);
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
  >
    <n-popover
      :show="elementPopover.showPopover.value"
      :x="elementPopover.popoverX.value"
      :y="elementPopover.popoverY.value"
      :show-arrow="false"
      :content-style="{ display: 'flex' }"
      placement="right-start"
      trigger="manual"
    >
      <ElementStyleConfig
        :element-type="elementPopover.selectedElementType.value"
        :fill-color="elementPopover.selectedElementFillColor.value"
        :stroke-color="elementPopover.selectedElementStrokeColor.value"
        :stroke-width="elementPopover.selectedElementStrokeWidth.value"
        :dash-pattern="elementPopover.selectedElementDashPattern.value"
        :start-arrow="elementPopover.selectedElementStartArrow.value"
        :end-arrow="elementPopover.selectedElementEndArrow.value"
        :text-color="elementPopover.selectedElementTextColor.value"
        :font-size="elementPopover.selectedElementFontSize.value"
        :can-bring-forward="elementPopover.canBringForward.value"
        :can-send-backward="elementPopover.canSendBackward.value"
        @update:fill-color="handleFillColorUpdate"
        @update:stroke-color="handleStrokeColorUpdate"
        @update:stroke-width="handleStrokeWidthUpdate"
        @update:stroke-type="handleStrokeTypeChange"
        @update:start-arrow="handleStartArrowUpdate"
        @update:end-arrow="handleEndArrowUpdate"
        @update:text-color="handleTextColorUpdate"
        @update:font-size="handleFontSizeUpdate"
        @bring-forward="elementPopover.bringElementForward"
        @send-backward="elementPopover.sendElementBackward"
        @bring-to-front="elementPopover.bringElementToFront"
        @send-to-back="elementPopover.sendElementToBack"
      />
    </n-popover>
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
      @lock-toggle="contextMenu.handleLockToggle"
    />
  </div>
</template>
