// Supabase Edge Function: shopify-to-discord
// Receives Shopify's Product Created webhook and routes to Discord

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL")

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const product = await req.json()
    
    const productTitle = product.title || "New Event"
    const productHandle = product.handle || ""
    const productImage = product.images?.[0]?.src || ""
    const priceRange = product.variants?.[0]?.price || "0.00"

    const discordPayload = {
      embeds: [
        {
          title: "🎉 New Event Added!",
          description: `Tickets for **${productTitle}** are now available!`,
          color: 5814783, // Decimal blurple color
          fields: [
            {
              name: "Price",
              value: `${priceRange} EUR`,
              inline: true
            }
          ],
          image: productImage ? { url: productImage } : undefined,
          url: `https://cardpirates.myshopify.com/products/${productHandle}` // Replaced with your storefront URL
        }
      ]
    }

    const response = await fetch(DISCORD_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    })

    if (!response.ok) {
      throw new Error(`Discord error: ${response.statusText}`)
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    })
  }
})
