// supabase/functions/check-channel-subscription/index.ts
// Универсальная проверка подписки на канал/группу Telegram + начисление награды
// Используется для рекламных заданий (Crypto Max и др.)
// Награды начисляются СЕРВЕРНО — защита от накруток

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Белый список каналов + конфигурация наград
// task_key — ключ в completed_tasks (JSONB) для защиты от повторного получения
const CHANNEL_CONFIG: Record<string, {
  chat_id: string;
  task_key: string;
  bpm_points: number;
  time_minutes: number;
  reward_name: string;
}> = {
  "cryptomaxbablo": {
    chat_id: "@cryptomaxbablo",
    task_key: "cryptomax",
    bpm_points: 100,
    time_minutes: 1440, // 1 день
    reward_name: "Crypto Max",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!BOT_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { telegram_id, channel } = await req.json();

    if (!telegram_id || !channel) {
      return new Response(
        JSON.stringify({ success: false, error: "telegram_id and channel are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Проверяем что канал в конфиге
    const config = CHANNEL_CONFIG[channel];
    if (!config) {
      console.error(`❌ Channel not in config: ${channel}`);
      return new Response(
        JSON.stringify({ success: false, error: "channel_not_allowed", message: "Канал не поддерживается" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Checking channel subscription: ${channel} for user ${telegram_id}`);

    // 1. Проверяем игрока и не получал ли он уже награду
    const { data: player, error: fetchError } = await supabase
      .from("players")
      .select("completed_tasks, airdrop_points, airdrop_breakdown")
      .eq("telegram_id", telegram_id)
      .single();

    if (fetchError || !player) {
      return new Response(
        JSON.stringify({ success: false, error: "player_not_found", message: "Игрок не найден" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Проверяем повторное получение
    if (player.completed_tasks?.[config.task_key]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "already_claimed",
          message: "Награда уже получена"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Проверяем подписку через Telegram Bot API getChatMember
    const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(config.chat_id)}&user_id=${telegram_id}`;

    const telegramResponse = await fetch(checkUrl);
    const telegramData = await telegramResponse.json();

    console.log(`📱 Telegram getChatMember response:`, JSON.stringify(telegramData));

    if (!telegramData.ok) {
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

    // 3. Подписан — начисляем награду серверно

    // 3a. Начисляем время через RPC
    const { error: timeError } = await supabase.rpc('add_time_currency', {
      p_telegram_id: telegram_id,
      p_amount: config.time_minutes
    });

    if (timeError) {
      console.error("Error adding time currency:", timeError);
    }

    // 3b. Обновляем BPM очки + completed_tasks + breakdown
    const newPoints = (player.airdrop_points || 0) + config.bpm_points;

    const breakdown = player.airdrop_breakdown || {};
    breakdown[config.reward_name] = (breakdown[config.reward_name] || 0) + config.bpm_points;

    const completedTasks = player.completed_tasks || {};
    completedTasks[config.task_key] = true;

    const { error: updateError } = await supabase
      .from("players")
      .update({
        airdrop_points: newPoints,
        airdrop_breakdown: breakdown,
        completed_tasks: completedTasks
      })
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating player:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "update_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎁 Reward granted to ${telegram_id} for ${channel}: ${config.bpm_points} BPM + ${config.time_minutes} min`);

    return new Response(
      JSON.stringify({
        success: true,
        subscribed: true,
        channel: channel,
        status: memberStatus,
        reward: {
          bpm_points: config.bpm_points,
          time_minutes: config.time_minutes,
          task_key: config.task_key
        }
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
