const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN
}).base(process.env.AIRTABLE_BASE_ID);

class AirtableService {
  // Получить пользователя по Telegram ID
  async getUserByTelegramId(telegramId) {
    try {
      const records = await base('Users').select({
        filterByFormula: `{TelegramID} = ${telegramId}`
      }).firstPage();

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Создать или обновить пользователя
  async createOrUpdateUser(telegramId, startDate, daysCount, timezone = 'UTC') {
    try {
      const existingUser = await this.getUserByTelegramId(telegramId);
      
      const userData = {
        TelegramID: telegramId,
        StartDate: startDate,
        DaysCount: daysCount,
        Timezone: timezone
      };

      if (existingUser) {
        // Обновляем существующего пользователя
        const record = await base('Users').update(existingUser.id, userData);
        return record;
      } else {
        // Создаем нового пользователя
        const record = await base('Users').create([{ fields: userData }]);
        return record[0];
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Получить сообщение для определенного дня
  async getMessageForDay(day) {
    try {
      const records = await base('Messages').select({
        filterByFormula: `{Day} = ${day}`
      }).firstPage();

      return records.length > 0 ? records[0].fields.Message : null;
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  // Получить всех пользователей
  async getAllUsers() {
    try {
      const records = await base('Users').select().all();
      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Обновить счетчик дней пользователя
  async updateUserDays(recordId, daysCount) {
    try {
      const record = await base('Users').update(recordId, {
        DaysCount: daysCount
      });
      return record;
    } catch (error) {
      console.error('Error updating user days:', error);
      throw error;
    }
  }
}

module.exports = new AirtableService();
