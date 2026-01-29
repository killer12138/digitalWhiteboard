/** * Main application component */

<script setup lang="ts">
  import type { GlobalThemeOverrides } from 'naive-ui';
  import { provide, ref } from 'vue';
  import { useBoardManager } from '@/composables/features/useBoardManager';
  import { useElementPopover } from '@/composables/state/useElementPopover';
  import { themeColors } from '@/config/theme';

  const themeOverrides: GlobalThemeOverrides = {
    common: {
      primaryColor: themeColors.primary,
      primaryColorHover: themeColors.primaryHover,
      primaryColorPressed: themeColors.primaryPressed,
      primaryColorSuppl: themeColors.primarySuppl
    }
  };

  const elementPopover = useElementPopover();
  provide('elementPopover', elementPopover);

  const boardManager = useBoardManager();
  const renamingBoardId = ref<string | null>(null);
  const newBoardName = ref('');

  function handleBoardCreate(options: {
    name: string;
    width: number;
    height: number;
    backgroundColor: string;
  }) {
    boardManager.createBoard(options);
  }

  function handleBoardDelete(boardId: string) {
    boardManager.deleteBoard(boardId);
  }

  function handleBoardDuplicate(boardId: string) {
    boardManager.duplicateBoard(boardId);
  }

  function handleBoardRename(boardId: string) {
    const board = boardManager.boards.value.find(b => b.id === boardId);
    if (board) {
      renamingBoardId.value = boardId;
      newBoardName.value = board.name;
    }
  }

  function confirmRename() {
    if (renamingBoardId.value && newBoardName.value) {
      boardManager.renameBoard(renamingBoardId.value, newBoardName.value);
    }
    renamingBoardId.value = null;
    newBoardName.value = '';
  }

  function cancelRename() {
    renamingBoardId.value = null;
    newBoardName.value = '';
  }
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <div class="w-screen h-screen flex flex-col bg-gray-100">
      <Toolbar />

      <div class="flex-1 flex overflow-hidden">
        <aside class="w-52 shrink-0 bg-white border-r border-gray-200 p-3 overflow-y-auto">
          <BoardPanel
            :boards="boardManager.boards.value"
            :active-board-id="boardManager.activeBoardId.value"
            @select="boardManager.setActiveBoard"
            @create="boardManager.openCreateDialog"
            @delete="handleBoardDelete"
            @duplicate="handleBoardDuplicate"
            @rename="handleBoardRename"
          />
        </aside>

        <main class="flex-1 relative overflow-hidden">
          <Canvas />
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
            <BottomToolbar />
          </div>
        </main>

        <aside class="w-56 shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <PropertiesPanel />
        </aside>
      </div>

      <BoardCreator v-model:show="boardManager.showCreateDialog.value" @create="handleBoardCreate" />

      <n-modal
        :show="renamingBoardId !== null"
        preset="dialog"
        title="重命名画板"
        positive-text="确定"
        negative-text="取消"
        @positive-click="confirmRename"
        @negative-click="cancelRename"
        @close="cancelRename"
      >
        <n-input v-model:value="newBoardName" placeholder="输入新名称" @keyup.enter="confirmRename" />
      </n-modal>
    </div>
  </n-config-provider>
</template>
