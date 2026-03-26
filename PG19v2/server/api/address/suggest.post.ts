/**
 * POST /api/address/suggest
 * Получение подсказок адресов через DaData API
 * Приоритет — Таганрог, затем Ростовская область, потом вся Россия
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { query, count = 10 } = body

  if (!query || query.trim().length < 1) {
    return { suggestions: [] }
  }

  const config = useRuntimeConfig()
  const apiKey = config.dadataApiKey

  try {
    const response = await $fetch<any>('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: {
        query: query.trim(),
        count,
        locations_boost: [
          { kladr_id: '6143000100000' },
          { kladr_id: '61' }
        ]
      }
    })

    // Преобразуем ответ DaData в наш формат
    const suggestions = (response.suggestions || []).map((item: any) => {
      const data = item.data || {}

      return {
        value: item.value,
        unrestricted_value: item.unrestricted_value,
        region: data.region_with_type,
        city: data.city_with_type || data.settlement_with_type,
        street: data.street_with_type,
        house: data.house_type && data.house ? `${data.house_type} ${data.house}` : data.house,
        flat: data.flat_type && data.flat ? `${data.flat_type} ${data.flat}` : data.flat,
        coordinates: data.geo_lat && data.geo_lon
          ? [parseFloat(data.geo_lat), parseFloat(data.geo_lon)] as [number, number]
          : null,
        postal_code: data.postal_code,
        fias_id: data.fias_id,
        fias_level: data.fias_level,
        title: item.value,
        subtitle: ''
      }
    })

    // Сортируем: Таганрог первый, затем Ростовская область, потом остальные
    suggestions.sort((a: any, b: any) => {
      const aTag = a.city?.includes('Таганрог') ? 0 : a.region?.includes('Ростовская') ? 1 : 2
      const bTag = b.city?.includes('Таганрог') ? 0 : b.region?.includes('Ростовская') ? 1 : 2
      return aTag - bTag
    })

    return { suggestions }
  } catch (error: any) {
    console.error('DaData API error:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении подсказок адресов'
    })
  }
})
