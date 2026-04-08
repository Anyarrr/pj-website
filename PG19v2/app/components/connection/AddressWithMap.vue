<script setup lang="ts">
/**
 * Поиск адреса + карта Yandex Maps API 2.1
 * Реализация как в v2pg19: сырой Yandex Maps API, ymaps.geocode, DaData подсказки
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { DadataSuggestion } from '~/composables/useDadataSuggest'

interface AddressValue {
  text: string
  coordinates: [number, number] | null // [lat, lon]
  components: Record<string, any> | null
}

const props = withDefaults(defineProps<{
  modelValue?: AddressValue
  label?: string
  required?: boolean
}>(), {
  modelValue: () => ({ text: '', coordinates: null, components: null }),
  required: true
})

const emit = defineEmits<{
  'update:modelValue': [value: AddressValue]
  'coverage-check': [result: any]
}>()

// --- Composables ---
const { suggestions, isLoading: suggestionsLoading, getSuggestions, clearSuggestions } = useDadataSuggest()
const { checkCoverage } = useCoverageCheck()
const runtimeConfig = useRuntimeConfig()

// --- Refs ---
const wrapperRef = ref<HTMLElement | null>(null)
const mapContainerRef = ref<HTMLElement | null>(null)

// --- Input state ---
const inputText = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)

// --- Map state ---
let ymapsMap: any = null
let ymapsPlacemark: any = null

// --- Status ---
const busy = ref(false)
const mapReady = ref(false)
const status = ref<'idle' | 'checking' | 'in_zone' | 'out_zone'>('idle')

// ===========================
// YANDEX MAPS API 2.1
// ===========================

/** Загрузить Yandex Maps API 2.1 через script tag */
function loadYmapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Уже загружен
    if (typeof (window as any).ymaps !== 'undefined') {
      resolve()
      return
    }

    // Уже добавлен script
    if (document.querySelector('script[src*="api-maps.yandex.ru"]')) {
      const check = setInterval(() => {
        if (typeof (window as any).ymaps !== 'undefined') {
          clearInterval(check)
          resolve()
        }
      }, 100)
      setTimeout(() => { clearInterval(check); reject(new Error('ymaps load timeout')) }, 15000)
      return
    }

    const apiKey = runtimeConfig.public.yandexMapsApiKey || '7a3c61c9-9e01-48b8-ad12-9a5688cc3a1b'
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU&coordorder=longlat`
    script.async = true
    script.onload = () => {
      const check = setInterval(() => {
        if (typeof (window as any).ymaps !== 'undefined') {
          clearInterval(check)
          resolve()
        }
      }, 100)
    }
    script.onerror = () => reject(new Error('Failed to load Yandex Maps'))
    document.head.appendChild(script)
  })
}

/** Инициализировать карту */
async function initMap() {
  if (!mapContainerRef.value) return

  try {
    await loadYmapsScript()

    const ymaps = (window as any).ymaps
    await new Promise<void>(resolve => ymaps.ready(resolve))

    // Создаём карту — как в v2pg19
    ymapsMap = new ymaps.Map(mapContainerRef.value, {
      center: [39.7015, 47.2357], // [lon, lat] — Ростов-на-Дону
      zoom: 12,
      controls: ['zoomControl']
    })

    // Клик по карте → маркер + обратное геокодирование
    ymapsMap.events.add('click', (e: any) => {
      const coords = e.get('coords') // [lon, lat]
      placeMarker(coords)
      reverseGeocode(coords)
    })

    mapReady.value = true
  } catch (err) {
    console.error('Map init error:', err)
  }
}

/** Поставить/переместить маркер (как в v2pg19) */
function placeMarker(coords: [number, number]) {
  const ymaps = (window as any).ymaps
  if (!ymaps || !ymapsMap) return

  if (ymapsPlacemark) {
    // Перемещаем существующий маркер
    ymapsPlacemark.geometry.setCoordinates(coords)
  } else {
    // Создаём новый маркер — фиолетовый, перетаскиваемый, с подписью
    ymapsPlacemark = new ymaps.Placemark(coords, {
      iconCaption: 'поиск...'
    }, {
      preset: 'islands#violetDotIconWithCaption',
      draggable: true
    })

    ymapsMap.geoObjects.add(ymapsPlacemark)

    // При перетаскивании — обновляем адрес
    ymapsPlacemark.events.add('dragend', () => {
      const newCoords = ymapsPlacemark.geometry.getCoordinates()
      reverseGeocode(newCoords)
    })
  }
}

/** Обратное геокодирование через DaData /api/address/reverse */
async function reverseGeocode(coords: [number, number]) {
  const [lon, lat] = coords
  busy.value = true

  if (ymapsPlacemark) {
    ymapsPlacemark.properties.set('iconCaption', 'поиск...')
  }

  try {
    const data = await $fetch<any>('/api/address/reverse', {
      method: 'POST',
      body: { lat, lon }
    })

    const addressLine = data.address || ''
    const components = data.components || {}
    const caption = [components.city, components.street, components.house].filter(Boolean).join(', ')

    // Обновляем маркер
    if (ymapsPlacemark) {
      ymapsPlacemark.properties.set({
        iconCaption: caption || addressLine,
        balloonContent: addressLine
      })
    }

    // Заполняем поле ввода
    inputText.value = addressLine

    emit('update:modelValue', {
      text: addressLine,
      coordinates: [lat, lon],
      components
    })

    // Проверяем покрытие
    await doCheckCoverage(lat, lon)
  } catch (err) {
    console.error('Reverse geocode error:', err)
  } finally {
    busy.value = false
  }
}

/** Переместить карту к координатам и поставить маркер */
function flyTo(lon: number, lat: number, zoom: number = 17) {
  if (!ymapsMap) return
  ymapsMap.setCenter([lon, lat], zoom, { duration: 300 })
  placeMarker([lon, lat])
}

// ===========================
// DaData ADDRESS INPUT
// ===========================

async function onInput() {
  // Убираем английские буквы
  inputText.value = inputText.value.replace(/[a-zA-Z]/g, '')
  const q = inputText.value.trim()
  status.value = 'idle'
  highlightedIndex.value = -1

  emit('update:modelValue', { text: inputText.value, coordinates: null, components: null })

  // Убираем маркер при ручном вводе
  if (ymapsPlacemark && ymapsMap) {
    ymapsMap.geoObjects.remove(ymapsPlacemark)
    ymapsPlacemark = null
  }

  if (q.length < 1) {
    clearSuggestions()
    showDropdown.value = false
    return
  }

  await getSuggestions(q)
  showDropdown.value = suggestions.value.length > 0
}

async function pickSuggestion(s: DadataSuggestion) {
  inputText.value = s.value
  showDropdown.value = false
  clearSuggestions()

  const addressValue: AddressValue = {
    text: s.value,
    coordinates: s.coordinates,
    components: {
      region: s.region, city: s.city, street: s.street,
      house: s.house, flat: s.flat,
      postal_code: s.postal_code, fias_id: s.fias_id
    }
  }
  emit('update:modelValue', addressValue)

  // Ставим маркер на карту (как в v2pg19: DaData → карта)
  if (s.coordinates) {
    const [lat, lon] = s.coordinates
    flyTo(lon, lat, 17)

    // Обновляем подпись маркера
    if (ymapsPlacemark) {
      ymapsPlacemark.properties.set({
        iconCaption: [s.city, s.street, s.house].filter(Boolean).join(', '),
        balloonContent: s.value
      })
    }

    await doCheckCoverage(lat, lon)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!showDropdown.value || !suggestions.value.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightedIndex.value >= 0) pickSuggestion(suggestions.value[highlightedIndex.value])
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}

// ===========================
// GEOLOCATION
// ===========================

async function locateMe() {
  if (busy.value || !mapReady.value) return
  busy.value = true

  try {
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((ok, fail) =>
          navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 8000, enableHighAccuracy: true })
        )
        const lon = pos.coords.longitude
        const lat = pos.coords.latitude
        flyTo(lon, lat, 16)
        await reverseGeocode([lon, lat])
        return
      } catch { /* fallthrough */ }
    }

    // Fallback: IP
    const ip = await $fetch<{ success: boolean; coordinates: [number, number] }>('/api/geolocation/ip')
    if (ip.success && ip.coordinates) {
      const [lat, lon] = ip.coordinates
      flyTo(lon, lat, 14)
      await reverseGeocode([lon, lat])
    }
  } catch (err) {
    console.error('Geolocation failed:', err)
  } finally {
    busy.value = false
  }
}

// ===========================
// COVERAGE CHECK
// ===========================

async function doCheckCoverage(lat: number, lon: number) {
  status.value = 'checking'
  try {
    const cov = await checkCoverage(lat, lon)
    status.value = cov.inCoverage ? 'in_zone' : 'out_zone'
    emit('coverage-check', cov)
  } catch {
    status.value = 'idle'
  }
}

// ===========================
// LIFECYCLE
// ===========================

function onDocClick(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  await nextTick()
  initMap()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (ymapsMap) {
    ymapsMap.destroy()
    ymapsMap = null
    ymapsPlacemark = null
  }
})

const borderColor = computed(() => {
  if (status.value === 'in_zone') return '#00A651'
  if (status.value === 'out_zone') return '#EF4444'
  return 'var(--glass-border)'
})
</script>

<template>
  <div ref="wrapperRef" class="space-y-4">

    <!-- ===== ПОЛЕ ВВОДА АДРЕСА ===== -->
    <div>
      <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {{ label }} <span v-if="required" class="text-primary">*</span>
      </label>

      <div class="relative">
        <input
          v-model="inputText"
          type="text"
          :required="required"
          @input="onInput"
          @keydown="onKeydown"
          @focus="showDropdown = suggestions.length > 0"
          class="w-full px-4 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12"
          :style="{ background: 'var(--glass-bg)', border: `1px solid ${borderColor}` }"
          placeholder="Начните вводить адрес..."
          autocomplete="off"
        />

        <!-- Иконка статуса -->
        <div class="absolute right-4 top-1/2 -translate-y-1/2">
          <Icon v-if="suggestionsLoading || status === 'checking' || busy" name="heroicons:arrow-path" class="w-5 h-5 text-primary animate-spin" />
          <Icon v-else-if="status === 'in_zone'" name="heroicons:check-circle" class="w-5 h-5 text-accent" />
          <Icon v-else-if="status === 'out_zone'" name="heroicons:exclamation-circle" class="w-5 h-5 text-red-500" />
          <Icon v-else name="heroicons:magnifying-glass" class="w-5 h-5 text-[var(--text-muted)]" />
        </div>

        <!-- Выпадающий список подсказок DaData -->
        <div
          v-if="showDropdown && suggestions.length"
          class="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto"
          style="background: #111827; border: 1px solid #374151; z-index: 40;"
        >
          <button
            v-for="(s, i) in suggestions"
            :key="i"
            type="button"
            class="w-full px-4 py-3 text-left transition-colors"
            :style="{
              background: i === highlightedIndex ? '#1f2937' : '#111827',
              borderBottom: i < suggestions.length - 1 ? '1px solid #374151' : 'none'
            }"
            @click.stop.prevent="pickSuggestion(s)"
            @mouseenter="highlightedIndex = i"
          >
            <div class="text-sm font-medium text-white">{{ s.title }}</div>
            <div v-if="s.subtitle" class="text-xs text-gray-400 mt-0.5">{{ s.subtitle }}</div>
          </button>
        </div>
      </div>

      <!-- Текст статуса -->
      <p v-if="status === 'in_zone'" class="mt-1.5 text-sm text-accent flex items-center gap-1">
        <Icon name="heroicons:check-circle" class="w-4 h-4" /> Адрес в зоне покрытия
      </p>
      <p v-else-if="status === 'out_zone'" class="mt-1.5 text-sm text-red-400 flex items-center gap-1">
        <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" /> Адрес вне зоны покрытия, но вы можете оставить заявку
      </p>
      <p v-else-if="inputText && !modelValue.coordinates" class="mt-1.5 text-sm text-[var(--text-muted)]">
        Выберите адрес из подсказок или укажите точку на карте
      </p>
    </div>

    <!-- ===== КАРТА ===== -->
    <div class="rounded-xl overflow-hidden border border-[var(--glass-border)]">

      <!-- Панель над картой -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3" style="background: var(--glass-bg)">
        <span class="text-xs sm:text-sm text-[var(--text-muted)]">
          <template v-if="busy">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 inline animate-spin mr-1" /> Определяем...
          </template>
          <template v-else>Кликните на карте для выбора адреса</template>
        </span>
      </div>

      <!-- Контейнер карты Yandex Maps API 2.1 -->
      <div ref="mapContainerRef" class="w-full h-[400px]" style="background: #1a1a2e;">
        <div v-if="!mapReady" class="w-full h-full flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p class="text-[var(--text-muted)] text-sm">Загрузка карты...</p>
          </div>
        </div>
      </div>

      <!-- Выбранный адрес -->
      <div
        v-if="modelValue.coordinates && modelValue.text"
        class="px-4 py-3 flex items-center gap-2 text-sm"
        style="background: var(--glass-bg); border-top: 1px solid var(--glass-border)"
      >
        <Icon
          name="heroicons:map-pin"
          class="w-4 h-4 flex-shrink-0"
          :class="status === 'in_zone' ? 'text-accent' : status === 'out_zone' ? 'text-red-500' : 'text-primary'"
        />
        <span class="text-[var(--text-primary)] truncate">{{ modelValue.text }}</span>
      </div>
    </div>
  </div>
</template>
