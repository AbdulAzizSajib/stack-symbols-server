import status from "http-status";
import { EventType, Prisma, Visibility } from "../../../generated/prisma/client";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { generateSvgSlug } from "../../utils/generateSvgSlug";
import { buildMeta, buildQuery } from "../../utils/queryBuilder";
import { formatSvg, SvgFormatOptions } from "../../utils/svgFormatter";
import { sanitizeSvg } from "../../utils/svgSanitizer";
import { validateSvg } from "../../utils/svgValidator";

interface SvgInputPayload {
  svgContent: string;
  title?: string | undefined;
  visibility?: Visibility | undefined;
  sourceFileName?: string | undefined;
}

const generateUniqueSvgSlug = async (slugInput?: string) => {
  const baseSlug = generateSvgSlug(slugInput);
  let nextSlug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.svgFile.findUnique({
      where: { slug: nextSlug },
      select: { id: true },
    });

    if (!existing) {
      return nextSlug;
    }

    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

// ── Core: validate → sanitize → upload → store ────────────────
const processSvgContent = async (payload: SvgInputPayload) => {
  const {
    svgContent,
    title,
    visibility = Visibility.PUBLIC,
    sourceFileName,
  } = payload;

  // 1. Validate
  const validation = validateSvg(svgContent);
  if (!validation.isValid) {
    throw new AppError(status.UNPROCESSABLE_ENTITY, validation.errors.join("; "));
  }

  // 2. Sanitize
  const { sanitizedSvg, removedCount, removedItems } = sanitizeSvg(svgContent);

  const slug = await generateUniqueSvgSlug(sourceFileName ?? title);

  // 3. Upload sanitized SVG to Cloudinary
  const svgBuffer = Buffer.from(sanitizedSvg, "utf8");
  const fileName = `${slug}.svg`;

  const uploaded = await uploadFileToCloudinary(svgBuffer, fileName, {
    resource_type: "image",
    folder: "skillsvg",
    format: "svg",
  });
  const svgPublicUrl = uploaded.secure_url.replace(
    "/image/upload/",
    "/image/upload/fl_sanitize/",
  );

  // 4. Validation log
  const validationLog = JSON.stringify({
    warnings: validation.warnings,
    detectedThreats: validation.detectedThreats,
    sanitizedItems: removedItems,
    sanitizedCount: removedCount,
  });

  // 5. Persist
  const createData: Prisma.SvgFileCreateInput = {
    title: title ?? null,
    slug,
    originalSvg: svgContent,
    sanitizedSvg,
    cdnUrl: svgPublicUrl,
    fileSize: validation.fileSizeBytes,
    isValid: validation.isValid,
    hasMalicious: validation.hasMalicious,
    validationLog,
    visibility,
  };

  return prisma.svgFile.create({
    data: createData,
  });
};

// ── Upload via multipart file ──────────────────────────────────
const uploadSvgFile = async (
  file: Express.Multer.File,
  body: { title?: string; visibility?: Visibility },
) => {
  if (!file) throw new AppError(status.BAD_REQUEST, "SVG file is required");

  if (file.mimetype !== "image/svg+xml" && !file.originalname.endsWith(".svg")) {
    throw new AppError(status.UNPROCESSABLE_ENTITY, "Only .svg files are allowed");
  }

  return processSvgContent({
    svgContent: file.buffer.toString("utf8"),
    ...body,
    sourceFileName: file.originalname,
  });
};

// ── Bulk upload via paste ────────────────────────────────────────
const bulkPasteSvg = async (
  items: Array<{
    svgContent: string;
    title?: string;
    visibility?: Visibility;
  }>,
) => {
  // Process in parallel for faster upload
  const uploadPromises = items.map(async (item, index) => {
    try {
      const result = await processSvgContent({
        svgContent: item.svgContent,
        title: item.title,
        visibility: item.visibility,
      });
      return { index, success: true as const, data: result };
    } catch (error) {
      return {
        index,
        success: false as const,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  const settled = await Promise.all(uploadPromises);

  const results = settled.filter((r) => r.success);
  const errors = settled.filter((r) => !r.success);

  return {
    total: items.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  };
};

// ── List ───────────────────────────────────────────────────────
const listSvgFiles = async (query: Record<string, unknown>) => {
  const { where, orderBy, skip, take, page, limit } = buildQuery(query, {
    searchFields: ["title", "slug"],
    sortableFields: ["title", "createdAt", "viewCount", "copyCount"],
    filterableFields: ["visibility"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    maxLimit: 200,
  });

  // Optimize: Only fetch necessary fields
  const [data, total] = await Promise.all([
    prisma.svgFile.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        cdnUrl: true,
        fileSize: true,
        isValid: true,
        visibility: true,
        viewCount: true,
        copyCount: true,
        embedCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.svgFile.count({ where }),
  ]);

  return { data, meta: buildMeta(total, page, limit) };
};

// ── Get single by slug ─────────────────────────────────────────
const getSvgBySlug = async (slug: string, trackView = true) => {
  const svgFile = await prisma.svgFile.findUnique({
    where: { slug },
  });

  if (!svgFile) throw new AppError(status.NOT_FOUND, "SVG not found");

  if (trackView) {
    void Promise.all([
      prisma.svgFile.update({ where: { slug }, data: { viewCount: { increment: 1 } } }),
      prisma.usageEvent.create({ data: { svgFileId: svgFile.id, eventType: EventType.VIEW } }),
    ]);
  }

  return {
    ...svgFile,
    embedCode: `<img src="${svgFile.cdnUrl}" alt="${svgFile.title ?? "SVG"}" />`,
    inlineEmbed: svgFile.sanitizedSvg,
  };
};

const getSvgIconContentBySlug = async (slug: string, formatOptions?: SvgFormatOptions) => {
  const svgFile = await prisma.svgFile.findUnique({
    where: { slug },
    select: { id: true, cdnUrl: true },
  });

  if (!svgFile) throw new AppError(status.NOT_FOUND, "SVG not found");

  const response = await fetch(svgFile.cdnUrl);

  if (!response.ok) {
    throw new AppError(status.BAD_GATEWAY, "Failed to fetch SVG content");
  }

  const svgContent = await response.text();

  void Promise.all([
    prisma.svgFile.update({ where: { slug }, data: { viewCount: { increment: 1 } } }),
    prisma.usageEvent.create({ data: { svgFileId: svgFile.id, eventType: EventType.VIEW } }),
  ]);

  return formatOptions ? formatSvg(svgContent, formatOptions) : svgContent;
};

// ── Track copy events ──────────────────────────────────────────
const trackCopyEvent = async (slug: string, eventType: EventType) => {
  const svgFile = await prisma.svgFile.findUnique({ where: { slug } });
  if (!svgFile) throw new AppError(status.NOT_FOUND, "SVG not found");

  const countField =
    eventType === EventType.COPY_LINK
      ? "copyCount"
      : eventType === EventType.COPY_EMBED || eventType === EventType.EXTERNAL_EMBED
        ? "embedCount"
        : null;

  await Promise.all([
    countField &&
      prisma.svgFile.update({ where: { slug }, data: { [countField]: { increment: 1 } } }),
    prisma.usageEvent.create({ data: { svgFileId: svgFile.id, eventType } }),
  ]);

  return { tracked: true };
};

// ── Update metadata ────────────────────────────────────────────
const updateSvgFile = async (
  slug: string,
  payload: { title?: string; visibility?: Visibility },
) => {
  const svgFile = await prisma.svgFile.findUnique({ where: { slug } });
  if (!svgFile) throw new AppError(status.NOT_FOUND, "SVG not found");

  return prisma.svgFile.update({
    where: { slug },
    data: {
      ...payload,
    },
  });
};

// ── Delete ─────────────────────────────────────────────────────
const deleteSvgFile = async (slug: string) => {
  const svgFile = await prisma.svgFile.findUnique({ where: { slug } });
  if (!svgFile) throw new AppError(status.NOT_FOUND, "SVG not found");

  // Delete DB record first; Cloudinary cleanup is best-effort
  await prisma.svgFile.delete({ where: { slug } });

  deleteFileFromCloudinary(svgFile.cdnUrl, "image").catch((err) => {
    console.error("Cloudinary delete failed for", svgFile.cdnUrl, err);
  });

  return { deleted: true };
};

export const svgService = {
  uploadSvgFile,
  bulkPasteSvg,
  listSvgFiles,
  getSvgBySlug,
  getSvgIconContentBySlug,
  trackCopyEvent,
  updateSvgFile,
  deleteSvgFile,
};