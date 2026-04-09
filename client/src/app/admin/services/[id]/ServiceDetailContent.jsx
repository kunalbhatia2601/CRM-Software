"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  DollarSign,
  PackageCheck,
  FileText,
  ListChecks,
  CheckCircle2,
  XCircle,
  Handshake,
  FolderKanban,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

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
          suppressHydrationWarning
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

export default function ServiceDetailContent({ initialService }) {
  const { format } = useSite();
  const [service] = useState(initialService);

  if (!service) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Service data unavailable.</p>
      </div>
    );
  }

  const { name, price, salePrice, isActive, description, points, dealServices = [], projectServices = [] } = service;

  const effectivePrice = salePrice || price;
  const pointsList = Array.isArray(points) ? points : [];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <PageHeader
        title="Service Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Services", href: "/admin/services" },
          { label: name },
        ]}
        actions={
          <Link
            href={`/admin/services/${service.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Service
          </Link>
        }
      />

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        {/* Gradient Banner */}
        <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-600" />

        {/* Content Section */}
        <div className="p-6 lg:p-8">
          <div className="flex items-start gap-6">
            {/* Icon Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0 -mt-10">
              <PackageCheck className="w-10 h-10 text-white" />
            </div>

            {/* Service Info */}
            <div className="flex-1 -mt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{name}</h1>
                <Badge value={isActive ? "ACTIVE" : "INACTIVE"} />
              </div>

              {/* Price Display */}
              <div className="mt-4">
                {salePrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-emerald-600" suppressHydrationWarning>
                      {format(salePrice)}
                    </span>
                    <span className="text-lg text-slate-400 line-through" suppressHydrationWarning>
                      {format(price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
                    {format(price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DetailCard
          icon={DollarSign}
          label="Price"
          value={format(price)}
        />
        <DetailCard
          icon={DollarSign}
          label="Sale Price"
          value={salePrice ? format(salePrice) : "N/A"}
        />
        <DetailCard
          icon={ListChecks}
          label="Includes"
          value={`${pointsList.length} items`}
        />
        <DetailCard
          icon={PackageCheck}
          label="Status"
          value={isActive ? "Active" : "Inactive"}
          accent={isActive}
        />
      </div>

      {/* Two Column Grid - Description & What's Included */}
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

        {/* What's Included Card */}
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">What's Included</h2>
          </div>
          {pointsList.length > 0 ? (
            <ul className="space-y-3">
              {pointsList.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No items listed.</p>
          )}
        </div>
      </div>

      {/* Usage Section - Linked Deals & Projects */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Handshake className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Linked Deals & Projects</h2>
        </div>

        <div className="space-y-3">
          {dealServices && dealServices.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 gap-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Handshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Included in <strong className="text-slate-900 dark:text-white font-semibold">{dealServices.length}</strong> deal{dealServices.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ) : null}

          {projectServices && projectServices.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 gap-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>Billed in <strong className="text-slate-900 dark:text-white font-semibold">{projectServices.length}</strong> project{projectServices.length !== 1 ? 's' : ''}.</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                <span className="text-slate-500 dark:text-slate-400">Avg. Revenue / Project:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                  {format(projectServices.reduce((acc, curr) => acc + (curr.price * curr.quantity || 0), 0) / projectServices.length)}
                </span>
              </div>
            </div>
          ) : null}

          {(!dealServices || dealServices.length === 0) && (!projectServices || projectServices.length === 0) ? (
            <p className="text-sm text-slate-400 italic">
              This service hasn't been linked to any deals or projects yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
