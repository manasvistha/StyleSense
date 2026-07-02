-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SkinTone" AS ENUM ('FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'DEEP');

-- CreateEnum
CREATE TYPE "SleeveType" AS ENUM ('SLEEVELESS', 'CAP', 'SHORT', 'THREE_QUARTER', 'LONG');

-- CreateEnum
CREATE TYPE "DressLength" AS ENUM ('MINI', 'KNEE', 'MIDI', 'MAXI', 'FLOOR');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('RECOMMENDATION_GENERATED', 'DRESS_VIEWED', 'DRESS_SELECTED', 'WISHLIST_ADDED', 'REVIEW_CREATED', 'PROFILE_UPDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bustCm" DOUBLE PRECISION NOT NULL,
    "waistCm" DOUBLE PRECISION NOT NULL,
    "hipCm" DOUBLE PRECISION NOT NULL,
    "shoulderCm" DOUBLE PRECISION,
    "skinTone" "SkinTone",
    "bodyShapeId" TEXT,
    "bodyShapeReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "budgetMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetMax" DOUBLE PRECISION NOT NULL DEFAULT 100000,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_shapes" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stylingTips" TEXT,

    CONSTRAINT "body_shapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_groups" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "age_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "dress_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_styles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "dress_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "country" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occasions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "occasions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sizes" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "bustMin" DOUBLE PRECISION NOT NULL,
    "bustMax" DOUBLE PRECISION NOT NULL,
    "waistMin" DOUBLE PRECISION NOT NULL,
    "waistMax" DOUBLE PRECISION NOT NULL,
    "hipMin" DOUBLE PRECISION NOT NULL,
    "hipMax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dresses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "ageGroupId" TEXT NOT NULL,
    "sleeveType" "SleeveType" NOT NULL,
    "length" "DressLength" NOT NULL,
    "neckStyle" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "discountPct" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendationTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_images" (
    "id" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dress_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dress_inventory" (
    "id" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dress_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recently_viewed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bodyShapeId" TEXT,
    "inputSnapshot" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "topConfidence" INTEGER NOT NULL DEFAULT 0,
    "selectedDressId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_items" (
    "id" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "dressId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "recommendation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_rules" (
    "id" TEXT NOT NULL,
    "factorKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_logs" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "userId" TEXT,
    "dressId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DressSuitableBodyShapes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DressSuitableBodyShapes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserPreferredStyles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserPreferredStyles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserFavoriteBrands" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserFavoriteBrands_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DressColors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DressColors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserPreferredColors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserPreferredColors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserFavoriteOccasions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserFavoriteOccasions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DressOccasions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DressOccasions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "login_logs_userId_idx" ON "login_logs"("userId");

-- CreateIndex
CREATE INDEX "login_logs_createdAt_idx" ON "login_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_measurements_userId_key" ON "user_measurements"("userId");

-- CreateIndex
CREATE INDEX "user_measurements_bodyShapeId_idx" ON "user_measurements"("bodyShapeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "body_shapes_key_key" ON "body_shapes"("key");

-- CreateIndex
CREATE UNIQUE INDEX "age_groups_label_key" ON "age_groups"("label");

-- CreateIndex
CREATE UNIQUE INDEX "age_groups_slug_key" ON "age_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dress_categories_name_key" ON "dress_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dress_categories_slug_key" ON "dress_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dress_styles_name_key" ON "dress_styles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dress_styles_slug_key" ON "dress_styles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "colors_name_key" ON "colors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "occasions_name_key" ON "occasions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "occasions_slug_key" ON "occasions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_name_key" ON "seasons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_slug_key" ON "seasons"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "fabrics_name_key" ON "fabrics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_label_key" ON "sizes"("label");

-- CreateIndex
CREATE UNIQUE INDEX "dresses_slug_key" ON "dresses"("slug");

-- CreateIndex
CREATE INDEX "dresses_brandId_idx" ON "dresses"("brandId");

-- CreateIndex
CREATE INDEX "dresses_categoryId_idx" ON "dresses"("categoryId");

-- CreateIndex
CREATE INDEX "dresses_ageGroupId_idx" ON "dresses"("ageGroupId");

-- CreateIndex
CREATE INDEX "dresses_isFeatured_idx" ON "dresses"("isFeatured");

-- CreateIndex
CREATE INDEX "dresses_isActive_idx" ON "dresses"("isActive");

-- CreateIndex
CREATE INDEX "dress_images_dressId_idx" ON "dress_images"("dressId");

-- CreateIndex
CREATE INDEX "dress_inventory_sizeId_idx" ON "dress_inventory"("sizeId");

-- CreateIndex
CREATE UNIQUE INDEX "dress_inventory_dressId_sizeId_key" ON "dress_inventory"("dressId", "sizeId");

-- CreateIndex
CREATE INDEX "reviews_dressId_idx" ON "reviews"("dressId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_dressId_key" ON "reviews"("userId", "dressId");

-- CreateIndex
CREATE INDEX "wishlist_items_userId_idx" ON "wishlist_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_dressId_key" ON "wishlist_items"("userId", "dressId");

-- CreateIndex
CREATE INDEX "recently_viewed_userId_viewedAt_idx" ON "recently_viewed"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "recently_viewed_userId_dressId_key" ON "recently_viewed"("userId", "dressId");

-- CreateIndex
CREATE INDEX "recommendation_history_userId_createdAt_idx" ON "recommendation_history"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "recommendation_items_historyId_idx" ON "recommendation_items"("historyId");

-- CreateIndex
CREATE INDEX "recommendation_items_dressId_idx" ON "recommendation_items"("dressId");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_rules_factorKey_key" ON "recommendation_rules"("factorKey");

-- CreateIndex
CREATE INDEX "analytics_logs_type_idx" ON "analytics_logs"("type");

-- CreateIndex
CREATE INDEX "analytics_logs_createdAt_idx" ON "analytics_logs"("createdAt");

-- CreateIndex
CREATE INDEX "_DressSuitableBodyShapes_B_index" ON "_DressSuitableBodyShapes"("B");

-- CreateIndex
CREATE INDEX "_UserPreferredStyles_B_index" ON "_UserPreferredStyles"("B");

-- CreateIndex
CREATE INDEX "_UserFavoriteBrands_B_index" ON "_UserFavoriteBrands"("B");

-- CreateIndex
CREATE INDEX "_DressColors_B_index" ON "_DressColors"("B");

-- CreateIndex
CREATE INDEX "_UserPreferredColors_B_index" ON "_UserPreferredColors"("B");

-- CreateIndex
CREATE INDEX "_UserFavoriteOccasions_B_index" ON "_UserFavoriteOccasions"("B");

-- CreateIndex
CREATE INDEX "_DressOccasions_B_index" ON "_DressOccasions"("B");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_measurements" ADD CONSTRAINT "user_measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_measurements" ADD CONSTRAINT "user_measurements_bodyShapeId_fkey" FOREIGN KEY ("bodyShapeId") REFERENCES "body_shapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "dress_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "dress_styles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "fabrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "age_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_images" ADD CONSTRAINT "dress_images_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_inventory" ADD CONSTRAINT "dress_inventory_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dress_inventory" ADD CONSTRAINT "dress_inventory_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_bodyShapeId_fkey" FOREIGN KEY ("bodyShapeId") REFERENCES "body_shapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_selectedDressId_fkey" FOREIGN KEY ("selectedDressId") REFERENCES "dresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "recommendation_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_items" ADD CONSTRAINT "recommendation_items_dressId_fkey" FOREIGN KEY ("dressId") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_logs" ADD CONSTRAINT "analytics_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DressSuitableBodyShapes" ADD CONSTRAINT "_DressSuitableBodyShapes_A_fkey" FOREIGN KEY ("A") REFERENCES "body_shapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DressSuitableBodyShapes" ADD CONSTRAINT "_DressSuitableBodyShapes_B_fkey" FOREIGN KEY ("B") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPreferredStyles" ADD CONSTRAINT "_UserPreferredStyles_A_fkey" FOREIGN KEY ("A") REFERENCES "dress_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPreferredStyles" ADD CONSTRAINT "_UserPreferredStyles_B_fkey" FOREIGN KEY ("B") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteBrands" ADD CONSTRAINT "_UserFavoriteBrands_A_fkey" FOREIGN KEY ("A") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteBrands" ADD CONSTRAINT "_UserFavoriteBrands_B_fkey" FOREIGN KEY ("B") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DressColors" ADD CONSTRAINT "_DressColors_A_fkey" FOREIGN KEY ("A") REFERENCES "colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DressColors" ADD CONSTRAINT "_DressColors_B_fkey" FOREIGN KEY ("B") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPreferredColors" ADD CONSTRAINT "_UserPreferredColors_A_fkey" FOREIGN KEY ("A") REFERENCES "colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPreferredColors" ADD CONSTRAINT "_UserPreferredColors_B_fkey" FOREIGN KEY ("B") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteOccasions" ADD CONSTRAINT "_UserFavoriteOccasions_A_fkey" FOREIGN KEY ("A") REFERENCES "occasions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteOccasions" ADD CONSTRAINT "_UserFavoriteOccasions_B_fkey" FOREIGN KEY ("B") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DressOccasions" ADD CONSTRAINT "_DressOccasions_A_fkey" FOREIGN KEY ("A") REFERENCES "dresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DressOccasions" ADD CONSTRAINT "_DressOccasions_B_fkey" FOREIGN KEY ("B") REFERENCES "occasions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
