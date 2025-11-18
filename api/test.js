const airtableService = require('../lib/airtable');

module.exports = async (req, res) => {
  // Добавляем CORS headers для браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Starting Airtable connection test...');
    
    // Тест подключения к Airtable
    const connectionTest = await airtableService.testConnection();
    
    // Тест получения сообщения
    const testMessage = await airtableService.getMessageForDay(1);
    
    // Тест создания пользователя
    let testUser;
    try {
      testUser = await airtableService.createOrUpdateUser(
        123456789, 
        new Date().toISOString().split('T')[0], 
        1, 
        'UTC'
      );
    } catch (userError) {
      console.log('User creation test failed:', userError.message);
      testUser = null;
    }

    const result = {
      connection: connectionTest ? '✅ Success' : '❌ Failed',
      messageTest: testMessage ? '✅ Success' : '❌ Failed',
      userTest: testUser ? '✅ Success' : '❌ Failed',
      details: {
        message: testMessage || 'Not found',
        user: testUser ? `User ID: ${testUser.id}` : 'Not created'
      },
      environment: {
        hasAirtableToken: !!process.env.AIRTABLE_TOKEN,
        hasAirtableBaseId: !!process.env.AIRTABLE_BASE_ID,
        airtableBaseId: process.env.AIRTABLE_BASE_ID ? 'Set' : 'Not set'
      }
    };

    console.log('Test result:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      environment: {
        hasAirtableToken: !!process.env.AIRTABLE_TOKEN,
        hasAirtableBaseId: !!process.env.AIRTABLE_BASE_ID
      }
    });
  }
};
