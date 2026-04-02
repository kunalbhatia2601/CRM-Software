"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  X,
  Upload,
  Link2,
} from "lucide-react";
import { updateSample } from "@/actions/samples.action";
import { useUpload } from "@/hooks/useUpload";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsButton from "@/components/settings/SettingsButton";

export default function EditSampleContent({ sample }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const { upload, uploading, progress } = useUpload();

  const initialLinks = Array.isArray(sample.links) && sample.links.length > 0
    ? sample.links
    : [{ label: "", url: "" }];

  const [form, setForm] = useState({
    name: sample.name || "",
    description: sample.description || "",
    links: initialLinks,
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Link Management ───
  const addLink = () => {
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, { label: "", url: "" }],
    }));
  };

  const removeLink = (index) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const updateLink = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const handleUploadForLink = async (index) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await upload(file);
      if (result) {
        updateLink(index, "url", result.fileUrl);
        if (!form.links[index].label) {
          updateLink(index, "label", file.name);
        }
      } else {
        showToast("error", "Upload failed");
      }
    };
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("error", "Sample name is required.");
      return;
    }

    const validLinks = form.links.filter((l) => l.label.trim() && l.url.trim());
    if (validLinks.length === 0) {
      showToast("error", "At least one link with label and URL is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      links: validLinks.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
    };

    startTransition(async () => {
      const result = await updateSample(sample.id, payload);

      if (result.success) {
        showToast("success", "Sample updated successfully!");
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        showToast("error", result.error || "Failed to update sample.");
      }
    });
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/owner/dashboard" },
    { label: "Samples", href: "/owner/samples" },
    { label: sample.name, href: `/owner/samples/${sample.id}` },
    { label: "Edit" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} />}

      <PageHeader
        title={`Edit — ${sample.name}`}
        description="Update sample details and links."
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sample Info */}
        <SettingsCard
          title="Sample Info"
          description="Basic sample details."
        >
          <SettingsInput
            label="Sample Name"
            placeholder="e.g., Website Redesign Portfolio"
            icon={Layers}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe what this sample showcases..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
              rows="4"
            />
          </div>
        </SettingsCard>

        {/* Links */}
        <SettingsCard
          title="Links"
          description="Manage links and file uploads for this sample."
        >
          <div className="space-y-3">
            {form.links.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(idx, "label", e.target.value)}
                    placeholder="Label (e.g., Homepage Design)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(idx, "url", e.target.value)}
                      placeholder="URL or upload a file"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUploadForLink(idx)}
                      disabled={uploading}
                      className="shrink-0 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-colors disabled:opacity-50"
                      title="Upload file"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  {uploading && idx === form.links.length - 1 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-violet-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {form.links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white rounded-xl text-sm font-semibold hover:bg-[#4636d4] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Link
          </button>
        </SettingsCard>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <SettingsButton
            label="Save Changes"
            isPending={isPending || uploading}
            onClick={() => {}}
          />
        </div>
      </form>
    </div>
  );
}
