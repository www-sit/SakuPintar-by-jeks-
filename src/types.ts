export type Category = string;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  date: string;
  userId?: string;
  userName?: string;
  scope: 'personal' | 'family';
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'member';
  avatar?: string;
}

export interface Family {
  id: string;
  name: string;
  members: FamilyMember[];
}

export interface Budget {
  category: Category;
  limit: number;
  spent: number;
}
