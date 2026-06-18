import axios from 'axios';
import TelegramSession from '../models/telegramSessionModel.js';
import { authUser, registerUser, verifyOTP } from '../controllers/userController.js';
import { invokeController } from '../utils/invokeController.js';

const getToken = () => process.env.TELEGRAM_BOT_TOKEN;
const getBotUsername = () => process.env.TELEGRAM_BOT_USERNAME || 'onlinelearning_tb_bot';

const getTelegramApi = () => {
  const token = getToken();
  return token ? `https://api.telegram.org/bot${token}` : null;
};

const WELCOME_MESSAGE = `🎓 <b>Welcome to the Online Learning Platform!</b> ✨

We're so happy you're here! 🌟

📚 Learn from quality courses anytime, anywhere
🚀 Build skills that move your career forward
💡 Expert guidance and practical lessons
🌍 Join learners who believe in growth
💪 Your education journey starts today!

Choose an option below to get started:`;

const MAIN_MENU = {
  inline_keyboard: [
    [{ text: 'A — Register', callback_data: 'action_register' }],
    [{ text: 'B — Login', callback_data: 'action_login' }],
  ],
};

const isNetworkError = (err) =>
  /ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ECONNRESET|ENETUNREACH|EAI_AGAIN|timeout/i.test(
    err?.message || ''
  );

const getSession = async (chatId) => {
  let session = await TelegramSession.findOne({ chatId });
  if (!session) {
    session = await TelegramSession.create({ chatId, step: 'menu', form: {} });
  }
  return session;
};

const resetSession = async (chatId) => {
  await TelegramSession.findOneAndUpdate(
    { chatId },
    { step: 'menu', form: {} },
    { upsert: true }
  );
};

const setStep = async (chatId, step, formPatch = {}) => {
  const session = await getSession(chatId);
  const currentForm = session.form ? { ...session.form } : {};
  return TelegramSession.findOneAndUpdate(
    { chatId },
    { step, form: { ...currentForm, ...formPatch } },
    { upsert: true, new: true }
  );
};

const tgRequest = async (method, body = {}, options = {}) => {
  const api = getTelegramApi();
  if (!api) return null;
  const { data } = await axios.post(`${api}/${method}`, body, {
    timeout: options.timeout ?? 15000,
  });
  if (!data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
};

const sendMessage = (chatId, text, replyMarkup) =>
  tgRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });

const showMainMenu = async (chatId, greeting = WELCOME_MESSAGE) => {
  await resetSession(chatId);
  await sendMessage(chatId, greeting, MAIN_MENU);
};

const callAuth = async (handler, body) => {
  const { status, data } = await invokeController(handler, body);
  if (status >= 400) {
    return { ok: false, message: data?.message || 'Request failed' };
  }
  return { ok: true, data };
};

const registerUserFlow = (payload) => callAuth(registerUser, { ...payload, role: 'student' });
const verifyOtpFlow = (payload) => callAuth(verifyOTP, payload);
const loginUserFlow = (payload) => callAuth(authUser, payload);

const handleTextMessage = async (chatId, text) => {
  const session = await getSession(chatId);
  const input = text.trim();

  if (input === '/start' || input.startsWith('/start ')) {
    await showMainMenu(chatId);
    return;
  }

  switch (session.step) {
    case 'register_name':
      if (input.length < 2) {
        await sendMessage(chatId, '❌ Name must be at least 2 characters. Try again:');
        return;
      }
      await setStep(chatId, 'register_email', { name: input });
      await sendMessage(chatId, 'What is your email address?');
      break;

    case 'register_email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        await sendMessage(chatId, '❌ Please provide a valid email address. Try again:');
        return;
      }
      await setStep(chatId, 'register_password', { email: input });
      await sendMessage(chatId, 'Choose a password (minimum 6 characters):');
      break;
    }

    case 'register_password': {
      if (input.length < 6) {
        await sendMessage(chatId, '❌ Password must be at least 6 characters. Try again:');
        return;
      }
      const form = { ...session.form, password: input };
      await sendMessage(chatId, 'Creating your account...');
      const result = await registerUserFlow({
        name: form.name,
        email: form.email,
        password: input,
      });
      if (!result.ok) {
        await sendMessage(chatId, `❌ ${result.message}`);
        await showMainMenu(chatId, 'Please try again:');
        return;
      }
      await setStep(chatId, 'register_otp', { ...form, email: result.data.email || form.email });
      await sendMessage(chatId, '📧 OTP sent to your email.\nEnter the 6-digit code here:');
      break;
    }

    case 'register_otp': {
      const result = await verifyOtpFlow({ email: session.form.email, otp: input });
      if (!result.ok) {
        await sendMessage(chatId, `❌ ${result.message}\nTry again or type /start to restart.`);
        return;
      }
      await sendMessage(
        chatId,
        `✅ ${result.data.message || 'Registration successful!'}\n\n🎉 Welcome aboard!\n\nWebsite: ${process.env.CLIENT_URL || 'http://localhost:5173'}`
      );
      await showMainMenu(chatId, '✨ Registration complete! Need anything else?');
      break;
    }

    case 'login_email':
      await setStep(chatId, 'login_password', { email: input });
      await sendMessage(chatId, 'Enter your password:');
      break;

    case 'login_password': {
      const result = await loginUserFlow({ email: session.form.email, password: input });
      if (!result.ok) {
        await sendMessage(chatId, `❌ ${result.message}`);
        await showMainMenu(chatId, 'Please try again:');
        return;
      }
      await sendMessage(
        chatId,
        `✅ Login successful! Welcome back, <b>${result.data.name}</b>! 🎉\n\nWebsite: ${process.env.CLIENT_URL || 'http://localhost:5173'}`
      );
      await showMainMenu(chatId, '✨ Glad to see you again! Need anything else?');
      break;
    }

    default:
      await showMainMenu(chatId);
  }
};

const handleCallbackQuery = async (query) => {
  const chatId = query.message?.chat?.id;
  if (!chatId) return;

  try {
    await tgRequest('answerCallbackQuery', { callback_query_id: query.id });
  } catch {
    /* expired callback */
  }

  if (query.callback_data === 'action_register') {
    await setStep(chatId, 'register_name', {});
    await sendMessage(chatId, 'Great! What is your full name?');
    return;
  }

  if (query.callback_data === 'action_login') {
    await setStep(chatId, 'login_email', {});
    await sendMessage(chatId, 'Please enter your email address:');
  }
};

export const handleTelegramUpdate = async (update) => {
  try {
    if (update.message?.text != null) {
      await handleTextMessage(update.message.chat.id, update.message.text);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (err) {
    console.error('Telegram update error:', err.message);
  }
};

const configureBotProfile = async () => {
  if (!getTelegramApi()) return;
  try {
    await tgRequest('setMyName', { name: 'Online Learning Platform' });
    await tgRequest('setMyDescription', {
      description: 'Register, login, and access quality online courses.',
    });
    await tgRequest('setMyShortDescription', {
      short_description: 'Online Learning — register & login',
    });
    console.log(`✅ Telegram bot @${getBotUsername()} configured`);
  } catch (err) {
    if (!err.message?.includes('429')) {
      console.warn('Telegram bot profile setup:', err.message);
    }
  }
};

let polling = false;
let offset = 0;
let lastNetworkLog = 0;

const pollUpdates = async () => {
  if (!getTelegramApi() || polling) return;
  polling = true;

  while (polling) {
    try {
      const api = getTelegramApi();
      const { data } = await axios.get(`${api}/getUpdates`, {
        params: { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] },
        timeout: 30000,
      });

      for (const update of data.result || []) {
        offset = update.update_id + 1;
        await handleTelegramUpdate(update);
      }
    } catch (err) {
      if (!polling) break;

      const waitMs = isNetworkError(err) ? 60000 : 5000;

      if (isNetworkError(err)) {
        const now = Date.now();
        if (now - lastNetworkLog > 120000) {
          lastNetworkLog = now;
          console.warn(
            '⚠️  Telegram API unreachable (ETIMEDOUT). Bot polling paused — check internet/VPN or set TELEGRAM_POLLING=false. Server keeps running.'
          );
        }
      } else if (err.message?.includes('409')) {
        await new Promise((r) => setTimeout(r, 15000));
        continue;
      } else {
        console.error('Telegram polling error:', err.message);
      }

      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
};

export const initTelegramBot = async (app) => {
  if (!getToken()) {
    console.log('ℹ️  TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
    return;
  }

  if (process.env.TELEGRAM_POLLING === 'false') {
    console.log('ℹ️  Telegram polling disabled (TELEGRAM_POLLING=false)');
    return;
  }

  try {
    await configureBotProfile();
  } catch (err) {
    console.warn('Telegram setup skipped:', err.message);
  }

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await tgRequest('setWebhook', { url: `${webhookUrl}/api/telegram/webhook` });
      app.post('/api/telegram/webhook', async (req, res) => {
        await handleTelegramUpdate(req.body);
        res.sendStatus(200);
      });
      console.log(`✅ Telegram webhook: ${webhookUrl}/api/telegram/webhook`);
    } catch (err) {
      console.warn('Telegram webhook setup failed:', err.message);
    }
    return;
  }

  try {
    await tgRequest('deleteWebhook', { drop_pending_updates: false });
    pollUpdates();
    console.log(`✅ Telegram bot @${getBotUsername()} polling started (Register/Login → same backend as web)`);
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn(
        '⚠️  Cannot reach Telegram API from this network. Bot disabled until VPN/webhook is available. Web app unaffected.'
      );
    } else {
      console.warn('Telegram polling not started:', err.message);
    }
  }
};

export const stopTelegramPolling = () => {
  polling = false;
};
