import { ReactNode } from 'react';

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`fsc-container ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = '',
  tight = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  tight?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`${tight ? 'fsc-section-tight' : 'fsc-section'} ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="fsc-eyebrow">{children}</p>;
}
