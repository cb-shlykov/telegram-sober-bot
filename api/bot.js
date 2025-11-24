const { Telegraf } = require('telegraf');
const airtableService = require('../lib/airtable');

// Создаем экземпляр бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Главное меню с кнопкой сброса
async function showMainMenu(ctx, text) {
  await ctx.reply(text, {
    reply_markup: {
      keyboard: [
        [{ text: '🔄 Сбросить счетчик' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
}

// Обработчик команды /start
bot.start(async (ctx) => {
  const welcomeText = `👋 Привет! Я твой помощник на пути к трезвой жизни.

Я буду отправлять тебе информацию о позитивных изменениях, которые происходят в твоём организме после отказа от алкоголя.

🎯 Для начала расскажи, когда ты отказался от алкоголя:`;

  await ctx.reply(welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗓️ Сегодня первый день', callback_data: 'start_today' }],
        [{ text: '📅 Указать количество дней', callback_data: 'input_days' }]
      ]
    }
  });
});

// Обработчик команды /reset
bot.command('reset', async (ctx) => {
  const userId = ctx.from.id;
  
  try {
    // Удаляем пользователя из базы данных
    const existingUser = await airtableService.getUserByTelegramId(userId);
    
    if (existingUser) {
      await airtableService.deleteUser(existingUser.id);
      await ctx.reply('🔄 Счетчик сброшен! Теперь вы можете начать заново.');
      
      // Показываем стартовое меню
      await ctx.reply('🎯 Выберите, когда вы отказались от алкоголя:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗓️ Сегодня первый день', callback_data: 'start_today' }],
            [{ text: '📅 Указать количество дней', callback_data: 'input_days' }]
          ]
        }
      });
    } else {
      await ctx.reply('У вас еще нет активного счетчика. Давайте начнем!');
      await ctx.reply('🎯 Выберите, когда вы отказались от алкоголя:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗓️ Сегодня первый день', callback_data: 'start_today' }],
            [{ text: '📅 Указать количество дней', callback_data: 'input_days' }]
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error resetting counter:', error);
    await ctx.reply('❌ Произошла ошибка при сбросе счетчика. Попробуйте еще раз.');
  }
});

// Обработчик callback запросов (кнопки)
bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  try {
    switch (callbackData) {
      case 'start_today':
        const today = new Date().toISOString().split('T')[0];
        await airtableService.createOrUpdateUser(userId, today, 1);
        await ctx.editMessageText(
          `🎉 Отлично! Твой трезвый путь начинается сегодня!\n\n` +
          `Я буду присылать тебе ободряющие сообщения о позитивных изменениях в твоём организме.\n\n` +
          `Уже завтра ты получишь первое сообщение! 💪`
        );
        // Показываем главное меню с кнопкой сброса
        await showMainMenu(ctx, 
          `💪 Отсчет начат! Ты на пути к лучшей версии себя!\n\n` +
          `Если вдруг случился срыв - не отчаивайся! Просто нажми "Сбросить счетчик" и начни заново.`
        );
        break;

      case 'input_days':
        await ctx.editMessageText(
          `✍️ Введи количество дней без алкоголя (только цифру):\n\n` +
          `Например: 7, 30, 100 и т.д.`
        );
        break;

      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
  }
});

// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from.id;

  // Обработка кнопки сброса
  if (text === '🔄 Сбросить счетчик') {
    try {
      // Удаляем пользователя из базы данных
      const existingUser = await airtableService.getUserByTelegramId(userId);
      
      if (existingUser) {
        await airtableService.deleteUser(existingUser.id);
        await ctx.reply('🔄 Счетчик сброшен! Теперь вы можете начать заново.');
        
        // Показываем стартовое меню
        await ctx.reply('🎯 Выберите, когда вы отказались от алкоголя:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🗓️ Сегодня первый день', callback_data: 'start_today' }],
              [{ text: '📅 Указать количество дней', callback_data: 'input_days' }]
            ]
          }
        });
      } else {
        await ctx.reply('У вас еще нет активного счетчика. Давайте начнем!');
        await ctx.reply('🎯 Выберите, когда вы отказались от алкоголя:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🗓️ Сегодня первый день', callback_data: 'start_today' }],
              [{ text: '📅 Указать количество дней', callback_data: 'input_days' }]
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error resetting counter:', error);
      await ctx.reply('❌ Произошла ошибка при сбросе счетчика. Попробуйте еще раз.');
    }
    return;
  }

  // Проверяем, является ли сообщение числом (количество дней)
  if (/^\d+$/.test(text)) {
    const daysCount = parseInt(text);
    
    if (daysCount <= 0) {
      await ctx.reply('❌ Количество дней должно быть положительным числом. Попробуй еще раз:');
      return;
    }

    if (daysCount > 3650) {
      await ctx.reply('❌ Пожалуйста, введите реалистичное количество дней (не более 10 лет). Попробуйте еще раз:');
      return;
    }

    try {
      // Вычисляем дату начала
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      const startDateStr = startDate.toISOString().split('T')[0];

      await airtableService.createOrUpdateUser(userId, startDateStr, daysCount);

      await ctx.reply(
        `📊 Зафиксировано: ${daysCount} дней без алкоголя! 🎉\n\n` +
        `Это огромное достижение! Продолжай в том же духе!`
      );

      // Отправляем сообщение для текущего дня
      const message = await airtableService.getMessageForDay(daysCount);
      if (message) {
        await ctx.reply(`💫 Изменения за ${daysCount} дней:\n\n${message}`);
      }

      // Показываем главное меню с кнопкой сброса
      await showMainMenu(ctx,
        `💪 Продолжайте в том же духе! Я буду присылать вам информацию о позитивных изменениях в вашем организме.\n\n` +
        `Если вдруг случился срыв - не отчаивайтесь! Просто нажмите "Сбросить счетчик" и начните заново.`
      );

    } catch (error) {
      console.error('Error saving user days:', error);
      await ctx.reply('❌ Произошла ошибка при сохранении данных. Попробуйте еще раз.');
    }
  } else {
    await ctx.reply(
      '🤔 Я понимаю только цифры (количество дней) или команду сброса.\n\n' +
      'Пожалуйста, введи количество дней без алкоголя цифрами или используйте меню:'
    );
  }
});

// Обработка ошибок
bot.catch((error) => {
  console.error('Telegraf error:', error);
});

// Экспорт обработчика для Vercel
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error processing update:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(200).json({ 
      status: 'Bot is running',
      usage: 'Send POST requests with Telegram updates',
      endpoints: {
        webhook: '/webhook (POST)',
        cron: '/cron (POST)',
        test: '/test (GET)'
      }
    });
  }
};
