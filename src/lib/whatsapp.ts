const WHATSAPP_CONFIG_KEY = "whiskered_whatsapp_config";
const WHATSAPP_STATUS_KEY = "whiskered_whatsapp_status";

export interface WhatsAppConfig {
  enabled: boolean;
  notificationNumber: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  qrCode: string | null;
}

export const getWhatsAppConfig = (): WhatsAppConfig => {
  const stored = localStorage.getItem(WHATSAPP_CONFIG_KEY);
  return stored ? JSON.parse(stored) : { enabled: false, notificationNumber: "+393292168002" };
};

export const saveWhatsAppConfig = (config: WhatsAppConfig): void => {
  localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(config));
};

export const getWhatsAppStatus = (): WhatsAppStatus => {
  const stored = localStorage.getItem(WHATSAPP_STATUS_KEY);
  return stored ? JSON.parse(stored) : { connected: false, qrCode: null };
};

export const setWhatsAppStatus = (status: WhatsAppStatus): void => {
  localStorage.setItem(WHATSAPP_STATUS_KEY, JSON.stringify(status));
};

// Simula la connessione WhatsApp Web JS
export const connectWhatsApp = async (): Promise<{ success: boolean; qrCode?: string; error?: string }> => {
  // In produzione, qui si integrerebbe whatsapp-web.js
  // Per ora simuliamo
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockQrCode = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp-web-mock-" + Date.now();
      setWhatsAppStatus({ connected: false, qrCode: mockQrCode });
      resolve({ success: true, qrCode: mockQrCode });
    }, 1500);
  });
};

export const disconnectWhatsApp = (): void => {
  setWhatsAppStatus({ connected: false, qrCode: null });
};

export const confirmWhatsAppConnection = (): void => {
  setWhatsAppStatus({ connected: true, qrCode: null });
};

// Invia notifica WhatsApp
export const sendWhatsAppNotification = async (booking: {
  service: { name: string; price: number };
  date: string;
  time: string;
  name: string;
  phone: string;
}): Promise<boolean> => {
  const config = getWhatsAppConfig();
  if (!config.enabled) return false;

  const message = `📅 *Nuova Prenotazione*\n\n` +
    `👤 *Cliente:* ${booking.name}\n` +
    `📞 *Telefono:* ${booking.phone}\n` +
    `💈 *Servizio:* ${booking.service.name}\n` +
    `💰 *Prezzo:* €${booking.service.price}\n` +
    `📆 *Data:* ${booking.date}\n` +
    `⏰ *Ora:* ${booking.time}`;

  // In produzione, qui si userebbe whatsapp-web.js per inviare
  console.log(`[WhatsApp] Invio a ${config.notificationNumber}:`, message);
  
  // Salva la notifica nel localStorage per debug
  const notifications = JSON.parse(localStorage.getItem("whiskered_notifications") || "[]");
  notifications.push({
    to: config.notificationNumber,
    message,
    sentAt: new Date().toISOString(),
  });
  localStorage.setItem("whiskered_notifications", JSON.stringify(notifications));

  return true;
};
