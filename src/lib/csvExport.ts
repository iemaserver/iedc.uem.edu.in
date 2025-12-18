import { BookChapter, Certification, Conference, Copyright, FDP, GrantIn, Journal, Patent, Transaction } from "@prisma/client";
import { utils, writeFile, WorkBook } from "xlsx-js-style";

interface bookChapterWithAuthors extends BookChapter {
  authors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface certificationsWithAuthors extends Certification {
  holders: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface conferenceWithAuthors extends Conference {
  authors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface copyrightWithAuthors extends Copyright {
  inventors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface fdpWithAuthors extends FDP {
  participants: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface GrantWithAuthors extends GrantIn {
  investigators: {
    id: string;
    role: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface JournalWithAuthors extends Journal {
  authors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

interface PatentWithInventors extends Patent {
  inventors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

// ------------------------
// Generate soft random colors
// ------------------------
function randomPastelColor() {
  const r = Math.floor(Math.random() * 127 + 127);
  const g = Math.floor(Math.random() * 127 + 127);
  const b = Math.floor(Math.random() * 127 + 127);
  return `FF${r.toString(16)}${g.toString(16)}${b.toString(16)}`.toUpperCase();
}

// ------------------------
// Create unique author-set signature
// ------------------------
function computeAuthorSet(authors: bookChapterWithAuthors["authors"]) {
  const sortedIds = authors.map((a) => a.teacher.user.id).sort();
  return sortedIds.join("|"); // Unique grouping key
}

// ------------------------
// Format date for Excel display
// ------------------------
function formatDate(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ------------------------
// FLATTEN BookChapter → Excel Row
// ------------------------
function flattenBookChapter(ch: bookChapterWithAuthors) {
  return {
    "Book Chapter Title": ch.title,
    status: ch.status,
    "ISBN/ISSN": ch.isbnIssn ?? "",
    "Registration Fees": ch.registrationFees ?? "",
    reimbursement: ch.reimbursement ?? "",
    createdAt: formatDate(ch.createdAt),
    updatedAt: formatDate(ch.updatedAt),

    authors: ch.authors.map((a) => a.teacher.user.name).join(", "),
    authorSet: computeAuthorSet(ch.authors),
  };
}
function flattenGrantIn(ch: GrantWithAuthors) {
  return {
    "Title": ch.title,
    "Project Code": ch.projectCode ?? "",
    "Project PI": ch.projectPI ?? "",
    "Project Co-PI": ch.projectCoPI ?? "",
    status: ch.status,
    "Applied At": formatDate(ch.appliedAt ?? null),
    "Granted At": formatDate(ch.grantedAt ?? null),
    "Completed At": formatDate(ch.completedAt ?? null),
    "Duration (Months)": ch.durationMonths ?? "",
    "Grant Amount": ch.grantAmount ?? "",
    "Utilized Amount": ch.utilizedAmount ?? "",
    "Remaining Amount": ch.remainingAmount ?? "",
    Publication: ch.publication ?? "",
    "Publication Details": ch.publicationDetails ?? "",
    createdAt: formatDate(ch.createdAt),
    updatedAt: formatDate(ch.updatedAt),
    investigators: ch.investigators.map((a)=>a.role + ": " + a.teacher.user.name).join(", "),
    investigatorSet: computeAuthorSet(ch.investigators),
  };
}
function flattenFDP(ch: fdpWithAuthors) {
  return {
    "FDP Title": ch.name,
    "Organized By": ch.organizedBy ?? "",
    "Sponsored By": ch.sponsoredBy ?? "",
    Venue: ch.venue ?? "",
    Duration: ch.duration ?? "",
    Topic: ch.topic ?? "",
    "Start Date": formatDate(ch.startDate ?? null),
    "End Date": formatDate(ch.endDate ?? null),
    certificateUrl: ch.certificateUrl ?? "",
    remarks: ch.remarks ?? "",
    createdAt: formatDate(ch.createdAt),
    updatedAt: formatDate(ch.updatedAt),
    participants: ch.participants.map((a) => a.teacher.user.name).join(", "),
    participantSet: computeAuthorSet(ch.participants),
  };
}
function flattenCertification(ch: certificationsWithAuthors) {
  return {
    "Certification Title": ch.certificationName,
    "Offered By": ch.offeredBy ?? "",
    Link: ch.link ?? "",
    remarks: ch.remarks ?? "",
    "Completion Date": formatDate(ch.completedAt ?? null),
    createdAt: formatDate(ch.createdAt),
    updatedAt: formatDate(ch.updatedAt),

    Holders: ch.holders.map((a) => a.teacher.user.name).join(", "),
    holderSet: computeAuthorSet(ch.holders),
  };
}
function flattenConference(ch: conferenceWithAuthors) {
  return {
    "Conference Title": ch.conferenceName,
    mode: ch.mode ?? "",
    "Type Of Conference": ch.typeOfConference ?? "",
    "Index Of Conference": ch.indexOfConference ?? "",
    Publisher: ch.publisher ?? "",
    Location: ch.location ?? "",
    "Conference Start Date": formatDate(ch.conferenceStartDate ?? null),
    "Conference End Date": formatDate(ch.conferenceEndDate ?? null),
    status: ch.status,
    "Paper Link DOI": ch.paperLinkDOI ?? "",
    "Registration Fees": ch.registrationFees ?? "",
    "Reimbursement Status": ch.reimbursementStatus ?? "",
    "Reimbursement Date": formatDate(ch.reimbursementDate ?? null),
    createdAt: formatDate(ch.createdAt),
    updatedAt: formatDate(ch.updatedAt),

    authors: ch.authors.map((a) => a.teacher.user.name).join(", "),
    authorSet: computeAuthorSet(ch.authors),
  };
}
function flattenCopyrights(ch: copyrightWithAuthors) {
  return {
    "Copyright Title": ch.title,
    "Filed Date": formatDate(ch.filedAt ?? null),
    "Submitted Date": formatDate(ch.submittedAt ?? null),
    "Published Date": formatDate(ch.publishedAt ?? null),
    "Grant Date": formatDate(ch.grantedAt ?? null),
    createdAt: formatDate(ch.createdAt),
    updatedAt: formatDate(ch.updatedAt),

    Inventors: ch.inventors.map((a) => a.teacher.user.name).join(", "),
    inventorSet: computeAuthorSet(ch.inventors),
  };
}

// ------------------------
// EXPORT FUNCTION
// ------------------------
export function exportCertificationsExcel(
  certifications: certificationsWithAuthors[],
  fileName = "Certifications.xlsx"
) {
  if (!certifications.length) return;

  // Flatten rows
  const flatRows = certifications.map(flattenCertification);

  // Extract headers
  const headers = Object.keys(flatRows[0]);

  // Build initial sheet
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  // Style header row (row 0)
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });

    if (!ws[headerCell]) return;

    ws[headerCell].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF28a745" }, // Green background
      },
      font: {
        bold: true,
        color: { rgb: "FF000000" }, // Black text
      },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  // Group color mapping
  const colorMap = new Map<string, string>();

  flatRows.forEach((row, index) => {
    const excelRow = index + 2; // 1 = headers
    const groupKey = row.holderSet;

    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;

    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });

      if (!ws[cellAddress]) return;

      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: bg },
        },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  // Workbook
  const wb: WorkBook = {
    SheetNames: ["BookChapters"],
    Sheets: { BookChapters: ws },
  };

  writeFile(wb, fileName);
}
export function exportGrantIn(
  grants: GrantWithAuthors[],
  fileName = "Grants.xlsx"
) {
  if (!grants.length) return;

  // Flatten rows
  const flatRows = grants.map(flattenGrantIn);

  // Extract headers
  const headers = Object.keys(flatRows[0]);

  // Build initial sheet
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  // Style header row (row 0)
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });

    if (!ws[headerCell]) return;

    ws[headerCell].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF28a745" }, // Green background
      },
      font: {
        bold: true,
        color: { rgb: "FF000000" }, // Black text
      },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  // Group color mapping
  const colorMap = new Map<string, string>();

  flatRows.forEach((row, index) => {
    const excelRow = index + 2; // 1 = headers
    const groupKey = row.investigatorSet;

    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;

    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });

      if (!ws[cellAddress]) return;

      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: bg },
        },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  // Workbook
  const wb: WorkBook = {
    SheetNames: ["BookChapters"],
    Sheets: { BookChapters: ws },
  };

  writeFile(wb, fileName);
}
export function exportFDPsExcel(
  fdps: fdpWithAuthors[],
  fileName = "FDPs.xlsx"
) {
  if (!fdps.length) return;

  // Flatten rows
  const flatRows = fdps.map(flattenFDP);

  // Extract headers
  const headers = Object.keys(flatRows[0]);

  // Build initial sheet
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  // Style header row (row 0)
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });

    if (!ws[headerCell]) return;

    ws[headerCell].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF28a745" }, // Green background
      },
      font: {
        bold: true,
        color: { rgb: "FF000000" }, // Black text
      },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  // Group color mapping
  const colorMap = new Map<string, string>();

  flatRows.forEach((row, index) => {
    const excelRow = index + 2; // 1 = headers
    const groupKey = row.participantSet;

    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;

    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });

      if (!ws[cellAddress]) return;

      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: bg },
        },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  // Workbook
  const wb: WorkBook = {
    SheetNames: ["BookChapters"],
    Sheets: { BookChapters: ws },
  };

  writeFile(wb, fileName);
}
export function exportCopyrightsExcel(
  copyrights: copyrightWithAuthors[],
  fileName = "Copyrights.xlsx"
) {
  if (!copyrights.length) return;

  // Flatten rows
  const flatRows = copyrights.map(flattenCopyrights);

  // Extract headers
  const headers = Object.keys(flatRows[0]);

  // Build initial sheet
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  // Style header row (row 0)
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });

    if (!ws[headerCell]) return;

    ws[headerCell].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF28a745" }, // Green background
      },
      font: {
        bold: true,
        color: { rgb: "FF000000" }, // Black text
      },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  // Group color mapping
  const colorMap = new Map<string, string>();

  flatRows.forEach((row, index) => {
    const excelRow = index + 2; // 1 = headers
    const groupKey = row.inventorSet;

    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;

    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });

      if (!ws[cellAddress]) return;

      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: bg },
        },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  // Workbook
  const wb: WorkBook = {
    SheetNames: ["BookChapters"],
    Sheets: { BookChapters: ws },
  };

  writeFile(wb, fileName);
}
export function exportBookChaptersExcel(
  chapters: bookChapterWithAuthors[],
  fileName = "BookChapters.xlsx"
) {
  if (!chapters.length) return;

  // Flatten rows
  const flatRows = chapters.map(flattenBookChapter);

  // Extract headers
  const headers = Object.keys(flatRows[0]);

  // Build initial sheet
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  // Style header row (row 0)
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });

    if (!ws[headerCell]) return;

    ws[headerCell].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF28a745" }, // Green background
      },
      font: {
        bold: true,
        color: { rgb: "FF000000" }, // Black text
      },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  // Group color mapping
  const colorMap = new Map<string, string>();

  flatRows.forEach((row, index) => {
    const excelRow = index + 2; // 1 = headers
    const groupKey = row.authorSet;

    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;

    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });

      if (!ws[cellAddress]) return;

      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: bg },
        },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  // Workbook
  const wb: WorkBook = {
    SheetNames: ["BookChapters"],
    Sheets: { BookChapters: ws },
  };

  writeFile(wb, fileName);
}
export function exportConferenceExcel(
  chapters: conferenceWithAuthors[],
  fileName = "Conference.xlsx"
) {
  if (!chapters.length) return;

  // Flatten rows
  const flatRows = chapters.map(flattenConference);

  // Extract headers
  const headers = Object.keys(flatRows[0]);

  // Build initial sheet
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  // Style header row (row 0)
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });

    if (!ws[headerCell]) return;

    ws[headerCell].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF28a745" }, // Green background
      },
      font: {
        bold: true,
        color: { rgb: "FF000000" }, // Black text
      },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  // Group color mapping
  const colorMap = new Map<string, string>();

  flatRows.forEach((row, index) => {
    const excelRow = index + 2; // 1 = headers
    const groupKey = row.authorSet;

    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;

    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });

      if (!ws[cellAddress]) return;

      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: bg },
        },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  // Workbook
  const wb: WorkBook = {
    SheetNames: ["BookChapters"],
    Sheets: { BookChapters: ws },
  };

  writeFile(wb, fileName);
}

// ------------------------
// Journals Export
// ------------------------
function flattenJournals(journal: JournalWithAuthors) {
  return {
    "Journal Title": journal.title,
    "Journal Name": journal.journalName || "N/A",
    "Publisher": journal.publisher || "N/A",
    "Status": journal.status || "N/A",
    "Status Date": formatDate(journal.statusDate ?? null),
    "Impact Factor": journal.impactFactor ? journal.impactFactor.toString() : "N/A",
    "Impact Factor Date": formatDate(journal.impactFactorDate ?? null),
    "Reimbursement Date": formatDate(journal.reimbursementDate ?? null),
    "Created At": formatDate(journal.createdAt),
    "Updated At": formatDate(journal.updatedAt),
    "Authors": journal.authors.map((a) => a.teacher.user.name).join(", "),
    "authorSet": computeAuthorSet(journal.authors),
  };
}

export function exportJournalsExcel(
  journals: JournalWithAuthors[],
  fileName = "Journals.xlsx"
) {
  if (!journals.length) return;

  const flatRows = journals.map(flattenJournals);
  const headers = Object.keys(flatRows[0]);
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });
    if (!ws[headerCell]) return;
    ws[headerCell].s = {
      fill: { patternType: "solid", fgColor: { rgb: "FF28a745" } },
      font: { bold: true, color: { rgb: "FF000000" } },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  const colorMap = new Map<string, string>();
  flatRows.forEach((row, index) => {
    const excelRow = index + 2;
    const groupKey = row.authorSet;
    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;
    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = {
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  const wb: WorkBook = { SheetNames: ["Journals"], Sheets: { Journals: ws } };
  writeFile(wb, fileName);
}

// ------------------------
// Patents Export
// ------------------------
function flattenPatents(patent: PatentWithInventors) {
  return {
    "Patent Title": patent.title,
    "Applicant": patent.applicant || "N/A",
    "Application Number": patent.applicationNo || "N/A",
    "Patent Number": patent.patentNumber || "N/A",
    "Country": patent.country || "N/A",
    "Filed Date": formatDate(patent.filedAt ?? null),
    "Submitted Date": formatDate(patent.submittedAt ?? null),
    "Published Date": formatDate(patent.publishedAt ?? null),
    "Granted Date": formatDate(patent.grantedAt ?? null),
    "Created At": formatDate(patent.createdAt),
    "Updated At": formatDate(patent.updatedAt),
    "Inventors": patent.inventors.map((i) => i.teacher.user.name).join(", "),
    "inventorSet": computeAuthorSet(patent.inventors),
  };
}

export function exportPatentsExcel(
  patents: PatentWithInventors[],
  fileName = "Patents.xlsx"
) {
  if (!patents.length) return;

  const flatRows = patents.map(flattenPatents);
  const headers = Object.keys(flatRows[0]);
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });
    if (!ws[headerCell]) return;
    ws[headerCell].s = {
      fill: { patternType: "solid", fgColor: { rgb: "FF28a745" } },
      font: { bold: true, color: { rgb: "FF000000" } },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  const colorMap = new Map<string, string>();
  flatRows.forEach((row, index) => {
    const excelRow = index + 2;
    const groupKey = row.inventorSet;
    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;
    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = {
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  const wb: WorkBook = { SheetNames: ["Patents"], Sheets: { Patents: ws } };
  writeFile(wb, fileName);
}

// ------------------------
// Transactions Export
// ------------------------
interface TransactionWithAuthors extends Transaction {
  authors: {
    id: string;
    teacher: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
    };
  }[];
}

function flattenTransactions(transaction: TransactionWithAuthors) {
  return {
    "Transaction Title": transaction.title,
    "Transaction Name": transaction.transactionName || "N/A",
    "Type": transaction.typeOfTransaction || "N/A",
    "Index": transaction.indexOfTransaction || "N/A",
    "Publisher": transaction.publisher || "N/A",
    "Status": transaction.status || "N/A",
    "Status Date": formatDate(transaction.statusDate ?? null),
    "Impact Factor": transaction.impactFactor ? transaction.impactFactor.toString() : "N/A",
    "Impact Factor Date": formatDate(transaction.impactFactorDate ?? null),
    "DOI/Link": transaction.paperLinkDOI || "N/A",
    "Registration Fees": transaction.registrationFees ? transaction.registrationFees.toString() : "N/A",
    "Reimbursement Status": transaction.reimbursementStatus || "N/A",
    "Visibility": transaction.isPublic ? "Public" : "Private",
    "Created At": formatDate(transaction.createdAt),
    "Updated At": formatDate(transaction.updatedAt),
    "Authors": transaction.authors.map((a) => a.teacher.user.name).join(", "),
    "authorSet": computeAuthorSet(transaction.authors),
  };
}

export function exportTransactionsExcel(
  transactions: TransactionWithAuthors[],
  fileName = "Transactions.xlsx"
) {
  if (!transactions.length) return;

  const flatRows = transactions.map(flattenTransactions);
  const headers = Object.keys(flatRows[0]);
  const sheetData = [
    headers,
    ...flatRows.map((row) => headers.map((h) => row[h as keyof typeof row])),
  ];

  const ws = utils.aoa_to_sheet(sheetData);

  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });
    if (!ws[headerCell]) return;
    ws[headerCell].s = {
      fill: { patternType: "solid", fgColor: { rgb: "FF28a745" } },
      font: { bold: true, color: { rgb: "FF000000" } },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });

  const colorMap = new Map<string, string>();
  flatRows.forEach((row, index) => {
    const excelRow = index + 2;
    const groupKey = row.authorSet;
    if (!colorMap.has(groupKey)) {
      colorMap.set(groupKey, randomPastelColor());
    }
    const bg = colorMap.get(groupKey)!;
    headers.forEach((_, colIndex) => {
      const cellAddress = utils.encode_cell({ r: excelRow - 1, c: colIndex });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = {
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        alignment: { vertical: "center", horizontal: "left" },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } },
        },
      };
    });
  });

  const wb: WorkBook = { SheetNames: ["Transactions"], Sheets: { Transactions: ws } };
  writeFile(wb, fileName);
}
