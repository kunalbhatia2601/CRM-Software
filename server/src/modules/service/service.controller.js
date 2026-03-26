import catchAsync from "../../utils/catchAsync.js";
import serviceService from "./service.service.js";

const createService = catchAsync(async (req, res) => {
  const service = await serviceService.createService(req.body);
  res.status(201).json({ success: true, data: service });
});

const listServices = catchAsync(async (req, res) => {
  const result = await serviceService.listServices(req.query);
  res.json({ success: true, data: result });
});

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);
  res.json({ success: true, data: service });
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  res.json({ success: true, data: service });
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteService(req.params.id);
  res.json({ success: true, message: "Service deleted" });
});

const getActiveServices = catchAsync(async (req, res) => {
  const services = await serviceService.getActiveServices();
  res.json({ success: true, data: services });
});

export default { createService, listServices, getService, updateService, deleteService, getActiveServices };
