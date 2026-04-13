import { z } from "zod";

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name must be at most 60 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  color: z.string().regex(hexColorRegex, "Color must be a valid hex code").optional(),
  icon: z.string().url("Icon must be a valid URL").optional(),
});

const updateCategorySchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name must be at most 60 characters").optional(),
    description: z.string().max(500, "Description must be at most 500 characters").nullable().optional(),
    color: z.string().regex(hexColorRegex, "Color must be a valid hex code").nullable().optional(),
    icon: z.string().url("Icon must be a valid URL").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

const listCategoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

const categorySlugParamSchema = z.object({
  slug: z.string().min(1, "Category slug is required"),
});

const categoryIdParamSchema = z.object({
  id: z.string().cuid("Invalid category id"),
});

export const CategoryValidation = {
  createCategorySchema,
  updateCategorySchema,
  listCategoryQuerySchema,
  categorySlugParamSchema,
  categoryIdParamSchema,
};
