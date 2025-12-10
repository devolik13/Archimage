// supabase/functions/telegram-webhook/index.ts
// Webhook handler для обработки платежей Telegram Stars

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Конфигурация наград за стартовые пакеты
const STARTER_PACK_REWARDS: Record<string, {
  time: number;
  towerLevel: number;
  wizardCount: number;
  experience: number;
}> = {
  starter_pack_small: { time: 10080, towerLevel: 3, wizardCount: 2, experience: 5000 },
  starter_pack_medium: { time: 43200, towerLevel: 5, wizardCount: 3, experience: 30000 },
  starter_pack_large: { time: 129600, towerLevel: 7, wizardCount: 4, experience: 200000 }
};

// Конфигурация пакетов времени
const TIME_PACKS: Record<string, number> = {
  time_pack_small: 1440,    // 1 день
  time_pack_medium: 10080,  // 7 дней
  time_pack_large: 43200    // 30 дней
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const update = await req.json();
    console.log("Webhook received:", JSON.stringify(update, null, 2));

    // Обработка pre_checkout_query (подтверждение перед оплатой)
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log("Pre-checkout query:", query.id);

      // Всегда подтверждаем (можно добавить валидацию)
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: query.id,
          ok: true
        })
      });

      return new Response("OK", { headers: corsHeaders });
    }

    // Обработка successful_payment
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const telegramId = update.message.from.id;

      console.log(`✅ Successful payment from ${telegramId}:`, payment);

      // Парсим payload
      let payload;
      try {
        payload = JSON.parse(payment.invoice_payload);
      } catch {
        payload = { product_id: "unknown" };
      }

      const productId = payload.product_id;
      const targetFaction = payload.target_faction;

      // Обновляем статус платежа в БД
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          telegram_payment_id: payment.telegram_payment_charge_id,
          completed_at: new Date().toISOString()
        })
        .eq("telegram_id", telegramId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      if (updateError) {
        console.error("Error updating payment:", updateError);
      }

      // Применяем награды в зависимости от типа товара
      await applyPurchaseRewards(supabase, telegramId, productId, payload);

      // Начисляем airdrop очки (100 Stars = 10 очков)
      const starsAmount = payment.total_amount;
      const airdropPoints = Math.floor(starsAmount / 10);
      if (airdropPoints > 0) {
        await addAirdropPoints(supabase, telegramId, airdropPoints, `Покупка ${starsAmount} Telegram Stars`);
      }

      console.log(`🎁 Rewards applied for ${telegramId}: ${productId}`);
    }

    return new Response("OK", { headers: corsHeaders });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});

/**
 * Применить награды за покупку
 */
async function applyPurchaseRewards(
  supabase: any,
  telegramId: number,
  productId: string,
  payload: any
) {
  // Получаем текущие данные игрока
  const { data: player, error: fetchError } = await supabase
    .from("players")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (fetchError || !player) {
    console.error("Player not found:", telegramId);
    return;
  }

  const updates: Record<string, any> = {};

  // Пакеты времени
  if (productId.startsWith("time_pack_")) {
    const timeAmount = TIME_PACKS[productId] || 0;
    updates.time_currency = (player.time_currency || 0) + timeAmount;
    console.log(`⏰ Added ${timeAmount} minutes to ${telegramId}`);
  }

  // Стартовые пакеты
  if (productId.startsWith("starter_pack_")) {
    const rewards = STARTER_PACK_REWARDS[productId];
    if (rewards) {
      // Время
      updates.time_currency = (player.time_currency || 0) + rewards.time;

      // Башня магов
      const buildings = player.buildings || {};
      if (!buildings.wizard_tower || buildings.wizard_tower.level < rewards.towerLevel) {
        buildings.wizard_tower = { level: rewards.towerLevel };
        updates.buildings = buildings;
      }

      // Маги и опыт (добавляем магов если нужно)
      const wizards = player.wizards || [];
      while (wizards.length < rewards.wizardCount) {
        wizards.push(createNewWizard(wizards.length + 1, player.faction || 'fire'));
      }
      // Распределяем опыт
      const expPerWizard = Math.floor(rewards.experience / wizards.length);
      wizards.forEach((wizard: any) => {
        wizard.experience = (wizard.experience || 0) + expPerWizard;
      });
      updates.wizards = wizards;

      // Отмечаем пакет как купленный
      const purchasedPacks = player.purchased_packs || {};
      purchasedPacks[productId] = {
        purchased_at: new Date().toISOString(),
        rewards: rewards
      };
      updates.purchased_packs = purchasedPacks;

      console.log(`🎁 Starter pack applied: ${productId}`);
    }
  }

  // Смена фракции
  if (productId === "faction_change" && payload.target_faction) {
    updates.faction = payload.target_faction;
    updates.faction_changed = true;

    // Обновляем фракцию у всех магов
    const wizards = player.wizards || [];
    wizards.forEach((wizard: any) => {
      wizard.faction = payload.target_faction;
    });
    updates.wizards = wizards;

    console.log(`🔄 Faction changed to ${payload.target_faction}`);
  }

  // Сохраняем изменения
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("players")
      .update(updates)
      .eq("telegram_id", telegramId);

    if (updateError) {
      console.error("Error updating player:", updateError);
    }
  }
}

/**
 * Создание нового мага
 */
function createNewWizard(index: number, faction: string) {
  const names: Record<string, string[]> = {
    fire: ['Пироман', 'Огневик', 'Пламенный', 'Жаровик', 'Искровик'],
    water: ['Гидромаг', 'Ледовик', 'Морозник', 'Волновик', 'Туманник'],
    earth: ['Геомант', 'Каменщик', 'Рудокоп', 'Скальник', 'Кристальщик'],
    wind: ['Аэромант', 'Ветровик', 'Штормовик', 'Вихревик', 'Облачник'],
    nature: ['Друид', 'Лесовик', 'Травник', 'Корневик', 'Листовик'],
    poison: ['Токсимаг', 'Ядовик', 'Чумовик', 'Гнилевик', 'Миазмик']
  };

  const factionNames = names[faction] || names.fire;
  const name = factionNames[index - 1] || `Маг ${index}`;

  return {
    id: `wizard_${Date.now()}_${index}`,
    name,
    faction,
    level: 1,
    experience: 0,
    exp_to_next: 80,
    original_max_hp: 100,
    hp: 100,
    max_hp: 100,
    armor: 50,
    max_armor: 50,
    damage: 10,
    isMain: index === 1
  };
}

/**
 * Начисление airdrop очков
 */
async function addAirdropPoints(
  supabase: any,
  telegramId: number,
  points: number,
  reason: string
) {
  const { data: player } = await supabase
    .from("players")
    .select("airdrop_points, airdrop_breakdown")
    .eq("telegram_id", telegramId)
    .single();

  if (!player) return;

  const newPoints = (player.airdrop_points || 0) + points;
  const breakdown = player.airdrop_breakdown || {};
  breakdown[reason] = (breakdown[reason] || 0) + points;

  await supabase
    .from("players")
    .update({
      airdrop_points: newPoints,
      airdrop_breakdown: breakdown
    })
    .eq("telegram_id", telegramId);

  console.log(`🪂 Added ${points} airdrop points to ${telegramId}`);
}
