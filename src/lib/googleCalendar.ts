const GOOGLE_CONFIG_KEY = "whiskered_google_config";
const GOOGLE_TOKEN_KEY = "whiskered_google_token";

export interface GoogleConfig {
  clientId: string;
  enabled: boolean;
}

export interface GoogleToken {
  access_token: string;
  expires_at: number;
}

// Configurazione OAuth2 per Google Calendar
const GOOGLE_CLIENT_ID = ""; // L'utente dovrà configurare questo
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export const getGoogleConfig = (): GoogleConfig => {
  const stored = localStorage.getItem(GOOGLE_CONFIG_KEY);
  return stored ? JSON.parse(stored) : { clientId: "", enabled: false };
};

export const saveGoogleConfig = (config: GoogleConfig): void => {
  localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(config));
};

export const isGoogleConnected = (): boolean => {
  const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
  if (!token) return false;
  
  try {
    const parsed: GoogleToken = JSON.parse(token);
    return parsed.expires_at > Date.now();
  } catch {
    return false;
  }
};

export const getGoogleAuthUrl = (): string => {
  const config = getGoogleConfig();
  if (!config.clientId) return "";

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: window.location.origin + "/admin",
    scope: GOOGLE_SCOPES.join(" "),
    response_type: "token",
    include_granted_scopes: "true",
    state: "google_auth",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const handleGoogleCallback = (hash: string): boolean => {
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const expiresIn = params.get("expires_in");
  const state = params.get("state");

  if (accessToken && state === "google_auth") {
    const token: GoogleToken = {
      access_token: accessToken,
      expires_at: Date.now() + parseInt(expiresIn || "3600") * 1000,
    };
    localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify(token));
    return true;
  }
  return false;
};

export const disconnectGoogle = (): void => {
  localStorage.removeItem(GOOGLE_TOKEN_KEY);
};

// Crea evento su Google Calendar
export const createCalendarEvent = async (booking: {
  service: { name: string; duration: number };
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}): Promise<boolean> => {
  const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
  if (!token) return false;

  try {
    const { access_token } = JSON.parse(token) as GoogleToken;
    
    // Calcola orario di fine
    const [hours, minutes] = booking.time.split(":").map(Number);
    const startDate = new Date(`${booking.date}T${booking.time}:00`);
    const endDate = new Date(startDate.getTime() + booking.service.duration * 60000);
    
    const event = {
      summary: `💈 ${booking.service.name} - ${booking.name}`,
      description: `Cliente: ${booking.name}\nTelefono: ${booking.phone}${booking.notes ? `\nNote: ${booking.notes}` : ""}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Rome",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Rome",
      },
      attendees: booking.email ? [{ email: booking.email }] : undefined,
    };

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (response.ok) {
      console.log("[Google Calendar] Evento creato:", await response.json());
      return true;
    } else {
      console.error("[Google Calendar] Errore:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("[Google Calendar] Errore:", error);
    return false;
  }
};

// Ottieni lista calendari
export const getCalendars = async (): Promise<Array<{ id: string; summary: string }>> => {
  const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
  if (!token) return [];

  try {
    const { access_token } = JSON.parse(token) as GoogleToken;
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (response.ok) {
      const data = await response.json();
      return data.items?.map((cal: { id: string; summary: string }) => ({ id: cal.id, summary: cal.summary })) || [];
    }
  } catch (error) {
    console.error("[Google Calendar] Errore:", error);
  }
  return [];
};
