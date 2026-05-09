"use client";

import { useState, useEffect, useCallback } from "react";
import type { MemoryEntry } from "./memory-thankyou-card";

export default function MemoryList() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState<Record<string, number>>(
    {},
  );

  const fetchMemories = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/memories");
      if (!res.ok) throw new Error("Failed to fetch memories");
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const deleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMemories((prev) => prev.filter((m) => m._id !== id && m.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const startEditing = (memory: MemoryEntry) => {
    setEditingId(mid(memory));
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setIsSaving(true);
    try {
      cancelEditing();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getPhotoIdx = (id: string) => activePhotoIdx[id] || 0;

  const setPhotoIdx = (id: string, idx: number) => {
    setActivePhotoIdx((prev) => ({ ...prev, [id]: idx }));
  };

  // Normalize MongoDB _id to id
  const mid = (m: MemoryEntry) => m._id || m.id;

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 flex justify-center">
        <svg
          className="animate-spin h-6 w-6 text-white/40"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchMemories}
          className="mt-3 px-4 py-2 rounded-lg border border-white/20 text-white/50 text-xs
                     hover:bg-white/10 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-white/20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="text-white/40 text-sm">No memories saved yet</p>
        <p className="text-white/20 text-xs mt-1">
          Create your first memory book above
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/60 text-sm font-medium">
          Saved Memories ({memories.length})
        </h3>
        <button
          onClick={fetchMemories}
          className="text-white/30 text-xs hover:text-white/60 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {memories.map((memory) => {
          const id = mid(memory);
          const isExpanded = expandedId === id;
          const photoIdx = getPhotoIdx(id);

          return (
            <div
              key={id}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Card header */}
              <button
                onClick={() => toggleExpand(id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
              >
                {memory.imageUrls.length > 0 ? (
                  <img
                    src={memory.imageUrls[0]}
                    alt={memory.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white/20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">
                    {memory.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 text-white/25 text-xs">
                    <span>
                      {new Date(memory.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {memory.imageUrls.length > 0 && (
                      <span>
                        {memory.imageUrls.length} photo
                        {memory.imageUrls.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {memory.moments?.length > 0 && (
                      <span>{memory.moments.length} moments</span>
                    )}
                  </div>
                </div>

                <svg
                  className={`w-5 h-5 text-white/30 shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Photo gallery (always visible, even in edit mode) */}
                  {memory.imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden aspect-4/3 bg-black/20">
                        <img
                          src={memory.imageUrls[photoIdx]}
                          alt={`${memory.title} - ${photoIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {memory.imageUrls.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setPhotoIdx(
                                  id,
                                  photoIdx === 0
                                    ? memory.imageUrls.length - 1
                                    : photoIdx - 1,
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                                         bg-black/40 hover:bg-black/60 text-white flex items-center justify-center
                                         transition-all backdrop-blur-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 19l-7-7 7-7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                setPhotoIdx(
                                  id,
                                  photoIdx === memory.imageUrls.length - 1
                                    ? 0
                                    : photoIdx + 1,
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                                         bg-black/40 hover:bg-black/60 text-white flex items-center justify-center
                                         transition-all backdrop-blur-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {memory.imageUrls.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setPhotoIdx(id, i)}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    i === photoIdx
                                      ? "bg-white scale-125"
                                      : "bg-white/40 hover:bg-white/70"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {memory.imageUrls.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {memory.imageUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`${i + 1}`}
                              onClick={() => setPhotoIdx(id, i)}
                              className={`w-12 h-12 rounded-md object-cover cursor-pointer transition-all border-2 shrink-0 ${
                                i === photoIdx
                                  ? "border-blue-400 opacity-100"
                                  : "border-transparent opacity-50 hover:opacity-80"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---- EDIT MODE ---- */}
                  {editingId === id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editValues.title}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Title"
                        className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5
                                   text-white text-sm placeholder-white/30
                                   focus:outline-none focus:border-blue-400/50 focus:bg-white/10
                                   transition-all"
                      />
                      <textarea
                        value={editValues.lifeMemories}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            lifeMemories: e.target.value,
                          }))
                        }
                        placeholder="Life memories narrative..."
                        rows={6}
                        className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5
                                   text-white text-sm placeholder-white/30 resize-y
                                   focus:outline-none focus:border-blue-400/50 focus:bg-white/10
                                   transition-all"
                      />
                      <div>
                        <p className="text-white/30 text-xs mb-1.5">
                          Moments — separated by{" "}
                          <code className="text-white/40">---</code> on its own
                          line
                        </p>
                        <textarea
                          value={editValues.moments}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              moments: e.target.value,
                            }))
                          }
                          placeholder={
                            "First moment here...\n\n---\n\nSecond moment here..."
                          }
                          rows={5}
                          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5
                                     text-white text-sm placeholder-white/30 resize-y
                                     focus:outline-none focus:border-blue-400/50 focus:bg-white/10
                                     transition-all"
                        />
                      </div>

                      {/* Edit actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveEdit(id)}
                          disabled={isSaving}
                          className="px-5 py-2 rounded-lg bg-blue-500/80 text-white text-xs font-medium
                                     hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed
                                     transition-all flex items-center gap-1.5"
                        >
                          {isSaving ? (
                            <>
                              <svg
                                className="animate-spin h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Saving...
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-lg border border-white/20 text-white/50 text-xs
                                     hover:bg-white/10 disabled:opacity-30 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ---- VIEW MODE ---- */
                    <>
                      {/* Moments list */}
                      {memory.moments?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-white/30 text-xs font-medium uppercase tracking-wide">
                            Moments
                          </p>
                          {memory.moments.map((moment, i) => (
                            <div
                              key={i}
                              className="flex gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5"
                            >
                              <span className="text-white/20 text-xs shrink-0 mt-0.5 font-mono">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <p className="text-white/50 text-xs leading-relaxed">
                                {moment}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Full narrative */}
                      <div className="text-white/70 text-sm leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                        {memory.lifeMemories}
                      </div>

                      {/* Timestamps */}
                      <div className="text-white/30 text-xs space-y-0.5">
                        <p>
                          Created:{" "}
                          {new Date(memory.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p>
                          Updated:{" "}
                          {new Date(memory.updatedAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(memory)}
                          className="px-4 py-2 rounded-lg border border-white/20 text-white/60 text-xs
                                     hover:bg-white/10 hover:border-white/40 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMemory(id)}
                          className="px-4 py-2 rounded-lg border border-red-400/20 text-red-400/70 text-xs
                                     hover:bg-red-400/10 hover:border-red-400/40 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
