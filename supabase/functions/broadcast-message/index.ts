// supabase/functions/broadcast-message/index.ts
// Одноразовая рассылка сообщений всем игрокам через Telegram Bot API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Защита: секретный ключ для запуска рассылки
const BROADCAST_SECRET = Deno.env.get("BROADCAST_SECRET") || "archimage_broadcast_2026";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Проверяем секретный ключ
    const { secret, dry_run } = await req.json();
    if (secret !== BROADCAST_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Получаем всех реальных игроков с telegram_id (исключаем тестовых с отрицательным id)
    const { data: players, error } = await supabase
      .from("players")
      .select("telegram_id")
      .not("telegram_id", "is", null)
      .gt("telegram_id", 0);

    if (error) {
      console.error("DB error:", error);
      return new Response(JSON.stringify({ error: "DB error", details: error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const totalPlayers = players?.length || 0;
    console.log(`📢 Broadcast to ${totalPlayers} players (dry_run: ${!!dry_run})`);

    if (dry_run) {
      return new Response(JSON.stringify({
        status: "dry_run",
        total_players: totalPlayers,
        player_ids: players?.map(p => p.telegram_id)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Текст рассылки — ивент босс "Отродье Тьмы"
    const caption = `⚔️ ИВЕНТ: Отродье Тьмы пробудилось!\n\n🐉 Глобальный босс — 5,000,000 HP! Все игроки бьют одного монстра!\n\n💡 Совет: Отродье Тьмы уязвимо к магии Света!\n\n🏆 Награды: время для всех участников + бонусы за ТОП-3!\n⏳ Длительность: 1 неделя`;

    // file_id анимации — промо ивент босса
    const animationFileId = "CgACAgIAAxkBAAFCRK9pjak9Y2A95pvWk8R7387kSWIcHAAC8JkAAlmsaUh9qcZmdEM_hzoE";

    let sent = 0;
    let failed = 0;
    let blocked = 0;
    const errors: Array<{ telegram_id: number; error: string }> = [];

    for (const player of players || []) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAnimation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: player.telegram_id,
            animation: animationFileId,
            caption,
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎮 Играть", url: "https://t.me/archimage_bot/app" }],
                [{ text: "👥 Сообщество", url: "https://t.me/archimage_chat" }]
              ]
            }
          })
        });

        const result = await response.json();

        if (result.ok) {
          sent++;
          console.log(`✅ Sent to ${player.telegram_id}`);
        } else {
          failed++;
          if (result.error_code === 403) {
            blocked++;
            console.log(`🚫 Blocked by ${player.telegram_id}`);
          } else {
            console.log(`❌ Failed for ${player.telegram_id}: ${result.description}`);
            errors.push({ telegram_id: player.telegram_id, error: result.description });
          }
        }
      } catch (e) {
        failed++;
        console.error(`❌ Error for ${player.telegram_id}:`, e);
        errors.push({ telegram_id: player.telegram_id, error: String(e) });
      }

      // Задержка 35мс между сообщениями (~28 сообщений/сек, в пределах лимита 30/сек)
      await new Promise(resolve => setTimeout(resolve, 35));
    }

    const summary = {
      status: "completed",
      total: totalPlayers,
      sent,
      failed,
      blocked,
      errors: errors.slice(0, 20) // Первые 20 ошибок
    };

    console.log(`📢 Broadcast done:`, JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
