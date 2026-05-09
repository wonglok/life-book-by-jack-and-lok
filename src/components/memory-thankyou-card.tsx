"use client";

import { useState, useRef, useCallback } from "react";

export interface ImageAndInspiration {
  imageUrl: string;
  description: string;
  inspiration: string;
}

export interface MemoryEntry {
  _id?: string;
  id: string;
  moments: string[];
  imageUrls: string[];
  imageAndInspiration: ImageAndInspiration[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onSubmitted?: (entry: MemoryEntry) => void;
}

export default function MemoryThankYouCard({ onSubmitted }: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [moments, setMoments] = useState<string[]>([]);
  const [activeMomentIndex, setActiveMomentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const [isGeneratingInspiration, setIsGeneratingInspiration] = useState(false);
  const [imageAndInspiration, setImageAndInspiration] = useState<
    ImageAndInspiration[]
  >([]);
  const [inspirationProgress, setInspirationProgress] = useState({
    done: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
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

  const handleGenerateInspiration = async () => {
    if (imageUrls.length === 0) return;
    setIsGeneratingInspiration(true);
    setInspirationProgress({ done: 0, total: imageUrls.length });
    setError(null);

    try {
      // 1. Generate inspiration for each photo
      const res = await fetch("/api/extract-inspiration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Inspiration generation failed");
      }

      const { imageAndInspiration: results } = await res.json();
      setImageAndInspiration(results || []);
      setInspirationProgress({
        done: imageUrls.length,
        total: imageUrls.length,
      });

      // 2. Auto-save to database
      const saveRes = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moments,
          imageUrls,
          imageAndInspiration: results || [],
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || "Auto-save failed");
      }

      const entry: MemoryEntry = await saveRes.json();
      setSubmitted(true);
      onSubmitted?.(entry);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Inspiration generation failed",
      );
    } finally {
      setIsGeneratingInspiration(false);
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

  const hasContent = imageUrls.length > 0;

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
                  <svg
                    className="w-5 h-5"
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
                  <svg
                    className="w-5 h-5"
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {imageUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activePhotoIndex
                          ? "bg-white scale-125"
                          : "bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {imageUrls.length > 1 && (
              <div
                className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/40
                             backdrop-blur-sm text-white text-xs z-20"
              >
                {activePhotoIndex + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/40">
              <svg
                className="w-16 h-16 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Add photos to the memory book</p>
            </div>
          </div>
        )}

        {/* Moment ticker overlay */}
        {moments.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10 max-h-[55%] overflow-y-auto">
            <div
              className="text-white/90 text-xs leading-relaxed drop-shadow-lg"
              style={{ fontStyle: "italic" }}
            >
              &ldquo;{moments[activeMomentIndex]}&rdquo;
            </div>
            {moments.length > 1 && (
              <div className="flex gap-1 mt-2">
                {moments.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMomentIndex(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === activeMomentIndex
                        ? "bg-white"
                        : "bg-white/30 hover:bg-white/60"
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
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
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
              <svg
                className="animate-spin h-8 w-8 mx-auto text-blue-400"
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
              <p className="text-white/70 text-sm">
                Uploading {uploadCount.done} of {uploadCount.total} photos...{" "}
                {uploadProgress}%
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
              <svg
                className="w-10 h-10 mx-auto text-white/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-white/60 text-sm">
                {imageUrls.length > 0
                  ? "Add more photos..."
                  : "Drop photos here or click to browse"}
              </p>
              <p className="text-white/30 text-xs">
                PNG, JPG up to 10MB each &middot; Select multiple
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Generate Inspiration button */}
      {imageUrls.length > 0 && (
        <button
          onClick={handleGenerateInspiration}
          disabled={isGeneratingInspiration}
          className="w-full py-3 rounded-xl border border-amber-400/30 bg-amber-400/10
                     text-amber-300 text-sm font-medium
                     hover:bg-amber-400/20 hover:border-amber-400/50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all flex items-center justify-center gap-2"
        >
          {isGeneratingInspiration ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
              Generating inspiration ({inspirationProgress.done}/
              {inspirationProgress.total})...
            </>
          ) : (
            <>
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Submit
            </>
          )}
        </button>
      )}

      {/* Inspiration cards */}
      {imageAndInspiration.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wide">
            Photo Inspiration ({imageAndInspiration.length})
          </p>
          <div className="grid gap-3">
            {imageAndInspiration.map((item, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5
                           hover:border-white/20 transition-all"
              >
                <img
                  src={item.imageUrl}
                  alt={`Photo ${i + 1}`}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  {item.description && (
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">
                        Description
                      </p>
                      <p className="text-white/60 text-xs leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}
                  {item.inspiration && (
                    <div>
                      <p className="text-amber-300/50 text-xs uppercase tracking-wide mb-0.5">
                        Inspiration
                      </p>
                      <p className="text-amber-200/70 text-xs leading-relaxed italic">
                        &ldquo;{item.inspiration}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {submitted && (
          <p className="text-green-400 text-sm flex items-center gap-1.5 py-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Memory saved!
          </p>
        )}
      </div>
    </div>
  );
}
