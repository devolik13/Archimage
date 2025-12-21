// knowledge-book-modal.js - Книга Знаний (FAQ и справка по игре)

/**
 * Данные для Книги Знаний
 * Категории и их содержимое
 */
const KNOWLEDGE_BOOK_DATA = {
    categories: [
        {
            id: 'buildings',
            icon: '🏰',
            title: 'Здания',
            articles: [
                {
                    title: 'Академия',
                    content: `<b>Академия</b> — главное здание для найма новых магов.

<b>Функции:</b>
• Нанимай новых магов за Time Currency
• Каждый маг имеет уникальную стихию
• Улучшай Академию чтобы открыть редких магов

<b>Стихии магов:</b>
🔥 Огонь • 💧 Вода • 🌿 Природа
🌍 Земля • 💨 Ветер • ☠️ Яд`
                },
                {
                    title: 'Библиотека',
                    content: `<b>Библиотека</b> — изучай и улучшай заклинания.

<b>Функции:</b>
• Изучай новые заклинания для боя
• Улучшай существующие заклинания
• Открывай мощные школы магии

<b>Школы магии:</b>
Каждая стихия имеет свой набор заклинаний с уникальными эффектами.`
                },
                {
                    title: 'Арена',
                    content: `<b>Арена</b> — сражайся с другими игроками!

<b>Функции:</b>
• PvP бои с реальными игроками
• Зарабатывай рейтинг и поднимайся в лигах
• Получай награды за победы

<b>Лиги:</b>
Бронза → Серебро → Золото → Платина → Алмаз → Мастер → Грандмастер`
                },
                {
                    title: 'Тренировочный полигон',
                    content: `<b>Тренировочный полигон</b> — испытай свою силу!

<b>Функции:</b>
• Сражайся с тренировочным манекеном
• Нанеси максимальный урон за ограниченные ходы
• Получай награды за достижение порогов урона

<b>Совет:</b>
Используй комбо заклинаний для максимального урона!`
                }
            ]
        },
        {
            id: 'wizards',
            icon: '🧙',
            title: 'Маги',
            articles: [
                {
                    title: 'Основы',
                    content: `<b>Маги</b> — твои бойцы на арене.

<b>Характеристики мага:</b>
• ❤️ HP — здоровье
• ⚔️ Атака — базовый урон
• 🛡️ Защита — снижение урона
• 🎯 Инициатива — порядок хода

<b>Стихии:</b>
Каждый маг принадлежит к одной из 6 стихий, определяющей его заклинания.`
                },
                {
                    title: 'Прокачка',
                    content: `<b>Как прокачивать магов:</b>

• Маги получают опыт за бои
• За каждый уровень растут характеристики
• Максимальный уровень — 30

<b>Совет:</b>
Используй магов в боях чтобы они получали опыт!`
                },
                {
                    title: 'Формация',
                    content: `<b>Формация</b> — расположение магов в бою.

• У тебя 5 слотов для магов
• Порядок влияет на выбор целей врагом
• Экспериментируй с разными составами

<b>Совет:</b>
Ставь танков (с высоким HP) на передние позиции!`
                }
            ]
        },
        {
            id: 'spells',
            icon: '✨',
            title: 'Заклинания',
            articles: [
                {
                    title: 'Основы',
                    content: `<b>Заклинания</b> — магические атаки и способности.

<b>Типы заклинаний:</b>
• 💥 Урон — наносят повреждения врагам
• 🛡️ Защита — щиты и барьеры
• 💚 Лечение — восстановление HP
• ⚡ Эффекты — яды, ослабления, усиления

<b>Изучение:</b>
Новые заклинания открываются в Библиотеке.`
                },
                {
                    title: 'Улучшение',
                    content: `<b>Улучшение заклинаний:</b>

• Каждое заклинание можно улучшить до 5 уровня
• Улучшение увеличивает урон/эффект
• Требуется Time Currency

<b>Совет:</b>
Сначала улучшай часто используемые заклинания!`
                },
                {
                    title: 'Школы магии',
                    content: `<b>Школы магии:</b>

🔥 <b>Огонь</b> — высокий урон, поджоги
💧 <b>Вода</b> — контроль, заморозка
🌿 <b>Природа</b> — лечение, регенерация
🌍 <b>Земля</b> — защита, оглушение
💨 <b>Ветер</b> — скорость, уклонение
☠️ <b>Яд</b> — DoT урон, ослабление`
                }
            ]
        },
        {
            id: 'battle',
            icon: '⚔️',
            title: 'Бой',
            articles: [
                {
                    title: 'Механика боя',
                    content: `<b>Как проходит бой:</b>

1. Маги ходят по очереди (по инициативе)
2. Каждый маг может атаковать или использовать заклинание
3. Бой идёт до победы одной стороны

<b>Победа:</b>
Уничтожь всех вражеских магов!`
                },
                {
                    title: 'Энергия',
                    content: `<b>Энергия боя:</b>

• Максимум: 12 единиц
• 1 бой = 1 энергия
• Восстановление: 1 единица каждые 10 минут

<b>Совет:</b>
Энергия восстанавливается даже офлайн!`
                },
                {
                    title: 'Рейтинг',
                    content: `<b>Рейтинговая система:</b>

• Победа = +рейтинг
• Поражение = -рейтинг
• Рейтинг определяет твою лигу

<b>Лиги:</b>
🥉 Бронза (0-999)
🥈 Серебро (1000-1499)
🥇 Золото (1500-1999)
💎 Платина (2000-2499)
💠 Алмаз (2500-2999)
👑 Мастер (3000+)`
                }
            ]
        },
        {
            id: 'rewards',
            icon: '🎁',
            title: 'Награды',
            articles: [
                {
                    title: 'Ежедневный вход',
                    content: `<b>Ежедневные награды:</b>

• Заходи каждый день и получай награды
• Награды растут с каждым днём
• Максимум 7 дней в цикле

<b>Streak бонус:</b>
Заходи несколько дней подряд для бонуса!`
                },
                {
                    title: 'Time Currency',
                    content: `<b>Time Currency ⏰</b> — основная валюта игры.

<b>Как получить:</b>
• Офлайн-накопление (1/мин)
• Ежедневные награды
• Победы в боях
• Награды за лиги

<b>Использование:</b>
• Найм магов
• Изучение заклинаний
• Улучшения`
                },
                {
                    title: 'Лиговые награды',
                    content: `<b>Награды за лиги:</b>

При достижении новой лиги ты получаешь единоразовую награду!

• 🥉 Бронза — 100 TC
• 🥈 Серебро — 250 TC
• 🥇 Золото — 500 TC
• 💎 Платина — 1000 TC
• 💠 Алмаз — 2000 TC
• 👑 Мастер — 5000 TC`
                }
            ]
        },
        {
            id: 'airdrop',
            icon: '💎',
            title: 'Airdrop',
            articles: [
                {
                    title: 'Что такое Airdrop?',
                    content: `<b>BPM Coin Airdrop</b>

Играй и зарабатывай BPM очки, которые будут конвертированы в токены при запуске!

<b>Как заработать:</b>
• 🎮 Побеждай в боях
• 📅 Заходи каждый день
• 👛 Подключи TON кошелёк
• 👥 Приглашай друзей`
                },
                {
                    title: 'TON Кошелёк',
                    content: `<b>Подключение кошелька:</b>

1. Открой раздел Airdrop
2. Нажми "Подключить кошелёк"
3. Выбери Tonkeeper, MyTonWallet или другой
4. Подтверди подключение

<b>Бонус:</b>
За подключение кошелька ты получишь BPM очки!`
                }
            ]
        },
        {
            id: 'faq',
            icon: '❓',
            title: 'FAQ',
            articles: [
                {
                    title: 'Мой прогресс сохраняется?',
                    content: `<b>Да!</b> Твой прогресс автоматически сохраняется в облаке.

• Прогресс привязан к твоему Telegram аккаунту
• Можешь играть с любого устройства
• Данные синхронизируются автоматически`
                },
                {
                    title: 'Как сменить фракцию?',
                    content: `<b>Смена фракции:</b>

• Первая смена бесплатна
• Последующие смены стоят Time Currency
• Твои маги и заклинания сохраняются

<b>Как:</b>
Нажми на свой аватар → Выбери новую фракцию`
                },
                {
                    title: 'Почему я проигрываю?',
                    content: `<b>Советы по улучшению:</b>

• 📈 Прокачивай магов в боях
• ✨ Улучшай заклинания в Библиотеке
• 🧙 Нанимай новых магов
• ⚔️ Экспериментируй с формацией
• 🎯 Используй комбо заклинаний`
                },
                {
                    title: 'Игра зависла, что делать?',
                    content: `<b>Решение проблем:</b>

1. Обнови страницу (потяни вниз)
2. Закрой и открой игру заново
3. Проверь интернет-соединение

<b>Важно:</b>
Твой прогресс сохраняется автоматически, ничего не потеряется!`
                },
                {
                    title: 'Как получить больше магов?',
                    content: `<b>Получение магов:</b>

• 🏛️ Нанимай в Академии за Time Currency
• 🎁 Получай из стартовых паков
• 🏆 Награды за достижения

<b>Совет:</b>
Улучшай Академию для доступа к редким магам!`
                }
            ]
        }
    ]
};

/**
 * Текущее состояние модалки
 */
let currentCategory = null;
let currentArticle = null;

/**
 * Показать модалку Книги Знаний
 */
function showKnowledgeBookModal() {
    console.log('📖 Открытие Книги Знаний');

    // Скрываем аватар игрока
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = 'none';
    }

    // Удаляем старый экран если есть
    const existingScreen = document.getElementById('knowledge-book-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    // Создаем экран
    const screen = document.createElement('div');
    screen.id = 'knowledge-book-screen';
    screen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
        z-index: 9000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Arial, sans-serif;
    `;

    screen.innerHTML = `
        <div id="knowledge-book-header" style="
            padding: 15px 20px;
            background: linear-gradient(90deg, rgba(255,215,0,0.2), transparent);
            border-bottom: 2px solid rgba(255,215,0,0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span id="kb-back-btn" style="
                    font-size: 24px;
                    cursor: pointer;
                    display: none;
                    padding: 5px;
                ">←</span>
                <h2 id="kb-title" style="
                    margin: 0;
                    color: #ffd700;
                    font-size: 20px;
                    text-shadow: 0 0 10px rgba(255,215,0,0.5);
                ">📖 Книга Знаний</h2>
            </div>
            <button id="kb-close-btn" style="
                background: rgba(255,100,100,0.2);
                border: 1px solid rgba(255,100,100,0.5);
                color: #ff6b6b;
                font-size: 20px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">✕</button>
        </div>
        <div id="knowledge-book-content" style="
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        "></div>
    `;

    document.body.appendChild(screen);

    // Обработчики
    document.getElementById('kb-close-btn').onclick = closeKnowledgeBookModal;
    document.getElementById('kb-back-btn').onclick = handleBackButton;

    // Показываем категории
    showCategories();
}

/**
 * Показать список категорий
 */
function showCategories() {
    currentCategory = null;
    currentArticle = null;

    const content = document.getElementById('knowledge-book-content');
    const title = document.getElementById('kb-title');
    const backBtn = document.getElementById('kb-back-btn');

    title.textContent = '📖 Книга Знаний';
    backBtn.style.display = 'none';

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';

    KNOWLEDGE_BOOK_DATA.categories.forEach(category => {
        html += `
            <div class="kb-category-item" data-category="${category.id}" style="
                background: linear-gradient(145deg, rgba(50,50,80,0.8), rgba(30,30,50,0.8));
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 12px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <span style="font-size: 32px;">${category.icon}</span>
                <div>
                    <div style="color: #fff; font-size: 18px; font-weight: bold;">${category.title}</div>
                    <div style="color: #888; font-size: 14px;">${category.articles.length} статей</div>
                </div>
                <span style="margin-left: auto; color: #ffd700; font-size: 20px;">›</span>
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;

    // Добавляем обработчики клика
    content.querySelectorAll('.kb-category-item').forEach(item => {
        item.onclick = () => {
            const categoryId = item.dataset.category;
            showCategoryArticles(categoryId);
        };
        // Hover эффект
        item.onmouseenter = () => {
            item.style.background = 'linear-gradient(145deg, rgba(70,70,100,0.9), rgba(50,50,70,0.9))';
            item.style.borderColor = 'rgba(255,215,0,0.6)';
        };
        item.onmouseleave = () => {
            item.style.background = 'linear-gradient(145deg, rgba(50,50,80,0.8), rgba(30,30,50,0.8))';
            item.style.borderColor = 'rgba(255,215,0,0.3)';
        };
    });
}

/**
 * Показать статьи категории
 */
function showCategoryArticles(categoryId) {
    const category = KNOWLEDGE_BOOK_DATA.categories.find(c => c.id === categoryId);
    if (!category) return;

    currentCategory = category;
    currentArticle = null;

    const content = document.getElementById('knowledge-book-content');
    const title = document.getElementById('kb-title');
    const backBtn = document.getElementById('kb-back-btn');

    title.textContent = `${category.icon} ${category.title}`;
    backBtn.style.display = 'block';

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

    category.articles.forEach((article, index) => {
        html += `
            <div class="kb-article-item" data-index="${index}" style="
                background: rgba(40,40,60,0.8);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <div style="color: #fff; font-size: 16px;">${article.title}</div>
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;

    // Обработчики
    content.querySelectorAll('.kb-article-item').forEach(item => {
        item.onclick = () => {
            const index = parseInt(item.dataset.index);
            showArticle(category, index);
        };
        item.onmouseenter = () => {
            item.style.background = 'rgba(60,60,80,0.9)';
            item.style.borderColor = 'rgba(255,215,0,0.5)';
        };
        item.onmouseleave = () => {
            item.style.background = 'rgba(40,40,60,0.8)';
            item.style.borderColor = 'rgba(255,255,255,0.1)';
        };
    });
}

/**
 * Показать статью
 */
function showArticle(category, articleIndex) {
    const article = category.articles[articleIndex];
    if (!article) return;

    currentArticle = article;

    const content = document.getElementById('knowledge-book-content');
    const title = document.getElementById('kb-title');

    title.textContent = article.title;

    // Форматируем контент (заменяем переносы строк на <br>)
    const formattedContent = article.content
        .replace(/\n/g, '<br>')
        .replace(/<b>/g, '<span style="color: #ffd700; font-weight: bold;">')
        .replace(/<\/b>/g, '</span>');

    content.innerHTML = `
        <div style="
            background: rgba(40,40,60,0.6);
            border: 1px solid rgba(255,215,0,0.2);
            border-radius: 15px;
            padding: 20px;
        ">
            <div style="
                color: #e0e0e0;
                font-size: 16px;
                line-height: 1.6;
            ">${formattedContent}</div>
        </div>
    `;
}

/**
 * Обработка кнопки "Назад"
 */
function handleBackButton() {
    if (currentArticle) {
        // Возврат к списку статей
        showCategoryArticles(currentCategory.id);
    } else if (currentCategory) {
        // Возврат к категориям
        showCategories();
    }
}

/**
 * Закрыть модалку
 */
function closeKnowledgeBookModal() {
    const screen = document.getElementById('knowledge-book-screen');
    if (screen) {
        screen.remove();
    }

    // Возвращаем аватар
    const playerAvatar = document.getElementById('player-avatar-container');
    if (playerAvatar) {
        playerAvatar.style.display = '';
    }

    currentCategory = null;
    currentArticle = null;
}

// Экспорт в window
window.showKnowledgeBookModal = showKnowledgeBookModal;
window.closeKnowledgeBookModal = closeKnowledgeBookModal;

console.log('📖 Knowledge Book Modal загружен');
