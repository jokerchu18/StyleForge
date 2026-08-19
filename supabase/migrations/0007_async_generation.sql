-- Async generation: expose Replicate's prediction lifecycle to the client.
-- POST /api/generate stores a pending generation + prediction_id, returns it,
-- and the client polls (or Replicate calls the webhook) until the image is
-- ready. Adds the columns needed to correlate a pending generation with its
-- upstream prediction, the provider that produced it, and the pending ledger
-- transaction to finalize on success/failure.

alter table public.generations
  add column if not exists prediction_id text,
  add column if not exists provider text,
  add column if not exists tx_id uuid references public.credit_transactions(id);

-- Helpers to correlate a generation ↔ prediction lookup by prediction id.
create index if not exists generations_prediction_id_idx
  on public.generations (prediction_id);
