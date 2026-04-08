/**
 * Composable для обратного геокодирования
 * Использует DaData geolocate API через серверный прокси /api/address/reverse
 */

export interface GeocoderResult {
  address: string
  coordinates: [number, number] // [lat, lon]
  components: {
    city?: string
    street?: string
    house?: string
    region?: string
    country?: string
  }
  precision: string
}

export function useYandexGeocoder() {
  const result = ref<GeocoderResult | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Обратное геокодирование: координаты → адрес
   */
  async function reverseGeocode(lat: number, lon: number): Promise<GeocoderResult> {
    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<{
        address: string
        coordinates: [number, number]
        components: Record<string, any>
      }>('/api/address/reverse', {
        method: 'POST',
        body: { lat, lon }
      })

      const geocodeResult: GeocoderResult = {
        address: data.address,
        coordinates: data.coordinates,
        components: data.components,
        precision: 'exact'
      }

      result.value = geocodeResult
      return geocodeResult
    } catch (e: any) {
      console.error('Reverse geocode error:', e)
      error.value = e.message || 'Ошибка геокодирования'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Прямое геокодирование: адрес → координаты
   * Использует DaData suggest и берёт первый результат
   */
  async function geocodeAddress(address: string): Promise<GeocoderResult> {
    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<{ suggestions: any[] }>('/api/address/suggest', {
        method: 'POST',
        body: { query: address, count: 1 }
      })

      if (!data.suggestions?.length) {
        throw new Error('Адрес не найден')
      }

      const s = data.suggestions[0]
      const geocodeResult: GeocoderResult = {
        address: s.value,
        coordinates: s.coordinates || [0, 0],
        components: {
          city: s.city,
          street: s.street,
          house: s.house,
          region: s.region
        },
        precision: 'exact'
      }

      result.value = geocodeResult
      return geocodeResult
    } catch (e: any) {
      console.error('Geocode error:', e)
      error.value = e.message || 'Ошибка геокодирования'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    result: readonly(result),
    isLoading: readonly(isLoading),
    error: readonly(error),
    geocodeAddress,
    reverseGeocode
  }
}
