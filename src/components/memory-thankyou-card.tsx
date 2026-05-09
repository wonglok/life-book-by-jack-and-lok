"use client";

import { useState, useRef, useCallback } from "react";

export interface MemoryEntry {
  _id?: string;
  id: string;
  title: string;
  elderlyName?: string;
  lifeMemories: string;
  moments: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onSubmitted?: (entry: MemoryEntry) => void;
}

function splitIntoMoments(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

export default function MemoryThankYouCard({ onSubmitted }: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lifeMemories, setLifeMemories] = useState("");
  const [moments, setMoments] = useState<string[]>([]);
  const [activeMomentIndex, setActiveMomentIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadSingleToS3 = useCallback(async (file: File): Promise<string> => {
    const presignedRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });

    if (!presignedRes.ok) {
      const err = await presignedRes.json();
      throw new Error(err.error || "Failed to get upload URL");
    }

    const { url, fields, cdnUrl } = await presignedRes.json();

    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value as string);
    }
    formData.append("file", file);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      });
      xhr.addEventListener("error", () =>
        reject(new Error("Network error during upload")),
      );
      xhr.send(formData);
    });

    return cdnUrl || `${url}${fields.key}`;
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
          setError("All files must be images");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("Each image must be under 10MB");
          return;
        }
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);
      setUploadCount({ done: 0, total: fileArray.length });

      try {
        const urls: string[] = [];
        for (let i = 0; i < fileArray.length; i++) {
          const url = await uploadSingleToS3(fileArray[i]);
          urls.push(url);
          setUploadCount({ done: i + 1, total: fileArray.length });
          setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
        }
        setImageUrls((prev) => [...prev, ...urls]);
        if (imageUrls.length === 0 && urls.length > 0) {
          setActivePhotoIndex(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadSingleToS3, imageUrls.length],
  );

  const handleExtractMemories = async () => {
    if (imageUrls.length === 0) return;
    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch("/api/extract-memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI extraction failed");
      }

      const { moments: aiMoments, narrative } = await res.json();
      setMoments(aiMoments || []);
      setActiveMomentIndex(0);
      setLifeMemories(narrative || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles],
  );

  const removePhoto = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    if (activePhotoIndex >= index && activePhotoIndex > 0) {
      setActivePhotoIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSubmit = async () => {
    if (!lifeMemories.trim()) {
      setError("Please write some life memories before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalMoments =
      moments.length > 0 ? moments : splitIntoMoments(lifeMemories);

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Memory",
          lifeMemories: lifeMemories.trim(),
          moments: finalMoments,
          imageUrls,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save memory");
      }

      const entry: MemoryEntry = await res.json();
      setIsSubmitting(false);
      setSubmitted(true);
      onSubmitted?.(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save memory");
      setIsSubmitting(false);
    }
  };

  const resetCard = () => {
    setImageUrls([]);
    setActivePhotoIndex(0);
    setLifeMemories("");
    setMoments([]);
    setActiveMomentIndex(0);
    setTitle("");
    setUploadProgress(0);
    setUploadCount({ done: 0, total: 0 });
    setError(null);
    setSubmitted(false);
  };

  const hasContent = imageUrls.length > 0 || lifeMemories || title;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Card Preview */}
      <div
        className="relative w-full aspect-4/3 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500"
        style={{
          background: hasContent
            ? "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))"
            : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {imageUrls.length > 0 ? (
          <div className="absolute inset-0">
            <img
              src={imageUrls[activePhotoIndex]}
              alt={`Memory ${activePhotoIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

            {/* Photo navigation */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? imageUrls.length - 1 : prev - 1,
                    );
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                             bg-black/30 hover:bg-black/50 text-white flex items-center justify-center
                             transition-all z-20 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) =>
                      prev === imageUrls.length - 1 ? 0 : prev + 1,
                    );
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                             bg-black/30 hover:bg-black/50 text-white flex items-center justify-center
                             transition-all z-20 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {imageUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(i); }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activePhotoIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {imageUrls.length > 1 && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/40
                             backdrop-blur-sm text-white text-xs z-20">
                {activePhotoIndex + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/40">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Add photos to the memory book</p>
            </div>
          </div>
        )}

        {/* Title overlay */}
        {title && (
          <div className="absolute top-0 left-0 right-0 p-6 z-10">
            <h2 className="text-white text-xl font-semibold drop-shadow-lg">{title}</h2>
          </div>
        )}

        {/* Moment ticker overlay */}
        {moments.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10 max-h-[55%] overflow-y-auto">
            <div className="text-white/90 text-xs leading-relaxed drop-shadow-lg"
                 style={{ fontStyle: "italic" }}>
              &ldquo;{moments[activeMomentIndex]}&rdquo;
            </div>
            {moments.length > 1 && (
              <div className="flex gap-1 mt-2">
                {moments.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveMomentIndex(i); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === activeMomentIndex ? "bg-white" : "bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {imageUrls.length > 0 && (
        <div className="w-full flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative shrink-0 group">
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                onClick={() => setActivePhotoIndex(i)}
                className={`w-16 h-16 rounded-lg object-cover cursor-pointer transition-all border-2 ${
                  i === activePhotoIndex
                    ? "border-blue-400 opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500
                           text-white text-xs flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div className="w-full space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                      transition-all duration-200 ${
                        isDragOver
                          ? "border-blue-400 bg-blue-400/10 scale-[1.02]"
                          : "border-white/30 hover:border-white/50 hover:bg-white/5"
                      }`}
        >
          {isUploading ? (
            <div className="space-y-3">
              <svg className="animate-spin h-8 w-8 mx-auto text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-white/70 text-sm">
                Uploading {uploadCount.done} of {uploadCount.total} photos... {uploadProgress}%
              </p>
              <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-10 h-10 mx-auto text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-white/60 text-sm">
                {imageUrls.length > 0 ? "Add more photos..." : "Drop photos here or click to browse"}
              </p>
              <p className="text-white/30 text-xs">
                PNG, JPG up to 10MB each &middot; Select multiple
              </p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Extract Memories button */}
      {imageUrls.length > 0 && (
        <button
          onClick={handleExtractMemories}
          disabled={isExtracting}
          className="w-full py-3 rounded-xl border border-purple-400/30 bg-purple-400/10
                     text-purple-300 text-sm font-medium
                     hover:bg-purple-400/20 hover:border-purple-400/50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all flex items-center justify-center gap-2"
        >
          {isExtracting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Extracting memories from photos...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Extract memories from photos (AI)
            </>
          )}
        </button>
      )}

      {/* Text Inputs */}
      <div className="w-full space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your memory book a title..."
          className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5
                     text-white placeholder-white/30 text-sm
                     focus:outline-none focus:border-white/40 focus:bg-white/10
                     transition-all backdrop-blur-sm"
        />
        <textarea
          value={lifeMemories}
          onChange={(e) => {
            setLifeMemories(e.target.value);
            // Clear AI moments if user edits manually
            if (moments.length > 0) setMoments([]);
          }}
          placeholder="Paste the elderly's life memories here... their stories, wisdom, special moments, and family history."
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5
                     text-white placeholder-white/30 text-sm
                     focus:outline-none focus:border-white/40 focus:bg-white/10
                     transition-all backdrop-blur-sm resize-y"
        />
      </div>

      {/* Moments display */}
      {moments.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wide">
            Moments ({moments.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {moments.map((moment, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg border border-white/10 bg-white/5 group"
              >
                <span className="text-white/20 text-xs shrink-0 mt-0.5 font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-white/60 text-xs leading-relaxed flex-1">
                  {moment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full flex gap-3 justify-center">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !lifeMemories.trim()}
            className="px-8 py-3 rounded-full font-medium text-sm transition-all
                       bg-white/90 text-gray-900 hover:bg-white
                       disabled:opacity-30 disabled:cursor-not-allowed
                       shadow-lg shadow-black/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Memory"
            )}
          </button>
        ) : (
          <p className="text-green-400 text-sm flex items-center gap-1.5 py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Memory saved!
          </p>
        )}

        {hasContent && (
          <button
            onClick={resetCard}
            className="px-6 py-3 rounded-full border border-white/20 text-white/50 text-xs
                       hover:border-red-400/40 hover:text-red-300 transition-all"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
