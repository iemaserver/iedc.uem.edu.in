// app/api/research-works/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ResearchWorkType, PublicationStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// =======================================================
// ZOD SCHEMAS FOR UPDATING
// =======================================================

const baseResearchWorkUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  type: z.nativeEnum(ResearchWorkType).optional(),
  uploadedById: z.string().min(1, "Uploader ID is required").optional(),
  isPublic: z.boolean().default(false).optional(),
  authors: z.array(z.string().min(1, "Author name cannot be empty")).optional(),
});

const copyrightUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.COPYRIGHT).optional(),
  inventors: z.string().min(1, "Inventors are required").optional(),
  filedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  submittedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publishedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  grantedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
});

const patentUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.PATENT).optional(),
  inventors: z.string().min(1, "Inventors are required").optional(),
  applicant: z.string().min(1, "Applicant is required").optional(),
  applicationNo: z.string().optional(),
  filedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  submittedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publishedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publicationLink: z.string().url("Invalid publication link").optional(),
  grantedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  patentLink: z.string().url("Invalid patent link").optional(),
  country: z.string().optional(),
});

const transactionUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.TRANSACTION).optional(),
  transactionName: z.string().min(1, "Transaction name is required").optional(),
  typeOfTransaction: z.string().optional(),
  indexOfTransaction: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  paperLinkDOI: z.string().url("Invalid paper link or DOI").optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
});

const conferenceUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.CONFERENCE).optional(),
  mode: z.string().optional(),
  conferenceName: z.string().min(1, "Conference name is required").optional(),
  typeOfConference: z.string().optional(),
  indexOfConference: z.string().optional(),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  paperLinkDOI: z.string().url("Invalid paper link or DOI").optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
});

const journalUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.JOURNAL).optional(),
  journalName: z.string().min(1, "Journal name is required").optional(),
  typeOfJournal: z.string().optional(),
  indexOfJournal: z.string().optional(),
  impactFactor: z.number().optional(),
  impactFactorDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  publisher: z.string().optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  statusDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  paperLinkDOI: z.string().url("Invalid paper link or DOI").optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
});

const bookChapterUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.BOOK_CHAPTER).optional(),
  status: z.nativeEnum(PublicationStatus).optional(),
  registrationFees: z.number().optional(),
  reimbursementStatus: z.string().optional(),
  isbnIssn: z.string().optional(),
});

const grantInUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.GRANT_IN).optional(),
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

const fdpUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.FDP).optional(),
  name: z.string().min(1, "FDP name is required").optional(),
  organizedBy: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  topic: z.string().optional(),
  remarks: z.string().optional(),
});

const certificationUpdateSchema = baseResearchWorkUpdateSchema.extend({
  type: z.literal(ResearchWorkType.CERTIFICATION).optional(),
  name: z.string().min(1, "Name is required").optional(),
  certificationName: z.string().min(1, "Certification name is required").optional(),
  offeredBy: z.string().optional(),
  completedAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  link: z.string().url("Invalid link").optional(),
  remarks: z.string().optional(),
});

// =======================================================
// API ENDPOINTS
// =======================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const researchWork = await prisma.researchWork.findUnique({
      where: { id },
      include: {
        authors: true,
        copyright: true,
        patent: true,
        transaction: true,
        conference: true,
        journal: true,
        bookChapter: true,
        grantIn: true,
        fdp: true,
        certification: true,
      },
    });

    if (!researchWork) {
      return NextResponse.json({ message: "Research work not found" }, { status: 404 });
    }

    return NextResponse.json(researchWork);

  } catch (error) {
    console.error("Error fetching research work:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const existingWork = await prisma.researchWork.findUnique({ where: { id } });
    if (!existingWork) {
      return NextResponse.json({ message: "Research work not found" }, { status: 404 });
    }

    let updateSchema;
    switch (existingWork.type) {
      case ResearchWorkType.COPYRIGHT:
        updateSchema = copyrightUpdateSchema;
        break;
      case ResearchWorkType.PATENT:
        updateSchema = patentUpdateSchema;
        break;
      case ResearchWorkType.TRANSACTION:
        updateSchema = transactionUpdateSchema;
        break;
      case ResearchWorkType.CONFERENCE:
        updateSchema = conferenceUpdateSchema;
        break;
      case ResearchWorkType.JOURNAL:
        updateSchema = journalUpdateSchema;
        break;
      case ResearchWorkType.BOOK_CHAPTER:
        updateSchema = bookChapterUpdateSchema;
        break;
      case ResearchWorkType.GRANT_IN:
        updateSchema = grantInUpdateSchema;
        break;
      case ResearchWorkType.FDP:
        updateSchema = fdpUpdateSchema;
        break;
      case ResearchWorkType.CERTIFICATION:
        updateSchema = certificationUpdateSchema;
        break;
      default:
        return NextResponse.json({ message: "Unsupported research work type" }, { status: 400 });
    }

    const parsedData = updateSchema.safeParse(body);

    if (!parsedData || !parsedData.success) {
      return NextResponse.json({
        message: "Invalid input for update",
        errors: parsedData?.error.format(),
      }, { status: 400 });
    }
    
    // Separate data for the base model and the nested model
    const baseUpdateData: any = {};
    const specificUpdateData: any = {};

    // Populate baseUpdateData with fields that exist in the base model
    if (parsedData.data.title !== undefined) baseUpdateData.title = parsedData.data.title;
    if (parsedData.data.isPublic !== undefined) baseUpdateData.isPublic = parsedData.data.isPublic;
    if (parsedData.data.authors !== undefined) {
      baseUpdateData.authors = {
        deleteMany: {},
        create: parsedData.data.authors.map(name => ({ name })),
      };
    }
    
    // Populate specificUpdateData with fields that only exist in the nested model
    // This is done by iterating through the validated data and skipping the base fields
    const baseFields = ['title', 'isPublic', 'authors', 'type', 'uploadedById'];
    for (const key in parsedData.data) {
        if (!baseFields.includes(key)) {
            specificUpdateData[key] = (parsedData.data as Record<string, any>)[key];
        }
    }

    const updatedResearchWork = await prisma.$transaction(async (tx) => {
      // 1. Update the base ResearchWork model
      const updatedWork = await tx.researchWork.update({
        where: { id },
        data: baseUpdateData,
      });

      // 2. Update the specific nested model based on the work's type
      switch (existingWork.type) {
        case ResearchWorkType.COPYRIGHT:
          await tx.copyright.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.PATENT:
          await tx.patent.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.TRANSACTION:
          await tx.transaction.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.CONFERENCE:
          await tx.conference.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.JOURNAL:
          await tx.journal.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.BOOK_CHAPTER:
          await tx.bookChapter.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.GRANT_IN:
          await tx.grantIn.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.FDP:
          await tx.fDP.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
        case ResearchWorkType.CERTIFICATION:
          await tx.certification.update({
            where: { researchWorkId: id },
            data: specificUpdateData,
          });
          break;
      }

      return updatedWork;
    });

    return NextResponse.json(updatedResearchWork);

  } catch (error) {
    console.error("Error updating research work:", error);
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.researchWork.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Research work deleted successfully" }, { status: 204 });

  } catch (error) {
    console.error("Error deleting research work:", error);
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}