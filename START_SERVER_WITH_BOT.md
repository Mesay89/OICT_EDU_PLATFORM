# How to Start Server with Telegram Bot

## The Issue

When you click "Register" or "Login" buttons in Telegram:
- ✅ You see "Processing..." (callback is received)
- ❌ But no follow-up message appears

**Why?** The backend server must be **actively running** to process bot updates and send responses.

## Solution: Start the Backend Server

### Step 1: Open a Terminal

Open a terminal/command prompt in the backend folder:
```bash
cd c:\Users\hp\OneDrive\Desktop\Edu_platform\backend
```

### Step 2: Start the Server

```bash
npm start
```

Or if you want to see more detailed logs:
```bash
node server.js
```

### Step 3: Look for These Success Messages

You should see:
```
✅ MongoDB connected
✅ Telegram bot @onlinelearning_tb_bot configured
✅ Telegram bot @onlinelearning_tb_bot polling started
Server running in development mode on port 5000
```

### Step 4: Test the Bot

Now go to Telegram and:
1. Send `/start` to `@onlinelearning_tb_bot`
2. Click "A — Register" or "B — Login"
3. You should now see the next message asking for your name/email

### Step 5: Watch the Console

As you interact with the bot, you'll see debug logs in the console:
```
📨 Telegram update received: ...
🔘 Callback query from 123456: action_register
🔵 Starting registration for chat 123456
📤 Sending message to 123456: 👤 Registration Started!...
✅ Message sent successfully to 123456
```

## Important Notes

### ⚠️ Server Must Stay Running

- The server must be running continuously while you test the bot
- If you close the terminal, the bot stops responding
- Each time you restart, you'll see "Telegram bot polling started"

### ⚠️ If Server Stops Unexpectedly

Check for these errors:
- MongoDB connection issues
- Port 5000 already in use
- Network timeout reaching Telegram API

### ⚠️ Updates Are Delayed

If you clicked buttons while the server was OFF:
- Those updates are queued by Telegram
- They will be processed when server starts
- You might see old messages appear

## Quick Troubleshooting

### Issue: "Port 5000 already in use"

**Solution 1:** Kill the existing process
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Solution 2:** Change the port in `.env`
```
PORT=5001
```

### Issue: "Telegram API unreachable"

**Solution:** Check your internet connection or use VPN if Telegram is blocked

### Issue: Bot responds but with old data

**Solution:** Send `/start` again to reset your session

### Issue: No logs appearing

**Solution:** Make sure you're watching the RIGHT terminal where server is running

## Production Deployment

For a live server (Heroku, AWS, etc.), use webhook mode instead of polling:

1. Set environment variable:
```
TELEGRAM_WEBHOOK_URL=https://yourdomain.com
```

2. The bot will automatically switch to webhook mode

3. No need to keep polling connection open

## Testing Checklist

- [ ] Backend server is running (`npm start`)
- [ ] You see "Telegram bot polling started" in console
- [ ] You can access http://localhost:5000 in browser
- [ ] MongoDB is connected
- [ ] Internet connection is stable
- [ ] Bot responds to `/start`
- [ ] Clicking buttons shows next message
- [ ] Debug logs appear in console

## Example Full Test

### Terminal 1 (Backend):
```bash
cd backend
npm start
# Wait for "Telegram bot polling started"
```

### Telegram App:
1. Open bot `@onlinelearning_tb_bot`
2. Send: `/start`
3. Click: "A — Register"
4. You should see: "👤 Registration Started! Great! What is your full name?"
5. Type: `John Doe`
6. You should see: "📧 What is your email address?"
7. Continue the flow...

### Terminal 1 (Should show):
```
📨 Telegram update received: {"message":{"text":"/start",...}}
💬 Text message from 123456: /start
📤 Sending message to 123456: 🎓 Welcome to the Online Learning...
✅ Message sent successfully to 123456
📨 Telegram update received: {"callback_query":{"data":"action_register",...}}
🔘 Callback query from 123456: action_register
🔵 Starting registration for chat 123456
📤 Sending message to 123456: 👤 Registration Started!...
✅ Message sent successfully to 123456
```

---

**Remember:** The server MUST be running for the bot to work! 🚀
