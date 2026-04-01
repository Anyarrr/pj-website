<script setup lang="ts">
const colorMode = useColorMode()
const chatStore = useChatStore()
const route = useRoute()
const isMenuOpen = ref(false)
const isScrolled = ref(false)
const isCallbackOpen = ref(false)

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// Scroll listener с правильной инициализацией
let scrollHandler: (() => void) | null = null
let resizeHandler: (() => void) | null = null

onMounted(() => {
  scrollHandler = () => {
    isScrolled.value = window.scrollY > 20
  }
  // Установить начальное состояние сразу (избегает hydration mismatch)
  scrollHandler()
  window.addEventListener('scroll', scrollHandler, { passive: true })

  resizeHandler = () => {
    if (window.innerWidth >= 1024) {
      closeMenu()
    }
  }
  window.addEventListener('resize', resizeHandler, { passive: true })
})

onUnmounted(() => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  document.body.style.overflow = ''
})

const mainNav = [
  { name: 'Частным лицам', href: '/' },
  { name: 'Бизнесу', href: '/business' },
  { name: 'Партнёрам', href: '/partners' },
  { name: 'О сообществе', href: '/about' }
]

const servicesNav = [
  { name: 'Интернет', href: '/internet', icon: 'heroicons:wifi' },
  { name: 'Телевидение', href: '/tv', icon: 'heroicons:tv' },
  { name: 'Мобильная связь', href: '/mobile', icon: 'heroicons:device-phone-mobile' },
  { name: 'Видеонаблюдение', href: '/cctv', icon: 'heroicons:video-camera' },
  { name: 'Домофон', href: '/intercom', icon: 'heroicons:home' }
]

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  }
)

watch(isMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="isScrolled ? 'header-blur shadow-lg' : 'header-transparent'"
  >
    <!-- Top Level: Main navigation -->
    <div class="border-b border-white/5">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-11 text-sm">
          <!-- Main nav (left) -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in mainNav"
              :key="item.href"
              :to="item.href"
              class="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
              active-class="text-primary bg-primary/10"
            >
              {{ item.name }}
            </NuxtLink>
          </nav>

          <!-- Right side links -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              to="/news"
              class="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
            >
              <Icon name="heroicons:newspaper" class="w-4 h-4" />
              <span>Новости</span>
            </NuxtLink>
            <button
              @click="chatStore.open()"
              class="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
            >
              <Icon name="heroicons:chat-bubble-left-right" class="w-4 h-4" />
              <span>Поддержка</span>
            </button>
            <button
              @click="isCallbackOpen = true"
              class="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-[var(--glass-bg)]"
            >
              <Icon name="heroicons:phone-arrow-up-right" class="w-4 h-4" />
              <span>Обратный звонок</span>
            </button>
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="theme-toggle"
              :title="colorMode.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
            >
              <Icon
                :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'"
                class="w-5 h-5"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Level: Logo + Services navigation -->
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex-shrink-0 group">
          <img
            src="/logo.png"
            alt="ПЖ19"
            class="h-10 transition-transform duration-300 group-hover:scale-105"
          />
        </NuxtLink>

        <!-- Services nav (center, desktop) -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink
            v-for="item in servicesNav"
            :key="item.href"
            :to="item.href"
            class="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 group"
            active-class="text-primary bg-primary/10"
          >
            <Icon
              :name="item.icon"
              class="w-5 h-5 transition-colors duration-300 group-hover:text-primary"
            />
            <span class="font-medium">{{ item.name }}</span>
          </NuxtLink>
        </nav>

        <!-- Personal Account Button -->
        <a
          href="https://pg19-client.doka.team"
          class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-info hover:bg-info/90 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-info/25 hover:shadow-xl hover:shadow-info/30"
        >
          <Icon name="heroicons:user-circle" class="w-5 h-5" />
          <span>Личный кабинет</span>
        </a>

        <!-- Mobile menu button -->
        <button
          @click="isMenuOpen = !isMenuOpen"
          class="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-primary hover:border-primary/40 transition-all"
          :aria-expanded="isMenuOpen"
          aria-label="Открыть меню"
        >
          <Icon :name="isMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'" class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <div v-if="isMenuOpen" class="lg:hidden">
        <button
          type="button"
          class="fixed inset-0 top-[108px] bg-slate-950/35 backdrop-blur-[2px]"
          aria-label="Закрыть меню"
          @click="closeMenu"
        />
        <div
          class="absolute top-full left-0 right-0 border-t shadow-2xl"
          :style="{ background: 'var(--header-blur-bg)', borderColor: 'var(--header-border)' }"
        >
          <div class="container mx-auto px-4 py-3">
            <div class="max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-[24px] border border-[var(--glass-border)] bg-[var(--bg-surface)]/95 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5">
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-primary)]">Меню</p>
                    <p class="text-xs text-[var(--text-muted)]">Навигация и быстрые действия</p>
                  </div>
                  <button
                    @click="toggleTheme"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--text-secondary)] transition-all hover:border-primary/40 hover:text-primary"
                    :aria-label="colorMode.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
                  >
                    <Icon
                      :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'"
                      class="w-5 h-5"
                    />
                  </button>
                </div>

                <div class="space-y-2.5">
                  <p class="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Разделы
                  </p>
                  <nav class="grid grid-cols-2 gap-2">
                    <NuxtLink
                      v-for="item in mainNav"
                      :key="item.href"
                      :to="item.href"
                      @click="closeMenu"
                      class="flex min-h-[54px] items-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm font-medium leading-tight text-[var(--text-secondary)] transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-[var(--text-primary)]"
                      active-class="border-primary/40 bg-primary/10 text-primary"
                    >
                      <span>{{ item.name }}</span>
                    </NuxtLink>
                    <NuxtLink
                      to="/news"
                      @click="closeMenu"
                      class="flex min-h-[54px] items-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm font-medium leading-tight text-[var(--text-secondary)] transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-[var(--text-primary)]"
                      active-class="border-primary/40 bg-primary/10 text-primary"
                    >
                      <span>Новости</span>
                    </NuxtLink>
                  </nav>
                </div>

                <div class="space-y-2.5">
                  <p class="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Услуги
                  </p>
                  <nav class="grid grid-cols-2 gap-2">
                    <NuxtLink
                      v-for="item in servicesNav"
                      :key="item.href"
                      :to="item.href"
                      @click="closeMenu"
                      class="flex items-center gap-2.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-[var(--text-secondary)] transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-[var(--text-primary)]"
                      active-class="border-primary/40 bg-primary/10 text-primary"
                    >
                      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10">
                        <Icon :name="item.icon" class="w-4.5 h-4.5 text-primary" />
                      </div>
                      <span class="text-xs font-medium leading-tight">{{ item.name }}</span>
                    </NuxtLink>
                  </nav>
                </div>

                <div class="space-y-2.5">
                  <p class="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Быстрые действия
                  </p>
                  <div class="grid grid-cols-1 gap-2">
                    <button
                      @click="chatStore.open(); closeMenu()"
                      class="flex items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-primary/40 hover:bg-primary/10"
                    >
                      <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-primary" />
                      <span>Поддержка</span>
                    </button>
                    <button
                      @click="isCallbackOpen = true; closeMenu()"
                      class="flex items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-primary/40 hover:bg-primary/10"
                    >
                      <Icon name="heroicons:phone-arrow-up-right" class="w-5 h-5 text-primary" />
                      <span>Обратный звонок</span>
                    </button>
                    <a
                      href="https://pg19-client.doka.team"
                      @click="closeMenu"
                      class="flex items-center justify-center gap-2 rounded-2xl bg-info px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-info/90"
                    >
                      <Icon name="heroicons:user-circle" class="w-5 h-5" />
                      <span>Личный кабинет</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Callback Modal -->
    <CallbackModal v-model="isCallbackOpen" />
  </header>
</template>
