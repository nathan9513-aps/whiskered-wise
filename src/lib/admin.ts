const ADMIN_PASSWORD = "Barber2026!";
const ADMIN_AUTH_KEY = "whiskered_admin_auth";

export const isAdminAuthenticated = (): boolean => {
  return localStorage.getItem(ADMIN_AUTH_KEY) === "true";
};

export const authenticateAdmin = (password: string): boolean => {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_AUTH_KEY, "true");
    return true;
  }
  return false;
};

export const logoutAdmin = (): void => {
  localStorage.removeItem(ADMIN_AUTH_KEY);
};
