export type TErrorSources = {
  path: string;
  message: string;
};

export type TErrorResponse = {
  success: boolean;
  statusCode?: number;
  message: string;
  errorSources: TErrorSources[];
  stack?: string;
  error?: unknown;
};
