<script setup lang="ts">
useHead({
  title: 'Интернет — ПЖ19'
})

interface Feature {
  icon: string
  title: string
  description: string
}

interface Equipment {
  name: string
  type: string
  description: string
  price_monthly: number
  icon: string
}

interface InternetContent {
  items: Feature[]
  equipment?: {
    title: string
    router: {
      name: string
      description: string
      price_monthly: number
    }
    tv_box?: {
      name: string
      description: string
      price_monthly: number
    }
  }
}

// Загружаем контент из API
const { content } = useSiteContent<{ features: InternetContent }>('internet')

// Получаем features из контента или используем fallback
const features = computed(() => content.value?.features?.items || [
  { icon: 'heroicons:no-symbol', title: 'Мы не режем скорость', description: 'Вы получаете всю полосу канала. Никаких искусственных ограничений' },
  { icon: 'heroicons:bolt', title: 'До 1000 Мбит/с', description: 'Максимальная скорость зависит только от вашего оборудования' },
  { icon: 'heroicons:device-tablet', title: '10+ устройств', description: 'Стабильная работа всех гаджетов одновременно' },
  { icon: 'heroicons:arrow-down-tray', title: '1 ГБ за 20 сек', description: 'Скачивание файлов на максимальной скорости' }
])

const routerEquipment = computed(() => content.value?.features?.equipment?.router)
const tvBoxEquipment = computed(() => content.value?.features?.equipment?.tv_box)

// Реактивные переменные для выбора оборудования
const selectedEquipment = ref<{ [key: string]: boolean }>({
  router: false,
  tv_box: false
})

// Дополнительное оборудование
const additionalEquipment: Equipment[] = computed(() => [
  {
    name: routerEquipment.value?.name || 'Wi-Fi роутер',
    type: 'router',
    description: routerEquipment.value?.description || 'SNR-CPE-ME2',
    price_monthly: routerEquipment.value?.price_monthly || 99,
    icon: 'heroicons:wifi'
  },
  {
    name: tvBoxEquipment.value?.name || 'ТВ-приставка',
    type: 'tv_box',
    description: tvBoxEquipment.value?.description || 'Imaqliq G-Box',
    price_monthly: tvBoxEquipment.value?.price_monthly || 99,
    icon: 'heroicons:tv'
  }
])

// Базовая цена
const basePrice = 699

// Вычисляем общую цену
const totalPrice = computed(() => {
  let total = basePrice
  if (selectedEquipment.value.router) {
    total += routerEquipment.value?.price_monthly || 99
  }
  if (selectedEquipment.value.tv_box) {
    total += tvBoxEquipment.value?.price_monthly || 99
  }
  return total
})

// Переключение выбора оборудования
function toggleEquipment(type: string) {
  selectedEquipment.value[type] = !selectedEquipment.value[type]
}
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-primary/20 -top-32 -right-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:wifi" class="w-10 h-10 text-primary" />
          </div>

          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            Интернет <span class="text-gradient-primary">без ограничений</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up stagger-2">
            Мы не режем скорость — вы получаете всю полосу канала до 1000 Мбит/с.
            Никаких тарифных ограничений, скорость зависит только от вашего оборудования.
          </p>

          <!-- Additional Equipment -->
          <div class="max-w-2xl mx-auto mb-8 opacity-0 animate-fade-in-up stagger-3">
            <!-- <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Дополнительное оборудование</h3> -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="equipment in additionalEquipment"
                :key="equipment.type"
                @click="toggleEquipment(equipment.type)"
                class="glass-card p-4 rounded-xl cursor-pointer transition-all duration-200 border-2"
                :class="selectedEquipment[equipment.type] ? 'border-primary bg-primary/10' : 'border-transparent hover:border-white/20'"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                      <Icon :name="equipment.icon" class="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <h4 class="text-sm font-semibold text-[var(--text-primary)]">{{ equipment.name }}</h4>
                      <span class="text-sm font-bold text-primary whitespace-nowrap">+ {{ equipment.price_monthly }} ₽</span>
                    </div>
                    <p class="text-xs text-[var(--text-muted)] mb-3">{{ equipment.description }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-[var(--text-muted)]">
                        {{ selectedEquipment[equipment.type] ? 'Включено' : 'Выключено' }}
                      </span>
                      <button 
                        @click.stop="toggleEquipment(equipment.type)"
                        class="relative w-11 h-6 rounded-full transition-colors duration-200"
                        :class="selectedEquipment[equipment.type] ? 'bg-primary' : 'bg-[var(--text-muted)]/30'"
                      >
                        <span
                          class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                          :class="selectedEquipment[equipment.type] ? 'translate-x-5' : 'translate-x-0'"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Price and Connect Button -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 opacity-0 animate-fade-in-up stagger-4">
            <div class="inline-flex items-baseline gap-2">
              <span class="text-base md:text-lg text-[var(--text-muted)]">от</span>
              <span class="text-3xl md:text-4xl font-bold text-gradient-primary">{{ totalPrice }}</span>
              <span class="text-base md:text-lg text-[var(--text-muted)]">₽/мес</span>
            </div>

            <NuxtLink
              to="/connect"
              class="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg"
            >
              <span>Подключиться</span>
              <Icon name="heroicons:arrow-right" class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="glass-card p-6 rounded-2xl opacity-0 animate-fade-in-up"
            :class="`stagger-${index + 1}`"
          >
            <div class="icon-container mb-4">
              <Icon :name="feature.icon" class="w-6 h-6 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">{{ feature.title }}</h3>
            <p class="text-[var(--text-muted)]">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
