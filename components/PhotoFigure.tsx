import Image from 'next/image';
import type { SitePhoto } from '@/data/photos';

export function PhotoFigure({
  photo,
  priority = false,
  sizes,
  cover = false,
}: {
  photo: SitePhoto;
  priority?: boolean;
  sizes: string;
  cover?: boolean;
}) {
  return (
    <figure className="fsc-photo">
      <div className={cover ? 'fsc-photo-frame' : 'fsc-photo-natural'}>
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          priority={priority}
          style={cover ? { objectPosition: photo.objectPosition ?? 'center' } : undefined}
        />
      </div>
    </figure>
  );
}

export function PhotoGrid({
  photos,
  sizes = '(min-width: 900px) 30vw, 100vw',
}: {
  photos: SitePhoto[];
  sizes?: string;
}) {
  return (
    <div className="fsc-photo-grid">
      {photos.map((photo) => (
        <PhotoFigure key={photo.src} photo={photo} sizes={sizes} cover />
      ))}
    </div>
  );
}
