"use client";

import { updatePackage } from "@/actions/packages.action";
import PackageForm from "@/components/packages/PackageForm";

export default function EditPackageContent({ pkg }) {
  return (
    <PackageForm
      initialPackage={pkg}
      onSubmit={(payload) => updatePackage(pkg.id, payload)}
      submitLabel="Save Changes"
    />
  );
}
