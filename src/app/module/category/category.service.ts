import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const toCategorySlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
};

const buildUniqueSlug = async (name: string, excludeId?: string): Promise<string> => {
  const baseSlug = toCategorySlug(name) || "category";
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const exists = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!exists) return candidate;

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
};

const createCategory = async (payload: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}) => {
  const slug = await buildUniqueSlug(payload.name);

  return prisma.category.create({
    data: {
      name: payload.name,
      slug,
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
    },
  });
};

const listCategories = async (query: { page: number; limit: number; search?: string }) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CategoryWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { svgFiles: true } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { svgFiles: true } },
    },
  });

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  return category;
};

const updateCategory = async (
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
  },
) => {
  const existingCategory = await prisma.category.findUnique({ where: { id } });

  if (!existingCategory) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  const nextSlug = payload.name
    ? await buildUniqueSlug(payload.name, existingCategory.id)
    : existingCategory.slug;

  return prisma.category.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name, slug: nextSlug } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
    },
  });
};

const deleteCategory = async (id: string) => {
  const existingCategory = await prisma.category.findUnique({ where: { id } });

  if (!existingCategory) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  await prisma.category.delete({ where: { id } });

  return { deleted: true };
};

export const categoryService = {
  createCategory,
  listCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};
