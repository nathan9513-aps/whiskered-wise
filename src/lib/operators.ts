export interface Operator {
  id: string;
  name: string;
  avatar: string;
}

import { API_BASE_URL } from "./api";

const OPERATORS_KEY = "whiskered_operators"; // For migration

export const defaultOperators: Operator[] = [
  { id: "op-yousef", name: "Yousef", avatar: "🧔🏽‍♂️" },
  { id: "op-amza", name: "Amza", avatar: "👨🏽‍🦱" },
  { id: "op-ando", name: "Ando", avatar: "👨🏻" },
  { id: "op-simo", name: "Simo", avatar: "🧔🏻‍♂️" }
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
