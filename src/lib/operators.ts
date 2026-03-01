export interface Operator {
  id: string;
  name: string;
  avatar: string;
}

import { API_BASE_URL } from "./api";

const OPERATORS_KEY = "whiskered_operators"; // For migration

export const defaultOperators: Operator[] = [
  {
    id: "op-1",
    name: "Marco",
    avatar: "👨🏻",
  },
  {
    id: "op-2",
    name: "Luigi",
    avatar: "🧔🏽‍♂️",
  },
];

export const getOperators = async (): Promise<Operator[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/operators`);
    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch operators:", error);
    return defaultOperators; // Fallback
  }
};

export const addOperator = async (operator: Omit<Operator, "id">): Promise<Operator> => {
  const response = await fetch(`${API_BASE_URL}/operators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(operator)
  });
  if (!response.ok) throw new Error("Failed to add operator");
  return await response.json();
};

export const deleteOperator = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/operators/${id}`, { method: "DELETE" });
};
