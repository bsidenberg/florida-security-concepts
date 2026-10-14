import type { ReactElement } from 'react';
import type { DiagramId } from '@/data/concepts';

const stroke = '#D6DEEE';
const muted = '#9AABC8';
const red = '#BF0A30';
const panel = '#002868';

function Label({ x, y, children, fill = muted }: { x: number; y: number; children: string; fill?: string }) {
  return (
    <text x={x} y={y} fill={fill} fontSize={11} fontFamily="inherit">
      {children}
    </text>
  );
}

function SlideEntry() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x={236} y={18} width={68} height={34} rx={3} fill={panel} stroke={stroke} />
      <Label x={252} y={39}>wall</Label>
      <path d="M16 52H118M198 52H304" stroke={stroke} strokeWidth={3} />
      <path d="M28 78H198" stroke={muted} strokeWidth={2} />
      <rect x={36} y={64} width={74} height={18} fill="none" stroke={muted} strokeDasharray="4 3" />
      <rect x={124} y={62} width={74} height={20} fill={panel} stroke={red} strokeWidth={2} />
      <path d="M112 73H78" stroke={red} strokeWidth={2} />
      <path d="M78 68L68 73L78 78" fill={red} />
      <rect x={22} y={88} width={30} height={24} rx={2} fill={panel} stroke={stroke} />
      <path d="M37 88V78" stroke={stroke} strokeWidth={2} />
      <Label x={18} y={128}>operator</Label>
      <path d="M150 96V168M190 96V168" stroke={stroke} strokeWidth={1.5} />
      <circle cx={128} cy={124} r={8} fill="none" stroke={red} strokeWidth={2} />
      <path d="M128 132V150" stroke={red} strokeWidth={2} />
      <Label x={96} y={166} fill={red}>driver side</Label>
      <Label x={206} y={74}>opening</Label>
    </svg>
  );
}

function StorageSlide() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x={16} y={16} width={288} height={36} rx={3} fill={panel} stroke={stroke} />
      <Label x={132} y={38}>storage</Label>
      <path d="M16 68H120M200 68H304" stroke={stroke} strokeWidth={3} />
      <path d="M40 90H200" stroke={muted} strokeWidth={2} />
      <rect x={126} y={76} width={74} height={18} fill={panel} stroke={red} strokeWidth={2} />
      <path d="M118 85H86" stroke={red} strokeWidth={2} />
      <path d="M86 80L76 85L86 90" fill={red} />
      <rect x={28} y={96} width={26} height={20} rx={2} fill={panel} stroke={stroke} />
      <path d="M41 96V90" stroke={stroke} strokeWidth={2} />
      <path d="M156 108V164M196 108V164" stroke={stroke} strokeWidth={1.5} />
      <path d="M118 128V156" stroke={red} strokeWidth={2} />
      <circle cx={118} cy={120} r={9} fill="none" stroke={red} strokeWidth={2} />
      <Label x={86} y={174} fill={red}>keypad</Label>
      <Label x={214} y={90}>leaf</Label>
    </svg>
  );
}

function SwingCallbox() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <Label x={124} y={22}>property</Label>
      <rect x={108} y={36} width={10} height={28} fill={panel} stroke={stroke} />
      <rect x={202} y={36} width={10} height={28} fill={panel} stroke={stroke} />
      <path d="M118 48H168" stroke={red} strokeWidth={3} />
      <path d="M202 48H156" stroke={red} strokeWidth={3} />
      <path d="M118 48C118 18 168 18 168 48" fill="none" stroke={red} strokeDasharray="3 3" />
      <path d="M202 48C202 18 156 18 156 48" fill="none" stroke={red} strokeDasharray="3 3" />
      <path d="M150 28V18" stroke={red} strokeWidth={2} />
      <path d="M145 24L150 16L155 24" fill={red} />
      <path d="M146 78V164M174 78V164" stroke={stroke} strokeWidth={1.5} />
      <rect x={70} y={108} width={22} height={30} rx={2} fill={panel} stroke={red} strokeWidth={2} />
      <path d="M81 138V156" stroke={red} strokeWidth={2} />
      <Label x={48} y={174} fill={red}>call box</Label>
      <Label x={214} y={168}>lane</Label>
    </svg>
  );
}

function OperatorCabinet() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x={28} y={28} width={96} height={124} rx={4} fill={panel} stroke={stroke} strokeWidth={2} />
      <rect x={44} y={42} width={48} height={28} rx={2} fill="none" stroke={stroke} />
      <Label x={50} y={60}>board</Label>
      <circle cx={58} cy={92} r={4} fill={red} />
      <circle cx={78} cy={92} r={4} fill="none" stroke={stroke} />
      <Label x={46} y={112}>limits</Label>
      <circle cx={76} cy={128} r={16} fill="none" stroke={red} strokeWidth={2} />
      <Label x={60} y={132} fill={red}>motor</Label>
      <path d="M92 128H250" stroke={red} strokeWidth={2} />
      <path d="M236 122L250 128L236 134" fill={red} />
      <rect x={168} y={112} width={120} height={22} fill="none" stroke={stroke} strokeWidth={2} />
      <Label x={196} y={158}>leaf</Label>
    </svg>
  );
}

function ReceiverPost() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <path d="M78 156V36" stroke={stroke} strokeWidth={3} />
      <rect x={58} y={48} width={40} height={26} rx={2} fill={panel} stroke={red} strokeWidth={2} />
      <path d="M78 48V28" stroke={red} strokeWidth={2} />
      <path d="M70 28H86" stroke={red} strokeWidth={2} />
      <Label x={40} y={96} fill={red}>receiver</Label>
      <path d="M98 61H168" stroke={muted} strokeWidth={2} strokeDasharray="4 3" />
      <rect x={168} y={36} width={92} height={112} rx={4} fill={panel} stroke={stroke} strokeWidth={2} />
      <circle cx={214} cy={112} r={14} fill="none" stroke={stroke} />
      <Label x={186} y={168}>operator</Label>
    </svg>
  );
}

function KeypadReach() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <path d="M12 150H308" stroke={stroke} strokeWidth={2} />
      <path d="M24 150V112H128V150" fill={panel} stroke={stroke} />
      <path d="M48 112V86H96V112" fill="none" stroke={stroke} />
      <path d="M96 92H168" stroke={red} strokeWidth={1.5} strokeDasharray="4 3" />
      <path d="M168 92V150" stroke={red} strokeWidth={2} />
      <rect x={156} y={78} width={24} height={20} rx={2} fill={panel} stroke={red} strokeWidth={2} />
      <Label x={132} y={70} fill={red}>window height</Label>
      <rect x={236} y={108} width={64} height={16} fill="none" stroke={stroke} />
      <path d="M236 150V100M300 150V100" stroke={stroke} strokeWidth={2} />
      <Label x={246} y={96}>leaf</Label>
      <Label x={36} y={168}>driver</Label>
    </svg>
  );
}

function CameraLane() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <path d="M48 156V42" stroke={stroke} strokeWidth={3} />
      <rect x={28} y={36} width={36} height={18} rx={2} fill={panel} stroke={red} strokeWidth={2} />
      <path d="M64 45H78" stroke={red} strokeWidth={2} />
      <path d="M78 40L292 78L292 150L78 52Z" fill="rgba(191,10,48,0.12)" stroke={red} strokeDasharray="4 3" />
      <rect x={150} y={112} width={52} height={22} rx={2} fill={panel} stroke={stroke} />
      <path d="M248 96V156" stroke={stroke} strokeWidth={3} />
      <Label x={24} y={28} fill={red}>camera</Label>
      <Label x={156} y={150}>vehicle</Label>
      <Label x={256} y={86}>gate</Label>
    </svg>
  );
}

const diagrams: Record<DiagramId, () => ReactElement> = {
  'slide-entry': SlideEntry,
  'storage-slide': StorageSlide,
  'swing-callbox': SwingCallbox,
  operator: OperatorCabinet,
  receiver: ReceiverPost,
  'keypad-reach': KeypadReach,
  'camera-lane': CameraLane,
};

export function ConceptDiagram({ id, alt }: { id: DiagramId; alt: string }) {
  const Diagram = diagrams[id];
  return (
    <div role="img" aria-label={alt}>
      <Diagram />
    </div>
  );
}
