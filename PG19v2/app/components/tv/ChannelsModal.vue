<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function close() {
  isOpen.value = false
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const parent = img.parentElement
  if (parent && !parent.querySelector('.fallback-icon')) {
    const fallback = document.createElement('div')
    fallback.className = 'fallback-icon'
    fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>'
    fallback.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;'
    parent.appendChild(fallback)
  }
}

// Загрузка полного списка каналов
const { data: channelsData, pending: loading, refresh } = useFetch('/api/content/tv-channels-full', {
  key: 'tv-channels-full-list'
})

// Загружаем данные при открытии модального окна
watch(() => isOpen.value, (val) => {
  if (val) {
    refresh()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="channels-modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-4xl glass-card rounded-3xl p-6 md:p-10 my-8 animate-fade-in-up">
          <!-- Close button -->
          <button
            @click="close"
            class="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6 text-[var(--text-muted)]" />
          </button>

          <!-- Header -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 mb-4">
              <Icon name="heroicons:tv" class="w-7 h-7 text-secondary" />
            </div>
            <h2 class="text-3xl font-bold text-[var(--text-primary)] mb-2">Список каналов</h2>
            <p class="text-[var(--text-muted)]">191 канал в HD и 4K качестве</p>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-20">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-secondary" />
          </div>

          <!-- Content -->
          <div v-else-if="channelsData" class="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <!-- Category -->
            <div
              v-for="category in channelsData"
              :key="category.id"
            >
              <div class="flex items-center gap-3 mb-4">
                <Icon :name="category.icon" class="w-5 h-5 text-secondary" />
                <h3 class="text-xl font-bold text-[var(--text-primary)]">{{ category.name }}</h3>
                <span class="text-sm text-[var(--text-muted)]">({{ category.channels.length }})</span>
              </div>

              <!-- Channels grid -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div
                  v-for="channel in category.channels"
                  :key="channel.id"
                  class="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    <img
                      :src="channel.logoUrl"
                      :alt="channel.name"
                      class="w-6 h-6 object-contain"
                      loading="lazy"
                      @error="onImageError($event)"
                    />
                  </div>
                  <span class="text-[var(--text-primary)] text-sm truncate">{{ channel.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-10 text-[var(--text-muted)]">
            Не удалось загрузить список каналов
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.channels-modal-enter-active,
.channels-modal-leave-active {
  transition: opacity 0.3s ease;
}

.channels-modal-enter-from,
.channels-modal-leave-to {
  opacity: 0;
}

.channels-modal-enter-active > div:last-child,
.channels-modal-leave-active > div:last-child {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.channels-modal-enter-from > div:last-child,
.channels-modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
