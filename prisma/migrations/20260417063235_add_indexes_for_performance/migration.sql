-- CreateIndex
CREATE INDEX "svg_files_categoryId_idx" ON "svg_files"("categoryId");

-- CreateIndex
CREATE INDEX "svg_files_visibility_idx" ON "svg_files"("visibility");

-- CreateIndex
CREATE INDEX "svg_files_ownerId_idx" ON "svg_files"("ownerId");

-- CreateIndex
CREATE INDEX "svg_files_createdAt_idx" ON "svg_files"("createdAt");

-- CreateIndex
CREATE INDEX "svg_files_slug_idx" ON "svg_files"("slug");

-- CreateIndex
CREATE INDEX "svg_files_visibility_createdAt_idx" ON "svg_files"("visibility", "createdAt");
