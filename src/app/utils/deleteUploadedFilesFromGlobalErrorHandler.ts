/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";

/**
 * Cleans up uploaded files from Cloudinary when an error occurs.
 *
 * Works with two upload strategies:
 * 1. CloudinaryStorage (multer-storage-cloudinary) — files have `file.path` (Cloudinary URL)
 * 2. memoryStorage — files are uploaded manually in service layer,
 *    and the Cloudinary URL is stored in `req.cloudinaryUrls` by the service if needed.
 */
export const deleteUploadedFilesFromGlobalErrorHandler = async (
  req: Request,
) => {
  try {
    const requestWithUploads = req as Request & {
      file?: { path?: string };
      files?:
        | Array<{ path?: string }>
        | Record<string, Array<{ path?: string }>>;
    };

    const filesToDelete: string[] = [];

    // Strategy 1: CloudinaryStorage — file.path contains the Cloudinary URL
    if (
      requestWithUploads.file &&
      requestWithUploads.file.path &&
      requestWithUploads.file.path.startsWith("http")
    ) {
      filesToDelete.push(requestWithUploads.file.path);
    } else if (
      requestWithUploads.files &&
      typeof requestWithUploads.files === "object" &&
      !Array.isArray(requestWithUploads.files)
    ) {
      Object.values(requestWithUploads.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file.path && file.path.startsWith("http")) {
              filesToDelete.push(file.path);
            }
          });
        }
      });
    } else if (
      requestWithUploads.files &&
      Array.isArray(requestWithUploads.files)
    ) {
      requestWithUploads.files.forEach((file) => {
        if (file.path && file.path.startsWith("http")) {
          filesToDelete.push(file.path);
        }
      });
    }

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map((url) => deleteFileFromCloudinary(url)),
      );
      console.log(
        `Deleted ${filesToDelete.length} uploaded file(s) from Cloudinary due to error.`,
      );
    }
  } catch (error: any) {
    console.error(
      "Error deleting uploaded files from Global Error Handler:",
      error.message,
    );
  }
};
