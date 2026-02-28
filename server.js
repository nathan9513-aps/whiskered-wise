import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

let client = null;
let currentQr = null;
let isConnected = false;

app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: isConnected,
    qrCode: currentQr
  });
});

app.post('/api/whatsapp/connect', async (req, res) => {
  if (isConnected) {
    return res.json({ success: true, message: 'Already connected' });
  }

  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      }
    });

    client.on('qr', async (qr) => {
      console.log('QR RECEIVED');
      try {
        currentQr = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('Failed to generate QR code Data URL', err);
      }
    });

    client.on('ready', () => {
      console.log('Client is ready!');
      isConnected = true;
      currentQr = null;
    });

    client.on('disconnected', (reason) => {
      console.log('Client was logged out', reason);
      isConnected = false;
      currentQr = null;
      client = null;
    });

    client.on('authenticated', () => {
      console.log('AUTHENTICATED');
    });

    client.on('auth_failure', msg => {
      console.error('AUTHENTICATION FAILURE', msg);
    });

    await client.initialize();
  } else {
    // If client exists but not connected (maybe waiting for QR scan)
    if (!currentQr && !isConnected) {
        // Just let it keep initializing/waiting for QR
    }
  }

  // Wait a bit to give it time to generate the first QR if it needs one
  // Or if it's already initializing, we just return the current status
  setTimeout(() => {
    res.json({
      success: true,
      qrCode: currentQr
    });
  }, 1500);
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  if (client) {
    try {
      await client.logout();
    } catch (err) {
      console.error('Logout error', err);
      try {
          await client.destroy();
      } catch (e) {
          console.error('Destroy error', e);
      }
    }
    client = null;
    isConnected = false;
    currentQr = null;
  }
  res.json({ success: true });
});

app.post('/api/whatsapp/send', async (req, res) => {
  if (!client || !isConnected) {
    return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
  }

  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ success: false, error: 'Missing number or message' });
  }

  try {
    // The number needs to include country code and end with @c.us
    // Basic sanitization
    let sanitizedNumber = number.toString().replace(/[^0-9]/g, '');

    // Add @c.us if not present
    if (!sanitizedNumber.endsWith('@c.us')) {
        sanitizedNumber += '@c.us';
    }

    await client.sendMessage(sanitizedNumber, message);
    console.log(`[WhatsApp] Sent message to ${sanitizedNumber}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send message' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Backend Server running on port ${PORT}`);
});
