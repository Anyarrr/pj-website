/**
 * Edge Function: beeline-webhook
 * Обработка webhook от Билайн Облачной АТС (XSI формат — XML)
 * При получении звонка обновляет БД и отправляет Realtime broadcast клиенту
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Читаем XML от Билайн
    const rawBody = await req.text()
    console.log('[Beeline Webhook] Received XML:', rawBody.substring(0, 500))

    // Извлекаем номер телефона из XML
    // Формат: <xsi:address countryCode="7">tel:+79604555668</xsi:address>
    const addressMatch = rawBody.match(/<xsi:address[^>]*>tel:\+?(\d+)<\/xsi:address>/)
    const callerId = addressMatch?.[1]

    // Извлекаем callId из networkCallId
    const callIdMatch = rawBody.match(/<xsi:networkCallId>([^<]+)<\/xsi:networkCallId>/)
    const callId = callIdMatch?.[1]

    // Извлекаем тип события для логирования
    const eventTypeMatch = rawBody.match(/xsi1:type="xsi:(\w+)"/)
    const eventType = eventTypeMatch?.[1] || 'Unknown'

    console.log('[Beeline Webhook] Event:', eventType, 'CallerId:', callerId, 'CallId:', callId)

    if (!callerId) {
      console.log('[Beeline Webhook] No phone number found in XML')
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Нормализация номера: только цифры, формат 7XXXXXXXXXX
    const normalizedPhone = callerId.replace(/\D/g, '').replace(/^8/, '7')

    if (!/^7\d{10}$/.test(normalizedPhone)) {
      console.log('[Beeline Webhook] Invalid phone format:', callerId, '→', normalizedPhone)
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Supabase client с service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ищем pending запрос с таким номером, который ещё не истёк
    const { data: request, error: findError } = await supabase
      .from('phone_verification_requests')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !request) {
      console.log('[Beeline Webhook] No pending request for phone:', normalizedPhone)
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Обновляем статус на verified
    const { error: updateError } = await supabase
      .from('phone_verification_requests')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        call_id: callId || null,
        caller_id: callerId,
        call_timestamp: new Date().toISOString()
      })
      .eq('id', request.id)

    if (updateError) {
      console.error('[Beeline Webhook] Update error:', updateError)
      return new Response(JSON.stringify({ ok: false, error: 'Update failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Отправляем Realtime broadcast клиенту
    const channel = supabase.channel(`call-verify:${request.token}`)
    await channel.send({
      type: 'broadcast',
      event: 'verified',
      payload: {
        status: 'verified',
        userId: request.user_id,
        accountId: request.account_id,
        phone: normalizedPhone
      }
    })

    console.log('[Beeline Webhook] Verified phone:', normalizedPhone, 'token:', request.token)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Beeline Webhook] Error:', error)
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
