<script setup lang="ts">
const visible = ref(false)

const checkVisibility = () => {
  // Показываем если страница длиннее viewport и пользователь прокрутил хотя бы немного
  visible.value = window.scrollY > 100
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', checkVisibility, { passive: true })
  checkVisibility()
})
onUnmounted(() => window.removeEventListener('scroll', checkVisibility))
</script>

<template>
  <Transition name="fade">
    <button
      v-if="visible"
      @click="scrollToTop"
      class="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-primary/40 active:scale-95 border border-white/20"
      style="background: var(--primary); color: #fff;"
      aria-label="Наверх"
    >
      <Icon name="heroicons:chevron-up-20-solid" class="w-7 h-7" />
    </button>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
