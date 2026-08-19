import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { usePricing } from '../hooks/usePricing';
import { useAccount } from '../hooks/useAccount';

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['40 Credits / month', 'Standard generation', 'Explore styles', 'Save styles'],
  plus: [
    '2000 Credits / month',
    'All styles + Premium styles',
    'HD generation',
    'No watermark',
    'Commercial use',
    'Credit history',
  ],
  pro: [
    '6000 Credits / month',
    'All styles + Premium models',
    'HD / High resolution',
    'Priority queue',
    'Advanced generation options',
    'Style creation & publishing',
  ],
};

export default function PricingPage() {
  const plans = usePricing();
  const { account } = useAccount();

  useEffect(() => {
    document.title = 'Pricing | StyleForge';
  }, []);

  return (
    <AppLayout>
      <div className="pricing">
        <div className="pricing-head">
          <h1>Credits, not subscriptions per style.</h1>
          <p className="hero-sub">
            Every generation spends credits — you pay for image generations,
            nothing else.
          </p>
        </div>

        <div className="pricing-grid">
          {plans?.map((plan) => {
            const isCurrent = account?.plan === plan.id;
            const isFree = plan.id === 'free';
            return (
              <div
                key={plan.id}
                className={`pricing-card${plan.mostPopular ? ' most-popular' : ''}`}
              >
                {plan.mostPopular && (
                  <span className="pricing-popular">Most Popular</span>
                )}
                <h2 className="pricing-name">{plan.label}</h2>
                <div className="pricing-price">
                  <span>${plan.price}</span>
                  {!isFree && <small>/ month</small>}
                </div>
                <div className="pricing-generations">
                  {plan.generations} Credits
                </div>
                <ul className="pricing-features">
                  {(PLAN_FEATURES[plan.id] ?? []).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`btn-${isFree ? 'ghost' : 'primary'} pricing-cta`}
                  disabled={isCurrent}
                >
                  {isCurrent
                    ? 'Current plan'
                    : plan.id === 'free'
                      ? 'Downgrade'
                      : `Choose ${plan.label}`}
                </button>
                <p className="pricing-note">
                  {isCurrent && isFree
                    ? 'You are on the Free plan.'
                    : isCurrent
                      ? 'You are on this plan.'
                      : 'Payment coming soon.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
