import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './useAuth';
import { apiJson } from '../lib/api';
import type { Account } from '../shared/account-types';

interface AccountCtx {
  account: Account | null;
  loading: boolean;
  refresh: (silent?: boolean) => Promise<void>;
}

const AccountContext = createContext<AccountCtx>({
  account: null,
  loading: true,
  refresh: async () => {},
});

/**
 * Global account provider — ONE instance shared by the header and every page.
 * Cached per user, so navigating to /account or /creations shows the balance
 * instantly and only ever makes one network round-trip per sign-in.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Map<string, Account>>(new Map());

  const refresh = useCallback(
    async (silent = false) => {
      if (!user) {
        setAccount(null);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const a = await apiJson<Account>('/api/account');
        cacheRef.current.set(user.id, a);
        setAccount(a);
      } catch {
        setAccount(null);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      setAccount(null);
      setLoading(false);
      return;
    }
    const cached = cacheRef.current.get(user.id);
    if (cached) {
      setAccount(cached);
      setLoading(false);
      refresh(true); // warm it quietly in the background
    } else {
      setLoading(true);
      refresh();
    }
  }, [user, refresh]);

  return (
    <AccountContext.Provider value={{ account, loading: loading || authLoading, refresh }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
