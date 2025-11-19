const AirtableService = require('../lib/airtable');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== STARTING AIRTABLE DIAGNOSTICS ===');
    
    // Тест подключения
    const connectionTest = await AirtableService.testConnection();
    
    // Тест получения сообщения
    let testMessage;
    try {
      testMessage = await AirtableService.getMessageForDay(1);
    } catch (messageError) {
      console.log('Message test error:', messageError.message);
      testMessage = null;
    }
    
    // Тест создания пользователя
    let testUser;
    try {
      testUser = await AirtableService.createOrUpdateUser(
        123456789, 
        new Date().toISOString().split('T')[0], 
        1, 
        'UTC'
      );
    } catch (userError) {
      console.log('User creation test error:', userError.message);
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
        airtableBaseId: process.env.AIRTABLE_BASE_ID ? process.env.AIRTABLE_BASE_ID : 'Not set',
        tokenPreview: process.env.AIRTABLE_TOKEN ? 
          process.env.AIRTABLE_TOKEN.substring(0, 10) + '...' : 'Not set'
      }
    };

    console.log('=== DIAGNOSTICS RESULT ===', JSON.stringify(result, null, 2));
    
    res.status(200).json(result);
  } catch (error) {
    console.error('=== DIAGNOSTICS ERROR ===', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? 'Hidden' : error.stack,
      environment: {
        hasAirtableToken: !!process.env.AIRTABLE_TOKEN,
        hasAirtableBaseId: !!process.env.AIRTABLE_BASE_ID,
        airtableBaseId: process.env.AIRTABLE_BASE_ID || 'Not set'
      }
    });
  }
};
