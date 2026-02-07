// battle/summons/summons-manager.js

// ========================================
// ГЛАВНЫЙ МЕНЕДЖЕР ПРИЗВАННЫХ СУЩЕСТВ
// ========================================

class SummonsManager {
    constructor() {
        // Хранилище всех активных существ
        this.summons = new Map(); // key: summonId, value: summonData
        
        // Хранилище визуалов существ
        this.visuals = new Map(); // key: summonId, value: PIXI объект
        
        // Типы существ и их параметры
        this.summonTypes = {
            'nature_wolf': {
                name: 'Волк Природы',
                sprite: 'images/spells/nature/call_wolf/wolf_idle_sheet.webp',
                frameWidth: 102,   // 512 / 5
                frameHeight: 102,  // 512 / 5
                framesX: 5,        // колонок
                framesY: 5,        // рядов
                frames: 25,        // всего кадров
                animationSpeed: 0.08,
                scale: 0.60,       // увеличили т.к. кадр теперь меньше (102 vs 204)
                yOffset: 0.7,
                attackAnimation: 'bite'
            },
            'necromant_skeleton': {
                name: 'Скелет',
                sprite: null, // пока без спрайта
                color: 0xCCCCCC,
                width: 15,
                height: 25,
                yOffset: 0.7,
                scale: 0.60,
                attackAnimation: 'slash'
            },
            'nature_ent': {
                name: 'Энт Природы',
                sprite: null, // пока без спрайта
                color: 0x4A5F3A,
                width: 25,
                height: 35,
                yOffset: 0.6,
                isDefensive: true
            }
            // Здесь можно добавить других существ:
            // 'fire_elemental', 'water_golem', 'air_spirit' и т.д.
        };
        
        // Счетчик для уникальных ID
        this.idCounter = 0;
    }
    
    // ========================================
    // СОЗДАНИЕ СУЩЕСТВА
    // ========================================
    
    createSummon(type, params) {
        const {
            casterId,
            casterType,
            position,
            level = 1,
            hp,
            maxHP,
            damage = 0,
            special = {}
        } = params;
        
        // Генерируем уникальный ID
        const summonId = `${type}_${casterId}_${++this.idCounter}_${Date.now()}`;
        
        // Определяем колонку призыва
        const column = this.getSummonColumn(casterType);
        
        // Создаем данные существа
        const summonData = {
            id: summonId,
            type: type,
            name: this.summonTypes[type]?.name || 'Призванное существо',
            
            // Боевые параметры
            hp: hp,
            maxHP: maxHP,
            damage: damage,
            level: level,
            
            // Позиционирование
            position: position,
            column: column,
            
            // Принадлежность
            casterId: casterId,
            casterType: casterType,
            faction: this.getFactionByType(type),
            
            // Специальные свойства
            special: special,
            isAlive: true,
            createdAt: Date.now(),
            
            // Для защитных существ (например, Энт)
            isDefensive: this.summonTypes[type]?.isDefensive || false,
            linkedWizards: special.linkedWizards || []
        };
        
        // Сохраняем в хранилище
        this.summons.set(summonId, summonData);
        
        // Создаем визуал (кроме Энта - у него отдельная визуализация)
	if (type !== 'nature_ent') {
	    this.createVisual(summonId, summonData);
	}
        
        // Логируем
        this.logSummon('create', summonData);
        
        return summonData;
    }
    
    // ========================================
    // ПОИСК СУЩЕСТВА
    // ========================================
    
    // Найти существо по ID
    getSummon(summonId) {
        return this.summons.get(summonId);
    }
    
    // Найти существо в позиции
    findSummonAt(column, position) {
        for (const [id, summon] of this.summons) {
            if (summon.column === column && 
                summon.position === position && 
                summon.isAlive) {
                return summon;
            }
        }
        return null;
    }
    
    // Найти всех существ кастера
    findCasterSummons(casterId, type = null) {
        const result = [];
        for (const [id, summon] of this.summons) {
            if (summon.casterId === casterId && summon.isAlive) {
                if (!type || summon.type === type) {
                    result.push(summon);
                }
            }
        }
        return result;
    }
    
    // Проверка, есть ли существо типа у кастера
    hasSummonOfType(casterId, type, position = null) {
        for (const [id, summon] of this.summons) {
            if (summon.casterId === casterId && 
                summon.type === type && 
                summon.isAlive) {
                if (position === null || summon.position === position) {
                    return summon;
                }
            }
        }
        return null;
    }
    
    // ========================================
    // ОБНОВЛЕНИЕ СУЩЕСТВА
    // ========================================
    
    // Обновить HP существа
    updateHP(summonId, newHP) {
        const summon = this.summons.get(summonId);
        if (!summon) return false;
        
        const oldHP = summon.hp;
        summon.hp = Math.min(Math.max(0, newHP), summon.maxHP);
        
        // Проверяем смерть
        if (summon.hp <= 0 && summon.isAlive) {
            this.killSummon(summonId);
        } else {
            // Обновляем визуал (например, HP бар)
            this.updateVisualHP(summonId, summon.hp, summon.maxHP);
            
            // Эффект исцеления/урона
            if (newHP > oldHP) {
                this.playHealEffect(summonId);
            } else if (newHP < oldHP) {
                this.playDamageEffect(summonId);
            }
        }
        
        return true;
    }
    
    // Восстановить существо (для волка при повторном вызове)
    restoreSummon(summonId) {
        const summon = this.summons.get(summonId);
        if (!summon) return false;
        
        summon.hp = summon.maxHP;
        summon.isAlive = true;
        
        this.playHealEffect(summonId);
        this.logSummon('restore', summon);
        
        return true;
    }
    
    // ========================================
    // УДАЛЕНИЕ СУЩЕСТВА
    // ========================================

    // Убить существо (skipLog = true если вызывающий код сам логирует смерть)
    killSummon(summonId, skipLog = false) {
        const summon = this.summons.get(summonId);
        if (!summon) return false;

        summon.isAlive = false;
        summon.hp = 0;

        // Анимация смерти
        this.playDeathAnimation(summonId, () => {
            this.removeVisual(summonId);
            this.summons.delete(summonId);
        });

        // Логируем только если не запрошен пропуск (skipLog)
        if (!skipLog) {
            this.logSummon('death', summon);
        }

        return true;
    }
    
    // Удалить всех мертвых существ
    cleanupDead() {
        const toRemove = [];
        
        for (const [id, summon] of this.summons) {
            if (!summon.isAlive || summon.hp <= 0) {
                toRemove.push(id);
            }
        }
        
        toRemove.forEach(id => {
            this.removeVisual(id);
            this.summons.delete(id);
        });
        
        return toRemove.length;
    }
    
    // Удалить всех существ кастера
    removeCasterSummons(casterId) {
        const toRemove = [];
        
        for (const [id, summon] of this.summons) {
            if (summon.casterId === casterId) {
                toRemove.push(id);
            }
        }
        
        toRemove.forEach(id => this.killSummon(id));
        
        return toRemove.length;
    }
    
    // Полная очистка
    clearAll() {
        console.log('🧹 Начинаем полную очистку призванных');
        
        // Немедленное удаление БЕЗ анимации fadeOut
        for (const [id, visual] of this.visuals) {
            if (visual && !visual.destroyed) {
                // Удаляем из контейнера
                if (visual.parent) {
                    visual.parent.removeChild(visual);
                }
                // Уничтожаем спрайт (НЕ текстуру - она может использоваться другими волками)
                visual.destroy({ children: true, texture: false, baseTexture: false });
            }
        }
        
        // Очищаем хранилища
        this.summons.clear();
        this.visuals.clear();
        
        console.log('🧹 Все призванные существа удалены');
    }
    
    // ========================================
    // ВИЗУАЛИЗАЦИЯ
    // ========================================
    
    // Создать визуал существа
    createVisual(summonId, summonData) {
        const container = window.pixiCore?.getEffectsContainer();
        const gridCells = window.pixiCore?.getGridCells();
        
        if (!container || !gridCells) {
            console.warn('Не могу создать визуал - нет PIXI контейнера');
            return;
        }
        
        const cell = gridCells[summonData.column]?.[summonData.position];
        if (!cell) return;
        
        const typeConfig = this.summonTypes[summonData.type];
        if (!typeConfig) return;
        
        // Создаем визуал в зависимости от типа
        if (typeConfig.sprite) {
            this.createSpriteVisual(summonId, summonData, typeConfig, cell, container);
        } else {
            this.createGraphicsVisual(summonId, summonData, typeConfig, cell, container);
        }
    }
    
    // Создать спрайтовый визуал (для волка)
    createSpriteVisual(summonId, summonData, config, cell, container) {
        PIXI.Assets.load(config.sprite).then(baseTexture => {
            if (!baseTexture || !baseTexture.valid) {
                this.createGraphicsVisual(summonId, summonData, config, cell, container);
                return;
            }
            
            // Нарезаем кадры анимации
            const frames = [];
            const cols = config.framesX || 3;  // Используем из конфига или 3 по умолчанию
            const rows = config.framesY || Math.ceil(config.frames / cols);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (frames.length >= config.frames) break;
                    
                    const frame = new PIXI.Texture(
                        baseTexture,
                        new PIXI.Rectangle(
                            col * config.frameWidth,
                            row * config.frameHeight,
                            config.frameWidth,
                            config.frameHeight
                        )
                    );
                    frames.push(frame);
                }
            }
            
            // Создаем анимированный спрайт
            const sprite = new PIXI.AnimatedSprite(frames);
            sprite.x = cell.x + cell.width / 2;
            sprite.y = cell.y + cell.height * config.yOffset;
            sprite.anchor.set(0.5, 0.5);
            
            // Масштаб и направление
            const scale = cell.cellScale * config.scale;
            const direction = summonData.casterType === 'player' ? -1 : 1;
            sprite.scale.set(scale * direction, scale);
            
            sprite.animationSpeed = config.animationSpeed;
            sprite.loop = true;
            sprite.alpha = 0;
            
            container.addChild(sprite);
            
            // Плавное появление
            this.fadeIn(sprite, () => {
                sprite.play();
            });
            
            // Сохраняем визуал
            this.visuals.set(summonId, sprite);
            
            // Добавляем HP бар
            this.addHPBar(summonId, sprite, summonData);
            
        }).catch(err => {
            console.warn('Ошибка загрузки спрайта:', err);
            this.createGraphicsVisual(summonId, summonData, config, cell, container);
        });
    }
    
    // Создать графический визуал (fallback)
    createGraphicsVisual(summonId, summonData, config, cell, container) {
        const graphics = new PIXI.Graphics();
        
        // Рисуем базовую фигуру
        graphics.beginFill(config.color || 0x666666, 0.8);
        
        if (config.width && config.height) {
            // Прямоугольник для Энта
            graphics.drawRoundedRect(
                -config.width/2, 
                -config.height, 
                config.width, 
                config.height, 
                5
            );
        } else {
            // Круг по умолчанию
            graphics.drawCircle(0, 0, 15);
        }
        
        graphics.endFill();
        
        // Позиционирование
        graphics.x = cell.x + cell.width / 2;
        graphics.y = cell.y + cell.height * (config.yOffset || 0.7);
        graphics.alpha = 0;
        
        container.addChild(graphics);
        
        // Плавное появление
        this.fadeIn(graphics);
        
        // Сохраняем визуал
        this.visuals.set(summonId, graphics);
        
        // Добавляем HP бар
        this.addHPBar(summonId, graphics, summonData);
        
        // Анимация покачивания
        this.startIdleAnimation(graphics);
    }
    
    // Добавить HP бар (как у магов: 40x5, текст 10px)
    addHPBar(summonId, parentSprite, summonData) {
        const barWidth = 40;
        const barHeight = 5;

        // Контейнер для HP бара
        const hpContainer = new PIXI.Container();
        hpContainer.y = -30;

        // Компенсируем зеркалирование спрайта, чтобы текст и бар не были отражены
        if (parentSprite.scale.x < 0) {
            hpContainer.scale.x = -1;
        }

        // Фон HP бара
        const hpBarBg = new PIXI.Graphics();
        hpBarBg.beginFill(0x000000, 0.5);
        hpBarBg.drawRect(-barWidth/2, 0, barWidth, barHeight);
        hpBarBg.endFill();

        // HP заполнение
        const hpBarFill = new PIXI.Graphics();
        const hpPercent = summonData.hp / summonData.maxHP;
        const color = hpPercent > 0.5 ? 0x4ade80 : (hpPercent > 0.25 ? 0xfbbf24 : 0xef4444);
        hpBarFill.beginFill(color);
        hpBarFill.drawRect(-barWidth/2, 0, barWidth * hpPercent, barHeight);
        hpBarFill.endFill();

        hpContainer.addChild(hpBarBg);
        hpContainer.addChild(hpBarFill);

        // Текст HP (как у магов)
        const hpText = new PIXI.Text(`${summonData.hp}/${summonData.maxHP}`, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 2
        });
        hpText.anchor.set(0.5, 1);
        hpText.y = -2;
        hpContainer.addChild(hpText);

        parentSprite.addChild(hpContainer);
        parentSprite.hpBar = hpBarFill;
        parentSprite.hpBarBg = hpBarBg;
        parentSprite.hpText = hpText;
        parentSprite.hpContainer = hpContainer;
    }
    
    // Обновить визуал HP (как у магов)
    updateVisualHP(summonId, hp, maxHP) {
        const visual = this.visuals.get(summonId);
        if (!visual || !visual.hpBar) return;

        const barWidth = 40;
        const barHeight = 5;

        // Обновляем заполнение
        visual.hpBar.clear();
        const hpPercent = hp / maxHP;
        const color = hpPercent > 0.5 ? 0x4ade80 :
                     hpPercent > 0.25 ? 0xfbbf24 : 0xef4444;

        visual.hpBar.beginFill(color);
        visual.hpBar.drawRect(-barWidth/2, 0, barWidth * hpPercent, barHeight);
        visual.hpBar.endFill();

        // Обновляем текст HP
        if (visual.hpText) {
            visual.hpText.text = `${hp}/${maxHP}`;
        }
    }
    
    // Удалить визуал
    removeVisual(summonId) {
        const visual = this.visuals.get(summonId);
        if (!visual) return;
        
        // Плавное исчезновение
        this.fadeOut(visual, () => {
            // ПРОВЕРКА: может быть уже удалён
            if (!visual || visual.destroyed) {
                this.visuals.delete(summonId);
                return;
            }
            
            if (visual.parent) {
                visual.parent.removeChild(visual);
            }
            if (!visual.destroyed) {
                // ВАЖНО: НЕ уничтожаем текстуру (texture: false), т.к. она общая для всех волков!
                visual.destroy({ children: true, texture: false, baseTexture: false });
            }
            this.visuals.delete(summonId);
        });
    }
    
    // ========================================
    // АНИМАЦИИ И ЭФФЕКТЫ
    // ========================================
    
    // Плавное появление
    fadeIn(sprite, onComplete) {
        const fade = () => {
            // ПРОВЕРКА: если спрайт уничтожен - прерываем анимацию
            if (!sprite || sprite.destroyed || !sprite.transform) {
                if (onComplete) onComplete();
                return;
            }
            
            sprite.alpha += 0.05;
            if (sprite.alpha < 1) {
                requestAnimationFrame(fade);
            } else {
                sprite.alpha = 1;
                if (onComplete) onComplete();
            }
        };
        fade();
    }
    
    // Плавное исчезновение
    fadeOut(sprite, onComplete) {
        const fade = () => {
            // ПРОВЕРКА: если спрайт уничтожен - прерываем анимацию
            if (!sprite || sprite.destroyed || !sprite.transform) {
                if (onComplete) onComplete();
                return;
            }
            
            sprite.alpha -= 0.05;
            if (sprite.alpha > 0) {
                requestAnimationFrame(fade);
            } else {
                if (onComplete) onComplete();
            }
        };
        fade();
    }
    
    // Анимация покачивания
    startIdleAnimation(sprite) {
        const animate = () => {
            if (!sprite.parent) return;
            sprite.rotation = Math.sin(Date.now() * 0.001) * 0.05;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    // Эффект исцеления
    playHealEffect(summonId) {
        const visual = this.visuals.get(summonId);
        if (!visual || visual.destroyed) return;
        
        const container = visual.parent;
        if (!container) return;
        
        // Сохраняем координаты СРАЗУ (до setTimeout)
        const visualX = visual.x;
        const visualY = visual.y;
        
        // Зеленые круги
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                // ПРОВЕРКА: visual может быть уничтожен к этому моменту
                if (!visual || visual.destroyed || !container.parent) {
                    console.warn('⚠️ Visual уничтожен, отменяем heal эффект');
                    return;
                }
                
                const heal = new PIXI.Graphics();
                heal.lineStyle(2, 0x00FF00, 0.6);
                heal.drawCircle(0, 0, 10);
                heal.x = visualX;  // Используем сохраненные координаты
                heal.y = visualY;
                
                container.addChild(heal);
                
                const startTime = Date.now();
                const animate = () => {
                    // ПРОВЕРКА: heal может быть уничтожен
                    if (!heal || heal.destroyed || !heal.transform) {
                        return;
                    }
                    
                    const progress = Math.min((Date.now() - startTime) / 800, 1);
                    heal.scale.set(1 + progress * 2);
                    heal.alpha = 0.6 * (1 - progress);
                    heal.y -= 1;
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        if (heal.parent) {
                            container.removeChild(heal);
                        }
                        if (!heal.destroyed) {
                            heal.destroy();
                        }
                    }
                };
                animate();
            }, i * 150);
        }
    }
    
    // Эффект урона
    playDamageEffect(summonId) {
        const visual = this.visuals.get(summonId);
        if (!visual || visual.destroyed) return;
        
        // Красная вспышка
        const originalTint = visual.tint || 0xFFFFFF;
        visual.tint = 0xFF0000;
        
        setTimeout(() => {
            // ПРОВЕРКА перед изменением tint
            if (!visual || visual.destroyed) return;
            visual.tint = originalTint;
        }, 200);
    }
    
    // Анимация смерти
    playDeathAnimation(summonId, onComplete) {
        const visual = this.visuals.get(summonId);
        if (!visual) return;

        // Остановить анимацию для спрайтов
        if (visual.stop) visual.stop();

        // Падение и исчезновение
        const startY = visual.y;
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
            if (!visual || visual.destroyed || !visual.transform) {
                if (onComplete) onComplete();
                return;
            }

            const progress = Math.min((Date.now() - startTime) / duration, 1);
            visual.y = startY + progress * 20;
            visual.alpha = 1 - progress;
            visual.rotation = progress * 0.5;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        };
        animate();
    }
    
    // Анимация атаки
    playAttackAnimation(summonId, targetX, targetY, onComplete) {
        const visual = this.visuals.get(summonId);
        if (!visual) return;
        
        const startX = visual.x;
        const startY = visual.y;
        
        // Прыжок к цели и обратно
        const jumpTo = () => {
            const progress = Math.min((Date.now() - startTime) / 200, 1);
            visual.x = startX + (targetX - startX) * progress * 0.3;
            visual.y = startY + (targetY - startY) * progress * 0.3;
            
            if (progress < 1) {
                requestAnimationFrame(jumpTo);
            } else {
                // Возврат
                const returnStart = Date.now();
                const jumpBack = () => {
                    const returnProgress = Math.min((Date.now() - returnStart) / 200, 1);
                    visual.x = startX + (targetX - startX) * 0.3 * (1 - returnProgress);
                    visual.y = startY + (targetY - startY) * 0.3 * (1 - returnProgress);
                    
                    if (returnProgress < 1) {
                        requestAnimationFrame(jumpBack);
                    } else {
                        if (onComplete) onComplete();
                    }
                };
                jumpBack();
            }
        };
        
        const startTime = Date.now();
        jumpTo();
    }
    
    // ========================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ========================================
    
    // Определить колонку призыва
    getSummonColumn(casterType) {
        return casterType === 'player' ? 4 : 1;
    }
    
    // Определить фракцию по типу существа
    getFactionByType(type) {
        const factionMap = {
            'nature_wolf': 'nature',
            'nature_ent': 'nature',
            'necromant_skeleton': 'necromant',
            'fire_elemental': 'fire',
            'water_golem': 'water',
            'air_spirit': 'air',
            'earth_guardian': 'earth'
        };
        return factionMap[type] || 'neutral';
    }
    
    // Логирование
    logSummon(action, summonData) {
        if (typeof window.addToBattleLog !== 'function') return;
        
        const messages = {
            'create': `🎭 Призван ${summonData.name} (HP: ${summonData.hp}/${summonData.maxHP})`,
            'restore': `💚 ${summonData.name} восстановлен (HP: ${summonData.hp}/${summonData.maxHP})`,
            'death': `💀 ${summonData.name} погиб`
        };
        
        const message = messages[action];
        if (message) {
            window.addToBattleLog(message);
        }
    }
    
    // Получить статистику
    getStats() {
        const stats = {
            total: this.summons.size,
            alive: 0,
            byType: {},
            byCaster: {}
        };
        
        for (const [id, summon] of this.summons) {
            if (summon.isAlive) stats.alive++;
            
            stats.byType[summon.type] = (stats.byType[summon.type] || 0) + 1;
            stats.byCaster[summon.casterId] = (stats.byCaster[summon.casterId] || 0) + 1;
        }
        
        return stats;
    }
}

// ========================================
// СОЗДАНИЕ ГЛОБАЛЬНОГО ЭКЗЕМПЛЯРА
// ========================================

window.summonsManager = new SummonsManager();

// ========================================
// ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМ КОДОМ
// ========================================

// Обертки для обратной совместимости
window.findSummonedCreatureAt = function(column, position) {
    // Используем новый менеджер если доступен
    if (window.summonsManager) {
        return window.summonsManager.findSummonAt(column, position);
    }
    
    // Fallback на старую систему
    if (!window.activeSummons) return null;
    
    return window.activeSummons.find(summon => 
        summon.column === column && 
        summon.position === position && 
        summon.hp > 0
    );
};

window.removeSummonVisual = function(summonId) {
    window.summonsManager.removeVisual(summonId);
};

window.cleanupDeadSummons = function() {
    return window.summonsManager.cleanupDead();
};

// ========================================
// АДАПТЕРЫ ДЛЯ ВОЛКОВ
// ========================================

// Адаптер для создания волка через новую систему
window.createWolfSummon = function(wizard, casterType, position, level) {
    const wolfStats = [
        { hp: 10, damage: 10 },   // Ур.1
        { hp: 12, damage: 12 },   // Ур.2
        { hp: 15, damage: 14 },   // Ур.3
        { hp: 18, damage: 16 },   // Ур.4
        { hp: 20, damage: 16 }    // Ур.5
    ];
    
    const stats = wolfStats[Math.min(level, 5) - 1] || wolfStats[0];
    
    // Проверяем, есть ли уже волк
    const existingWolf = window.summonsManager.hasSummonOfType(
        wizard.id, 
        'nature_wolf', 
        position
    );
    
    if (existingWolf) {
        // Восстанавливаем существующего
        window.summonsManager.restoreSummon(existingWolf.id);
        return existingWolf;
    } else {
        // Создаем нового
        return window.summonsManager.createSummon('nature_wolf', {
            casterId: wizard.id,
            casterType: casterType,
            position: position,
            level: level,
            hp: stats.hp,
            maxHP: stats.hp,
            damage: stats.damage
        });
    }
};

// Адаптер для создания Скелета (Некромант)
window.createSkeletonSummon = function(wizard, casterType, position, level) {
    const skeletonStats = [
        { hp: 5,  damage: 15 },   // Ур.1
        { hp: 6,  damage: 18 },   // Ур.2
        { hp: 7,  damage: 21 },   // Ур.3
        { hp: 8,  damage: 24 },   // Ур.4
        { hp: 10, damage: 24 }    // Ур.5 — 50% шанс пробить 50% брони
    ];

    const stats = skeletonStats[Math.min(level, 5) - 1] || skeletonStats[0];

    // Проверяем, есть ли уже скелет
    const existingSkeleton = window.summonsManager.hasSummonOfType(
        wizard.id,
        'necromant_skeleton',
        position
    );

    if (existingSkeleton) {
        window.summonsManager.restoreSummon(existingSkeleton.id);
        return existingSkeleton;
    } else {
        return window.summonsManager.createSummon('necromant_skeleton', {
            casterId: wizard.id,
            casterType: casterType,
            position: position,
            level: level,
            hp: stats.hp,
            maxHP: stats.hp,
            damage: stats.damage
        });
    }
};

// Адаптер для создания Энта
window.createEntSummon = function(wizard, casterType, position, level, linkedWizards) {
    const hp = [40, 50, 60, 70, 80][level - 1] || 40;
    
    return window.summonsManager.createSummon('nature_ent', {
        casterId: wizard.id,
        casterType: casterType,
        position: position,
        level: level,
        hp: hp,
        maxHP: hp,
        damage: 0,
        special: {
            linkedWizards: linkedWizards
        }
    });
};

