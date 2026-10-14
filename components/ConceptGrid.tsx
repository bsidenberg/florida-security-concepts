import type { SiteConcept } from '@/data/concepts';
import { ConceptDiagram } from './ConceptDiagram';

export function ConceptCard({ concept }: { concept: SiteConcept }) {
  return (
    <article className="fsc-concept">
      <div className="fsc-concept-art">
        <ConceptDiagram id={concept.diagram} alt={concept.alt} />
      </div>
      <div className="fsc-concept-copy">
        <p className="fsc-concept-kicker">{concept.kicker}</p>
        <h3>{concept.title}</h3>
        <p>{concept.caption}</p>
      </div>
    </article>
  );
}

export function ConceptGrid({ concepts }: { concepts: readonly SiteConcept[] }) {
  return (
    <div className="fsc-concept-grid">
      {concepts.map((concept) => (
        <ConceptCard key={concept.id} concept={concept} />
      ))}
    </div>
  );
}
