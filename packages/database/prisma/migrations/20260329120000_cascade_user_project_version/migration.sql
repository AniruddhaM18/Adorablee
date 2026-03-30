-- Alter FK: deleting User cascades to Project
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter FK: deleting Project cascades to Version
ALTER TABLE "Version" DROP CONSTRAINT "Version_projectId_fkey";
ALTER TABLE "Version" ADD CONSTRAINT "Version_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
