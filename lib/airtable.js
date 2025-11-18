const Airtable = require('airtable');

// Инициализация Airtable с детальным логированием
console.log('Initializing Airtable with base:', process.env.AIRTABLE_BASE_ID);
const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN
}).base(process.env.AIRTABLE_BASE_ID);

class AirtableService {
  // Получить пользователя по Telegram ID
  async getUserByTelegramId(telegramId) {
    try {
      console.log(`Searching user with TelegramID: ${telegramId}`);
      
      const records = await base('Users').select({
        filterByFormula: `{TelegramID} = ${telegramId}`,
        maxRecords: 1
      }).firstPage();

      console.log(`Found ${records.length} users`);
      
      return records.length > 0 ? {
        id: records[0].id,
        ...records[0].fields
      } : null;
    } catch (error) {
      console.error('Error getting user:', error);
      if (error.error && error.error === 'NOT_FOUND') {
        console.error('Table "Users" not found. Please check table name.');
      }
      return null;
    }
  }

  // Создать или обновить пользователя
  async createOrUpdateUser(telegramId, startDate, daysCount, timezone = 'UTC') {
    try {
      console.log(`Creating/updating user:`, {
        telegramId,
        startDate,
        daysCount,
        timezone
      });

      const existingUser = await this.getUserByTelegramId(telegramId);
      
      const userData = {
        TelegramID: Number(telegramId),
        StartDate: startDate,
        DaysCount: Number(daysCount),
        Timezone: timezone
      };

      console.log('User data to save:', userData);

      if (existingUser) {
        // Обновляем существующего пользователя
        console.log(`Updating existing user with ID: ${existingUser.id}`);
        const record = await base('Users').update(existingUser.id, userData);
        console.log('Successfully updated user:', record.id);
        return record;
      } else {
        // Создаем нового пользователя
        console.log('Creating new user');
        const records = await base('Users').create([
          { fields: userData }
        ]);
        console.log('Successfully created user with ID:', records[0].getId());
        return records[0];
      }
    } catch (error) {
      console.error('Detailed error creating/updating user:');
      console.error('Error message:', error.message);
      console.error('Error type:', error.error);
      console.error('Error status code:', error.statusCode);
      
      if (error.error === 'NOT_FOUND') {
        console.error('Table "Users" not found. Please check:');
        console.error('1. Table name is "Users" (case sensitive)');
        console.error('2. Base ID is correct');
        console.error('3. API token has access to this base');
      }
      
      if (error.error === 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND') {
        console.error('Permission error. Please check:');
        console.error('1. API token has write permissions');
        console.error('2. Table structure matches expected fields');
      }
      
      throw error;
    }
  }

  // Получить сообщение для определенного дня
  async getMessageForDay(day) {
    try {
      console.log(`Getting message for day: ${day}`);
      
      const records = await base('Messages').select({
        filterByFormula: `{Day} = ${day}`,
        maxRecords: 1
      }).firstPage();

      console.log(`Found ${records.length} messages for day ${day}`);
      
      return records.length > 0 ? records[0].get('Message') : null;
    } catch (error) {
      console.error('Error getting message:', error);
      if (error.error && error.error === 'NOT_FOUND') {
        console.error('Table "Messages" not found. Please check table name.');
      }
      return null;
    }
  }

  // Получить всех пользователей
  async getAllUsers() {
    try {
      const records = await base('Users').select().all();
      const users = records.map(record => ({
        id: record.id,
        ...record.fields
      }));
      console.log(`Retrieved ${users.length} users from database`);
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Обновить счетчик дней пользователя
  async updateUserDays(recordId, daysCount) {
    try {
      const record = await base('Users').update(recordId, {
        DaysCount: Number(daysCount)
      });
      console.log(`Updated user ${recordId} days to ${daysCount}`);
      return record;
    } catch (error) {
      console.error('Error updating user days:', error);
      throw error;
    }
  }

  // Тестовый метод для проверки подключения
  async testConnection() {
    try {
      console.log('Testing Airtable connection...');
      const records = await base('Users').select({maxRecords: 1}).firstPage();
      console.log('✅ Airtable connection successful');
      return true;
    } catch (error) {
      console.error('❌ Airtable connection failed:', error);
      return false;
    }
  }
}

module.exports = new AirtableService();
