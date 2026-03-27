<template>
  <div class="min-h-screen flex flex-col">
    <LayoutAppHeader />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutAppFooter />

    <!-- Кнопка "Наверх" на мобилке -->
    <ClientOnly>
      <ScrollToTop />
    </ClientOnly>

    <!-- Виджет онлайн-чата -->
    <ClientOnly>
      <ChatWidget />
    </ClientOnly>
  </div>
</template>
