"use client";

import { CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";

const EMPLOYED_DOCS = [
  "Passport or Government-issued Photo ID",
  "Proof of Address (utility bill or bank letter, last 3 months)",
  "Latest 3 Months Payslips",
  "Last 3 Months Bank Statements (salary account)",
  "Credit File (Experian / Equifax / TransUnion)",
];

const SELF_EMPLOYED_DOCS = [
  "Passport or Government-issued Photo ID",
  "Proof of Address (utility bill or bank letter, last 3 months)",
  "Last 3 Months Business Bank Statements",
  "SA302 for Last 2 Years",
  "Tax Year Overview (TYO) for Last 2 Years",
  "Credit File (Experian / Equifax / TransUnion)",
];

const CONTRACTOR_DOCS = [
  "Passport or Government-issued Photo ID",
  "Proof of Address (utility bill or bank letter, last 3 months)",
  "Current Contract (and previous if within 3 months of renewal)",
  "Last 3 Months Bank Statements",
  "Credit File (Experian / Equifax / TransUnion)",
];

function getDocList(employment: string | null): string[] {
  const e = (employment ?? "").toLowerCase();
  if (e === "self_employed" || e === "self-employed") return SELF_EMPLOYED_DOCS;
  if (e === "contractor") return CONTRACTOR_DOCS;
  return EMPLOYED_DOCS;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string | null): string {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📑";
  return "📄";
}

interface UploadedDoc {
  id: string;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  uploaded_at: string;
}

interface AppInfo {
  applicant_full_name: string;
  employment: string | null;
  adviser_name: string;
  documents: UploadedDoc[];
}

interface FileEntry {
  id: string;
  file: File;
  state: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function UploadPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);

  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [queue, setQueue] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/upload?applicationId=${applicationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        setAppInfo(data as AppInfo);
        setUploadedDocs(data.documents ?? []);
      })
      .catch(() => setNotFound(true));
  }, [applicationId]);

  const enqueue = useCallback((files: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(files).map((f) => ({
      id: `${Date.now()}_${Math.random()}`,
      file: f,
      state: "pending" as const,
    }));
    setQueue((prev) => [...prev, ...entries]);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) enqueue(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) enqueue(e.target.files);
    e.target.value = "";
  };

  const removeFromQueue = (id: string) =>
    setQueue((prev) => prev.filter((f) => f.id !== id));

  const uploadFile = async (entry: FileEntry) => {
    if (entry.file.size > 10 * 1024 * 1024) {
      setQueue((prev) =>
        prev.map((f) =>
          f.id === entry.id ? { ...f, state: "error", error: "File exceeds 10 MB limit." } : f
        )
      );
      return;
    }

    setQueue((prev) =>
      prev.map((f) => (f.id === entry.id ? { ...f, state: "uploading" } : f))
    );

    const formData = new FormData();
    formData.append("file", entry.file);
    formData.append("applicationId", applicationId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json() as { ok?: boolean; error?: string; document?: UploadedDoc };

      if (!res.ok || json.error) {
        setQueue((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, state: "error", error: json.error ?? "Upload failed." } : f
          )
        );
      } else {
        setQueue((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, state: "done" } : f))
        );
        if (json.document) {
          setUploadedDocs((prev) => [json.document!, ...prev]);
        }
      }
    } catch {
      setQueue((prev) =>
        prev.map((f) =>
          f.id === entry.id ? { ...f, state: "error", error: "Network error." } : f
        )
      );
    }
  };

  const uploadAll = () => {
    queue.filter((f) => f.state === "pending").forEach(uploadFile);
  };

  const pendingCount = queue.filter((f) => f.state === "pending").length;
  const uploadingCount = queue.filter((f) => f.state === "uploading").length;

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Link not found</h2>
          <p className="text-sm text-gray-500">
            This upload link may have expired or is incorrect. Please contact your adviser.
          </p>
        </div>
      </div>
    );
  }

  if (!appInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const docList = getDocList(appInfo.employment);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-base">
              {appInfo.applicant_full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Document Upload — {appInfo.applicant_full_name}
              </h1>
              <p className="text-sm text-gray-500">
                Sent by {appInfo.adviser_name}
              </p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText size={15} className="text-indigo-600" />
            <h2 className="font-bold text-sm text-gray-900">Documents you need to provide</h2>
          </div>
          <ul className="px-5 py-4 space-y-2.5">
            {docList.map((doc, i) => {
              const uploaded = uploadedDocs.length > i;
              return (
                <li key={i} className="flex items-start gap-3">
                  {uploaded ? (
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${uploaded ? "text-green-700 line-through" : "text-gray-700"}`}>
                    {doc}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-700">
              Upload each document as a clear scan or photo (PDF or image). Max 10 MB per file.
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed cursor-pointer transition select-none p-10 flex flex-col items-center justify-center gap-3 ${
            dragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <Upload size={22} className="text-indigo-600" />
          </div>
          <p className="font-semibold text-sm text-gray-800">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG — up to 10 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
            onChange={onInputChange}
            className="hidden"
          />
        </div>

        {/* Queue */}
        {queue.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900">
                Ready to upload ({queue.length})
              </h2>
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  disabled={uploadingCount > 0}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {uploadingCount > 0 ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Upload All ({pendingCount})
                    </>
                  )}
                </button>
              )}
            </div>
            <ul className="divide-y divide-gray-100">
              {queue.map((entry) => (
                <li key={entry.id} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="text-xl">{fileIcon(entry.file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(entry.file.size)}</p>
                    {entry.error && (
                      <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {entry.state === "pending" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromQueue(entry.id); }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                    {entry.state === "uploading" && (
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                    )}
                    {entry.state === "done" && (
                      <CheckCircle2 size={16} className="text-green-500" />
                    )}
                    {entry.state === "error" && (
                      <span className="text-xs font-semibold text-red-500">Failed</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Already uploaded */}
        {uploadedDocs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />
              <h2 className="font-bold text-sm text-gray-900">
                Uploaded ({uploadedDocs.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {uploadedDocs.map((doc) => (
                <li key={doc.id} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="text-xl">{fileIcon(doc.mime_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {doc.original_filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {doc.size_bytes ? formatBytes(doc.size_bytes) : ""} ·{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Your documents are encrypted and shared only with your adviser.
        </p>
      </div>
    </div>
  );
}
