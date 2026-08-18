import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/** Responsive grid container for StyleCards. No business logic. */
export default function StyleGrid({ children, className }: Props) {
  return <div className={`style-grid${className ? ` ${className}` : ''}`}>{children}</div>;
}
