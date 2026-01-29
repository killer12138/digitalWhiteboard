<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    canBringForward: boolean;
    canSendBackward: boolean;
  }

  interface Emits {
    (e: 'bringForward'): void;
    (e: 'sendBackward'): void;
    (e: 'bringToFront'): void;
    (e: 'sendToBack'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const canBringToFront = computed(() => props.canBringForward);
  const canSendToBack = computed(() => props.canSendBackward);

  function handleBringForward() {
    emit('bringForward');
  }

  function handleSendBackward() {
    emit('sendBackward');
  }

  function handleBringToFront() {
    emit('bringToFront');
  }

  function handleSendToBack() {
    emit('sendToBack');
  }
</script>

<template>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
    <template #trigger>
      <n-button quaternary size="small" circle title="图层控制">
        <template #icon>
          <IconRenderer name="i-lucide-layers" class="text-sm" />
        </template>
      </n-button>
    </template>
    <div class="flex flex-col gap-1 p-1 min-w-[120px]">
      <n-button
        size="small"
        quaternary
        class="justify-start"
        :disabled="!canBringToFront"
        @click="handleBringToFront"
      >
        <template #icon>
          <IconRenderer name="i-lucide-bring-to-front" class="text-sm" />
        </template>
        置顶
      </n-button>
      <n-button
        size="small"
        quaternary
        class="justify-start"
        :disabled="!canBringForward"
        @click="handleBringForward"
      >
        <template #icon>
          <IconRenderer name="i-lucide-chevron-up" class="text-sm" />
        </template>
        上移一层
      </n-button>
      <n-button
        size="small"
        quaternary
        class="justify-start"
        :disabled="!canSendBackward"
        @click="handleSendBackward"
      >
        <template #icon>
          <IconRenderer name="i-lucide-chevron-down" class="text-sm" />
        </template>
        下移一层
      </n-button>
      <n-button
        size="small"
        quaternary
        class="justify-start"
        :disabled="!canSendToBack"
        @click="handleSendToBack"
      >
        <template #icon>
          <IconRenderer name="i-lucide-send-to-back" class="text-sm" />
        </template>
        置底
      </n-button>
    </div>
  </n-popover>
</template>
