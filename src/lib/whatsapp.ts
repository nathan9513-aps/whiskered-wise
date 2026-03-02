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

// Use environment variable for the backend API URL, fallback to localhost for local development
const API_URL = import.meta.env.PROD
  ? "/api/whatsapp"
  : (import.meta.env.VITE_WHATSAPP_API_URL || "http://localhost:3001/api/whatsapp");

export const fetchWhatsAppStatus = async (): Promise<WhatsAppStatus> => {
  try {
    const response = await fetch(`${API_URL}/status`);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    setWhatsAppStatus(data);
    return data;
  } catch (error) {
    console.error("Errore fetch status WhatsApp:", error);
    return getWhatsAppStatus(); // Fallback to localStorage
  }
};

export const connectWhatsApp = async (): Promise<{ success: boolean; qrCode?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/connect`, {
      method: "POST",
    });
    const data = await response.json();
    if (data.success && data.qrCode) {
      setWhatsAppStatus({ connected: false, qrCode: data.qrCode });
    }
    return data;
  } catch (error) {
    console.error("Errore connessione WhatsApp:", error);
    return { success: false, error: "Connessione fallita" };
  }
};

export const disconnectWhatsApp = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/disconnect`, { method: "POST" });
    setWhatsAppStatus({ connected: false, qrCode: null });
  } catch (error) {
    console.error("Errore disconnessione WhatsApp:", error);
  }
};

export const confirmWhatsAppConnection = (): void => {
  setWhatsAppStatus({ connected: true, qrCode: null });
};

export const sendWhatsAppNotification = async (booking: {
  service: { name: string; price: number };
  date: string;
  time: string;
  name: string;
  phone: string;
  operatorName?: string;
}): Promise<boolean> => {
  const config = getWhatsAppConfig();
  if (!config.enabled) return false;

  const message = `📅 *Nuova Prenotazione*\n\n` +
    `👤 *Cliente:* ${booking.name}\n` +
    `📞 *Telefono:* ${booking.phone}\n` +
    `💈 *Servizio:* ${booking.service.name}\n` +
    `💰 *Prezzo:* €${booking.service.price}\n` +
    `📆 *Data:* ${booking.date}\n` +
    `⏰ *Ora:* ${booking.time}` +
    (booking.operatorName ? `\n💈 *Operatore:* ${booking.operatorName}` : "");

  try {
    const response = await fetch(`${API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: config.notificationNumber,
        message,
      }),
    });
    const data = await response.json();

    // Salva la notifica nel localStorage per debug in caso di successo o errore
    const notifications = JSON.parse(localStorage.getItem("whiskered_notifications") || "[]");
    notifications.push({
      to: config.notificationNumber,
      message,
      sentAt: new Date().toISOString(),
      success: data.success
    });
    localStorage.setItem("whiskered_notifications", JSON.stringify(notifications));

    return data.success;
  } catch (error) {
    console.error("Errore invio notifica WhatsApp:", error);
    return false;
  }
};
