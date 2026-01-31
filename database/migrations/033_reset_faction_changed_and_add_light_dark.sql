-- Сброс флага faction_changed для всех игроков (бесплатная смена фракции снова доступна)
UPDATE players SET faction_changed = false WHERE faction_changed = true;
