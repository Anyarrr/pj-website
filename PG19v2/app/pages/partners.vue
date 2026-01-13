<script setup lang="ts">
useHead({
  title: 'Партнёрам — ПЖ19'
})

const benefits = [
  { icon: 'heroicons:user-group', title: 'Расширение аудитории', description: 'Доступ к 100 000+ участников сообщества' },
  { icon: 'heroicons:chart-bar', title: 'Стабильный доход', description: 'Прозрачные условия партнёрства' },
  { icon: 'heroicons:wrench-screwdriver', title: 'Техническая поддержка', description: 'Помощь в интеграции и обслуживании' },
  { icon: 'heroicons:shield-check', title: 'Надёжность', description: 'Работа в рамках законодательства РФ' }
]
</script>

<template>
  <div class="pt-28">
    <!-- Hero -->
    <section class="mesh-gradient-hero py-20 md:py-32 relative overflow-hidden">
      <div class="absolute inset-0 network-pattern opacity-20"></div>
      <div class="floating-shape w-[400px] h-[400px] bg-accent/20 -top-32 -left-32"></div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 glass-card rounded-3xl mb-8 opacity-0 animate-fade-in-up">
            <Icon name="heroicons:building-office-2" class="w-10 h-10 text-accent" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 opacity-0 animate-fade-in-up stagger-1">
            <span class="text-accent">Партнёрам</span>
          </h1>
          <p class="text-xl text-[var(--text-muted)] opacity-0 animate-fade-in-up stagger-2">
            Приглашаем к сотрудничеству владельцев сетей и операторов связи
          </p>
        </div>
      </div>
    </section>

    <!-- Benefits & Contact -->
    <section class="py-20 md:py-32" :style="{ background: 'var(--bg-base)' }">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row gap-8 lg:items-stretch lg:justify-between">
          <!-- Benefits - 2 columns -->
          <div class="flex-1 grid md:grid-cols-2 gap-6">
            <div
              v-for="(benefit, index) in benefits"
              :key="benefit.title"
              class="glass-card p-6 rounded-2xl opacity-0 animate-fade-in-up"
              :class="`stagger-${index + 1}`"
            >
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4">
                <Icon :name="benefit.icon" class="w-7 h-7 text-accent" />
              </div>
              <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">{{ benefit.title }}</h3>
              <p class="text-[var(--text-muted)]">{{ benefit.description }}</p>
            </div>
          </div>

          <!-- Divider -->
          <div class="hidden lg:block w-px bg-white/10 flex-shrink-0 self-stretch"></div>

          <!-- Contact -->
          <div class="flex-shrink-0 lg:w-80 w-full">
            <h2 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6 lg:text-left text-center">
              Стать партнёром
            </h2>
            <div class="glass-card rounded-2xl p-8 opacity-0 animate-fade-in-up stagger-5">
              <p class="text-[var(--text-muted)] mb-6 text-sm lg:text-left text-center">
                Свяжитесь с нами для обсуждения условий сотрудничества
              </p>
              <div class="space-y-4 mb-6">
                <a href="mailto:partners@pg19.ru" class="flex items-center gap-3 group lg:justify-start justify-center">
                  <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Icon name="heroicons:envelope" class="w-5 h-5 text-accent" />
                  </div>
                  <span class="text-[var(--text-primary)] text-sm group-hover:text-accent transition-colors">partners@pg19.ru</span>
                </a>
                <a href="tel:+78001234567" class="flex items-center gap-3 group lg:justify-start justify-center">
                  <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon name="heroicons:phone" class="w-5 h-5 text-primary" />
                  </div>
                  <span class="text-[var(--text-primary)] text-sm group-hover:text-primary transition-colors">8 (800) 123-45-67</span>
                </a>
              </div>

              <NuxtLink
                to="/connect"
                class="btn-primary w-full inline-flex items-center justify-center gap-3 px-6 py-3 text-base"
              >
                <span>Оставить заявку</span>
                <Icon name="heroicons:arrow-right" class="w-5 h-5" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
