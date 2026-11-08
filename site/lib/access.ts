import type { PlannerState } from "./planner";
export type Role = "owner" | "editor" | "planner" | "viewer";
export function visiblePlan(state: PlannerState, role: Role): PlannerState {
  return role === "planner"
    ? {
        ...state,
        settings: { ...state.settings, budget: 0 },
        expenses: [],
        documents: [],
      }
    : state;
}
export function permittedUpdate(
  current: PlannerState,
  next: PlannerState,
  role: Role,
): PlannerState {
  if (role === "viewer")
    throw Error("This invitation gives you read-only access.");
  if (role === "planner") {
    if (next.expenses.length || next.documents.length)
      throw Error("Budget and documents are not included in this role.");
    return {
      ...next,
      settings: current.settings,
      expenses: current.expenses,
      documents: current.documents,
    };
  }
  return next;
}
