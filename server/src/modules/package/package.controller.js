import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import packageService from "./package.service.js";

const createPackage = catchAsync(async (req, res) => {
  const pkg = await packageService.createPackage(req.body);
  return created(res, "Package created successfully", pkg);
});

const listPackages = catchAsync(async (req, res) => {
  const result = await packageService.listPackages(req.query);
  return ok(res, "Packages retrieved", result);
});

const getPackage = catchAsync(async (req, res) => {
  const pkg = await packageService.getPackageById(req.params.id);
  return ok(res, "Package retrieved", pkg);
});

const updatePackage = catchAsync(async (req, res) => {
  const pkg = await packageService.updatePackage(req.params.id, req.body);
  return ok(res, "Package updated successfully", pkg);
});

const deletePackage = catchAsync(async (req, res) => {
  await packageService.deletePackage(req.params.id);
  return ok(res, "Package deleted successfully");
});

const getActivePackages = catchAsync(async (req, res) => {
  const packages = await packageService.getActivePackages();
  return ok(res, "Active packages retrieved", packages);
});

export default { createPackage, listPackages, getPackage, updatePackage, deletePackage, getActivePackages };
