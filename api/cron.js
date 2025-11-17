const airtableService = require('../lib/airtable');
const TelegramBot = require('../lib/bot');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const bot = new TelegramBot();
      const users = await airtableService.getAllUsers();
      
      let sentCount = 0;
      
      for (const user of users) {
        try {
          // Получаем сообщение для текущего дня пользователя
          const message = await airtableService.getMessageForDay(user.DaysCount);
          
          if (message) {
            const success = await bot.sendMessage(
              user.TelegramID, 
              `💫 Изменения за ${user.DaysCount} дней:\n\n${message}`
            );
            
            if (success) {
              sentCount++;
              
              // Увеличиваем счетчик дней для следующего сообщения
              await airtableService.updateUserDays(user.id, user.DaysCount + 1);
            }
          }
        } catch (error) {
          console.error(`Error processing user ${user.TelegramID}:`, error);
        }
      }
      
      res.status(200).json({ 
        status: 'ok', 
        message: `Sent ${sentCount} messages to users` 
      });
      
    } catch (error) {
      console.error('Error in cron job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
