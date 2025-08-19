-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResearchWorkType" AS ENUM ('COPYRIGHT', 'PATENT', 'TRANSACTION', 'CONFERENCE', 'JOURNAL', 'BOOK_CHAPTER', 'GRANT_IN', 'FDP', 'CERTIFICATION');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('ACCEPTED', 'COMMUNICATED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('UNDER_REVIEW', 'UPLOADED', 'PUBLISHED', 'REJECTED');

-- DropEnum
DROP TYPE "crdb_internal_region";

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "email" STRING,
    "password" STRING,
    "fullName" STRING NOT NULL,
    "userType" "UserType" NOT NULL,
    "image" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOL NOT NULL DEFAULT false,
    "resetToken" STRING,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "section" STRING NOT NULL,
    "year" INT4 NOT NULL,
    "batch" STRING NOT NULL,
    "department" STRING NOT NULL,
    "rollNumber" STRING NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "affiliation" STRING NOT NULL,
    "designation" STRING NOT NULL,
    "subjectOfInterest" STRING,
    "officialMail" STRING,
    "address" STRING,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchWork" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "type" "ResearchWorkType" NOT NULL,
    "uploadedById" STRING NOT NULL,
    "isPublic" BOOL NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOL NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "keywords" STRING[],

    CONSTRAINT "ResearchWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Copyright" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "inventors" STRING NOT NULL,
    "filedAt" DATE,
    "submittedAt" DATE,
    "publishedAt" DATE,
    "grantedAt" DATE,

    CONSTRAINT "Copyright_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patent" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "inventors" STRING NOT NULL,
    "applicant" STRING NOT NULL,
    "applicationNo" STRING,
    "filedAt" DATE,
    "submittedAt" DATE,
    "publishedAt" DATE,
    "publicationLink" STRING,
    "grantedAt" DATE,
    "patentLink" STRING,
    "country" STRING,

    CONSTRAINT "Patent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "transactionName" STRING NOT NULL,
    "typeOfTransaction" STRING,
    "indexOfTransaction" STRING,
    "impactFactor" FLOAT8,
    "impactFactorDate" DATE,
    "publisher" STRING,
    "status" "PublicationStatus" NOT NULL,
    "statusDate" DATE NOT NULL,
    "paperLinkDOI" STRING,
    "registrationFees" FLOAT8,
    "reimbursementStatus" STRING,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conference" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "mode" STRING,
    "conferenceName" STRING NOT NULL,
    "typeOfConference" STRING,
    "indexOfConference" STRING,
    "publisher" STRING,
    "status" "PublicationStatus" NOT NULL,
    "statusDate" DATE NOT NULL,
    "paperLinkDOI" STRING,
    "registrationFees" FLOAT8,
    "reimbursementStatus" STRING,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "journalName" STRING NOT NULL,
    "typeOfJournal" STRING,
    "indexOfJournal" STRING,
    "impactFactor" FLOAT8,
    "impactFactorDate" DATE,
    "publisher" STRING,
    "status" "PublicationStatus" NOT NULL,
    "statusDate" DATE NOT NULL,
    "paperLinkDOI" STRING,
    "registrationFees" FLOAT8,
    "reimbursementStatus" STRING,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookChapter" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "status" "PublicationStatus" NOT NULL,
    "registrationFees" FLOAT8,
    "reimbursementStatus" STRING,
    "isbnIssn" STRING,

    CONSTRAINT "BookChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantIn" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "projectCode" STRING,
    "projectPI" STRING,
    "projectCoPI" STRING,
    "status" STRING,
    "appliedAt" DATE,
    "grantedAt" DATE,
    "durationMonths" INT4,
    "grantAmount" FLOAT8,
    "utilizedAmount" FLOAT8,
    "remainingAmount" FLOAT8,
    "publication" STRING,
    "publicationDetails" STRING,

    CONSTRAINT "GrantIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FDP" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "name" STRING NOT NULL,
    "organizedBy" STRING,
    "duration" STRING,
    "startDate" DATE,
    "endDate" DATE,
    "topic" STRING,
    "remarks" STRING,

    CONSTRAINT "FDP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" STRING NOT NULL,
    "researchWorkId" STRING NOT NULL,
    "name" STRING NOT NULL,
    "certificationName" STRING NOT NULL,
    "offeredBy" STRING,
    "completedAt" DATE,
    "link" STRING,
    "remarks" STRING,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING,
    "imageUrl" STRING,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOL NOT NULL DEFAULT false,
    "link" STRING,
    "uploadedById" STRING NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchPaper" (
    "id" STRING NOT NULL,
    "studentId" STRING NOT NULL,
    "title" STRING NOT NULL,
    "abstract" STRING,
    "image" STRING,
    "status" "SubmissionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keywords" STRING[],

    CONSTRAINT "ResearchPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OngoingProject" (
    "id" STRING NOT NULL,
    "studentId" STRING NOT NULL,
    "title" STRING NOT NULL,
    "abstract" STRING,
    "image" STRING,
    "status" "SubmissionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keywords" STRING[],

    CONSTRAINT "OngoingProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyUser" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "fullName" STRING NOT NULL,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingCompetition" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" STRING,
    "organizer" STRING,
    "prizeDetails" STRING,
    "registrationLink" STRING,
    "isPublished" BOOL NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpcomingCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "type" STRING NOT NULL,
    "provider" STRING NOT NULL,
    "providerAccountId" STRING NOT NULL,
    "refresh_token" STRING,
    "access_token" STRING,
    "expires_at" INT4,
    "token_type" STRING,
    "scope" STRING,
    "id_token" STRING,
    "session_state" STRING,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" STRING NOT NULL,
    "sessionToken" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" STRING NOT NULL,
    "token" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "_ResearchPaperAdvisors" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateTable
CREATE TABLE "_ResearchPaperMembers" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateTable
CREATE TABLE "_OngoingProjectAdvisors" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateTable
CREATE TABLE "_OngoingProjectMembers" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Copyright_researchWorkId_key" ON "Copyright"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "Patent_researchWorkId_key" ON "Patent"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_researchWorkId_key" ON "Transaction"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_researchWorkId_key" ON "Conference"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_researchWorkId_key" ON "Journal"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "BookChapter_researchWorkId_key" ON "BookChapter"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "GrantIn_researchWorkId_key" ON "GrantIn"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "FDP_researchWorkId_key" ON "FDP"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_researchWorkId_key" ON "Certification"("researchWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyUser_email_key" ON "LegacyUser"("email");

-- CreateIndex
CREATE INDEX "LegacyUser_userType_idx" ON "LegacyUser"("userType");

-- CreateIndex
CREATE INDEX "UpcomingCompetition_startDate_idx" ON "UpcomingCompetition"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_ResearchPaperAdvisors_AB_unique" ON "_ResearchPaperAdvisors"("A", "B");

-- CreateIndex
CREATE INDEX "_ResearchPaperAdvisors_B_index" ON "_ResearchPaperAdvisors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ResearchPaperMembers_AB_unique" ON "_ResearchPaperMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_ResearchPaperMembers_B_index" ON "_ResearchPaperMembers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OngoingProjectAdvisors_AB_unique" ON "_OngoingProjectAdvisors"("A", "B");

-- CreateIndex
CREATE INDEX "_OngoingProjectAdvisors_B_index" ON "_OngoingProjectAdvisors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OngoingProjectMembers_AB_unique" ON "_OngoingProjectMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_OngoingProjectMembers_B_index" ON "_OngoingProjectMembers"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchWork" ADD CONSTRAINT "ResearchWork_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Copyright" ADD CONSTRAINT "Copyright_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patent" ADD CONSTRAINT "Patent_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conference" ADD CONSTRAINT "Conference_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookChapter" ADD CONSTRAINT "BookChapter_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantIn" ADD CONSTRAINT "GrantIn_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FDP" ADD CONSTRAINT "FDP_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_researchWorkId_fkey" FOREIGN KEY ("researchWorkId") REFERENCES "ResearchWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchPaper" ADD CONSTRAINT "ResearchPaper_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingProject" ADD CONSTRAINT "OngoingProject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchPaperAdvisors" ADD CONSTRAINT "_ResearchPaperAdvisors_A_fkey" FOREIGN KEY ("A") REFERENCES "ResearchPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchPaperAdvisors" ADD CONSTRAINT "_ResearchPaperAdvisors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchPaperMembers" ADD CONSTRAINT "_ResearchPaperMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "ResearchPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchPaperMembers" ADD CONSTRAINT "_ResearchPaperMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OngoingProjectAdvisors" ADD CONSTRAINT "_OngoingProjectAdvisors_A_fkey" FOREIGN KEY ("A") REFERENCES "OngoingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OngoingProjectAdvisors" ADD CONSTRAINT "_OngoingProjectAdvisors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OngoingProjectMembers" ADD CONSTRAINT "_OngoingProjectMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "OngoingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OngoingProjectMembers" ADD CONSTRAINT "_OngoingProjectMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
