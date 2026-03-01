export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  icon: string;
}

export const defaultServices: Service[] = [
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
];

import { API_BASE_URL } from "./api";

const SERVICES_KEY = "whiskered_services"; // For migration purpose only

export const getServices = async (): Promise<Service[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return defaultServices; // Fallback
  }
};

export const addService = async (service: Omit<Service, "id">): Promise<Service> => {
  const response = await fetch(`${API_BASE_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service)
  });
  if (!response.ok) throw new Error("Failed to add service");
  return await response.json();
};

export const deleteService = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/services/${id}`, { method: "DELETE" });
};

export const updateService = async (id: string, service: Partial<Service>): Promise<Service> => {
  const response = await fetch(`${API_BASE_URL}/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(service)
  });
  if (!response.ok) throw new Error("Failed to update service");
  return await response.json();
};

export const timeSlots = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export const shopInfo = {
  name: "Barbiere Shop Marrakech",
  address: "Via S. Romano, 93, 44121 Ferrara FE, Italia",
  phone: "+39 0532 472724",
  rating: 4.8,
  hours: {
    lunedi: "8:30 – 20:00",
    martedi: "8:30 – 20:00",
    mercoledi: "8:30 – 20:00",
    giovedi: "8:30 – 20:00",
    venerdi: "8:30 – 20:00",
    sabato: "8:30 – 20:00",
    domenica: "Chiuso",
  },
};
