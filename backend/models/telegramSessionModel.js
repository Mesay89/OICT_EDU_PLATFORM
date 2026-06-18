import mongoose from 'mongoose';

const telegramSessionSchema = mongoose.Schema(
  {
    chatId: { type: Number, required: true, unique: true },
    step: { type: String, default: 'menu' },
    form: {
      name: String,
      email: String,
      password: String,
    },
  },
  { timestamps: true }
);

const TelegramSession = mongoose.model('TelegramSession', telegramSessionSchema);

export default TelegramSession;
