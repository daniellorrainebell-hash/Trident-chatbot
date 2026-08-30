/**
 * Placeholder shell.
 *
 * The interface is deliberately not built yet. Spec section 67: do not start by
 * building the UI. This page exists so the app builds and so the available
 * endpoints are discoverable.
 */

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "48rem" }}>
      <h1>Nexus IQ LinkedIn Content Engine</h1>
      <p>
        The content engine is built and the interface is not. Endpoints available
        now:
      </p>
      <ul>
        <li>
          <code>POST /api/ideas</code> runs the full pipeline for one idea
        </li>
        <li>
          <code>POST /api/feedback</code> records a user edit and what was learned from it
        </li>
        <li>
          <code>POST /api/lint</code> runs the writing-rules linter with no model call
        </li>
        <li>
          <code>GET /api/frameworks</code> returns the framework library
        </li>
      </ul>
      <p>
        See <code>docs/architecture.md</code> for how the stages fit together.
      </p>
    </main>
  );
}
