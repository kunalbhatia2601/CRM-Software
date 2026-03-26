import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-slate-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">{title}</h1>
        {description && <p className="text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
