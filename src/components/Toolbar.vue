<script setup lang="ts"></script>

<template>
  <header class="h-12 shrink-0 flex items-center px-4 bg-white border-b border-gray-200 z-50">
    <div
      class="flex items-center gap-1 px-2 py-1.5 shadow-sm backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-lg"
    >
      <MenuDropdown />
      <div class="w-px h-5 bg-gray-200 mx-0.5" />
      <UndoRedoButtons />
    </div>
  </header>
</template>
