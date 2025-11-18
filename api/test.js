const airtableService = require('../lib/airtable');

module.exports = async (req, res) => {
  try {
    // Тест подключения к Airtable
    const connectionTest = await airtableService.testConnection();
    
    // Тест получения сообщения
    const testMessage = await airtableService.getMessageForDay(1);
    
    // Тест создания пользователя
    const testUser = await airtableService.createOrUpdateUser(
      123456789, 
      new Date().toISOString().split('T')[0], 
      1, 
      'UTC'
    );

    res.status(200).json({
      connection: connectionTest ? '✅ Success' : '❌ Failed',
      messageTest: testMessage ? '✅ Success' : '❌ Failed',
      userTest: testUser ? '✅ Success' : '❌ Failed',
      details: {
        message: testMessage ? 'Found' : 'Not found',
        user: testUser ? `User ID: ${testUser.id}` : 'Not created'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error
    });
  }
};
