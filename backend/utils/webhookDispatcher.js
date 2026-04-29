import axios from 'axios';
import crypto from 'crypto';
import Webhook from '../models/webhookModel.js';

const fireWebhook = async (event, data, userId) => {
  try {
    const webhooks = await Webhook.find({ user: userId, events: event, isActive: true });
    
    for (const hook of webhooks) {
      const payload = JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString()
      });

      const signature = crypto
        .createHmac('sha256', hook.secret)
        .update(payload)
        .digest('hex');

      axios.post(hook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature
        },
        timeout: 5000
      }).catch(err => {
        console.error(`Webhook failed for ${hook.url}:`, err.message);
      });
    }
  } catch (error) {
    console.error('Error firing webhooks:', error);
  }
};

export default fireWebhook;
