import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
import path from 'path';
import { fileURLToPath } from 'url';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs/promises';
import fssync from 'fs';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// --- Middleware to redirect HTTP to HTTPS in development ---
app.use((req, res, next) => {
  if (!req.secure && req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV !== 'production') {
    // Determine the host (handling custom localhost port)
    let host = req.hostname;
    if (Number(HTTPS_PORT) !== 443) {
      host = `${host}:${HTTPS_PORT}`;
    }
    return res.redirect(`https://${host}${req.url}`);
  }
  next();
});

// --- Persistence Setup ---
const DATA_DIR = process.env.VERCEL ? '/tmp' : (process.env.DATA_DIR || __dirname);
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Initialize data file if it doesn't exist
const initDataFile = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch (error) {
    const defaultData = {
      services: [
        { id: "taglio-uomo", name: "Taglio Uomo", description: "Taglio capelli uomo", duration: 30, price: 19, icon: "✂️" },
        { id: "shampoo", name: "Shampoo", description: "Lavaggio capelli", duration: 30, price: 2, icon: "🧴" },
        { id: "barba", name: "Barba", description: "Taglio Barba", duration: 30, price: 5, icon: "🪒" },
        { id: "barba-modellata", name: "Barba Modellata", description: "Taglio barba modellata", duration: 30, price: 8, icon: "💇‍♂️" },
        { id: "sopracciglia", name: "Sopracciglia", description: "Taglio sopracciglia", duration: 30, price: 3, icon: "✂️" },
        { id: "pulizia-viso", name: "Pulizia Viso", description: "Pulizia del viso", duration: 30, price: 17, icon: "🧴" },
        { id: "disegni", name: "Disegni", description: "Disegni", duration: 30, price: 5, icon: "🎨" },
        { id: "depilazione-naso-orecchie", name: "Depilazione naso e orecchie", description: "Depilazione del naso e delle orecchie", duration: 30, price: 3, icon: "🪒" },
        { id: "meches", name: "Meches", description: "Meches capelli", duration: 30, price: 25, icon: "🎨" },
        { id: "colore", name: "Colore", description: "Colore", duration: 30, price: 0, icon: "🎨" },
        { id: "vip-all-inclusive", name: "Servizio speciale vip All inclusive", description: "Servizio All inclusive", duration: 30, price: 4, icon: "🌟" },
        { id: "taglio-10-bambini", name: "Taglio 10 bambini under", description: "Taglio bambini", duration: 30, price: 10, icon: "✂️" },
        { id: "solo-shampoo", name: "Solo shampoo", description: "Solo lavaggio capelli", duration: 30, price: 5, icon: "🧴" }
      ],
      operators: [
        { id: "op-yousef", name: "Yousef", avatar: "🧔🏽‍♂️" },
        { id: "op-amza", name: "Amza", avatar: "👨🏽‍🦱" },
        { id: "op-ando", name: "Ando", avatar: "👨🏻" },
        { id: "op-simo", name: "Simo", avatar: "🧔🏻‍♂️" }
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
    const authOptions = process.env.VERCEL ? { dataPath: '/tmp/.wwebjs_auth' } : {};
    client = new Client({
      authStrategy: new LocalAuth(authOptions),
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
  let bookings = data.bookings;
  if (req.query.date) {
    bookings = bookings.filter(b => b.date === req.query.date);
  }
  res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
  const data = await readData();
  const { date, time, operatorId } = req.body;

  // Check for overlapping appointments
  if (date && time) {
    const bookingsForSlot = data.bookings.filter(b => b.date === date && b.time === time);
    const maxCapacity = data.operators.length;

    // Check global capacity first
    if (bookingsForSlot.length >= maxCapacity) {
      return res.status(400).json({ success: false, error: 'Tutti gli operatori sono occupati in questo orario.' });
    }

    // If a specific operator is selected, check if they are already explicitly booked
    if (operatorId && operatorId !== 'any') {
      const isBooked = bookingsForSlot.some(b => b.operatorId === operatorId);
      if (isBooked) {
        return res.status(400).json({ success: false, error: 'Questo operatore è già prenotato in questo orario.' });
      }
    }
  }

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


const isProd = process.env.NODE_ENV === 'production';

const domain = process.env.DOMAIN || 'barbershopmarrakesh.com';
const certPath = process.env.NODE_ENV === 'production'
  ? `/app/data/ssl/fullchain.cer`
  : path.join(__dirname, 'ssl', 'cert.pem');
const keyPath = process.env.NODE_ENV === 'production'
  ? `/app/data/ssl/${domain}.key`
  : path.join(__dirname, 'ssl', 'key.pem');

let vite;
if (!isProd) {
  // Dynamically import vite so it doesn't break production builds
  // where devDependencies are not installed
  const viteModule = 'vite';
  const { createServer: createViteServer } = await import(viteModule);

  // Load dev certificates for Vite HMR WebSocket server
  const devCertOptions = {
    key: fssync.existsSync(keyPath) ? fssync.readFileSync(keyPath) : null,
    cert: fssync.existsSync(certPath) ? fssync.readFileSync(certPath) : null
  };

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  vite = await createViteServer({
    server: {
      middlewareMode: true,
      https: devCertOptions.key && devCertOptions.cert ? devCertOptions : false
    },
    appType: 'custom'
  });
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);
} else {
  // Serve static files from the React frontend app
  // allow dotfiles for Let's Encrypt /.well-known/acme-challenge/
  app.use(express.static(path.join(__dirname, 'dist'), { dotfiles: 'allow' }));
}

// Anything that doesn't match the above, send back index.html
app.use(async (req, res, next) => {
  const url = req.originalUrl;

  // Exclude API requests from HTML fallback
  if (url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  try {
    if (!isProd) {
      // always read fresh template in dev
      let template = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } else {
      return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  } catch (e) {
    if (!isProd) vite.ssrFixStacktrace(e);
    console.log(e.stack);
    if (!isProd) {
      return res.status(500).end(e.stack);
    } else {
      return res.status(500).send('Internal Server Error');
    }
  }
});

let httpsServer = null;

const startHttps = () => {
  if (httpsServer) return true; // Already running
  try {
    if (fssync.existsSync(certPath) && fssync.existsSync(keyPath)) {
      const options = {
        key: fssync.readFileSync(keyPath),
        cert: fssync.readFileSync(certPath)
      };
      const HTTPS_PORT = process.env.HTTPS_PORT || 443;
      httpsServer = https.createServer(options, app);
      httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
      });
      return true;
    }
  } catch (err) {
    console.error("Failed to start HTTPS server:", err);
  }
  return false;
};

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Backend Server (HTTP) running on port ${PORT}`);

    const httpsStarted = startHttps();

    // Create SSL services for the domain after the server has started in production
    if (process.env.NODE_ENV === 'production') {
      console.log(`Executing ./get-ssl-acme.sh ${domain} ...`);
      exec(`./get-ssl-acme.sh ${domain}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing get-ssl-acme.sh: ${error}`);
          return;
        }
        console.log(`get-ssl-acme.sh stdout: ${stdout}`);
        if (stderr) {
          console.error(`get-ssl-acme.sh stderr: ${stderr}`);
        }

        if (!httpsStarted) {
          const startedNow = startHttps();
          if (startedNow) {
            console.log("HTTPS Server successfully started after ACME script execution.");
          }
        }
      });
    } else if (!httpsStarted) {
      console.log("HTTPS Server could not be started. Missing development certificates in /ssl/ directory.");
      console.log("Run 'npm run ssl:dev' to generate self-signed certificates.");
    }
  });
}

export default app;
