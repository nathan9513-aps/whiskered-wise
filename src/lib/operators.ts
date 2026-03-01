export interface Operator {
  id: string;
  name: string;
  avatar: string;
}

const OPERATORS_KEY = "whiskered_operators";

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

export const getOperators = (): Operator[] => {
  const stored = localStorage.getItem(OPERATORS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse operators from localStorage", e);
    }
  }
  return defaultOperators;
};

export const addOperator = (operator: Omit<Operator, "id">): Operator => {
  const operators = getOperators();
  const newOperator: Operator = {
    ...operator,
    id: `op-${Date.now()}`,
  };
  operators.push(newOperator);
  localStorage.setItem(OPERATORS_KEY, JSON.stringify(operators));
  return newOperator;
};

export const deleteOperator = (id: string): void => {
  const operators = getOperators().filter(op => op.id !== id);
  localStorage.setItem(OPERATORS_KEY, JSON.stringify(operators));
};
