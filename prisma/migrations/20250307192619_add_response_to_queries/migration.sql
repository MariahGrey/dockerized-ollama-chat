/*
  Warnings:

  - Added the required column `response` to the `Query` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Query" ADD COLUMN     "response" TEXT NOT NULL;
