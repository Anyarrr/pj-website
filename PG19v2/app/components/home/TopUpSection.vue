<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

const contractNumber = ref('')
const error = ref('')

const paymentBaseUrl = computed(
  () => runtimeConfig.public.externalPaymentUrl || 'https://artelmik.ru/external-payment.html'
)

const digitsOnlyFilter = (value: string) => value.replace(/\D/g, '').slice(0, 10)

watch(contractNumber, () => {
  if (error.value) {
    error.value = ''
  }
})

const submitTopUp = async () => {
  const normalizedContract = contractNumber.value.trim()

  if (!normalizedContract) {
    error.value = 'Введите номер договора'
    return
  }

  if (normalizedContract.length < 4) {
    error.value = 'Номер договора должен содержать не менее 4 цифр'
    return
  }

  error.value = ''

  const targetUrl = new URL(paymentBaseUrl.value)
  targetUrl.searchParams.set('contract', normalizedContract)

  await navigateTo(targetUrl.toString(), { external: true })
}
</script>

<template>
  <section class="py-8 md:py-10">
    <div class="container mx-auto px-4">
      <div class="top-up-card max-w-5xl mx-auto glass-card rounded-2xl p-5 md:p-6">
        <div class="mb-4 md:mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl md:text-2xl font-semibold text-[var(--text-primary)]">
              Быстрое пополнение
            </h2>
            <p class="text-base md:text-lg text-[var(--text-muted)]">
              Введите номер договора и перейдите к оплате
            </p>
          </div>
          <Icon name="heroicons:credit-card" class="w-6 h-6 md:w-7 md:h-7 text-primary shrink-0 mt-0.5" />
        </div>

        <form class="grid gap-4 md:grid-cols-[1fr_auto] md:items-start" @submit.prevent="submitTopUp">
          <UInput
            v-model="contractNumber"
            placeholder="Номер договора"
            :filter="digitsOnlyFilter"
            :error="error"
          />
          <UButton
            variant="success"
            size="lg"
            class="md:min-w-[220px] md:h-[54px]"
          >
            Пополнить
          </UButton>
        </form>

        <p class="mt-4 text-sm md:text-base text-[var(--text-muted)]">
          Списание происходит 1-го числа каждого месяца.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.top-up-card.glass-card:hover {
  transform: none;
}
</style>
