const { Telegraf, Markup } = require('telegraf');
const airtableService = require('./airtable');

class TelegramBot {
  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.setupHandlers();
  }

  setupHandlers() {
    // Команда старт
    this.bot.start((ctx) => this.handleStart(ctx));

    // Обработка текстовых сообщений
    this.bot.on('text', (ctx) => this.handleText(ctx));

    // Обработка callback запросов (кнопки)
    this.bot.on('callback_query', (ctx) => this.handleCallback(ctx));
  }

  async handleStart(ctx) {
    const welcomeText = `👋 Привет! Я твой помощник на пути к трезвой жизни.

Я буду отправлять тебе информацию о позитивных изменениях, которые происходят в твоём организме после отказа от алкоголя.

🎯 Для начала расскажи, когда ты отказался от алкоголя:`;

    await ctx.reply(welcomeText, Markup.inlineKeyboard([
      [Markup.button.callback('🗓️ Сегодня первый день', 'start_today')],
      [Markup.button.callback('📅 Указать количество дней', 'input_days')]
    ]));
  }

  async handleCallback(ctx) {
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
  }

  async handleText(ctx) {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    // Проверяем, является ли сообщение числом (количество дней)
    if (/^\d+$/.test(text)) {
      const daysCount = parseInt(text);
      
      if (daysCount <= 0) {
        await ctx.reply('❌ Количество дней должно быть положительным числом. Попробуй еще раз:');
        return;
      }

      if (daysCount > 3650) { // 10 лет
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
          `Это огромное достижение! Продолжай в том же духе!\n\n` +
          `Я буду присылать тебе информацию о позитивных изменениях в твоём организме.`
        );

        // Отправляем сообщение для текущего дня
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
  }

  // Отправка сообщения пользователю
  async sendMessage(userId, message) {
    try {
      await this.bot.telegram.sendMessage(userId, message);
      return true;
    } catch (error) {
      console.error(`Error sending message to user ${userId}:`, error);
      return false;
    }
  }

  launch() {
    return this.bot.launch();
  }
}

module.exports = TelegramBot;
