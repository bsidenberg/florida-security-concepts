import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export type EquipmentBrand = { file: string; name: string };

type EquipmentIcon = 'slide' | 'swing' | 'lift' | 'barrier' | 'operator' | 'keypad' | 'callbox' | 'camera';

type EquipmentItem = {
  id: string;
  icon: EquipmentIcon;
  title: string;
  benefit: string;
  href: string;
  cta: string;
};

const work = ['Install', 'Repair', 'Maintenance'] as const;

const items: EquipmentItem[] = [
  {
    id: 'slide',
    icon: 'slide',
    title: 'Slide gates',
    benefit: 'The leaf travels along the fence and parks beside the opening.',
    href: '/services/security-gate-systems',
    cta: 'Security gate systems',
  },
  {
    id: 'swing',
    icon: 'swing',
    title: 'Swing gates',
    benefit: 'The leaves open on hinges when the lane has room for the arc.',
    href: '/services/security-gate-systems',
    cta: 'Security gate systems',
  },
  {
    id: 'lift',
    icon: 'lift',
    title: 'Vertical lift gates',
    benefit: 'The leaf rises between the posts when a swing or a slide will not fit.',
    href: '/services/security-gate-systems',
    cta: 'Security gate systems',
  },
  {
    id: 'barrier',
    icon: 'barrier',
    title: 'Barrier arms',
    benefit: 'An arm across the lane, where a full leaf is more than the entry needs.',
    href: '/services/security-gate-systems',
    cta: 'Security gate systems',
  },
  {
    id: 'operator',
    icon: 'operator',
    title: 'Operators',
    benefit: 'The cabinet that moves the leaf, sized to its weight and how often it cycles.',
    href: '/services/gate-automation',
    cta: 'Gate automation',
  },
  {
    id: 'keypad',
    icon: 'keypad',
    title: 'Keypads & access control',
    benefit: 'A code, a fob, or a phone credential decides who the entry opens for.',
    href: '/services/access-control',
    cta: 'Access control',
  },
  {
    id: 'callbox',
    icon: 'callbox',
    title: 'Call boxes & intercoms',
    benefit: 'A visitor calls someone on the property before the gate opens.',
    href: '/services/access-control',
    cta: 'Access control',
  },
  {
    id: 'camera',
    icon: 'camera',
    title: 'Cameras',
    benefit: 'A recorded view of the lane, the vehicle, and the gate.',
    href: '/services/video-surveillance',
    cta: 'Video surveillance',
  },
];

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  );
}

function EquipmentIcon({ name }: { name: EquipmentIcon }) {
  const ink = { fill: 'none', stroke: '#F4F7FC', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const hot = { fill: 'none', stroke: '#FF8FA3', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'slide') {
    return (
      <Mark>
        <path d="M8 40h32M10 14v26M38 14v26M10 18h8M30 18h8" {...ink} />
        <rect x="12" y="22" width="14" height="12" rx="1.2" {...hot} />
        <path d="M28 28h8" {...hot} />
        <path d="M33 25l4 3-4 3" {...hot} />
      </Mark>
    );
  }
  if (name === 'swing') {
    return (
      <Mark>
        <path d="M8 40h32M12 12v28" {...ink} />
        <path d="M12 16h16M12 32h14M28 16v16" {...ink} />
        <path d="M28 16c8 4 8 12 0 16" {...hot} />
      </Mark>
    );
  }
  if (name === 'lift') {
    return (
      <Mark>
        <path d="M8 40h32M12 12v28M36 12v28" {...ink} />
        <path d="M12 24h24" {...hot} />
        <path d="M24 20V11" {...hot} />
        <path d="M21 14l3-4 3 4" {...hot} />
      </Mark>
    );
  }
  if (name === 'barrier') {
    return (
      <Mark>
        <path d="M8 40h32" {...ink} />
        <rect x="8" y="20" width="10" height="16" rx="1.2" {...ink} />
        <path d="M18 26h20" {...hot} />
        <path d="M38 26v10" {...ink} />
      </Mark>
    );
  }
  if (name === 'operator') {
    return (
      <Mark>
        <rect x="8" y="10" width="16" height="22" rx="2" {...ink} />
        <circle cx="16" cy="20" r="3" {...hot} />
        <path d="M12 14h3M21 14h3" {...ink} />
        <path d="M24 22h8" {...hot} />
        <rect x="32" y="16" width="8" height="12" rx="1" {...ink} />
      </Mark>
    );
  }
  if (name === 'keypad') {
    return (
      <Mark>
        <path d="M20 40h8M24 40V28" {...ink} />
        <rect x="14" y="8" width="20" height="18" rx="2" {...ink} />
        <circle cx="20" cy="14" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="24" cy="14" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="28" cy="14" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="20" cy="18" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="24" cy="18" r="1.3" fill="#FF8FA3" stroke="none" />
        <circle cx="28" cy="18" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="20" cy="22" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="24" cy="22" r="1.15" fill="#F4F7FC" stroke="none" />
        <circle cx="28" cy="22" r="1.15" fill="#F4F7FC" stroke="none" />
      </Mark>
    );
  }
  if (name === 'callbox') {
    return (
      <Mark>
        <path d="M18 40h8M22 40V28" {...ink} />
        <rect x="12" y="8" width="16" height="18" rx="2" {...ink} />
        <circle cx="20" cy="17" r="3" {...ink} />
        <path d="M31 13c2 2.2 2 5.8 0 8" {...hot} />
        <path d="M34 11c3 3 3 9 0 12" {...hot} />
      </Mark>
    );
  }
  return (
    <Mark>
      <path d="M14 40V24" {...ink} />
      <rect x="8" y="12" width="14" height="10" rx="1.5" {...ink} />
      <circle cx="15" cy="17" r="2" {...ink} />
      <path d="M22 14 L38 8 V26 L22 20" {...hot} />
    </Mark>
  );
}

export function EquipmentGrid({ brands }: { brands: readonly EquipmentBrand[] }) {
  return (
    <>
      <ul className="fsc-equip-grid">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="fsc-equip-card">
              <span className="fsc-equip-icon">
                <EquipmentIcon name={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.benefit}</p>
              <div className="fsc-equip-foot">
                <ul className="fsc-equip-work">
                  {work.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
                <span className="fsc-equip-cta">
                  {item.cta}
                  <span aria-hidden="true">›</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="fsc-equip-brands">
        <h3 id="mfr-heading">Equipment we install and service</h3>
        <ul className="fsc-equip-logos" aria-labelledby="mfr-heading">
          {brands.map((brand) => (
            <li key={brand.file} className="fsc-equip-logo">
              <Image
                src={`/manufacturers/${brand.file}.png`}
                alt={brand.name}
                width={160}
                height={70}
                sizes="160px"
                unoptimized
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
