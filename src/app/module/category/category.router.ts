import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { categoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const categoryRouter: Router = Router();

categoryRouter.get(
  "/",
  validateRequest(CategoryValidation.listCategoryQuerySchema, "query"),
  categoryController.listCategories,
);

categoryRouter.get(
  "/:slug",
  validateRequest(CategoryValidation.categorySlugParamSchema, "params"),
  categoryController.getCategoryBySlug,
);

categoryRouter.post(
  "/",
  checkAuth(Role.ADMIN),
  validateRequest(CategoryValidation.createCategorySchema),
  categoryController.createCategory,
);

categoryRouter.patch(
  "/:id",
  checkAuth(Role.ADMIN),
  validateRequest(CategoryValidation.categoryIdParamSchema, "params"),
  validateRequest(CategoryValidation.updateCategorySchema),
  categoryController.updateCategory,
);

categoryRouter.delete(
  "/:id",
  checkAuth(Role.ADMIN),
  validateRequest(CategoryValidation.categoryIdParamSchema, "params"),
  categoryController.deleteCategory,
);

export default categoryRouter;
