"use client";

import { useState, useRef, useCallback } from "react";

export default function MemoryThankYouCard() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToS3 = useCallback(async (file: File): Promise<string> => {
    // 1. Get presigned POST URL from our API
    setUploadProgress(10);
    const presignedRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!presignedRes.ok) {
      const err = await presignedRes.json();
      throw new Error(err.error || "Failed to get upload URL");
    }

    const { url, fields, cdnUrl } = await presignedRes.json();
    setUploadProgress(20);

    // 2. Upload directly to S3 using presigned POST
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value as string);
    }
    formData.append("file", file);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          // Progress from 20% to 90% during upload phase
          const pct = 20 + Math.round((e.loaded / e.total) * 70);
          setUploadProgress(pct);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () =>
        reject(new Error("Network error during upload")),
      );
      xhr.send(formData);
    });

    setUploadProgress(100);
    // Return CDN URL if available, otherwise construct S3 URL
    return cdnUrl || `${url}${fields.key}`;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10MB");
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const url = await uploadToS3(file);
        setImageUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadToS3],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const resetCard = () => {
    setImageUrl(null);
    setMessage("");
    setAuthor("");
    setUploadProgress(0);
    setError(null);
  };

  const hasContent = imageUrl || message || author;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
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
        {imageUrl ? (
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt="Memory"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ) : (
          /* Empty state */
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
              <p className="text-sm">Add a photo to your memory card</p>
            </div>
          </div>
        )}

        {/* Message overlay */}
        {message && (
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <p className="text-white text-lg leading-relaxed font-light italic drop-shadow-lg">
              &ldquo;{message}&rdquo;
            </p>
            {author && (
              <p className="text-white/80 text-sm mt-2 drop-shadow-lg">
                — {author}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="w-full space-y-4">
        {!imageUrl ? (
          <>
            {/* Drag & drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${
                  isDragOver
                    ? "border-blue-400 bg-blue-400/10 scale-[1.02]"
                    : "border-white/30 hover:border-white/50 hover:bg-white/5"
                }
              `}
            >
              {isUploading ? (
                <div className="space-y-3">
                  {/* Spinner */}
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
                    Uploading... {uploadProgress}%
                  </p>
                  {/* Progress bar */}
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
                    Drop your photo here or click to browse
                  </p>
                  <p className="text-white/30 text-xs">PNG, JPG up to 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-lg border border-white/20 text-white/60 text-sm
                       hover:bg-white/10 hover:text-white/80 transition-all"
          >
            Change photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </button>
        )}
      </div>

      {/* Text Inputs */}
      <div className="w-full space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your thank you message..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5
                     text-white placeholder-white/30 text-sm resize-none
                     focus:outline-none focus:border-white/40 focus:bg-white/10
                     transition-all backdrop-blur-sm"
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/5
                     text-white placeholder-white/30 text-sm
                     focus:outline-none focus:border-white/40 focus:bg-white/10
                     transition-all backdrop-blur-sm"
        />
      </div>

      {/* Actions */}
      {hasContent && (
        <button
          onClick={resetCard}
          className="px-6 py-2 rounded-full border border-white/20 text-white/50 text-xs
                     hover:border-red-400/40 hover:text-red-300 transition-all"
        >
          Reset card
        </button>
      )}
    </div>
  );
}
