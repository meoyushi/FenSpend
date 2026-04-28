/*
  Warnings:

  - Added the required column `userEmail` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Expense" ("amountCents", "category", "createdAt", "date", "description", "id", "requestId") SELECT "amountCents", "category", "createdAt", "date", "description", "id", "requestId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE UNIQUE INDEX "Expense_requestId_key" ON "Expense"("requestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
