import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Props {
  collapsed?: boolean;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="auth-google-icon">
      <path
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-2.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12s3.36-7.27 7.19-7.27c2.04 0 3.47.78 4.28 1.8l2.03-1.95C16.77 2.98 14.5 2 12.19 2 6.48 2 2 6.48 2 12s4.48 10 10.19 10c5.88 0 9.78-4.13 9.78-9.95 0-.66-.07-1.16-.18-1.68l-.44-.27z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AuthButton({ collapsed }: Props) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  // Supabase not configured — hide auth entirely.
  if (!supabase || loading) return null;

  if (!user) {
    return (
      <button type="button" className="auth-btn" onClick={signInWithGoogle}>
        <GoogleIcon />
        {!collapsed && <span className="auth-label">Sign in with Google</span>}
      </button>
    );
  }

  const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'User';
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <button
      type="button"
      className="auth-btn"
      onClick={signOut}
      title={`Signed in as ${name} — click to sign out`}
    >
      {avatar ? (
        <img className="auth-avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="auth-avatar auth-avatar--fallback">
          {(name[0] ?? 'U').toUpperCase()}
        </span>
      )}
      {!collapsed && <span className="auth-label auth-label--name">{name}</span>}
    </button>
  );
}
