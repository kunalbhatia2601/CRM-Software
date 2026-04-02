"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Layers,
  Plus,
  X,
  ExternalLink,
  Link2,
  Upload,
  Trash2,
  FileImage,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  getSamplesDropdown,
  createSample,
  attachSamplesToLead,
  detachSampleFromLead,
  attachSamplesToDeal,
  detachSampleFromDeal,
} from "@/actions/samples.action";
import { useUpload } from "@/hooks/useUpload";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";

/**
 * Reusable Samples Section for Lead and Deal detail pages.
 *
 * Props:
 *  - samples: initial sample list
 *  - entityType: "lead" | "deal"
 *  - entityId: the lead or deal ID
 *  - showToast: (type, message) => void
 *  - readOnly: optional, disables editing
 */
export default function SamplesSection({
  samples: initialSamples = [],
  entityType,
  entityId,
  showToast,
  readOnly = false,
}) {
  const [samples, setSamples] = useState(initialSamples);
  const [isPending, startTransition] = useTransition();

  // Attach existing sample
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [allSamples, setAllSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");

  // Create new sample
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSampleName, setNewSampleName] = useState("");
  const [newSampleDescription, setNewSampleDescription] = useState("");
  const [newSampleLinks, setNewSampleLinks] = useState([{ label: "", url: "" }]);

  // Upload
  const { upload, uploading, progress } = useUpload();

  // Expanded sample cards
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (showAttachModal && allSamples.length === 0) {
      getSamplesDropdown().then(setAllSamples);
    }
  }, [showAttachModal]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const attachFn = entityType === "lead" ? attachSamplesToLead : attachSamplesToDeal;
  const detachFn = entityType === "lead" ? detachSampleFromLead : detachSampleFromDeal;

  const handleAttach = () => {
    if (!selectedSampleId) return;
    startTransition(async () => {
      const result = await attachFn(entityId, [selectedSampleId]);
      if (result.success) {
        // Add the sample to local state
        const attached = allSamples.find((s) => s.id === selectedSampleId);
        if (attached && !samples.find((s) => s.id === attached.id)) {
          setSamples((prev) => [attached, ...prev]);
        }
        setSelectedSampleId("");
        setShowAttachModal(false);
        showToast("success", "Sample attached");
      } else {
        showToast("error", result.error || "Failed to attach sample");
      }
    });
  };

  const handleDetach = (sampleId) => {
    startTransition(async () => {
      const result = await detachFn(entityId, sampleId);
      if (result.success) {
        setSamples((prev) => prev.filter((s) => s.id !== sampleId));
        showToast("success", "Sample detached");
      } else {
        showToast("error", result.error || "Failed to detach sample");
      }
    });
  };

  // ─── New Link Management ───
  const addLinkRow = () => {
    setNewSampleLinks((prev) => [...prev, { label: "", url: "" }]);
  };

  const removeLinkRow = (idx) => {
    setNewSampleLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLink = (idx, field, value) => {
    setNewSampleLinks((prev) =>
      prev.map((link, i) => (i === idx ? { ...link, [field]: value } : link))
    );
  };

  const handleUploadForLink = async (idx) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await upload(file);
      if (result) {
        updateLink(idx, "url", result.fileUrl);
        if (!newSampleLinks[idx].label) {
          updateLink(idx, "label", file.name);
        }
      } else {
        showToast("error", "Upload failed");
      }
    };
    input.click();
  };

  const handleCreateAndAttach = () => {
    if (!newSampleName.trim()) {
      showToast("error", "Sample name is required");
      return;
    }

    const validLinks = newSampleLinks.filter((l) => l.label.trim() && l.url.trim());
    if (validLinks.length === 0) {
      showToast("error", "At least one link is required");
      return;
    }

    startTransition(async () => {
      // 1. Create the sample
      const createResult = await createSample({
        name: newSampleName.trim(),
        description: newSampleDescription.trim() || null,
        links: validLinks.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
      });

      if (!createResult.success) {
        showToast("error", createResult.error || "Failed to create sample");
        return;
      }

      // 2. Attach it to the entity
      const attachResult = await attachFn(entityId, [createResult.data.id]);
      if (attachResult.success) {
        setSamples((prev) => [createResult.data, ...prev]);
        // Also add to allSamples cache
        setAllSamples((prev) => [...prev, createResult.data]);
        resetCreateForm();
        setShowCreateModal(false);
        showToast("success", "Sample created and attached");
      } else {
        showToast("error", attachResult.error || "Failed to attach sample");
      }
    });
  };

  const resetCreateForm = () => {
    setNewSampleName("");
    setNewSampleDescription("");
    setNewSampleLinks([{ label: "", url: "" }]);
  };

  // Filter out already-attached samples
  const attachableSamples = allSamples.filter(
    (s) => !samples.find((attached) => attached.id === s.id)
  );

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Samples</h3>
            <p className="text-xs text-slate-400">Work samples shared with this {entityType}</p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAttachModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              <Link2 className="w-4 h-4" />
              Attach
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-all"
            >
              <Plus className="w-4 h-4" />
              New Sample
            </button>
          </div>
        )}
      </div>

      {/* Samples List */}
      {samples.length > 0 ? (
        <div className="space-y-3">
          {samples.map((sample) => {
            const links = Array.isArray(sample.links) ? sample.links : [];
            const isExpanded = expanded[sample.id];

            return (
              <div
                key={sample.id}
                className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors overflow-hidden"
              >
                {/* Sample Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {sample.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {sample.name}
                      </p>
                      {sample.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{sample.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {links.length} link{links.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(sample.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => handleDetach(sample.id)}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Detach sample"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Links */}
                {isExpanded && links.length > 0 && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2 mt-3">
                      {links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                            {isFileUrl(link.url) ? (
                              <FileImage className="w-4 h-4 text-violet-500" />
                            ) : (
                              <ExternalLink className="w-4 h-4 text-violet-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                              {link.label}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{link.url}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-violet-400 shrink-0 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No samples attached yet.</p>
          {!readOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Add your first sample
            </button>
          )}
        </div>
      )}

      {/* ═══ Attach Existing Sample Modal ═══ */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAttachModal(false)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Attach Sample</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select an existing sample to attach.</p>
              </div>
            </div>

            <SettingsSelect
              label="Sample"
              icon={Layers}
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              options={[
                { value: "", label: "— Select Sample —" },
                ...attachableSamples.map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ]}
            />

            {attachableSamples.length === 0 && allSamples.length > 0 && (
              <p className="text-xs text-amber-500 mt-2">All samples are already attached.</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAttachModal(false); setSelectedSampleId(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAttach}
                disabled={isPending || !selectedSampleId}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link2 className="w-4 h-4" />
                {isPending ? "Attaching..." : "Attach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create New Sample Modal ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Plus className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">New Sample</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Create a sample and attach it to this {entityType}.</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <SettingsInput
                label="Sample Name *"
                icon={Layers}
                value={newSampleName}
                onChange={(e) => setNewSampleName(e.target.value)}
                placeholder="e.g., Website Redesign Portfolio"
              />

              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Description</label>
                <textarea
                  value={newSampleDescription}
                  onChange={(e) => setNewSampleDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description of this sample..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Links *</label>
                  <button
                    onClick={addLinkRow}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Link
                  </button>
                </div>

                <div className="space-y-3">
                  {newSampleLinks.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(idx, "label", e.target.value)}
                          placeholder="Label (e.g., Homepage Design)"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400/20 focus:border-indigo-500 transition-all"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => updateLink(idx, "url", e.target.value)}
                            placeholder="URL or upload a file"
                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400/20 focus:border-indigo-500 transition-all"
                          />
                          <button
                            onClick={() => handleUploadForLink(idx)}
                            disabled={uploading}
                            className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-colors disabled:opacity-50"
                            title="Upload file"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        </div>
                        {uploading && idx === newSampleLinks.length - 1 && (
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-violet-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {newSampleLinks.length > 1 && (
                        <button
                          onClick={() => removeLinkRow(idx)}
                          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors mt-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAndAttach}
                disabled={isPending || uploading || !newSampleName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {isPending ? "Creating..." : "Create & Attach"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple heuristic to detect if a URL is a file upload vs external link
 */
function isFileUrl(url) {
  if (!url) return false;
  const fileExts = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".mp4", ".mov"];
  const lower = url.toLowerCase();
  return fileExts.some((ext) => lower.includes(ext));
}
