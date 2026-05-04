import { Container } from './Container';

const capabilities = [
  {
    label: 'Gate Automation',
    iconPath:
      'M3 12h7m0 0V5m0 7v7m11-7h-7m0 0V5m0 7v7',
  },
  {
    label: 'Access Control',
    iconPath:
      'M16 11V8a4 4 0 10-8 0v3M5 11h14v9H5z',
  },
  {
    label: 'Video Surveillance',
    iconPath:
      'M3 7l13-3v14L3 15V7zm13 1l5-2v8l-5-2',
  },
  {
    label: 'System Integration',
    iconPath:
      'M5 7h6v6H5zM13 11h6v6h-6zM11 13l2-2',
  },
  {
    label: 'Emergency Support',
    iconPath:
      'M12 2v6m0 0l3-3m-3 3l-3-3M5 13l-2 7 7-2m4-12l5 5-9 9H5v-5z',
  },
];

export function CapabilityBar() {
  return (
    <section className="relative border-y border-fsc-border bg-fsc-surface/40">
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {capabilities.map((cap, i) => (
            <div
              key={cap.label}
              className={`flex items-center gap-3 px-4 py-5 ${
                i !== capabilities.length - 1
                  ? 'lg:border-r border-fsc-border'
                  : ''
              } ${
                i % 2 === 0
                  ? 'sm:border-r border-fsc-border sm:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:border-r'
                  : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-fsc-border-strong bg-fsc-bg/50">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-fsc-accent-glow"
                  aria-hidden
                >
                  <path
                    d={cap.iconPath}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-fsc-text">
                {cap.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
