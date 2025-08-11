// app/api/research-works/route.ts

import { NextRequest, NextResponse } from "next/server";
import {  ResearchWorkType, PublicationStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from "@/lib/prisma";



// =======================================================
// ZOD SCHEMAS
// =======================================================

// Base schema for common ResearchWork fields
const baseResearchWorkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(ResearchWorkType),
  uploadedById: z.string().min(1, "Uploader ID is required"),
  isPublic: z.boolean().default(false).optional(),
  authors: z.array(z.string().min(1, "Author name cannot be empty")).optional(),
});

// Schemas for each specific research work type
const copyrightSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.COPYRIGHT),
  inventors: z.string().min(1, "Inventors are required"),
  filedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  submittedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publishedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  grantedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
});

const patentSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.PATENT),
  inventors: z.string().min(1, "Inventors are required"),
  applicant: z.string().min(1, "Applicant is required"),
  applicationNo: z.string().optional(),
  filedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  submittedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publishedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publicationLink: z.string().url("Invalid publication link").optional(),
  grantedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  patentLink: z.string().url("Invalid patent link").optional(),
  country: z.string().optional(),
});

const transactionSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.TRANSACTION),
  transactionName: z.string().min(1, "Transaction name is required"),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().datetime().transform(str => new Date(str)),
  paperLinkDOI: z.string().url("Invalid paper link or DOI").optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
});

const conferenceSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.CONFERENCE),
  mode: z.string().optional(),
  conferenceName: z.string().min(1, "Conference name is required"),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().datetime().transform(str => new Date(str)),
  paperLinkDOI: z.string().url("Invalid paper link or DOI").optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
});

const journalSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.JOURNAL),
  journalName: z.string().min(1, "Journal name is required"),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus),
  statusDate: z.string().datetime().transform(str => new Date(str)),
  paperLinkDOI: z.string().url("Invalid paper link or DOI").optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
});

const bookChapterSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.BOOK_CHAPTER),
  status: z.nativeEnum(PublicationStatus),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  isbnIssn: z.string().optional(),
});

const grantInSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.GRANT_IN),
  projectCode: z.string().optional(),
  projectPI: z.string().optional(),
  projectCoPI: z.string().optional(),
  status: z.string().optional(),
  appliedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  grantedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  durationMonths: z.number().int().optional(),
  grantAmount: z.number().optional(),
  utilizedAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  publication: z.string().optional(),
  publicationDetails: z.string().optional(),
});

const fdpSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.FDP),
  name: z.string().min(1, "FDP name is required"),
  organizedBy: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  topic: z.string().optional(),
  remarks: z.string().optional(),
});

const certificationSchema = baseResearchWorkSchema.extend({
  type: z.literal(ResearchWorkType.CERTIFICATION),
  name: z.string().min(1, "Name is required"),
  certificationName: z.string().min(1, "Certification name is required"),
  offeredBy: z.string().optional(),
  completedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  link: z.string().url("Invalid link").optional(),
  remarks: z.string().optional(),
});

// A union of all specific schemas for validation
const createResearchWorkUnionSchema = z.discriminatedUnion("type", [
  copyrightSchema,
  patentSchema,
  transactionSchema,
  conferenceSchema,
  journalSchema,
  bookChapterSchema,
  grantInSchema,
  fdpSchema,
  certificationSchema,
]);

// Zod schema for fetching research works with pagination and filtering
const getResearchWorksQuerySchema = z.object({
  page: z.string().transform(Number).default("1").optional(),
  limit: z.string().transform(Number).default("10").optional(),
  title: z.string().optional(),
  type: z.nativeEnum(ResearchWorkType).optional(),
  uploadedById: z.string().optional(),
});

// =======================================================
// API ENDPOINTS
// =======================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = createResearchWorkUnionSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({
        message: "Invalid input",
        errors: parsedData.error.format(),
      }, { status: 400 });
    }

    const { type, authors, title, uploadedById, isPublic, ...specificData } = parsedData.data;

    const newResearchWork = await prisma.$transaction(async (tx) => {
      // Step 1: Create the base ResearchWork record first with common fields
      const createdWork = await tx.researchWork.create({
        data: {
          title: title,
          type: type,
          uploadedById: uploadedById,
          isPublic: isPublic,
          authors: authors ? {
            create: authors.map(name => ({ name })),
          } : undefined,
        },
      });

      // Step 2: Create the corresponding type-specific record.
      // We pass only the fields relevant to that specific model.
      switch (type) {
        case ResearchWorkType.COPYRIGHT:
          const copyrightData = copyrightSchema.parse(body);
          await tx.copyright.create({
            data: { researchWorkId: createdWork.id, ...copyrightData },
          });
          break;
        case ResearchWorkType.PATENT:
          const patentData = patentSchema.parse(body);
          await tx.patent.create({
            data: { researchWorkId: createdWork.id, ...patentData },
          });
          break;
        case ResearchWorkType.TRANSACTION:
          const transactionData = transactionSchema.parse(body);
          await tx.transaction.create({
            data: { researchWorkId: createdWork.id, ...transactionData },
          });
          break;
        case ResearchWorkType.CONFERENCE:
          const conferenceData = conferenceSchema.parse(body);
          await tx.conference.create({
            data: { researchWorkId: createdWork.id, ...conferenceData },
          });
          break;
        case ResearchWorkType.JOURNAL:
          const journalData = journalSchema.parse(body);
          await tx.journal.create({
            data: { researchWorkId: createdWork.id, ...journalData },
          });
          break;
        case ResearchWorkType.BOOK_CHAPTER:
          const bookChapterData = bookChapterSchema.parse(body);
          await tx.bookChapter.create({
            data: { researchWorkId: createdWork.id, ...bookChapterData },
          });
          break;
        case ResearchWorkType.GRANT_IN:
          const grantInData = grantInSchema.parse(body);
          await tx.grantIn.create({
            data: { researchWorkId: createdWork.id, ...grantInData },
          });
          break;
        case ResearchWorkType.FDP:
          const fdpData = fdpSchema.parse(body);
          await tx.fDP.create({
            data: { researchWorkId: createdWork.id, ...fdpData },
          });
          break;
        case ResearchWorkType.CERTIFICATION:
          const certificationData = certificationSchema.parse(body);
          await tx.certification.create({
            data: { researchWorkId: createdWork.id, ...certificationData },
          });
          break;
      }
      return createdWork;
    });

    return NextResponse.json(newResearchWork, { status: 201 });

  } catch (error) {
    console.error("Error creating research work:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = getResearchWorksQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return NextResponse.json({
        message: "Invalid query parameters",
        errors: parsedQuery.error.format(),
      }, { status: 400 });
    }

    const { page = 1, limit = 10, title, type, uploadedById } = parsedQuery.data;

    const whereClause: any = {};
    if (title) whereClause.title = { contains: title, mode: 'insensitive' };
    if (type) whereClause.type = type;
    if (uploadedById) whereClause.uploadedById = uploadedById;

    const researchWorks = await prisma.researchWork.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      include: {
        authors: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalResearchWorks = await prisma.researchWork.count({ where: whereClause });

    return NextResponse.json({
      data: researchWorks,
      meta: {
        totalItems: totalResearchWorks,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalResearchWorks / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching research works:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}



export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Invalid or empty array of IDs provided." }, { status: 400 });
    }

    const result = await prisma.researchWork.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      message: `${result.count} research works deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting multiple research works:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}