<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { BOARD_PRESETS, DEFAULT_BOARD_SIZE, type BoardPreset } from '@/types/board';

  interface Props {
    show: boolean;
  }

  interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'create', options: { name: string; width: number; height: number }): void;
  }

  defineProps<Props>();
  const emit = defineEmits<Emits>();

  const boardName = ref('');
  const selectedPreset = ref<BoardPreset>(BOARD_PRESETS[4]!);
  const customWidth = ref(DEFAULT_BOARD_SIZE.width);
  const customHeight = ref(DEFAULT_BOARD_SIZE.height);

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
      height: finalHeight.value
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

      <div class="text-sm text-gray-500">画板尺寸: {{ finalWidth }} x {{ finalHeight }} px</div>
    </div>
  </n-modal>
</template>
