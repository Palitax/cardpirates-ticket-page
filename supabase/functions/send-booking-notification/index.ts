// Supabase Edge Function: send-booking-notification
// Handles automated email dispatch via Resend for Booking Alerts & Newsletter Welcome emails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const rawApiKey = Deno.env.get("RESEND_API_KEY") || ""
    const RESEND_API_KEY = rawApiKey.replace(/^["']|["']$/g, '').trim()
    const DEFAULT_ORGANIZER_EMAIL = Deno.env.get("DEFAULT_ORGANIZER_EMAIL") || "events@cardpirates.de"

    const payload = await req.json()
    const {
      type = 'booking_notification',
      ticketId,
      eventTitle = 'Cardpirates Event',
      eventDate = '',
      holderName = 'Gast',
      buyerEmail = '',
      email = '',
      quantity = 1,
      price = '',
      organizerEmail
    } = payload

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing in environment. Email payload logged:", payload)
      return new Response(JSON.stringify({ 
        success: true, 
        simulated: true, 
        message: "RESEND_API_KEY not configured, simulation logged." 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    let recipientEmail = ""
    let subject = ""
    let emailHtml = ""

    if (type === 'newsletter_welcome') {
      recipientEmail = email || buyerEmail
      if (!recipientEmail || !recipientEmail.includes('@')) {
        throw new Error("Gültige Empfänger-E-Mail erforderlich.")
      }
      subject = "🏴‍☠️ Willkommen beim Cardpirates Newsletter!"
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
              .container { max-width: 560px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
              .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
              .title { font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 8px 0; }
              .badge { display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
              .content { line-height: 1.6; font-size: 14px; color: #d4d4d8; text-align: center; }
              .card { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin: 20px 0; }
              .footer { border-top: 1px solid #27272a; padding-top: 20px; margin-top: 28px; text-align: center; font-size: 12px; color: #71717a; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span class="badge">Willkommen an Bord</span>
                <h1 class="title" style="margin-top: 12px;">🏴‍☠️ Du bist dabei!</h1>
              </div>
              <div class="content">
                <div class="card">
                  <p style="margin-top: 0; font-size: 16px; font-weight: 700; color: #ffffff;">Vielen Dank für deine Anmeldung zum Cardpirates Newsletter.</p>
                  <p>Du erhältst ab sofort als Erste(r) exklusive Updates zu neuen Events, Ticket-Drop-Zeiten und Community-News.</p>
                </div>
              </div>
              <div class="footer">
                Cardpirates Crew &bull; Exklusive Event Updates
              </div>
            </div>
          </body>
        </html>
      `
    } else {
      // Booking notification email to organizer
      recipientEmail = (organizerEmail && organizerEmail.includes('@')) 
        ? organizerEmail.trim() 
        : DEFAULT_ORGANIZER_EMAIL
      subject = `🎟️ Neue Ticket-Buchung: ${eventTitle}`
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
              .container { max-width: 560px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
              .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; }
              .title { font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 8px 0; }
              .badge { display: inline-block; background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
              .content { line-height: 1.6; }
              .card { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 20px 0; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
              .row:last-child { margin-bottom: 0; }
              .label { color: #a1a1aa; font-weight: 500; }
              .value { color: #ffffff; font-weight: 700; text-align: right; }
              .footer { border-top: 1px solid #27272a; padding-top: 20px; margin-top: 28px; text-align: center; font-size: 12px; color: #71717a; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span class="badge">Neue Buchung</span>
                <h1 class="title" style="margin-top: 12px;">🎟️ Neue Ticket-Buchung!</h1>
                <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Jemand hat ein Ticket für dein Event gebucht.</p>
              </div>
              
              <div class="content">
                <div class="card">
                  <div class="row">
                    <span class="label">Event:</span>
                    <span class="value">${eventTitle}</span>
                  </div>
                  ${eventDate ? `
                  <div class="row">
                    <span class="label">Datum:</span>
                    <span class="value">${eventDate}</span>
                  </div>
                  ` : ''}
                  <div class="row">
                    <span class="label">Käufer:</span>
                    <span class="value">${holderName}</span>
                  </div>
                  ${buyerEmail ? `
                  <div class="row">
                    <span class="label">Käufer E-Mail:</span>
                    <span class="value">${buyerEmail}</span>
                  </div>
                  ` : ''}
                  <div class="row">
                    <span class="label">Anzahl Tickets:</span>
                    <span class="value">${quantity}x</span>
                  </div>
                  ${price ? `
                  <div class="row">
                    <span class="label">Betrag:</span>
                    <span class="value">${price}</span>
                  </div>
                  ` : ''}
                  <div class="row" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #27272a;">
                    <span class="label">Ticket-ID:</span>
                    <span class="value" style="font-family: monospace; font-size: 12px; color: #ef4444;">${ticketId}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                Cardpirates Event Notification System &bull; Automatic Booking Alert
              </div>
            </div>
          </body>
        </html>
      `
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: type === 'newsletter_welcome' 
          ? "Cardpirates <newsletter@cardpiratescrew.com>" 
          : "Cardpirates <tickets@cardpiratescrew.com>",
        to: [recipientEmail],
        subject: subject,
        html: emailHtml
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData)
      const errDetail = resendData.message || resendData.error?.message || JSON.stringify(resendData)
      throw new Error(`Resend Error: ${errDetail}`)
    }

    return new Response(JSON.stringify({ success: true, resendId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("Edge function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
