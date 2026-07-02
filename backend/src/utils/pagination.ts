import { PAGINATION } from '../config/constants';

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

/** Normalizes raw query params into safe pagination bounds. */
export function getPageParams(rawPage?: unknown, rawLimit?: unknown): PageParams {
  const page = Math.max(1, Number(rawPage) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(rawLimit) || PAGINATION.DEFAULT_LIMIT),
  );
  return { page, limit, skip: (page - 1) * limit };
}
