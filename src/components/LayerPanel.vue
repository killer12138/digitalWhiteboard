/** * Layer panel component for managing canvas elements like Photoshop layers */

<script setup lang="ts">
  import type { DropdownOption } from 'naive-ui';
  import { computed, h, ref } from 'vue';
  import IconRenderer from '@/components/IconRenderer.vue';
  import { useLayerControl } from '@/composables/features/useLayerControl';
  import { useHistory } from '@/plugins/composables/useHistory';
  import { useCanvasStore } from '@/stores/canvas';

  const store = useCanvasStore();
  const layerControl = useLayerControl();
  const { addSnapshot } = useHistory();

  const draggedIndex = ref<number | null>(null);
  const dragOverIndex = ref<number | null>(null);

  const contextMenuShow = ref(false);
  const contextMenuX = ref(0);
  const contextMenuY = ref(0);
  const contextMenuLayerId = ref<string | null>(null);

  const layers = computed(() => {
    return [...store.objects].reverse().map((obj, index) => {
      const element = obj.element;
      return {
        id: obj.id,
        type: obj.type,
        element,
        index: store.objects.length - 1 - index,
        visible: layerControl.isVisible(element),
        locked: layerControl.isLocked(element),
        name: getElementName(obj.type),
        icon: getElementIcon(obj.type)
      };
    });
  });

  const selectedElementId = computed(() => {
    const app = store.appInstance;
    if (!app?.editor?.list?.length) return null;
    const selectedElement = app.editor.list[0];
    const obj = store.objects.find(o => o.element?.innerId === selectedElement?.innerId);
    return obj?.id ?? null;
  });

  const contextMenuLayer = computed(() => {
    if (!contextMenuLayerId.value) return null;
    return layers.value.find(l => l.id === contextMenuLayerId.value) ?? null;
  });

  const canBringForward = computed(() => {
    if (!contextMenuLayer.value?.element) return false;
    return layerControl.canBringForward(contextMenuLayer.value.element);
  });

  const canSendBackward = computed(() => {
    if (!contextMenuLayer.value?.element) return false;
    return layerControl.canSendBackward(contextMenuLayer.value.element);
  });

  const contextMenuOptions = computed<DropdownOption[]>(() => {
    return [
      {
        label: '上移一层',
        key: 'bringForward',
        disabled: !canBringForward.value,
        icon: () => h(IconRenderer, { name: 'i-lucide-chevron-up', size: 14 })
      },
      {
        label: '下移一层',
        key: 'sendBackward',
        disabled: !canSendBackward.value,
        icon: () => h(IconRenderer, { name: 'i-lucide-chevron-down', size: 14 })
      },
      {
        label: '置顶',
        key: 'bringToFront',
        disabled: !canBringForward.value,
        icon: () => h(IconRenderer, { name: 'i-lucide-bring-to-front', size: 14 })
      },
      {
        label: '置底',
        key: 'sendToBack',
        disabled: !canSendBackward.value,
        icon: () => h(IconRenderer, { name: 'i-lucide-send-to-back', size: 14 })
      },
      { type: 'divider', key: 'd1' },
      {
        label: '复制',
        key: 'copy',
        icon: () => h(IconRenderer, { name: 'i-lucide-copy', size: 14 })
      },
      {
        label: '粘贴',
        key: 'paste',
        icon: () => h(IconRenderer, { name: 'i-lucide-clipboard-paste', size: 14 })
      },
      { type: 'divider', key: 'd2' },
      {
        label: '删除',
        key: 'delete',
        icon: () => h(IconRenderer, { name: 'i-lucide-trash-2', size: 14 })
      }
    ];
  });

  function getElementName(type: string): string {
    const typeNames: Record<string, string> = {
      rect: '矩形',
      circle: '圆形',
      line: '直线',
      arrow: '箭头',
      pen: '画笔',
      polygon: '多边形',
      text: '文本',
      image: '图片',
      group: '组合'
    };
    return typeNames[type] || type;
  }

  function getElementIcon(type: string): string {
    const typeIcons: Record<string, string> = {
      rect: 'i-lucide-square',
      circle: 'i-lucide-circle',
      line: 'i-lucide-minus',
      arrow: 'i-lucide-arrow-right',
      pen: 'i-lucide-pen-tool',
      polygon: 'i-lucide-pentagon',
      text: 'i-lucide-type',
      image: 'i-lucide-image',
      group: 'i-lucide-group'
    };
    return typeIcons[type] || 'i-lucide-layers';
  }

  function handleLayerClick(layerId: string) {
    store.selectObject(layerId);
  }

  function handleVisibilityToggle(layerId: string, event: Event) {
    event.stopPropagation();
    const obj = store.objects.find(o => o.id === layerId);
    if (obj?.element) {
      layerControl.toggleVisibility(obj.element);
    }
  }

  function handleLockToggle(layerId: string, event: Event) {
    event.stopPropagation();
    const obj = store.objects.find(o => o.id === layerId);
    if (obj?.element) {
      layerControl.toggleLock(obj.element);
    }
  }

  function handleDragStart(index: number) {
    draggedIndex.value = index;
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    dragOverIndex.value = index;
  }

  function handleDragLeave() {
    dragOverIndex.value = null;
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
      draggedIndex.value = null;
      dragOverIndex.value = null;
      return;
    }

    const sourceLayer = layers.value[draggedIndex.value];
    const targetLayer = layers.value[targetIndex];

    if (sourceLayer && targetLayer && sourceLayer.element?.parent) {
      const parent = sourceLayer.element.parent;
      const children = parent.children as any[];
      const sourceTreeIndex = children.indexOf(sourceLayer.element);
      const targetTreeIndex = children.indexOf(targetLayer.element);

      if (sourceTreeIndex !== -1 && targetTreeIndex !== -1) {
        parent.remove(sourceLayer.element);
        const adjustedIndex = sourceTreeIndex < targetTreeIndex ? targetTreeIndex : targetTreeIndex;
        parent.addAt(sourceLayer.element, adjustedIndex);
        addSnapshot();
      }
    }

    draggedIndex.value = null;
    dragOverIndex.value = null;
  }

  function handleDragEnd() {
    draggedIndex.value = null;
    dragOverIndex.value = null;
  }

  function handleContextMenu(event: MouseEvent, layerId: string) {
    event.preventDefault();
    event.stopPropagation();
    contextMenuLayerId.value = layerId;
    contextMenuX.value = event.clientX;
    contextMenuY.value = event.clientY;
    contextMenuShow.value = true;

    store.selectObject(layerId);
  }

  function handleContextMenuSelect(key: string) {
    const layer = contextMenuLayer.value;
    if (!layer) return;

    switch (key) {
      case 'bringForward':
        layerControl.bringForward(layer.element);
        break;
      case 'sendBackward':
        layerControl.sendBackward(layer.element);
        break;
      case 'bringToFront':
        layerControl.bringToFront(layer.element);
        break;
      case 'sendToBack':
        layerControl.sendToBack(layer.element);
        break;
      case 'copy':
        handleCopyLayer(layer.id);
        break;
      case 'paste':
        handlePasteLayer();
        break;
      case 'delete':
        handleDeleteLayer(layer.id);
        break;
    }
    contextMenuShow.value = false;
  }

  function handleCopyLayer(layerId: string) {
    const obj = store.objects.find(o => o.id === layerId);
    if (!obj?.element) return;

    const jsonData = [obj.element.toJSON()];
    localStorage.setItem('wl-draw-clipboard', JSON.stringify(jsonData));
  }

  function handlePasteLayer() {
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
  }

  function handleDeleteLayer(layerId: string) {
    store.removeObject(layerId);
    addSnapshot();
  }

  function handleContextMenuClickOutside() {
    contextMenuShow.value = false;
  }
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
      <span class="text-xs font-medium text-gray-600">图层</span>
      <span class="text-[10px] text-gray-400">{{ layers.length }} 个</span>
    </div>

    <div v-if="layers.length === 0" class="flex-1 flex items-center justify-center p-4">
      <p class="text-xs text-gray-400 text-center">暂无图层</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="(layer, index) in layers"
        :key="layer.id"
        draggable="true"
        class="group flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-gray-100 transition-colors"
        :class="[
          selectedElementId === layer.id ? 'bg-blue-50' : 'hover:bg-gray-50',
          dragOverIndex === index ? 'bg-blue-100' : '',
          !layer.visible ? 'opacity-50' : ''
        ]"
        @click="handleLayerClick(layer.id)"
        @contextmenu="handleContextMenu($event, layer.id)"
        @dragstart="handleDragStart(index)"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(index)"
        @dragend="handleDragEnd"
      >
        <div class="flex items-center gap-1">
          <button
            class="p-0.5 rounded hover:bg-gray-200 transition-colors"
            :class="layer.visible ? 'text-gray-500' : 'text-gray-300'"
            @click="handleVisibilityToggle(layer.id, $event)"
          >
            <IconRenderer :name="layer.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'" :size="12" />
          </button>
          <button
            class="p-0.5 rounded hover:bg-gray-200 transition-colors"
            :class="layer.locked ? 'text-orange-500' : 'text-gray-300'"
            @click="handleLockToggle(layer.id, $event)"
          >
            <IconRenderer :name="layer.locked ? 'i-lucide-lock' : 'i-lucide-unlock'" :size="12" />
          </button>
        </div>

        <IconRenderer
          :name="layer.icon"
          :size="14"
          :class="selectedElementId === layer.id ? 'text-blue-500' : 'text-gray-400'"
        />

        <span
          class="flex-1 text-xs truncate"
          :class="selectedElementId === layer.id ? 'text-blue-600 font-medium' : 'text-gray-600'"
        >
          {{ layer.name }}
        </span>
      </div>
    </div>

    <n-dropdown
      :show="contextMenuShow"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      placement="bottom-start"
      trigger="manual"
      size="small"
      @select="handleContextMenuSelect"
      @clickoutside="handleContextMenuClickOutside"
    />
  </div>
</template>
