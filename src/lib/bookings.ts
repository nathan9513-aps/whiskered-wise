import { Service } from "./services";

export interface Booking {
  id: string;
  service: Service;
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

const BOOKINGS_KEY = "whiskered_bookings";

export const getBookings = (): Booking[] => {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addBooking = (booking: Omit<Booking, "id" | "createdAt">): Booking => {
  const bookings = getBookings();
  const newBooking: Booking = {
    ...booking,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  return newBooking;
};

export const deleteBooking = (id: string): void => {
  const bookings = getBookings().filter(b => b.id !== id);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
};

export const getTodayBookings = (): Booking[] => {
  const today = new Date().toISOString().split('T')[0];
  return getBookings().filter(b => b.date === today);
};

export const getUpcomingBookings = (): Booking[] => {
  const today = new Date().toISOString().split('T')[0];
  return getBookings()
    .filter(b => b.date >= today)
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
};
