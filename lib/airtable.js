const Airtable = require('airtable');

class AirtableService {
  constructor() {
    console.log('Airtable Service Initialization:');
    console.log('- AIRTABLE_TOKEN exists:', !!process.env.AIRTABLE_TOKEN);
    console.log('- AIRTABLE_BASE_ID exists:', !!process.env.AIRTABLE_BASE_ID);
    
    if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      throw new Error('Airtable environment variables are missing');
    }

    try {
      this.base = new Airtable({
        apiKey: process.env.AIRTABLE_TOKEN
      }).base(process.env.AIRTABLE_BASE_ID);
      console.log('✅ Airtable base initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Airtable base:', error);
      throw error;
    }
  }

  // ... остальные существующие методы ...

  // Удалить пользователя
  async deleteUser(recordId) {
    try {
      await this.base('Users').destroy(recordId);
      console.log(`User ${recordId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ... остальные методы ...
}

const airtableService = new AirtableService();
module.exports = airtableService;
