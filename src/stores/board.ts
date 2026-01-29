/**
 * Board store for managing multiple drawing boards
 */

import { Frame } from 'leafer-ui';
import { defineStore } from 'pinia';
import type { Board, BoardCreateOptions, BoardUpdateOptions } from '@/types/board';
import { DEFAULT_BOARD_SIZE } from '@/types/board';
import { useCanvasStore } from './canvas';

export const useBoardStore = defineStore('board', {
  state: () => ({
    boards: [] as Board[],
    activeBoardId: null as string | null
  }),

  getters: {
    activeBoard(): Board | null {
      if (!this.activeBoardId) return null;
      return this.boards.find(board => board.id === this.activeBoardId) ?? null;
    },

    boardCount(): number {
      return this.boards.length;
    },

    hasBoards(): boolean {
      return this.boards.length > 0;
    }
  },

  actions: {
    generateBoardId(): string {
      return `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    createBoard(options: BoardCreateOptions): Board | null {
      const canvasStore = useCanvasStore();
      const app = canvasStore.appInstance;

      if (!app?.tree) return null;

      const boardId = this.generateBoardId();
      const now = new Date().toISOString();

      const boardX = options.x ?? this.boards.length * 50;
      const boardY = options.y ?? this.boards.length * 50;
      const bgColor = options.backgroundColor || '#ffffff';

      const frame = new Frame({
        x: boardX,
        y: boardY,
        width: options.width || DEFAULT_BOARD_SIZE.width,
        height: options.height || DEFAULT_BOARD_SIZE.height,
        fill: bgColor === 'transparent' ? undefined : bgColor,
        editable: true,
        draggable: true,
        overflow: 'hide'
      });

      app.tree.add(frame);

      const board: Board = {
        id: boardId,
        name: options.name || `画板 ${this.boards.length + 1}`,
        width: options.width || DEFAULT_BOARD_SIZE.width,
        height: options.height || DEFAULT_BOARD_SIZE.height,
        x: boardX,
        y: boardY,
        backgroundColor: bgColor,
        frame,
        objects: [],
        createdAt: now,
        updatedAt: now
      };

      this.boards.push(board);

      if (!this.activeBoardId) {
        this.activeBoardId = boardId;
      }

      return board;
    },

    deleteBoard(boardId: string): boolean {
      const canvasStore = useCanvasStore();
      const app = canvasStore.appInstance;

      const boardIndex = this.boards.findIndex(board => board.id === boardId);
      if (boardIndex === -1) return false;

      const board = this.boards[boardIndex];

      if (board?.frame && app?.tree) {
        app.tree.remove(board.frame);
      }

      this.boards.splice(boardIndex, 1);

      if (this.activeBoardId === boardId) {
        this.activeBoardId = this.boards.length > 0 ? (this.boards[0]?.id ?? null) : null;
      }

      return true;
    },

    updateBoard(boardId: string, options: BoardUpdateOptions): boolean {
      const board = this.boards.find(b => b.id === boardId);
      if (!board) return false;

      if (options.name !== undefined) {
        board.name = options.name;
      }

      if (options.width !== undefined && board.frame) {
        board.width = options.width;
        board.frame.width = options.width;
      }

      if (options.height !== undefined && board.frame) {
        board.height = options.height;
        board.frame.height = options.height;
      }

      if (options.x !== undefined && board.frame) {
        board.x = options.x;
        board.frame.x = options.x;
      }

      if (options.y !== undefined && board.frame) {
        board.y = options.y;
        board.frame.y = options.y;
      }

      board.updatedAt = new Date().toISOString();

      return true;
    },

    setActiveBoard(boardId: string): boolean {
      const board = this.boards.find(b => b.id === boardId);
      if (!board) return false;

      this.activeBoardId = boardId;

      const canvasStore = useCanvasStore();
      const app = canvasStore.appInstance;

      if (app?.editor && board.frame) {
        app.editor.select(board.frame);
      }

      return true;
    },

    getBoardById(boardId: string): Board | null {
      return this.boards.find(board => board.id === boardId) ?? null;
    },

    duplicateBoard(boardId: string): Board | null {
      const sourceBoard = this.getBoardById(boardId);
      if (!sourceBoard) return null;

      const newBoard = this.createBoard({
        name: `${sourceBoard.name} 副本`,
        width: sourceBoard.width,
        height: sourceBoard.height,
        x: sourceBoard.x + 50,
        y: sourceBoard.y + 50
      });

      return newBoard;
    },

    clearAllBoards(): void {
      const canvasStore = useCanvasStore();
      const app = canvasStore.appInstance;

      this.boards.forEach(board => {
        if (board.frame && app?.tree) {
          app.tree.remove(board.frame);
        }
      });

      this.boards = [];
      this.activeBoardId = null;
    }
  }
});
