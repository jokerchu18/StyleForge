import { en } from '../i18n/en';

interface Props {
  phase: 'loading' | 'processing';
  label?: string;
}

export default function ProcessingOverlay({ phase, label }: Props) {
  const text =
    label ?? (phase === 'loading' ? en.loadingModel : en.processing);
  return (
    <div className="processing">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
