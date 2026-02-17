// supabase/functions/check-channel-subscription/index.ts
// Универсальная проверка подписки на канал/группу Telegram
// Используется для рекламных заданий (Crypto Max, Gift Kombat и др.)
// Награды НЕ начисляются здесь — только проверка. Награды выдаёт клиент.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Белый список каналов, для которых разрешена проверка
// Защита от злоупотреблений — нельзя проверить подписку на произвольный канал
const ALLOWED_CHANNELS: Record<string, string> = {
  "cryptomaxbablo": "@cryptomaxbablo",
  "archimage_chat": "@archimage_chat",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!BOT_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { telegram_id, channel } = await req.json();

    if (!telegram_id || !channel) {
      return new Response(
        JSON.stringify({ success: false, error: "telegram_id and channel are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Проверяем что канал в белом списке
    const chatId = ALLOWED_CHANNELS[channel];
    if (!chatId) {
      console.error(`❌ Channel not in whitelist: ${channel}`);
      return new Response(
        JSON.stringify({ success: false, error: "channel_not_allowed", message: "Канал не поддерживается" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Checking channel subscription: ${channel} for user ${telegram_id}`);

    // Проверяем подписку через Telegram Bot API getChatMember
    // Требует: бот должен быть администратором канала (права не нужны)
    const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${telegram_id}`;

    const telegramResponse = await fetch(checkUrl);
    const telegramData = await telegramResponse.json();

    console.log(`📱 Telegram getChatMember response:`, JSON.stringify(telegramData));

    if (!telegramData.ok) {
      // Если бот не админ в канале или канал не найден
      const description = telegramData.description || "Unknown error";
      console.error(`❌ Telegram API error for ${channel}: ${description}`);

      return new Response(
        JSON.stringify({
          success: false,
          subscribed: false,
          error: "telegram_api_error",
          message: "Не удалось проверить подписку. Бот не добавлен в канал как администратор.",
          details: description
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const memberStatus = telegramData.result?.status;
    // member, administrator, creator — подписан
    // left, kicked, restricted (без is_member) — не подписан
    const isSubscribed = ["member", "administrator", "creator"].includes(memberStatus);

    if (!isSubscribed) {
      console.log(`⚠️ User ${telegram_id} is NOT subscribed to ${channel} (status: ${memberStatus})`);
      return new Response(
        JSON.stringify({
          success: false,
          subscribed: false,
          error: "not_subscribed",
          message: "Вы не подписаны на канал",
          status: memberStatus
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ User ${telegram_id} IS subscribed to ${channel} (status: ${memberStatus})`);

    return new Response(
      JSON.stringify({
        success: true,
        subscribed: true,
        channel: channel,
        status: memberStatus
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
