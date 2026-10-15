import Image from 'next/image';
import type { WorkPhoto } from '@/data/workPhotos';

export function WorkGallery({ photos, lead = false }: { photos: WorkPhoto[]; lead?: boolean }) {
  return (
    <ul className={`fsc-work-grid${lead ? ' fsc-work-grid-lead' : ''}`}>
      {photos.map((ph, i) => (
        <li key={ph.src} className="fsc-work-item">
          <Image src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} sizes={lead && i === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'} priority={lead && i === 0} />
          <span className="fsc-work-cap"><b>{ph.caption}</b>{ph.city}, FL</span>
        </li>
      ))}
    </ul>
  );
}
