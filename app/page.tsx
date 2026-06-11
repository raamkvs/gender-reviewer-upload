"use client";

import { useEffect, useRef, useState } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [customChatId, setCustomChatId] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/chat-ids")
      .then((r) => r.json())
      .then((data) => setChatIds(data.chat_ids ?? []))
      .catch(() => setChatIds([]));
  }, []);

  const activeChatId = selectedChatId === "__custom__" ? customChatId.trim() : selectedChatId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChatId) {
      setMessage("Please select or enter a session ID.");
      return;
    }
    if (!files || files.length === 0) {
      setMessage("Please choose at least one PDF file.");
      return;
    }

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("chat_id_topic", activeChatId);
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Upload failed. Please try again.");
        return;
      }

      setStatus("success");
      setUploadedCount(data.uploaded ?? files.length);
      setMessage(
        `${data.uploaded ?? files.length} file(s) uploaded successfully for session "${activeChatId}". ` +
          "Your chatbot can now trigger a rerun to process them."
      );
      setFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-undp-blue-pale to-white">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-undp-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-undp-blue to-undp-blue-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gender Reviewer — Document Upload
          </h1>
          <p className="mt-2 text-undp-blue-light text-sm leading-relaxed">
            Upload PDFs that couldn&apos;t be downloaded automatically. Your
            chatbot will process them on the next rerun.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {/* Session selector */}
          <div>
            <label className="block text-sm font-semibold text-undp-black mb-2">
              Session ID (chat_id_topic)
            </label>
            <select
              className="w-full border-2 border-undp-gray-300 rounded-lg px-4 py-2.5 text-sm text-undp-black focus:outline-none focus:ring-2 focus:ring-undp-blue focus:border-transparent transition-all"
              value={selectedChatId}
              onChange={(e) => setSelectedChatId(e.target.value)}
            >
              <option value="">— Select a session —</option>
              {chatIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
              <option value="__custom__">Enter manually…</option>
            </select>

            {selectedChatId === "__custom__" && (
              <input
                className="mt-3 w-full border-2 border-undp-gray-300 rounded-lg px-4 py-2.5 text-sm text-undp-black focus:outline-none focus:ring-2 focus:ring-undp-blue focus:border-transparent transition-all"
                placeholder="e.g. climate-gender-2024"
                value={customChatId}
                onChange={(e) => setCustomChatId(e.target.value)}
              />
            )}
          </div>

          {/* File input */}
          <div>
            <label className="block text-sm font-semibold text-undp-black mb-2">
              PDF files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="block w-full text-sm text-undp-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-undp-blue file:text-white hover:file:bg-undp-blue-dark cursor-pointer transition-all"
              onChange={(e) => setFiles(e.target.files)}
            />
            {files && files.length > 0 && (
              <p className="mt-2 text-xs text-undp-gray-600 font-medium">
                {files.length} file(s) selected
              </p>
            )}
          </div>

          {/* Feedback */}
          {message && (
            <div
              className={`rounded-lg px-4 py-3.5 text-sm font-medium ${
                status === "success"
                  ? "bg-green-50 text-green-800 border-2 border-green-200"
                  : status === "error"
                  ? "bg-red-50 text-red-800 border-2 border-red-200"
                  : "bg-undp-blue-pale text-undp-blue-dark border-2 border-undp-blue-light"
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "uploading"}
            className="w-full bg-gradient-to-r from-undp-blue to-undp-blue-dark text-white rounded-lg py-3 text-sm font-bold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
          >
            {status === "uploading" ? "Uploading…" : "Upload Documents"}
          </button>
        </form>
      </div>
    </main>
  );
}
