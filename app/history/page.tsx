"use client";

import { useEffect, useState } from "react";

interface StoredPost {
  id: string;
  topic: string;
  coreClaim: string;
  contentPillar: string;
  frameworkId: string;
  hookFamily: string;
  selectedHook: string;
  draftText: string;
  finalText: string | null;
  status: string;
  criticScore: number | null;
  createdAt: string;
}

interface Version {
  versionNumber: number;
  text: string;
  source: string;
  createdAt: string;
}

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function History() {
  const [posts, setPosts] = useState<StoredPost[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.detail ?? data.error);
        setPosts(data.posts);
      })
      .catch((caught: Error) => {
        setError(caught.message);
        setPosts([]);
      });
  }, []);

  const openPost = async (id: string) => {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    setVersions([]);
    const response = await fetch(`/api/posts/${id}`);
    const data = await response.json();
    if (!data.error) setVersions(data.versions ?? []);
  };

  return (
    <main className="page page-narrow">
      <h1 style={{ marginBottom: "1.25rem" }}>History</h1>

      {error && <div className="notice notice-error">{error}</div>}

      {posts === null && <p className="muted">Loading...</p>}

      {posts?.length === 0 && !error && (
        <div className="empty">
          <p>Nothing written yet.</p>
          <a className="btn btn-primary" href="/">
            Write the first post
          </a>
        </div>
      )}

      {posts?.map((post) => (
        <div key={post.id} style={{ marginBottom: "0.6rem" }}>
          <button
            className="post-row"
            onClick={() => openPost(post.id)}
            style={{ width: "100%", textAlign: "left", cursor: "pointer", font: "inherit" }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
              {post.topic || "Untitled"}
            </div>
            <div className="small muted" style={{ marginBottom: "0.5rem" }}>
              {post.selectedHook}
            </div>
            <div className="chip-row">
              <span className="chip chip-neutral">{formatDate(post.createdAt)}</span>
              {post.frameworkId && <span className="chip">{post.frameworkId}</span>}
              {post.hookFamily && (
                <span className="chip chip-neutral">{post.hookFamily}</span>
              )}
              {post.criticScore !== null && (
                <span
                  className={`chip ${post.criticScore >= 7 ? "chip-good" : "chip-warn"}`}
                >
                  {post.criticScore.toFixed(1)}
                </span>
              )}
              {post.finalText && <span className="chip chip-good">Approved</span>}
            </div>
          </button>

          {open === post.id && (
            <div className="card" style={{ marginTop: "0.4rem" }}>
              <div className="section-label" style={{ marginBottom: "0.5rem" }}>
                {post.finalText ? "Final version" : "Draft"}
              </div>
              <div className="draft-preview">{post.finalText ?? post.draftText}</div>

              {versions.length > 1 && (
                <>
                  <div
                    className="section-label"
                    style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}
                  >
                    {versions.length} versions
                  </div>
                  <div className="chip-row">
                    {versions.map((version) => (
                      <span key={version.versionNumber} className="chip chip-neutral">
                        v{version.versionNumber} · {version.source.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
