"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Layers,
  FileText,
  Link2,
  ExternalLink,
  FileImage,
  Target,
  Handshake,
  User,
  Calendar,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

function DetailCard({ icon: Icon, label, value, subtext, accent }) {
  return (
    <div
      className={`rounded-[24px] p-6 flex flex-col justify-between min-h-[140px] ${
        accent
          ? "bg-[#5542F6] text-white shadow-xl shadow-indigo-500/20"
          : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none"
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`font-medium text-sm ${
            accent ? "text-indigo-200" : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              accent
                ? "bg-white dark:bg-slate-950/20"
                : "bg-slate-50 dark:bg-slate-900 text-slate-400"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <span
          className={`text-lg font-bold ${
            accent ? "text-white" : "text-slate-900 dark:text-slate-50"
          }`}
        >
          {value}
        </span>
        {subtext && (
          <p
            className={`text-xs mt-0.5 ${
              accent ? "text-indigo-200" : "text-slate-400"
            }`}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function isFileUrl(url) {
  if (!url) return false;
  const fileExts = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".mp4", ".mov"];
  const lower = url.toLowerCase();
  return fileExts.some((ext) => lower.includes(ext));
}

export default function SampleDetailContent({ initialSample }) {
  const [sample] = useState(initialSample);

  if (!sample) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Sample data unavailable.</p>
      </div>
    );
  }

  const { name, description, links: rawLinks, createdBy, createdAt, leadSamples = [], dealSamples = [] } = sample;
  const links = Array.isArray(rawLinks) ? rawLinks : [];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <PageHeader
        title="Sample Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Samples", href: "/admin/samples" },
          { label: name },
        ]}
        actions={
          <Link
            href={`/admin/samples/${sample.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Sample
          </Link>
        }
      />

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        {/* Gradient Banner */}
        <div className="h-28 bg-gradient-to-r from-violet-500 to-purple-600" />

        {/* Content Section */}
        <div className="p-6 lg:p-8">
          <div className="flex items-start gap-6">
            {/* Icon Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0 -mt-10">
              <Layers className="w-10 h-10 text-white" />
            </div>

            {/* Sample Info */}
            <div className="flex-1 -mt-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">{name}</h1>
              {createdBy && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Created by {createdBy.firstName} {createdBy.lastName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DetailCard
          icon={Link2}
          label="Links"
          value={`${links.length} link${links.length !== 1 ? "s" : ""}`}
        />
        <DetailCard
          icon={Target}
          label="Leads"
          value={`${leadSamples.length} lead${leadSamples.length !== 1 ? "s" : ""}`}
        />
        <DetailCard
          icon={Handshake}
          label="Deals"
          value={`${dealSamples.length} deal${dealSamples.length !== 1 ? "s" : ""}`}
        />
        <DetailCard
          icon={Calendar}
          label="Created"
          value={createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
          accent
        />
      </div>

      {/* Two Column Grid - Description & Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Description Card */}
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Description</h2>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {description || <span className="text-slate-400 italic">No description added.</span>}
          </p>
        </div>

        {/* Links Card */}
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Links</h2>
          </div>
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
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
          ) : (
            <p className="text-sm text-slate-400 italic">No links added.</p>
          )}
        </div>
      </div>

      {/* Linked Leads & Deals */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Linked Leads & Deals</h2>
        </div>

        <div className="space-y-3">
          {leadSamples && leadSamples.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 gap-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span>Shared with <strong className="text-slate-900 dark:text-white font-semibold">{leadSamples.length}</strong> lead{leadSamples.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ) : null}

          {dealSamples && dealSamples.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 gap-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Attached to <strong className="text-slate-900 dark:text-white font-semibold">{dealSamples.length}</strong> deal{dealSamples.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ) : null}

          {(!leadSamples || leadSamples.length === 0) && (!dealSamples || dealSamples.length === 0) ? (
            <p className="text-sm text-slate-400 italic">
              This sample hasn't been linked to any leads or deals yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
