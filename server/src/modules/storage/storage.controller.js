import storageService from "./storage.service.js";
import catchAsync from "../../utils/catchAsync.js";

class StorageController {
  /**
   * GET /api/storage/upload-config
   * Returns upload configuration based on current storage provider.
   * For S3/R2: returns a presigned PUT URL so the client uploads directly.
   * For CUSTOM: returns the POST URL, file key, and URL response key.
   * For LOCAL: returns the local upload endpoint URL.
   *
   * Query: ?filename=report.pdf&contentType=application/pdf&fileSize=1048576
   */
  getUploadConfig = catchAsync(async (req, res) => {
    const { filename, contentType, fileSize } = req.query;
    const config = await storageService.getUploadConfig(filename, contentType, fileSize);
    res.json({ success: true, data: config });
  });

  /**
   * POST /api/storage/upload/local
   * Handles local file upload via streaming.
   * The request body IS the raw file (not multipart form).
   * File name is passed via x-filename header.
   *
   * This endpoint is only hit when provider is LOCAL.
   */
  uploadLocal = catchAsync(async (req, res) => {
    const result = await storageService.handleLocalUpload(req);
    res.json({ success: true, data: result });
  });

  /**
   * GET /api/storage/files/*
   * Serves locally stored files.
   */
  serveFile = catchAsync(async (req, res) => {
    const key = req.params[0]; // Everything after /files/
    const filePath = await storageService.getLocalFile(key);
    res.sendFile(filePath);
  });
}

export default new StorageController();
