-- Adds the fields the recommendation engine needs to record an honest result:
--   * caveats  — negative signals shown alongside the positive reasons, so a
--                match is no longer presented as uniformly good.
--   * coverage — the share of scoring weight backed by real profile data, used
--                to calibrate the confidence figure shown to the user.

ALTER TABLE "recommendation_items"
  ADD COLUMN "caveats" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "recommendation_history"
  ADD COLUMN "coverage" DOUBLE PRECISION NOT NULL DEFAULT 1;
