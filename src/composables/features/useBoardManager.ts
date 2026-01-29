/**
 * Board manager composable for managing multiple drawing boards
 */

import { computed, ref } from 'vue';
import { useBoardStore } from '@/stores/board';
import type { BoardCreateOptions } from '@/types/board';

export function useBoardManager() {
  const boardStore = useBoardStore();

  const showCreateDialog = ref(false);

  const boards = computed(() => boardStore.boards);
  const activeBoard = computed(() => boardStore.activeBoard);
  const activeBoardId = computed(() => boardStore.activeBoardId);
  const boardCount = computed(() => boardStore.boardCount);
  const hasBoards = computed(() => boardStore.hasBoards);

  function openCreateDialog() {
    showCreateDialog.value = true;
  }

  function closeCreateDialog() {
    showCreateDialog.value = false;
  }

  function createBoard(options: BoardCreateOptions) {
    const board = boardStore.createBoard(options);
    closeCreateDialog();
    return board;
  }

  function deleteBoard(boardId: string) {
    return boardStore.deleteBoard(boardId);
  }

  function renameBoard(boardId: string, name: string) {
    return boardStore.updateBoard(boardId, { name });
  }

  function resizeBoard(boardId: string, width: number, height: number) {
    return boardStore.updateBoard(boardId, { width, height });
  }

  function setActiveBoard(boardId: string) {
    return boardStore.setActiveBoard(boardId);
  }

  function duplicateBoard(boardId: string) {
    return boardStore.duplicateBoard(boardId);
  }

  return {
    boards,
    activeBoard,
    activeBoardId,
    boardCount,
    hasBoards,

    showCreateDialog,
    openCreateDialog,
    closeCreateDialog,

    createBoard,
    deleteBoard,
    renameBoard,
    resizeBoard,
    setActiveBoard,
    duplicateBoard
  };
}
