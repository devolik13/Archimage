// supabase/functions/check-gift-kombat/index.ts
// Серверная проверка уровня 2 в Gift Kombat + начисление награды
// Проксирует запрос к gift-kombat.com API (обход CORS) и выдаёт награду серверно

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TASK_KEY = "gift_kombat";
const BPM_REWARD = 100;
const TIME_REWARD_MINUTES = 120; // 2 часа
const REWARD_NAME = "Gift Kombat";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { telegram_id } = await req.json();

    if (!telegram_id) {
      return new Response(
        JSON.stringify({ success: false, error: "telegram_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🥊 Checking Gift Kombat level 2 for user ${telegram_id}`);

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

    if (player.completed_tasks?.[TASK_KEY]) {
      return new Response(
        JSON.stringify({ success: false, error: "already_claimed", message: "Награда уже получена" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Проверяем уровень 2 через Gift Kombat API (серверный запрос — без CORS)
    const apiUrl = `https://gift-kombat.com/api/characters/check-lvl-2-exists?tg_user_id=${telegram_id}`;

    const gkResponse = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!gkResponse.ok) {
      console.error(`❌ Gift Kombat API error: ${gkResponse.status} ${gkResponse.statusText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "api_error",
          message: "Не удалось проверить Gift Kombat. Попробуйте позже."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gkData = await gkResponse.json();
    console.log(`📱 Gift Kombat API response:`, JSON.stringify(gkData));

    const levelReached = gkData === true || gkData?.exists === true || gkData?.success === true;

    if (!levelReached) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "level_not_reached",
          message: "Персонаж 2 уровня не найден. Продолжай играть!"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Уровень 2 подтверждён — начисляем награду серверно

    // 3a. Начисляем время через RPC
    const { error: timeError } = await supabase.rpc('add_time_currency', {
      p_telegram_id: telegram_id,
      p_amount: TIME_REWARD_MINUTES
    });

    if (timeError) {
      console.error("Error adding time currency:", timeError);
    }

    // 3b. Обновляем BPM + completed_tasks + breakdown
    const newPoints = (player.airdrop_points || 0) + BPM_REWARD;

    const breakdown = player.airdrop_breakdown || {};
    breakdown[REWARD_NAME] = (breakdown[REWARD_NAME] || 0) + BPM_REWARD;

    const completedTasks = player.completed_tasks || {};
    completedTasks[TASK_KEY] = true;

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

    console.log(`🎁 Gift Kombat reward granted to ${telegram_id}: ${BPM_REWARD} BPM + ${TIME_REWARD_MINUTES} min`);

    return new Response(
      JSON.stringify({
        success: true,
        reward: {
          bpm_points: BPM_REWARD,
          time_minutes: TIME_REWARD_MINUTES,
          task_key: TASK_KEY
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
