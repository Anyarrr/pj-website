<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  filter?: (value: string) => string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const onInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  let value: string | number = input.value

  if (props.filter && typeof value === 'string') {
    const cursor = input.selectionStart ?? 0
    const oldLen = value.length
    value = props.filter(value)
    input.value = value
    // Корректируем позицию курсора
    const newCursor = Math.max(0, cursor - (oldLen - value.length))
    nextTick(() => input.setSelectionRange(newCursor, newCursor))
  }

  emit('update:modelValue', value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
      {{ label }}
    </label>
    <input
      ref="inputRef"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
      class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/20': error }"
      :style="{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)'
      }"
    />
    <p v-if="error" class="mt-1.5 text-sm text-red-400">{{ error }}</p>
  </div>
</template>
