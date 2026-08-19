-- Scale the credit system:
--   • every existing user's balance ×10
--   • every existing ledger amount ×10 (so history matches the new balance)
--   • new-user onboarding gives 40 credits (was 10)
--   • welcome message updated

update public.credit_balances
set balance = balance * 10, updated_at = now()
where balance > 0;

update public.credit_transactions
set amount = amount * 10
where amount <> 0;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active') on conflict (user_id) do nothing;
  insert into public.credit_balances (user_id, balance, free_cycle_start)
    values (new.id, 40, now()) on conflict (user_id) do nothing;
  insert into public.credit_transactions (user_id, amount, type, description)
    values (new.id, 40, 'initial', 'Welcome — 40 free credits');
  return new;
end; $$;
