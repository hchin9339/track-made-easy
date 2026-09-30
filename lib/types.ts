export type TeamRole = "owner" | "admin" | "member";
export type Team = { id: string; name: string; slug: string };
export type Membership = { team: Team; role: TeamRole };
export type Workspace = {
  userId: string;
  userEmail: string;
  team: Team;
  role: TeamRole;
  memberships: Membership[];
};
export type Category = { id: string; name: string; team_id?: string };
export type Budget = {
  id: string;
  category_id: string;
  month: string;
  approved_amount: number;
};
export type Expense = {
  id: string;
  category_id: string;
  budget_id: string | null;
  vendor: string;
  description: string;
  amount: number;
  expense_date: string;
  month: string;
  status: "committed" | "actual";
  notes: string;
  user_id?: string;
};
export type Snapshot = {
  categories: Category[];
  budgets: Budget[];
  expenses: Expense[];
  workspace?: Workspace;
};
