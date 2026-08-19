import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAccount } from '../hooks/useAccount';

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function AccountPage() {
  const { account, loading } = useAccount();

  useEffect(() => {
    document.title = 'My Account | StyleForge';
  }, []);

  return (
    <AppLayout>
      <div className="account">
        <div className="account-head">
          <h1 className="hero-h1">My Account</h1>
        </div>

        {loading ? (
          <div className="processing">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="account-balance-card">
              <div className="account-balance">
                <span className="generations-bolt" aria-hidden="true">⚡</span>
                <span className="account-balance-num">{account?.balance ?? 0}</span>
                <span className="account-balance-label">Credits</span>
              </div>
              <div className="account-plan">
                <span className={`plan-badge plan-badge--${account?.plan ?? 'free'}`}>
                  {account?.planLabel ?? 'Free'}
                </span>
                <span className="account-plan-month">
                  {account?.monthlyGenerations ?? 40} credits / month
                </span>
              </div>
            </div>

            <section className="account-section">
              <div className="section-head">
                <h2>Credit History</h2>
              </div>
              {account?.transactions?.length ? (
                <div className="tx-list">
                  {account.transactions.map((tx) => (
                    <div key={tx.id} className="tx-row">
                      <span
                        className={`tx-amount tx-amount--${tx.amount >= 0 ? 'pos' : 'neg'}`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                      <span className="tx-desc">{tx.description || tx.type}</span>
                      <time className="tx-date">{formatDate(tx.createdAt)}</time>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No activity yet</strong>
                  <span>Generate an image and your credits will show up here.</span>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
