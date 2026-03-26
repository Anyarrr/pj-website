/**
 * POST /api/address/reverse
 * Обратное геокодирование: координаты → адрес (через DaData geolocate)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { lat, lon } = body

  if (!lat || !lon) {
    throw createError({ statusCode: 400, message: 'lat and lon are required' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.dadataApiKey

  try {
    const response = await $fetch<any>('https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: {
        lat,
        lon,
        count: 1,
        radius_meters: 100
      }
    })

    const items = response.suggestions || []

    if (items.length === 0) {
      return {
        address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        coordinates: [lat, lon],
        components: {}
      }
    }

    const item = items[0]
    const data = item.data || {}

    return {
      address: item.value,
      coordinates: [
        parseFloat(data.geo_lat) || lat,
        parseFloat(data.geo_lon) || lon
      ],
      components: {
        region: data.region_with_type,
        city: data.city_with_type || data.settlement_with_type,
        street: data.street_with_type,
        house: data.house_type && data.house ? `${data.house_type} ${data.house}` : data.house,
        country: data.country
      }
    }
  } catch (error: any) {
    console.error('DaData geolocate error:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка обратного геокодирования'
    })
  }
})
