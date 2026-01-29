<script setup lang="ts">
  import { h } from 'vue';
  import type { DropdownOption } from 'naive-ui';
  import IconRenderer from '@/components/IconRenderer.vue';
  import type { Board } from '@/types/board';

  interface Props {
    boards: Board[];
    activeBoardId: string | null;
  }

  interface Emits {
    (e: 'select', boardId: string): void;
    (e: 'create'): void;
    (e: 'delete', boardId: string): void;
    (e: 'duplicate', boardId: string): void;
    (e: 'rename', boardId: string): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  function getBoardMenuOptions(): DropdownOption[] {
    return [
      {
        label: '重命名',
        key: 'rename',
        icon: () => h(IconRenderer, { name: 'i-lucide-pencil', size: 14 })
      },
      {
        label: '复制',
        key: 'duplicate',
        icon: () => h(IconRenderer, { name: 'i-lucide-copy', size: 14 })
      },
      { type: 'divider', key: 'd1' },
      {
        label: '删除',
        key: 'delete',
        icon: () => h(IconRenderer, { name: 'i-lucide-trash-2', size: 14 })
      }
    ];
  }

  function handleBoardSelect(boardId: string) {
    emit('select', boardId);
  }

  function handleCreateBoard() {
    emit('create');
  }

  function handleBoardMenuSelect(key: string, board: Board) {
    switch (key) {
      case 'rename':
        emit('rename', board.id);
        break;
      case 'duplicate':
        emit('duplicate', board.id);
        break;
      case 'delete':
        emit('delete', board.id);
        break;
    }
  }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-gray-700">画板列表</span>
      <n-button size="tiny" quaternary circle @click="handleCreateBoard" title="新建画板">
        <template #icon>
          <IconRenderer name="i-lucide-plus" class="text-xs text-gray-500" />
        </template>
      </n-button>
    </div>

    <div v-if="boards.length === 0" class="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-lg">
      点击 + 新建画板
    </div>

    <div v-else class="flex flex-col gap-1">
      <div
        v-for="board in boards"
        :key="board.id"
        class="group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all"
        :class="[
          board.id === activeBoardId
            ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
            : 'hover:bg-gray-50 text-gray-700'
        ]"
        @click="handleBoardSelect(board.id)"
      >
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <IconRenderer
            name="i-lucide-frame"
            class="text-sm shrink-0"
            :class="board.id === activeBoardId ? 'text-blue-500' : 'text-gray-400'"
          />
          <div class="flex flex-col flex-1 min-w-0">
            <span class="text-xs font-medium truncate">{{ board.name }}</span>
            <span class="text-[10px] text-gray-400">{{ board.width }} × {{ board.height }}</span>
          </div>
        </div>

        <n-dropdown
          :options="getBoardMenuOptions()"
          trigger="click"
          size="small"
          @select="key => handleBoardMenuSelect(key as string, board)"
        >
          <n-button
            size="tiny"
            quaternary
            circle
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop
          >
            <template #icon>
              <IconRenderer name="i-lucide-more-horizontal" class="text-xs" />
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </div>
  </div>
</template>
