// battle/renderer/animations/nature/ent-visual.js

(function() {
    const activeEnts = new Map();
    
    // Интеграция с менеджером призывов
    const originalCreateSummon = window.summonsManager?.createSummon;
    if (originalCreateSummon) {
    	window.summonsManager.createSummon = function(type, params) {
    	    // Для Энта проверяем, есть ли уже визуал
    	    if (type === 'nature_ent') {
    	        const existingEnt = this.hasSummonOfType(params.casterId, 'nature_ent', params.position);
    	        if (existingEnt) {
    	            // Восстанавливаем существующего
    	            this.restoreSummon(existingEnt.id);
    	            
    	            // Обновляем визуал
    	            const visual = activeEnts.get(existingEnt.id);
    	            if (visual) {
    	                updateHPBar(visual.hpBar, existingEnt.maxHP, existingEnt.maxHP);
    	                visual.sprite.alpha = 1;
    	            }
    	            
    	            return existingEnt;
    	        }
    	    }
    	    
    	    const summon = originalCreateSummon.call(this, type, params);
    	    
    	    if (type === 'nature_ent' && summon) {
    	        createEntVisual(summon);
    	    }
    	    
    	    return summon;
    	};
    }
    
    function createEntVisual(entData) {
        // КРИТИЧНО: При быстрой симуляции пропускаем анимацию
        if (window.fastSimulation) {
            console.log('⚡ Быстрая симуляция: пропуск анимации Энт');
            return;
        }

        const gridCells = window.pixiCore?.getGridCells();
        const unitsContainer = window.pixiCore?.getUnitsContainer();

        if (!gridCells || !unitsContainer) return;
        
        // Энт в колонке 2 (игрок) или 3 (враг)
        const entCol = entData.casterType === 'player' ? 4 : 1;
        const entCell = gridCells[entCol]?.[entData.position];
        
        if (!entCell) return;
        
        // Загружаем спрайт 768x768, 3x3
        const entSheetPath = 'images/spells/nature/ent/ent_sheet.webp';
        
        PIXI.Assets.load(entSheetPath).then(texture => {
            // Нарезаем кадры
            const frames = [];
            const frameSize = 256; // 768/3
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    frames.push(new PIXI.Texture(
                        texture,
                        new PIXI.Rectangle(col * frameSize, row * frameSize, frameSize, frameSize)
                    ));
                }
            }
            
            // Создаем спрайт
            const entSprite = new PIXI.AnimatedSprite(frames);
            entSprite.animationSpeed = 0.05;
            entSprite.anchor.set(0.5, 0.5);
            entSprite.scale.set(entCell.cellScale * 0.3);
            entSprite.x = entCell.x + entCell.width / 2;
            entSprite.y = entCell.y + entCell.height / 2;
            entSprite.play();
            
            // HP бар
            const hpBar = new PIXI.Graphics();
            updateHPBar(hpBar, entData.hp, entData.maxHP);
            entSprite.addChild(hpBar);
            
            unitsContainer.addChild(entSprite);
            
            activeEnts.set(entData.id, {
                sprite: entSprite,
                hpBar: hpBar,
                data: entData
            });
            
        }).catch(() => {
            createFallbackEnt(entData, entCell, unitsContainer);
        });
    }
    
    function createFallbackEnt(entData, cell, container) {
        const ent = new PIXI.Graphics();
        
        // Ствол
        ent.beginFill(0x8B4513, 0.9);
        ent.drawRect(-10, -5, 50, 25);
        ent.endFill();
        
        // Крона
        ent.beginFill(0x228B22, 0.8);
        ent.drawEllipse(0, -15, 17, 15);
        ent.endFill();
        
        // Глаза
        ent.beginFill(0xFFFF00, 1);
        ent.drawCircle(-5, -15, 2);
        ent.drawCircle(5, -15, 2);
        ent.endFill();
        
        ent.scale.set(cell.cellScale * 0.75);
        ent.x = cell.x + cell.width / 2;
        ent.y = cell.y + cell.height / 2;
        
        // HP бар
        const hpBar = new PIXI.Graphics();
        updateHPBar(hpBar, entData.hp, entData.maxHP);
        ent.addChild(hpBar);
        
        container.addChild(ent);
        
        activeEnts.set(entData.id, {
            sprite: ent,
            hpBar: hpBar,
            data: entData
        });
    }
    
    function updateHPBar(hpBar, hp, maxHP) {
        const barWidth = 40;
        const barHeight = 5;

        // Создаём фон если его нет
        if (!hpBar.hpBarBg) {
            hpBar.hpBarBg = new PIXI.Graphics();
            hpBar.hpBarBg.beginFill(0x000000, 0.5);
            hpBar.hpBarBg.drawRect(-barWidth/2, 0, barWidth, barHeight);
            hpBar.hpBarBg.endFill();
            hpBar.hpBarBg.y = -55;
            hpBar.addChild(hpBar.hpBarBg);

            // Заполнение
            hpBar.hpBarFill = new PIXI.Graphics();
            hpBar.hpBarFill.y = -55;
            hpBar.addChild(hpBar.hpBarFill);

            // Текст HP
            hpBar.hpText = new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0xFFFFFF,
                fontWeight: 'bold',
                stroke: 0x000000,
                strokeThickness: 2
            });
            hpBar.hpText.anchor.set(0.5, 1);
            hpBar.hpText.y = -57;
            hpBar.addChild(hpBar.hpText);
        }

        // Обновляем заполнение
        hpBar.hpBarFill.clear();
        const hpPercent = hp / maxHP;
        const color = hpPercent > 0.5 ? 0x4ade80 :
                     hpPercent > 0.25 ? 0xfbbf24 : 0xef4444;
        hpBar.hpBarFill.beginFill(color);
        hpBar.hpBarFill.drawRect(-barWidth/2, 0, barWidth * hpPercent, barHeight);
        hpBar.hpBarFill.endFill();

        // Обновляем текст
        hpBar.hpText.text = `${hp}/${maxHP}`;
    }
    
    // Обновление HP при получении урона
    const originalUpdateHP = window.summonsManager?.updateHP;
    if (originalUpdateHP) {
        window.summonsManager.updateHP = function(summonId, newHP) {
            const result = originalUpdateHP.call(this, summonId, newHP);
            
            const ent = activeEnts.get(summonId);
            if (ent) {
                const summon = this.summons.get(summonId);
                if (summon) {
                    updateHPBar(ent.hpBar, newHP, summon.maxHP);
                    
                    // Эффект при получении урона
                    if (newHP < ent.data.hp) {
                        ent.sprite.tint = 0xff6666;
                        setTimeout(() => {
                            ent.sprite.tint = 0xffffff;
                        }, 200);
                    }
                    
                    ent.data.hp = newHP;
                }
            }
            
            return result;
        };
    }
    
    // Удаление при смерти
    const originalKillSummon = window.summonsManager?.killSummon;
    if (originalKillSummon) {
        window.summonsManager.killSummon = function(summonId) {
            const ent = activeEnts.get(summonId);
            if (ent) {
                // Анимация смерти
                const fadeOut = () => {
                    // ПРОВЕРКА: если объект уничтожен - прерываем анимацию
                    if (!ent.sprite || ent.sprite.destroyed || !ent.sprite.transform) {
                        activeEnts.delete(summonId);
                        return;
                    }

                    ent.sprite.alpha -= 0.05;
                    if (ent.sprite.alpha > 0) {
                        requestAnimationFrame(fadeOut);
                    } else {
                        if (ent.sprite.parent) {
                            ent.sprite.parent.removeChild(ent.sprite);
                        }
                        if (!ent.sprite.destroyed) {
                            ent.sprite.destroy();
                        }
                        activeEnts.delete(summonId);
                    }
                };
                fadeOut();
            }
            
            return originalKillSummon.call(this, summonId);
        };
    }
    
    console.log('🌳 Визуализация Энта интегрирована');
})();