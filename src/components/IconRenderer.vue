<script setup lang="ts">
  import {
    ArrowRight,
    BringToFront,
    ChevronDown,
    ChevronUp,
    Circle,
    ClipboardPaste,
    Copy,
    FileCode,
    FileCode2,
    FileJson,
    FileJson2,
    Frame,
    Github,
    Group,
    Hand,
    Image,
    ImageDown,
    Layers,
    Lock,
    Menu,
    Minus,
    MoreHorizontal,
    MousePointer2,
    Pencil,
    Pentagon,
    PenTool,
    Plus,
    PlusSquare,
    Redo2,
    SendToBack,
    Square,
    SquareCheckBig,
    Trash2,
    Type,
    Undo2,
    Ungroup,
    Unlock,
    ZoomIn,
    ZoomOut
  } from 'lucide-vue-next';
  import type { Component } from 'vue';
  import { computed } from 'vue';

  const props = defineProps<{
    name: string;
    class?: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
  }>();

  const iconNameToComponentMap: Record<string, Component> = {
    'i-lucide-square': Square,
    'i-lucide-circle': Circle,
    'i-lucide-minus': Minus,
    'i-lucide-arrow-right': ArrowRight,
    'i-lucide-pen-tool': PenTool,
    'i-lucide-pentagon': Pentagon,
    'i-lucide-type': Type,
    'i-lucide-image': Image,
    'i-lucide-image-down': ImageDown,
    'i-lucide-undo-2': Undo2,
    'i-lucide-redo-2': Redo2,
    'i-lucide-zoom-in': ZoomIn,
    'i-lucide-zoom-out': ZoomOut,
    'i-lucide-mouse-pointer-2': MousePointer2,
    'i-lucide-hand': Hand,
    'i-lucide-github': Github,
    'i-lucide-menu': Menu,
    'i-lucide-file-braces-corner': FileJson2,
    'i-lucide-plus-square': PlusSquare,
    'i-lucide-plus': Plus,
    'i-lucide-layers': Layers,
    'i-lucide-lock': Lock,
    'i-lucide-unlock': Unlock,
    'i-lucide-frame': Frame,
    'i-lucide-more-horizontal': MoreHorizontal,
    'i-lucide-pencil': Pencil,
    'i-lucide-copy': Copy,
    'i-lucide-trash-2': Trash2,
    'i-lucide-group': Group,
    'i-lucide-ungroup': Ungroup,
    'i-lucide-bring-to-front': BringToFront,
    'i-lucide-send-to-back': SendToBack,
    'i-lucide-chevron-up': ChevronUp,
    'i-lucide-chevron-down': ChevronDown,
    'i-lucide-clipboard-paste': ClipboardPaste,
    'i-lucide-square-check-big': SquareCheckBig,
    FileJson2,
    FileJson,
    FileCode2,
    FileCode
  };

  const resolvedIconComponent = computed(() => {
    const trimmedIconName = props.name.trim();
    return iconNameToComponentMap[trimmedIconName] ?? null;
  });
</script>

<template>
  <component
    :is="resolvedIconComponent"
    v-if="resolvedIconComponent"
    :class="class"
    :size="size"
    :color="color"
    :stroke-width="strokeWidth"
    :absolute-stroke-width="absoluteStrokeWidth"
  />
</template>
