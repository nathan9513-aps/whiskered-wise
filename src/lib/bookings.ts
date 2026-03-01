import { Service } from "./services";
import { API_BASE_URL } from "./api";

export interface Booking {
  id: string;
  service: Service;
  operatorId?: string;
  operatorName?: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

const BOOKINGS_KEY = "whiskered_bookings";

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`);
    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return [];
  }
};

export const addBooking = async (booking: Omit<Booking, "id" | "createdAt">): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking)
  });
  if (!response.ok) throw new Error("Failed to add booking");
  return await response.json();
};

export const deleteBooking = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/bookings/${id}`, { method: "DELETE" });
};

export const getTodayBookings = async (): Promise<Booking[]> => {
  const today = new Date().toISOString().split('T')[0];
  const bookings = await getBookings();
  return bookings.filter(b => b.date === today);
};

export const getUpcomingBookings = async (): Promise<Booking[]> => {
  const today = new Date().toISOString().split('T')[0];
  const bookings = await getBookings();
  return bookings
    .filter(b => b.date >= today)
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
};
