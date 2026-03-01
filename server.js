import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
import path from 'path';
import { fileURLToPath } from 'url';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs/promises';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- Persistence Setup ---
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
const initDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    const defaultData = {
      services: [
        { id: "taglio", name: "Taglio Capelli", description: "Taglio classico o moderno con lavaggio e styling", duration: 30, price: 18, icon: "✂️" },
        { id: "barba", name: "Barba", description: "Rasatura e modellamento barba con asciugamano caldo", duration: 20, price: 12, icon: "🪒" },
        { id: "taglio-barba", name: "Taglio + Barba", description: "Pacchetto completo taglio capelli e cura della barba", duration: 45, price: 25, icon: "💈" },
        { id: "trattamento", name: "Trattamento Capelli", description: "Trattamento rigenerante con prodotti professionali", duration: 40, price: 20, icon: "🧴" },
        { id: "colorazione", name: "Colorazione", description: "Colorazione professionale o copertura capelli bianchi", duration: 60, price: 30, icon: "🎨" },
        { id: "bambino", name: "Taglio Bambino", description: "Taglio dedicato per bambini fino a 12 anni", duration: 20, price: 12, icon: "👦" }
      ],
      operators: [
        { id: "op-1", name: "Marco", avatar: "👨🏻" },
        { id: "op-2", name: "Luigi", avatar: "🧔🏽‍♂️" }
      ],
      bookings: []
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
};
initDataFile();

const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await initDataFile();
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    throw err;
  }
};

const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

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

// --- API Persistence Routes ---

// Services
app.get('/api/services', async (req, res) => {
  const data = await readData();
  res.json(data.services);
});

app.post('/api/services', async (req, res) => {
  const data = await readData();
  const newService = { ...req.body, id: `service-${Date.now()}` };
  data.services.push(newService);
  await writeData(data);
  res.status(201).json(newService);
});

app.delete('/api/services/:id', async (req, res) => {
  const data = await readData();
  data.services = data.services.filter(s => s.id !== req.params.id);
  await writeData(data);
  res.json({ success: true });
});

app.put('/api/services/:id', async (req, res) => {
  const data = await readData();
  const index = data.services.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    data.services[index] = { ...data.services[index], ...req.body };
    await writeData(data);
    res.json(data.services[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Operators
app.get('/api/operators', async (req, res) => {
  const data = await readData();
  res.json(data.operators);
});

app.post('/api/operators', async (req, res) => {
  const data = await readData();
  const newOperator = { ...req.body, id: `op-${Date.now()}` };
  data.operators.push(newOperator);
  await writeData(data);
  res.status(201).json(newOperator);
});

app.delete('/api/operators/:id', async (req, res) => {
  const data = await readData();
  data.operators = data.operators.filter(o => o.id !== req.params.id);
  await writeData(data);
  res.json({ success: true });
});

// Bookings
app.get('/api/bookings', async (req, res) => {
  const data = await readData();
  res.json(data.bookings);
});

app.post('/api/bookings', async (req, res) => {
  const data = await readData();
  const newBooking = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
  data.bookings.push(newBooking);
  await writeData(data);
  res.status(201).json(newBooking);
});

app.delete('/api/bookings/:id', async (req, res) => {
  const data = await readData();
  data.bookings = data.bookings.filter(b => b.id !== req.params.id);
  await writeData(data);
  res.json({ success: true });
});

// Migration endpoint
app.post('/api/migrate', async (req, res) => {
  try {
    const incomingData = req.body;
    let currentData = await readData();

    // Merge bookings (avoid duplicates by ID)
    if (incomingData.bookings && incomingData.bookings.length > 0) {
      const existingIds = new Set(currentData.bookings.map(b => b.id));
      const newBookings = incomingData.bookings.filter(b => !existingIds.has(b.id));
      currentData.bookings = [...currentData.bookings, ...newBookings];
    }

    // Replace services if incoming has data
    if (incomingData.services && incomingData.services.length > 0) {
      currentData.services = incomingData.services;
    }

    // Replace operators if incoming has data
    if (incomingData.operators && incomingData.operators.length > 0) {
      currentData.operators = incomingData.operators;
    }

    await writeData(currentData);
    res.json({ success: true, message: 'Migration completed' });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});


// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

// Anything that doesn't match the above, send back index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Backend Server running on port ${PORT}`);
});
