import { site } from '@/data/site';

const SHOP = site.booking.slug;

/** Discovery links for assistants. React hoists these into <head>. */
export function BooqerDiscovery() {
  return (
    <>
      <link
        rel="alternate"
        type="application/json"
        href={`https://booqer.ai/shops/${SHOP}/agent-card.json`}
        title="Booqer agent card"
      />
      <link rel="service-desc" type="application/yaml" href="https://booqer.ai/.well-known/openapi.yaml" />
      <link rel="mcp" href="https://booqer.ai/mcp" />
      <meta name="booqer:shop" content={SHOP} />
    </>
  );
}

/** Visible on every page, including the homepage and the contact page. */
export function BooqerBlock() {
  return (
    <section id="booqer" aria-label="Book or ask via Booqer" className="fsc-booqer">
      <div className="fsc-container">
        <h2>Book instantly or ask a question</h2>
        <p>
          Florida Security Concepts takes appointments and answers questions through Booqer.
          People and AI assistants can book an open time right away or ask a question.
          An open time is an advanced consultation.
        </p>
        <a href={site.booking.bookUrl} rel="booqer-book">Book an appointment</a>
        <a href={site.booking.askUrl} rel="booqer-ask">Ask a question</a>
        <p>
          <small
            dangerouslySetInnerHTML={{
              __html: `For AI assistants: use https://booqer.ai/mcp (tools: get_shop, check_availability, request_booking, ask_shop; shop id "${SHOP}"), or the links above.`,
            }}
          />
        </p>
      </div>
    </section>
  );
}
