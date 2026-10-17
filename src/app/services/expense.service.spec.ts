import { describe, it, expect } from 'vitest';
import { ExpenseService } from './expense.service';
import { FirebaseService } from './firebase.service';

interface Call {
  op: 'push' | 'set' | 'remove';
  path: string;
  data?: unknown;
}

function makeService(uid: string | null = 'u1') {
  const calls: Call[] = [];
  const fake = {
    uid,
    push: async (path: string, data: unknown) => {
      calls.push({ op: 'push', path, data });
      return 'new-id';
    },
    set: async (path: string, data: unknown) => {
      calls.push({ op: 'set', path, data });
    },
    remove: async (path: string) => {
      calls.push({ op: 'remove', path });
    }
  };
  return { service: new ExpenseService(fake as unknown as FirebaseService), calls };
}

const base = {
  who: 'Anna',
  amount: 10,
  date: '2026-10-01',
  where: 'Shop',
  category: 'Cibo',
  notes: ''
};

describe('ExpenseService.addExpense and debit', () => {
  it('writes debit: true when ticked', async () => {
    const { service, calls } = makeService();
    await service.addExpense({ ...base, debit: true });
    expect((calls[0].data as Record<string, unknown>)['debit']).toBe(true);
  });

  it('does not write the debit key when false or undefined', async () => {
    const { service, calls } = makeService();
    await service.addExpense({ ...base, debit: false });
    await service.addExpense({ ...base });
    expect('debit' in (calls[0].data as object)).toBe(false);
    expect('debit' in (calls[1].data as object)).toBe(false);
  });
});

describe('ExpenseService.setDebit', () => {
  it('sets the debit path to true', async () => {
    const { service, calls } = makeService();
    await service.setDebit('e1', true);
    expect(calls).toEqual([{ op: 'set', path: 'users/u1/expenses/e1/debit', data: true }]);
  });

  it('removes the debit path when false and never writes false', async () => {
    const { service, calls } = makeService();
    await service.setDebit('e1', false);
    expect(calls).toEqual([{ op: 'remove', path: 'users/u1/expenses/e1/debit' }]);
  });

  it('rejects when not authenticated', async () => {
    const { service, calls } = makeService(null);
    await expect(service.setDebit('e1', true)).rejects.toThrow('Non autenticato');
    expect(calls).toEqual([]);
  });
});
