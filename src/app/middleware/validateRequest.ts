import { NextFunction, Request, Response } from "express";
import z from "zod";

type RequestPart = "body" | "query" | "params";

export const validateRequest = (
  zodSchema: z.ZodTypeAny,
  requestPart: RequestPart = "body",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[requestPart];
    const parsedResult = zodSchema.safeParse(dataToValidate);

    if (!parsedResult.success) {
      return next(parsedResult.error);
    }

    // Sanitize the validated request part
    if (requestPart === "query") {
      // req.query is read-only in newer Express — replace via defineProperty
      Object.defineProperty(req, "query", {
        value: parsedResult.data,
        writable: true,
        configurable: true,
      });
    } else {
      (req[requestPart] as unknown) = parsedResult.data;
    }

    return next();
  };
};
