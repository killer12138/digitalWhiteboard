<script setup lang="ts">
  import { useBoardManager } from '@/composables/features/useBoardManager';

  const boardManager = useBoardManager();

  function handleCreateBoard() {
    boardManager.openCreateDialog();
  }
</script>

<template>
  <header
    class="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-white border-b border-gray-200 z-50"
  >
    <div class="flex items-center gap-2">
      <MenuDropdown />
      <div class="w-px h-5 bg-gray-200 mx-1" />
      <UndoRedoButtons />
      <div class="w-px h-5 bg-gray-200 mx-1" />
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button quaternary size="small" @click="handleCreateBoard">
            <template #icon>
              <IconRenderer name="i-lucide-plus-square" class="text-base text-gray-600" />
            </template>
          </n-button>
        </template>
        新建画板
      </n-tooltip>
    </div>

    <div class="flex items-center">
      <ToolSelector />
    </div>

    <div class="w-32" />
  </header>
</template>
