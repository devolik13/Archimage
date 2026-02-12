// supabase/functions/check-group-subscription/index.ts
// Проверка подписки на группу @archimage_chat и начисление награды

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Конфигурация награды
const GROUP_REWARD = {
  CHAT_ID: "@archimage_chat",  // ID группы или @username
  BPM_POINTS: 500,             // BPM очки
  TIME_MINUTES: 2880,          // 2 дня в минутах
  REASON: "Вступление в группу"
};

serve(async (req) => {
  // CORS preflight
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

    // Получаем telegram_id из запроса
    const { telegram_id } = await req.json();

    if (!telegram_id) {
      return new Response(
        JSON.stringify({ success: false, error: "telegram_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Checking subscription for ${telegram_id}`);

    // 1. Проверяем, не получал ли игрок уже награду
    const { data: player, error: fetchError } = await supabase
      .from("players")
      .select("group_reward_claimed, time_currency, airdrop_points, airdrop_breakdown")
      .eq("telegram_id", telegram_id)
      .single();

    if (fetchError || !player) {
      return new Response(
        JSON.stringify({ success: false, error: "Player not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (player.group_reward_claimed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "already_claimed",
          message: "Награда уже получена"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Проверяем подписку на группу через Telegram API
    const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_REWARD.CHAT_ID}&user_id=${telegram_id}`;

    const telegramResponse = await fetch(checkUrl);
    const telegramData = await telegramResponse.json();

    console.log(`📱 Telegram response:`, JSON.stringify(telegramData));

    if (!telegramData.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "telegram_api_error",
          message: "Ошибка проверки подписки"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const memberStatus = telegramData.result?.status;
    const isSubscribed = ["member", "administrator", "creator"].includes(memberStatus);

    if (!isSubscribed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "not_subscribed",
          message: "Вы не подписаны на группу",
          status: memberStatus
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Начисляем награду через RPC add_time_currency (обновляет time_currency_base)
    const { error: timeError } = await supabase.rpc('add_time_currency', {
      p_telegram_id: telegram_id,
      p_amount: GROUP_REWARD.TIME_MINUTES
    });

    if (timeError) {
      console.error("Error adding time currency:", timeError);
    }

    const newPoints = (player.airdrop_points || 0) + GROUP_REWARD.BPM_POINTS;

    const breakdown = player.airdrop_breakdown || {};
    breakdown[GROUP_REWARD.REASON] = (breakdown[GROUP_REWARD.REASON] || 0) + GROUP_REWARD.BPM_POINTS;

    const { error: updateError } = await supabase
      .from("players")
      .update({
        group_reward_claimed: true,
        airdrop_points: newPoints,
        airdrop_breakdown: breakdown
      })
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating player:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "update_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎁 Reward granted to ${telegram_id}: ${GROUP_REWARD.BPM_POINTS} BPM + ${GROUP_REWARD.TIME_MINUTES} minutes`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Награда получена!",
        reward: {
          bpm_points: GROUP_REWARD.BPM_POINTS,
          time_minutes: GROUP_REWARD.TIME_MINUTES
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
