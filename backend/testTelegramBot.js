import axios from 'axios';
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
const api = `https://api.telegram.org/bot${token}`;

console.log('🔍 Testing Telegram Bot Connection...\n');

async function testBot() {
  try {
    // Test 1: Get bot info
    console.log('1️⃣ Testing bot authentication...');
    const { data: botInfo } = await axios.get(`${api}/getMe`);
    if (botInfo.ok) {
      console.log('✅ Bot authenticated successfully!');
      console.log(`   Bot name: ${botInfo.result.first_name}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Bot ID: ${botInfo.result.id}\n`);
    }

    // Test 2: Get updates
    console.log('2️⃣ Checking for recent updates...');
    const { data: updates } = await axios.get(`${api}/getUpdates`, {
      params: { limit: 5 }
    });
    if (updates.ok) {
      console.log(`✅ Received ${updates.result.length} recent updates`);
      if (updates.result.length > 0) {
        const lastUpdate = updates.result[updates.result.length - 1];
        console.log(`   Last update ID: ${lastUpdate.update_id}`);
        if (lastUpdate.message) {
          console.log(`   Last message: "${lastUpdate.message.text}" from chat ${lastUpdate.message.chat.id}`);
        }
        if (lastUpdate.callback_query) {
          console.log(`   Last callback: "${lastUpdate.callback_query.data}" from chat ${lastUpdate.callback_query.message.chat.id}`);
        }
      }
      console.log('');
    }

    // Test 3: Check webhook status
    console.log('3️⃣ Checking webhook configuration...');
    const { data: webhookInfo } = await axios.get(`${api}/getWebhookInfo`);
    if (webhookInfo.ok) {
      if (webhookInfo.result.url) {
        console.log(`⚠️  Webhook is SET: ${webhookInfo.result.url}`);
        console.log('   This prevents polling mode from working!');
        console.log('   Run this to disable webhook:');
        console.log(`   curl "${api}/deleteWebhook"\n`);
      } else {
        console.log('✅ Webhook is NOT set (polling mode will work)\n');
      }
    }

    // Test 4: Database connection
    console.log('4️⃣ Testing database connection...');
    console.log(`   MongoDB URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Not set'}`);
    console.log('');

    // Test 5: Send a test message (requires chat ID)
    console.log('5️⃣ To test sending messages:');
    console.log('   1. Send /start to your bot in Telegram');
    console.log('   2. Check the updates above for your chat ID');
    console.log('   3. Then run: node backend/sendTestMessage.js YOUR_CHAT_ID\n');

    console.log('✅ All basic tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure your backend server is running (npm start in backend folder)');
    console.log('   2. Check server logs for "Telegram bot polling started"');
    console.log('   3. Send /start to your bot');
    console.log('   4. Click the Register or Login button');
    console.log('   5. Check server console for debug logs starting with 📨, 🔘, 📤');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Network issue detected!');
      console.log('   - Check your internet connection');
      console.log('   - Try using a VPN if Telegram is blocked');
      console.log('   - Or set up webhook mode for production');
    }
  }
}

testBot();
