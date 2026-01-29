<script setup lang="ts"></script>

<template>
  <header class="h-10 shrink-0 flex items-center px-4 bg-white border-b border-gray-200 z-50">
    <div class="flex items-center gap-2">
      <MenuDropdown />
      <div class="w-px h-5 bg-gray-200 mx-1" />
      <UndoRedoButtons />
    </div>
  </header>
</template>
