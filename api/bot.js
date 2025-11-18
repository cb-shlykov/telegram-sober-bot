const { Telegraf } = require('telegraf');

// Создаем экземпляр бота один раз (вне функции handler)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Настройка обработчиков
bot.start((ctx) => {
  const welcomeText = `👋 Привет! Я твой помощник на пути к трезвой жизни.

Я буду отправлять тебе информацию о позитивных изменениях, которые происходят в твоём организме после отказа от алкоголя.

🎯 Для начала расскажи, когда ты отказался от алкоголя:`;

  return ctx.reply(welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗓️ Сегодня первый день', callback_data: 'start_today' }],
        [{ text: '📅 Указать количество дней', callback_data: 'input_days' }]
      ]
    }
  });
});

// Обработка callback запросов
bot.on('callback_query', async (ctx) => {
  const airtableService = require('../lib/airtable');
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

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const airtableService = require('../lib/airtable');
  const text = ctx.message.text;
  const userId = ctx.from.id;

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
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      const startDateStr = startDate.toISOString().split('T')[0];

      await airtableService.createOrUpdateUser(userId, startDateStr, daysCount);

      await ctx.reply(
        `📊 Зафиксировано: ${daysCount} дней без алкоголя! 🎉\n\n` +
        `Это огромное достижение! Продолжай в том же духе!\n\n` +
        `Я буду присылать тебе информацию о позитивных изменениях в твоём организме.`
      );

      const message = await airtableService.getMessageForDay(daysCount);
      if (message) {
        await ctx.reply(`💫 Изменения за ${daysCount} дней:\n\n${message}`);
      }

    } catch (error) {
      console.error('Error saving user days:', error);
      await ctx.reply('❌ Произошла ошибка при сохранении данных. Попробуйте еще раз.');
    }
  } else {
    await ctx.reply(
      '🤔 Я понимаю только цифры (количество дней).\n\n' +
      'Пожалуйста, введи количество дней без алкоголя цифрами:'
    );
  }
});

// Обработка ошибок
bot.catch((error) => {
  console.error('Telegraf error:', error);
});

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
      usage: 'Send POST requests with Telegram updates'
    });
  }
};
