// supabase/functions/create-invoice/index.ts
// Edge Function для создания Telegram Stars invoice

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Конфигурация товаров (должна совпадать с клиентом)
const PRODUCTS: Record<string, { title: string; description: string; price: number; type: string; amount?: number }> = {
  // Пакеты времени (цены -20%)
  time_pack_1hour: {
    title: "⏰ 1 час",
    description: "+1 час игрового времени",
    price: 8,
    type: "time_pack",
    amount: 60
  },
  time_pack_small: {
    title: "Пакет времени (1 день)",
    description: "+1 день игрового времени",
    price: 134,
    type: "time_pack",
    amount: 1440
  },
  time_pack_medium: {
    title: "Пакет времени (7 дней)",
    description: "+7 дней времени (-5% скидка)",
    price: 896,
    type: "time_pack",
    amount: 10080
  },
  time_pack_large: {
    title: "Пакет времени (30 дней)",
    description: "+30 дней времени (-15% скидка)",
    price: 3424,
    type: "time_pack",
    amount: 43200
  },
  // Стартовые пакеты (цены -20%)
  starter_pack_small: {
    title: "🎁 Малый стартовый пакет",
    description: "+1 маг (макс 2), Башня до 3 ур, 7 дней, 5000 XP",
    price: 2320,
    type: "starter_pack"
  },
  starter_pack_medium: {
    title: "📦 Средний стартовый пакет",
    description: "+1 маг (макс 3), Башня до 5 ур, 30 дней, 30000 XP",
    price: 8320,
    type: "starter_pack"
  },
  starter_pack_large: {
    title: "💎 Крупный стартовый пакет",
    description: "+1 маг (макс 4), Башня до 7 ур, 90 дней, 200000 XP",
    price: 32000,
    type: "starter_pack"
  },
  // Смена фракции (динамическая цена)
  faction_change: {
    title: "Смена фракции",
    description: "Изменить школу магии",
    price: 224, // Минимальная цена -20%, реальная передаётся в запросе
    type: "faction_change"
  },

  // ===== ПРЕМИУМ ОБРАЗЫ =====
  skin_lady_fire: {
    title: "👑 Огненная Леди",
    description: "Элегантная воительница в доспехах пламени",
    price: 165,
    type: "skin"
  }
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Парсим запрос
    const { product_id, telegram_id, custom_price, target_faction } = await req.json();

    if (!product_id || !telegram_id) {
      return new Response(
        JSON.stringify({ error: "Missing product_id or telegram_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Получаем конфигурацию товара
    const product = PRODUCTS[product_id];
    if (!product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Определяем цену (может быть динамической для faction_change)
    const price = custom_price || product.price;

    // Создаём уникальный payload для отслеживания платежа
    const payload = JSON.stringify({
      product_id,
      telegram_id,
      price,
      target_faction: target_faction || null,
      timestamp: Date.now()
    });

    // Создаём invoice через Telegram Bot API
    const invoiceResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          payload: payload,
          currency: "XTR", // Telegram Stars
          prices: [{ label: product.title, amount: price }]
        })
      }
    );

    const invoiceData = await invoiceResponse.json();

    if (!invoiceData.ok) {
      console.error("Telegram API error:", invoiceData);
      return new Response(
        JSON.stringify({ error: "Failed to create invoice", details: invoiceData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invoiceUrl = invoiceData.result;

    // Сохраняем pending платёж в БД для отслеживания
    const { error: dbError } = await supabase
      .from("payments")
      .insert({
        telegram_id: telegram_id,
        product_id: product_id,
        amount_stars: price,
        status: "pending",
        payload: payload,
        invoice_url: invoiceUrl,
        target_faction: target_faction || null
      });

    if (dbError) {
      console.error("DB error:", dbError);
      // Не фейлим - платёж всё равно можно обработать через webhook
    }

    console.log(`✅ Invoice created for ${telegram_id}: ${product_id} (${price} Stars)`);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_url: invoiceUrl,
        product_id,
        price
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
