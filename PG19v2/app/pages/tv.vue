<script setup lang="ts">
useHead({
  title: 'Телевидение — ПЖ19'
})

// Загружаем категории каналов из API
const { data: channelsData } = useTvChannels()

// Преобразуем в формат для отображения
const channels = computed(() => {
  return (channelsData.value || []).map(c => ({
    category: c.name,
    count: c.count,
    icon: c.icon
  }))
})

// Общее количество каналов
const totalChannels = computed(() => {
  return channels.value.reduce((sum, c) => sum + c.count, 0)
})
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-secondary/20 -top-32 -left-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:tv" class="w-10 h-10 text-secondary" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Цифровое <span class="text-gradient-secondary">телевидение</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-4 opacity-0 animate-fade-in-up stagger-2">
            <span class="text-5xl font-bold text-secondary">{{ totalChannels || 191 }}</span> <span class="text-[var(--text-secondary)]">канал в HD и 4K качестве</span>
          </p>
          <p class="text-[var(--text-muted)] mb-10 opacity-0 animate-fade-in-up stagger-2">
            Включено в членский взнос без дополнительной платы
          </p>
          <NuxtLink
            to="/connect"
            class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg opacity-0 animate-fade-in-up stagger-3"
          >
            <span>Подключиться</span>
            <Icon name="heroicons:arrow-right" class="w-5 h-5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Channels & Equipment -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row gap-8 lg:items-stretch lg:justify-between">
          <!-- Channels - 3 columns -->
          <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="(item, index) in channels"
              :key="item.category"
              class="glass-card p-5 rounded-xl opacity-0 animate-fade-in-up"
              :class="`stagger-${(index % 6) + 1}`"
            >
              <div class="flex items-center gap-3 mb-2">
                <Icon :name="item.icon" class="w-5 h-5 text-secondary" />
                <span class="text-3xl font-bold text-[var(--text-primary)]">{{ item.count }}</span>
              </div>
              <p class="text-[var(--text-muted)] text-sm">{{ item.category }}</p>
            </div>
          </div>

          <!-- Divider -->
          <div class="hidden lg:block w-px bg-white/10 flex-shrink-0 self-stretch"></div>

          <!-- Equipment -->
          <div class="flex-shrink-0 lg:w-64 w-full">
            <h2 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6 lg:text-left text-center">Оборудование</h2>
            <div class="glass-card rounded-2xl p-8 opacity-0 animate-fade-in-up stagger-5">
              <div class="icon-container mb-6">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                  <Icon name="heroicons:tv" class="w-6 h-6 text-secondary" />
                </div>
              </div>
              <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-3">ТВ-приставка Imaqliq G-Box</h3>
              <p class="text-[var(--text-muted)] mb-6 text-sm">Smart TV приставка с поддержкой 4K</p>
              <p class="text-xl font-bold text-secondary">+99 <span class="text-base text-[var(--text-muted)]">₽/мес</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
