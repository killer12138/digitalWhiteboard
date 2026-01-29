<script setup lang="ts">
  import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
  import type { ArrowType } from './common/ArrowPicker.vue';
  import { useElementPopover } from '@/composables/state/useElementPopover';
  import { calculateDashPattern } from '@/utils/stroke';

  type StrokeType = 'solid' | 'dashed';

  const elementPopover = inject<ReturnType<typeof useElementPopover>>('elementPopover', useElementPopover());

  const propertiesCollapsed = ref(false);

  const layerPanelHeight = ref(200);
  const isDraggingSplitter = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  function handleSplitterMouseDown(e: MouseEvent) {
    e.preventDefault();
    isDraggingSplitter.value = true;
    document.addEventListener('mousemove', handleSplitterMouseMove);
    document.addEventListener('mouseup', handleSplitterMouseUp);
  }

  function handleSplitterMouseMove(e: MouseEvent) {
    if (!isDraggingSplitter.value || !containerRef.value) return;

    const containerRect = containerRef.value.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    const minHeight = 100;
    const maxHeight = containerRect.height - 100;

    layerPanelHeight.value = Math.max(minHeight, Math.min(maxHeight, newHeight));
  }

  function handleSplitterMouseUp() {
    isDraggingSplitter.value = false;
    document.removeEventListener('mousemove', handleSplitterMouseMove);
    document.removeEventListener('mouseup', handleSplitterMouseUp);
  }

  onMounted(() => {
    if (containerRef.value) {
      layerPanelHeight.value = containerRef.value.clientHeight * 0.5;
    }
  });

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleSplitterMouseMove);
    document.removeEventListener('mouseup', handleSplitterMouseUp);
  });

  const hasSelection = computed(() => elementPopover.selectedElement.value !== null);
  const elementType = computed(() => elementPopover.selectedElementType.value);

  const currentStrokeType = computed<StrokeType>(() => {
    return elementPopover.selectedElementDashPattern.value ? 'dashed' : 'solid';
  });

  const isFillableElement = computed(() => {
    return elementType.value === 'rect' || elementType.value === 'circle';
  });

  const isStrokeOnlyElement = computed(() => {
    return elementType.value === 'line' || elementType.value === 'pen';
  });

  const isArrowElement = computed(() => {
    return elementType.value === 'arrow';
  });

  const isTextElement = computed(() => {
    return elementType.value === 'text';
  });

  const isImageElement = computed(() => {
    return elementType.value === 'image';
  });

  function handleStrokeTypeChange(type: StrokeType) {
    if (type === 'dashed') {
      const currentStrokeWidth = elementPopover.selectedElementStrokeWidth.value;
      elementPopover.updateElementDashPattern(calculateDashPattern(currentStrokeWidth));
    } else {
      elementPopover.updateElementDashPattern(undefined);
    }
  }

  function handleFillColorUpdate(color: string) {
    elementPopover.updateElementFillColor(color);
  }

  function handleStrokeColorUpdate(color: string) {
    elementPopover.updateElementStrokeColor(color);
  }

  function handleStrokeWidthUpdate(width: number) {
    const hasDashedStroke = elementPopover.selectedElementDashPattern.value;
    const dashPattern = hasDashedStroke ? calculateDashPattern(width) : undefined;
    elementPopover.updateElementStrokeWidth(width, dashPattern);
  }

  function handleStartArrowUpdate(arrowType: ArrowType) {
    elementPopover.updateElementStartArrow(arrowType);
  }

  function handleEndArrowUpdate(arrowType: ArrowType) {
    elementPopover.updateElementEndArrow(arrowType);
  }

  function handleTextColorUpdate(color: string) {
    elementPopover.updateElementTextColor(color);
  }

  function handleFontSizeUpdate(size: number | null) {
    if (size === null) return;
    const minFontSize = 8;
    const maxFontSize = 200;
    const clampedValue = Math.max(minFontSize, Math.min(maxFontSize, size));
    elementPopover.updateElementFontSize(clampedValue);
  }

  const keepAspectRatio = ref(true);

  function handleImageWidthUpdate(width: number | null) {
    if (width === null || width <= 0) return;
    elementPopover.updateElementImageWidth(width, keepAspectRatio.value);
  }

  function handleImageHeightUpdate(height: number | null) {
    if (height === null || height <= 0) return;
    elementPopover.updateElementImageHeight(height, keepAspectRatio.value);
  }

  function handleImageReplace() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      elementPopover.replaceImageSource(url);
    };
    input.click();
  }
</script>

<template>
  <div ref="containerRef" class="h-full flex flex-col overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div
        class="px-3 py-2 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        @click="propertiesCollapsed = !propertiesCollapsed"
      >
        <h3 class="text-xs font-medium text-gray-600">属性</h3>
        <IconRenderer
          :name="propertiesCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
          :size="14"
          class="text-gray-400"
        />
      </div>

      <div v-show="!propertiesCollapsed" class="p-3">
        <div v-if="!hasSelection" class="text-xs text-gray-400 text-center py-4">选择元素以编辑属性</div>

        <div v-else class="flex flex-col gap-3">
          <template v-if="isFillableElement">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">填充颜色</label>
              <ColorPicker
                size="small"
                :value="elementPopover.selectedElementFillColor.value"
                @update:value="handleFillColorUpdate"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">边框</label>
              <StrokeConfigPopover
                :stroke-width="elementPopover.selectedElementStrokeWidth.value"
                :stroke-color="elementPopover.selectedElementStrokeColor.value"
                :stroke-type="currentStrokeType"
                @update:stroke-width="handleStrokeWidthUpdate"
                @update:stroke-color="handleStrokeColorUpdate"
                @update:stroke-type="handleStrokeTypeChange"
              >
                <template #trigger>
                  <StrokeColorButton :stroke-color="elementPopover.selectedElementStrokeColor.value" />
                </template>
              </StrokeConfigPopover>
            </div>
          </template>

          <template v-else-if="isStrokeOnlyElement || isArrowElement">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">线条样式</label>
              <StrokeConfigPopover
                :stroke-width="elementPopover.selectedElementStrokeWidth.value"
                :stroke-color="elementPopover.selectedElementStrokeColor.value"
                :stroke-type="currentStrokeType"
                @update:stroke-width="handleStrokeWidthUpdate"
                @update:stroke-color="handleStrokeColorUpdate"
                @update:stroke-type="handleStrokeTypeChange"
              >
                <template #trigger>
                  <StrokeColorButton :stroke-color="elementPopover.selectedElementStrokeColor.value" />
                </template>
              </StrokeConfigPopover>
            </div>

            <template v-if="isArrowElement">
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] text-gray-500">箭头</label>
                <ArrowConfigButtons
                  :start-arrow="elementPopover.selectedElementStartArrow.value"
                  :end-arrow="elementPopover.selectedElementEndArrow.value"
                  @update:start-arrow="handleStartArrowUpdate"
                  @update:end-arrow="handleEndArrowUpdate"
                />
              </div>
            </template>
          </template>

          <template v-else-if="isTextElement">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">文字颜色</label>
              <ColorPicker
                size="small"
                :value="elementPopover.selectedElementTextColor.value ?? '#000000'"
                @update:value="handleTextColorUpdate"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">字体大小</label>
              <n-input-number
                :value="elementPopover.selectedElementFontSize.value ?? 32"
                :min="8"
                :max="200"
                :step="1"
                size="small"
                class="w-full"
                placeholder=""
                @update:value="handleFontSizeUpdate"
              />
            </div>
          </template>

          <template v-else-if="isImageElement">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">宽度</label>
              <n-input-number
                :value="elementPopover.selectedElementImageWidth.value"
                :min="1"
                :max="10000"
                :step="1"
                size="small"
                class="w-full"
                placeholder=""
                @update:value="handleImageWidthUpdate"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-gray-500">高度</label>
              <n-input-number
                :value="elementPopover.selectedElementImageHeight.value"
                :min="1"
                :max="10000"
                :step="1"
                size="small"
                class="w-full"
                placeholder=""
                @update:value="handleImageHeightUpdate"
              />
            </div>

            <div class="flex items-center gap-2">
              <n-checkbox v-model:checked="keepAspectRatio" size="small">
                <span class="text-[11px] text-gray-500">保持比例</span>
              </n-checkbox>
            </div>

            <div class="flex flex-col gap-1.5">
              <n-button size="small" block @click="handleImageReplace">
                <template #icon>
                  <IconRenderer name="i-lucide-image-plus" :size="14" />
                </template>
                替换图片
              </n-button>
            </div>
          </template>

          <div v-if="hasSelection" class="border-t border-gray-100 pt-3 mt-1">
            <label class="text-[11px] text-gray-500 mb-1.5 block">图层顺序</label>
            <LayerControls
              :can-bring-forward="elementPopover.canBringForward.value"
              :can-send-backward="elementPopover.canSendBackward.value"
              @bring-forward="elementPopover.bringElementForward"
              @send-backward="elementPopover.sendElementBackward"
              @bring-to-front="elementPopover.bringElementToFront"
              @send-to-back="elementPopover.sendElementToBack"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      class="h-1 bg-gray-100 hover:bg-blue-200 cursor-row-resize transition-colors shrink-0 relative group"
      @mousedown="handleSplitterMouseDown"
    >
      <div
        class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div class="w-8 h-0.5 bg-gray-300 rounded-full" />
      </div>
    </div>

    <div class="min-h-0 border-t border-gray-200" :style="{ height: `${layerPanelHeight}px` }">
      <LayerPanel />
    </div>
  </div>
</template>
