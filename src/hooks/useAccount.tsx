import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { apiJson } from '../lib/api';
import type { Account } from '../shared/account-types';

/** Signed-in user's billing/permission context, refreshed on demand. */
export function useAccount() {
  const { user, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setLoading(false);
      return;
    }
    try {
      const a = await apiJson<Account>('/api/account');
      setAccount(a);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return { account, loading: loading || authLoading, refresh };
}
