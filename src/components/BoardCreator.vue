<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { BOARD_PRESETS, DEFAULT_BOARD_SIZE, type BoardPreset } from '@/types/board';

  interface Props {
    show: boolean;
  }

  interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'create', options: { name: string; width: number; height: number; backgroundColor: string }): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();

  const boardName = ref('');
  const selectedPreset = ref<BoardPreset>(BOARD_PRESETS[4]!);
  const customWidth = ref(DEFAULT_BOARD_SIZE.width);
  const customHeight = ref(DEFAULT_BOARD_SIZE.height);
  const backgroundColor = ref('#ffffff');

  const backgroundColorOptions = [
    { label: '白色', value: '#ffffff' },
    { label: '黑色', value: '#000000' },
    { label: '灰色', value: '#f5f5f5' },
    { label: '透明', value: 'transparent' }
  ];

  const isCustomSize = computed(() => selectedPreset.value?.name === '自定义');

  const finalWidth = computed(() => {
    return isCustomSize.value ? customWidth.value : selectedPreset.value.width;
  });

  const finalHeight = computed(() => {
    return isCustomSize.value ? customHeight.value : selectedPreset.value.height;
  });

  const presetOptions = BOARD_PRESETS.map(preset => ({
    label: preset.name === '自定义' ? preset.name : `${preset.name} (${preset.width}x${preset.height})`,
    value: preset.name
  }));

  function handlePresetChange(value: string) {
    const preset = BOARD_PRESETS.find(p => p.name === value);
    if (preset) {
      selectedPreset.value = preset;
      if (!isCustomSize.value) {
        customWidth.value = preset.width;
        customHeight.value = preset.height;
      }
    }
  }

  function handleCreate() {
    emit('create', {
      name: boardName.value || '未命名画板',
      width: finalWidth.value,
      height: finalHeight.value,
      backgroundColor: backgroundColor.value
    });
    resetForm();
  }

  function handleCancel() {
    emit('update:show', false);
    resetForm();
  }

  function resetForm() {
    boardName.value = '';
    selectedPreset.value = BOARD_PRESETS[4]!;
    customWidth.value = DEFAULT_BOARD_SIZE.width;
    customHeight.value = DEFAULT_BOARD_SIZE.height;
    backgroundColor.value = '#ffffff';
  }
</script>

<template>
  <n-modal
    :show="show"
    preset="dialog"
    title="新建画板"
    positive-text="创建"
    negative-text="取消"
    @positive-click="handleCreate"
    @negative-click="handleCancel"
    @close="handleCancel"
  >
    <div class="flex flex-col gap-4 py-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600">画板名称</label>
        <n-input v-model:value="boardName" placeholder="输入画板名称" clearable />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600">尺寸预设</label>
        <n-select :value="selectedPreset.name" :options="presetOptions" @update:value="handlePresetChange" />
      </div>

      <div v-if="isCustomSize" class="flex gap-4">
        <div class="flex-1 flex flex-col gap-2">
          <label class="text-sm text-gray-600">宽度 (px)</label>
          <n-input-number v-model:value="customWidth" :min="100" :max="5000" placeholder="宽度" />
        </div>
        <div class="flex-1 flex flex-col gap-2">
          <label class="text-sm text-gray-600">高度 (px)</label>
          <n-input-number v-model:value="customHeight" :min="100" :max="5000" placeholder="高度" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600">背景颜色</label>
        <div class="flex items-center gap-2">
          <n-select v-model:value="backgroundColor" :options="backgroundColorOptions" class="flex-1" />
          <n-color-picker
            v-model:value="backgroundColor"
            :show-alpha="true"
            :modes="['hex']"
            size="small"
            style="width: 80px"
          />
        </div>
      </div>

      <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div
          class="w-16 h-12 rounded border border-gray-300 shadow-inner"
          :style="{
            backgroundColor:
              backgroundColor === 'transparent'
                ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px'
                : backgroundColor
          }"
        />
        <div class="text-sm text-gray-500">
          <div>尺寸: {{ finalWidth }} x {{ finalHeight }} px</div>
          <div>背景: {{ backgroundColor }}</div>
        </div>
      </div>
    </div>
  </n-modal>
</template>
