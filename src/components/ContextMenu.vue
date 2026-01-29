<script setup lang="ts">
  import { h, computed } from 'vue';
  import type { DropdownOption } from 'naive-ui';
  import IconRenderer from '@/components/IconRenderer.vue';

  interface Props {
    show: boolean;
    x: number;
    y: number;
    hasSelectedElements: boolean;
    selectedElementsCount: number;
    canGroup: boolean;
    canUngroup: boolean;
    canBringForward: boolean;
    canSendBackward: boolean;
  }

  interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'copy'): void;
    (e: 'paste'): void;
    (e: 'delete'): void;
    (e: 'group'): void;
    (e: 'ungroup'): void;
    (e: 'bringForward'): void;
    (e: 'sendBackward'): void;
    (e: 'bringToFront'): void;
    (e: 'sendToBack'): void;
    (e: 'selectAll'): void;
    (e: 'lockToggle'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const layerSubmenu = computed<DropdownOption[]>(() => [
    {
      label: '置顶',
      key: 'bringToFront',
      disabled: !props.canBringForward,
      icon: () => h(IconRenderer, { name: 'i-lucide-bring-to-front', size: 14 })
    },
    {
      label: '上移一层',
      key: 'bringForward',
      disabled: !props.canBringForward,
      icon: () => h(IconRenderer, { name: 'i-lucide-chevron-up', size: 14 })
    },
    {
      label: '下移一层',
      key: 'sendBackward',
      disabled: !props.canSendBackward,
      icon: () => h(IconRenderer, { name: 'i-lucide-chevron-down', size: 14 })
    },
    {
      label: '置底',
      key: 'sendToBack',
      disabled: !props.canSendBackward,
      icon: () => h(IconRenderer, { name: 'i-lucide-send-to-back', size: 14 })
    }
  ]);

  const dropdownOptions = computed<DropdownOption[]>(() => {
    const options: DropdownOption[] = [];

    if (props.hasSelectedElements) {
      options.push({
        label: '复制',
        key: 'copy',
        icon: () => h(IconRenderer, { name: 'i-lucide-copy', size: 14 })
      });
    }

    options.push({
      label: '粘贴',
      key: 'paste',
      icon: () => h(IconRenderer, { name: 'i-lucide-clipboard-paste', size: 14 })
    });

    if (props.hasSelectedElements) {
      options.push(
        {
          label: '删除',
          key: 'delete',
          icon: () => h(IconRenderer, { name: 'i-lucide-trash-2', size: 14 })
        },
        { type: 'divider', key: 'd1' }
      );

      if (props.canGroup) {
        options.push({
          label: '组合',
          key: 'group',
          icon: () => h(IconRenderer, { name: 'i-lucide-group', size: 14 })
        });
      }

      if (props.canUngroup) {
        options.push({
          label: '取消组合',
          key: 'ungroup',
          icon: () => h(IconRenderer, { name: 'i-lucide-ungroup', size: 14 })
        });
      }

      if (props.canGroup || props.canUngroup) {
        options.push({ type: 'divider', key: 'd2' });
      }

      options.push(
        {
          label: '图层',
          key: 'layer',
          icon: () => h(IconRenderer, { name: 'i-lucide-layers', size: 14 }),
          children: layerSubmenu.value
        },
        { type: 'divider', key: 'd3' },
        {
          label: '锁定/解锁',
          key: 'lockToggle',
          icon: () => h(IconRenderer, { name: 'i-lucide-lock', size: 14 })
        }
      );
    }

    options.push(
      { type: 'divider', key: 'd4' },
      {
        label: '全选',
        key: 'selectAll',
        icon: () => h(IconRenderer, { name: 'i-lucide-square-check-big', size: 14 })
      }
    );

    return options;
  });

  function handleSelect(key: string) {
    switch (key) {
      case 'copy':
        emit('copy');
        break;
      case 'paste':
        emit('paste');
        break;
      case 'delete':
        emit('delete');
        break;
      case 'group':
        emit('group');
        break;
      case 'ungroup':
        emit('ungroup');
        break;
      case 'bringForward':
        emit('bringForward');
        break;
      case 'sendBackward':
        emit('sendBackward');
        break;
      case 'bringToFront':
        emit('bringToFront');
        break;
      case 'sendToBack':
        emit('sendToBack');
        break;
      case 'selectAll':
        emit('selectAll');
        break;
      case 'lockToggle':
        emit('lockToggle');
        break;
    }
    emit('update:show', false);
  }

  function handleClickOutside() {
    emit('update:show', false);
  }
</script>

<template>
  <n-dropdown
    :show="show"
    :x="x"
    :y="y"
    :options="dropdownOptions"
    placement="bottom-start"
    trigger="manual"
    size="small"
    @select="handleSelect"
    @clickoutside="handleClickOutside"
  />
</template>
