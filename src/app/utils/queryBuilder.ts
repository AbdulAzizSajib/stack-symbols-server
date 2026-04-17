import { Prisma } from "../../generated/prisma/client";

type SortOrder = "asc" | "desc";

interface QueryBuilderConfig {
  searchFields?: string[];
  sortableFields?: string[];
  filterableFields?: string[];
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
  maxLimit?: number;
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  [key: string]: unknown;
}

interface QueryResult {
  where: Record<string, unknown>;
  orderBy: Record<string, SortOrder>;
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const buildQuery = (query: QueryParams, config: QueryBuilderConfig = {}): QueryResult => {
  const {
    searchFields = [],
    sortableFields = [],
    filterableFields = [],
    defaultSortBy = "id",
    defaultSortOrder = "desc",
    maxLimit = 200,
  } = config;

  // Pagination
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), maxLimit);
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy =
    typeof query.sortBy === "string" && sortableFields.includes(query.sortBy)
      ? query.sortBy
      : defaultSortBy;
  const sortOrder: SortOrder = query.sortOrder === "asc" ? "asc" : defaultSortOrder;

  // Search (OR across searchFields with case-insensitive contains)
  const searchConditions: Record<string, unknown>[] = [];
  const searchTerm = typeof query.search === "string" ? query.search.trim() : "";

  if (searchTerm && searchFields.length > 0) {
    for (const field of searchFields) {
      searchConditions.push({
        [field]: { contains: searchTerm, mode: "insensitive" as Prisma.QueryMode },
      });
    }
  }

  // Filters (exact match on filterableFields)
  const filterConditions: Record<string, unknown>[] = [];

  for (const field of filterableFields) {
    const value = query[field];
    if (value !== undefined && value !== null && value !== "") {
      filterConditions.push({ [field]: value });
    }
  }

  // Build where clause
  const where: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  if (searchConditions.length > 0) {
    andConditions.push({ OR: searchConditions });
  }

  if (filterConditions.length > 0) {
    andConditions.push(...filterConditions);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return {
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    page,
    limit,
  };
};

export const buildMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
