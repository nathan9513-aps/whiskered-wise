import { API_BASE_URL } from "./api";

const SERVICES_KEY = "whiskered_services";
const OPERATORS_KEY = "whiskered_operators";
const BOOKINGS_KEY = "whiskered_bookings";
const MIGRATED_KEY = "whiskered_migrated";

export const migrateDataToBackend = async (): Promise<boolean> => {
  // Check if we already migrated
  if (localStorage.getItem(MIGRATED_KEY) === "true") {
    return true;
  }

  // Gather data
  const servicesData = localStorage.getItem(SERVICES_KEY);
  const operatorsData = localStorage.getItem(OPERATORS_KEY);
  const bookingsData = localStorage.getItem(BOOKINGS_KEY);

  let payload: any = {};

  if (servicesData) {
    try { payload.services = JSON.parse(servicesData); } catch (e) {}
  }
  if (operatorsData) {
    try { payload.operators = JSON.parse(operatorsData); } catch (e) {}
  }
  if (bookingsData) {
    try { payload.bookings = JSON.parse(bookingsData); } catch (e) {}
  }

  // If there's nothing to migrate, just mark as migrated and return
  if (!payload.services && !payload.operators && !payload.bookings) {
    localStorage.setItem(MIGRATED_KEY, "true");
    return true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/migrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      localStorage.setItem(MIGRATED_KEY, "true");
      return true;
    }
  } catch (error) {
    console.error("Migration failed", error);
  }

  return false;
};
