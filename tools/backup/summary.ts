export interface UserData {
  expenses?: Record<string, unknown>;
  categories?: Record<string, unknown>;
  people?: Record<string, unknown>;
}

export interface Counts {
  expenses: number;
  categories: number;
  people: number;
}

export interface BackupDocument {
  users: Record<string, UserData>;
}

function countKeys(group: Record<string, unknown> | undefined): number {
  return group ? Object.keys(group).length : 0;
}

export function countGroups(data: UserData | null): Counts {
  return {
    expenses: countKeys(data?.expenses),
    categories: countKeys(data?.categories),
    people: countKeys(data?.people),
  };
}

export function hasData(data: UserData | null): boolean {
  const { expenses, categories, people } = countGroups(data);
  return expenses + categories + people > 0;
}

export function buildBackupDocument(uid: string, data: UserData): BackupDocument {
  return { users: { [uid]: data } };
}

export function formatSummary(path: string, email: string, counts: Counts): string {
  return [
    `Backup created: ${path}`,
    `Account: ${email}`,
    `Expenses: ${counts.expenses}`,
    `Categories: ${counts.categories}`,
    `People: ${counts.people}`,
  ].join('\n');
}
