import { z } from "zod";
import { Visibility } from "../../../generated/prisma/client";

const uploadSvgBodySchema = z.object({
  title: z.string().max(120).optional(),
  visibility: z.nativeEnum(Visibility).optional().default(Visibility.PUBLIC),
});

const pasteSvgSchema = z.object({
  items: z
    .array(
      z.object({
        svgContent: z
          .string({ error: "SVG content is required" })
          .min(10, "SVG content too short")
          .max(2_097_152, "SVG content exceeds 2MB"),
        title: z.string().max(120).optional(),
        visibility: z.nativeEnum(Visibility).optional().default(Visibility.PUBLIC),
      }),
    )
    .min(1, "At least one SVG item is required")
    .max(50, "Maximum 50 SVG items allowed per request"),
});

const updateSvgSchema = z.object({
  title: z.string().max(120).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
});

const trackEventSchema = z.object({
  type: z.enum(["link", "embed", "external_embed"]),
});

const serveIconQuerySchema = z.object({
  w: z.coerce.number().int().min(1).max(2048).optional(),
  h: z.coerce.number().int().min(1).max(2048).optional(),
});

const listSvgQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum(["title", "createdAt", "viewCount", "copyCount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
});

export const SvgValidation = {
  uploadSvgBodySchema,
  pasteSvgSchema,
  updateSvgSchema,
  trackEventSchema,
  listSvgQuerySchema,
  serveIconQuerySchema,
};