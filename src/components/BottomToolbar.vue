/** * Bottom toolbar component combining drawing tools and zoom controls */

<script setup lang="ts">
  import { computed, inject } from 'vue';
  import { useElementPopover } from '@/composables/state/useElementPopover';
  import { canvasConfig } from '@/config/canvas';
  import { useZoomTool } from '@/plugins/composables/useZoomTool';
  import { pluginRegistry } from '@/plugins/registry';
  import { useCanvasStore } from '@/stores/canvas';
  import type { ToolType } from '@/types';
  import { isValidToolType } from '@/types';

  const ZOOM_IN_TYPE = 'zoomIn';
  const ZOOM_OUT_TYPE = 'zoomOut';

  const elementPopover = inject<ReturnType<typeof useElementPopover>>('elementPopover', useElementPopover());

  const store = useCanvasStore();
  const { zoomIn, zoomOut, resetZoom } = useZoomTool(elementPopover);

  const tools = computed(() => {
    const excludedTypes = ['export', 'zoomIn', 'zoomOut', 'redo', 'undo', 'exportJson'];
    return pluginRegistry
      .getAllPluginMetadata()
      .filter(
        metadata => metadata.ui && !excludedTypes.includes(metadata.type) && isValidToolType(metadata.type)
      )
      .map(metadata => {
        const ui = metadata.ui as NonNullable<typeof metadata.ui>;
        const toolType = metadata.type;
        if (!isValidToolType(toolType)) {
          throw new Error(`Invalid tool type: ${toolType}`);
        }
        return {
          type: toolType,
          label: ui.label,
          shortcut: metadata.shortcut,
          iconName: ui.iconComponent,
          dividerAfter: ui.dividerAfter
        };
      });
  });

  const currentTool = computed(() => store.currentTool);
  const zoomPercent = computed(() => Math.round(store.zoom * 100));

  function handleToolClick(toolType: ToolType) {
    store.setTool(toolType);
  }

  function getZoomPluginMetadata(pluginType: string) {
    const metadata = pluginRegistry.getPluginMetadata(pluginType);
    if (!metadata?.ui) return null;
    return {
      type: metadata.type,
      label: metadata.ui.label,
      shortcut: metadata.shortcut,
      iconName: metadata.ui.iconComponent
    };
  }

  const zoomOutPlugin = computed(() => getZoomPluginMetadata(ZOOM_OUT_TYPE));
  const zoomInPlugin = computed(() => getZoomPluginMetadata(ZOOM_IN_TYPE));

  function handleZoomAction(zoomType: string) {
    if (zoomType === ZOOM_IN_TYPE) {
      zoomIn(canvasConfig.zoom.step);
    } else if (zoomType === ZOOM_OUT_TYPE) {
      zoomOut(canvasConfig.zoom.step);
    }
  }
</script>

<template>
  <div
    class="flex items-center gap-1 px-3 py-2 shadow-lg backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl"
  >
    <template v-for="tool in tools" :key="tool.type">
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            :type="currentTool === tool.type ? 'primary' : undefined"
            :quaternary="currentTool !== tool.type"
            size="small"
            circle
            @click="handleToolClick(tool.type)"
          >
            <template #icon>
              <IconRenderer :name="tool.iconName" :size="16" />
            </template>
          </n-button>
        </template>
        <template #default>
          <span>{{ tool.label }}</span>
          <span v-if="tool.shortcut" class="text-gray-400 text-xs ml-2">
            {{ tool.shortcut }}
          </span>
        </template>
      </n-tooltip>
      <n-divider v-if="tool.dividerAfter" vertical class="!mx-1" />
    </template>

    <n-divider vertical class="!mx-2" />

    <n-tooltip v-if="zoomOutPlugin" trigger="hover">
      <template #trigger>
        <n-button quaternary size="small" circle @click="handleZoomAction(zoomOutPlugin.type)">
          <template #icon>
            <IconRenderer :name="zoomOutPlugin.iconName" :size="14" />
          </template>
        </n-button>
      </template>
      <template #default>
        <span>{{ zoomOutPlugin.label }}</span>
        <span v-if="zoomOutPlugin.shortcut" class="text-gray-400 text-xs ml-2">
          {{ zoomOutPlugin.shortcut }}
        </span>
      </template>
    </n-tooltip>

    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button quaternary size="small" style="width: 50px" @click="resetZoom">{{ zoomPercent }}%</n-button>
      </template>
      <template #default>
        <span>点击重置到 100%</span>
      </template>
    </n-tooltip>

    <n-tooltip v-if="zoomInPlugin" trigger="hover">
      <template #trigger>
        <n-button quaternary size="small" circle @click="handleZoomAction(zoomInPlugin.type)">
          <template #icon>
            <IconRenderer :name="zoomInPlugin.iconName" :size="14" />
          </template>
        </n-button>
      </template>
      <template #default>
        <span>{{ zoomInPlugin.label }}</span>
        <span v-if="zoomInPlugin.shortcut" class="text-gray-400 text-xs ml-2">
          {{ zoomInPlugin.shortcut }}
        </span>
      </template>
    </n-tooltip>
  </div>
</template>
