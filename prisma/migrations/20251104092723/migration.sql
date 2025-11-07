/*
  Warnings:

  - A unique constraint covering the columns `[file_id]` on the table `Files` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Files_file_id_key" ON "Files"("file_id");
