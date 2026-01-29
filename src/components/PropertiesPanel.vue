<script setup lang="ts">
  import { computed, inject, ref } from 'vue';
  import type { ArrowType } from './common/ArrowPicker.vue';
  import { useElementPopover } from '@/composables/state/useElementPopover';
  import { calculateDashPattern } from '@/utils/stroke';

  type StrokeType = 'solid' | 'dashed';

  const elementPopover = inject<ReturnType<typeof useElementPopover>>('elementPopover', useElementPopover());

  const propertiesCollapsed = ref(false);

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
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="shrink-0">
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
                :value="elementPopover.selectedElementFontSize.value ?? 16"
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
            <div class="text-xs text-gray-400 text-center py-2">图片元素</div>
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

    <div class="flex-1 min-h-0 border-t border-gray-200">
      <LayerPanel />
    </div>
  </div>
</template>
