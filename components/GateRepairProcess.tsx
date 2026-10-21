import { Container, Section, Eyebrow } from '@/components/Container';
import { gateRepairProcess } from '@/data/gateRepairProcess';

export function GateRepairProcess({ intro }: { intro?: string }) {
  return (
    <Section id="repair-process">
      <Container>
        <Eyebrow>From the first call</Eyebrow>
        <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-fsc-text leading-tight max-w-3xl">
          {gateRepairProcess.name}
        </h2>
        <p className="mt-4 max-w-3xl text-base text-fsc-text-dim leading-relaxed">
          {intro ??
            'If the gate is down, call. If the lane is still open, an advanced consultation is how we scope the repair. On site we diagnose first, then repair the operator, leaf, loop, and safety devices that apply to that entrance.'}
        </p>
        <ol className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {gateRepairProcess.steps.map((step, index) => (
            <li key={step.name} className="fsc-card p-6">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-fsc-eyebrow text-fsc-accent-glow">
                <span>Step {String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-fsc-text">{step.name}</h3>
              <p className="mt-2 text-sm text-fsc-text-dim leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
