"use client";

import { useState, useEffect } from "react";
import { getMemories, type MemoryEntry } from "./memory-thankyou-card";

export default function MemoryList() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<Record<string, number>>({});

  useEffect(() => {
    setMemories(getMemories());

    const onStorage = () => setMemories(getMemories());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const deleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    localStorage.setItem("life-book-memories", JSON.stringify(updated));
    setMemories(updated);
    if (expandedId === id) setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getPhotoIdx = (id: string) => activePhotoIdx[id] || 0;

  const setPhotoIdx = (id: string, idx: number) => {
    setActivePhotoIdx((prev) => ({ ...prev, [id]: idx }));
  };

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
      <h3 className="text-white/60 text-sm font-medium mb-4">
        Saved Memories ({memories.length})
      </h3>

      <div className="space-y-4">
        {memories.map((memory) => {
          const isExpanded = expandedId === memory.id;
          const photoIdx = getPhotoIdx(memory.id);

          return (
            <div
              key={memory.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Card header — always visible */}
              <button
                onClick={() => toggleExpand(memory.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
              >
                {/* Thumbnail */}
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

                {/* Title + excerpt */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">
                    {memory.title}
                  </h4>
                  <p className="text-white/40 text-xs truncate mt-0.5">
                    {memory.lifeMemories.slice(0, 100)}
                    {memory.lifeMemories.length > 100 ? "..." : ""}
                  </p>
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
                        {memory.imageUrls.length} photo{memory.imageUrls.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand chevron */}
                <svg
                  className={`w-5 h-5 text-white/30 shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Photo gallery */}
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
                                  memory.id,
                                  photoIdx === 0
                                    ? memory.imageUrls.length - 1
                                    : photoIdx - 1,
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                                         bg-black/40 hover:bg-black/60 text-white flex items-center justify-center
                                         transition-all backdrop-blur-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                setPhotoIdx(
                                  memory.id,
                                  photoIdx === memory.imageUrls.length - 1
                                    ? 0
                                    : photoIdx + 1,
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                                         bg-black/40 hover:bg-black/60 text-white flex items-center justify-center
                                         transition-all backdrop-blur-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {memory.imageUrls.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setPhotoIdx(memory.id, i)}
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

                      {/* Thumbnail strip */}
                      {memory.imageUrls.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {memory.imageUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`${i + 1}`}
                              onClick={() => setPhotoIdx(memory.id, i)}
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

                  {/* Full life memories text */}
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

                  {/* Delete button */}
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className="px-4 py-2 rounded-lg border border-red-400/20 text-red-400/70 text-xs
                               hover:bg-red-400/10 hover:border-red-400/40 transition-all"
                  >
                    Delete memory
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
