const airtableService = require('../lib/airtable');
const TelegramBot = require('../lib/bot');

module.exports = async (req, res) => {
  // Разрешаем запросы от Google Apps Script
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const bot = new TelegramBot();
      const users = await airtableService.getAllUsers();
      
      let sentCount = 0;
      
      for (const user of users) {
        try {
          // Получаем сообщение для текущего дня
          const message = await airtableService.getMessageForDay(user.DaysCount);
          
          if (message) {
            // Отправляем сообщение пользователю
            const success = await bot.sendMessage(
              user.TelegramID, 
              `💫 День ${user.DaysCount} без алкоголя!\n\n${message}\n\nПродолжайте в том же духе! 💪`
            );
            
            if (success) {
              sentCount++;
              // Увеличиваем счетчик дней
              await airtableService.updateUserDays(user.id, user.DaysCount + 1);
            }
          } else {
            // Если нет сообщения для этого дня, просто увеличиваем счетчик
            await airtableService.updateUserDays(user.id, user.DaysCount + 1);
          }
        } catch (error) {
          console.error(`Ошибка у пользователя ${user.TelegramID}:`, error);
        }
      }
      
      res.status(200).json({ 
        status: 'success', 
        sentCount: sentCount,
        totalUsers: users.length
      });
      
    } catch (error) {
      console.error('Ошибка в cron задаче:', error);
      res.status(500).json({ 
        status: 'error', 
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
