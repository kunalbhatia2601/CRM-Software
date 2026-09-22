"use client";

import { createPackage } from "@/actions/packages.action";
import PackageForm from "@/components/packages/PackageForm";

export default function CreatePackageContent() {
  return <PackageForm onSubmit={createPackage} submitLabel="Create Package" />;
}
