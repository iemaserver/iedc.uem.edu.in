// Utility functions for exporting data to CSV format
import { Parser } from 'json2csv';

/**
 * Converts an array of objects to CSV string using json2csv
 */
export function jsonToCSV(data: any[], fields?: string[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (error) {
    console.error("Error converting to CSV:", error);
    return "";
  }
}

/**
 * Generic function to export any data array to CSV
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }
  
  const csvContent = jsonToCSV(data);
  const fullFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadCSV(csvContent, fullFilename);
}

/**
 * Downloads a CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US");
}

/**
 * Extract author names from research work data
 */
export function getAuthorNames(authors: any[]): string {
  if (!authors || authors.length === 0) return "";
  return authors
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    .map((author) => author.teacher?.user?.name || "")
    .filter(Boolean)
    .join(", ");
}

/**
 * Export Copyrights to CSV
 */
export function exportCopyrightsToCSV(copyrights: any[]): string {
  const data = copyrights.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Copyright Number": item.copyrightNumber || "",
    Applicant: item.applicant || "",
    "Filed Date": formatDateForCSV(item.filedAt),
    "Submitted Date": formatDateForCSV(item.submittedAt),
    "Published Date": formatDateForCSV(item.publishedAt),
    "Granted Date": formatDateForCSV(item.grantedAt),
    Country: item.country || "",
    "Certificate URL": item.certificateUrl || "",
    Inventors: getAuthorNames(item.inventors),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Patents to CSV
 */
export function exportPatentsToCSV(patents: any[]): string {
  const data = patents.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    Applicant: item.applicant,
    "Application Number": item.applicationNo || "",
    "Patent Number": item.patentNumber || "",
    "Filed Date": formatDateForCSV(item.filedAt),
    "Submitted Date": formatDateForCSV(item.submittedAt),
    "Published Date": formatDateForCSV(item.publishedAt),
    "Granted Date": formatDateForCSV(item.grantedAt),
    "Publication Link": item.publicationLink || "",
    "Patent Link": item.patentLink || "",
    Country: item.country || "",
    Inventors: getAuthorNames(item.inventors),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Journals to CSV
 */
export function exportJournalsToCSV(journals: any[]): string {
  const data = journals.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Journal Name": item.journalName,
    "Type of Journal": item.typeOfJournal || "",
    "Index of Journal": item.indexOfJournal || "",
    "Impact Factor": item.impactFactor || "",
    "Impact Factor Date": formatDateForCSV(item.impactFactorDate),
    Publisher: item.publisher || "",
    ISSN: item.issn || "",
    "Volume Number": item.volumeNumber || "",
    "Issue Number": item.issueNumber || "",
    "Page Numbers": item.pageNumbers || "",
    Status: item.status,
    "Status Date": formatDateForCSV(item.statusDate),
    "Paper Link/DOI": item.paperLinkDOI || "",
    "Registration Fees": item.registrationFees || "",
    "Reimbursement Status": item.reimbursementStatus || "",
    "Reimbursement Date": formatDateForCSV(item.reimbursementDate),
    Authors: getAuthorNames(item.authors),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Conferences to CSV
 */
export function exportConferencesToCSV(conferences: any[]): string {
  const data = conferences.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Conference Name": item.conferenceName,
    Mode: item.mode || "",
    "Type of Conference": item.typeOfConference || "",
    "Index of Conference": item.indexOfConference || "",
    Publisher: item.publisher || "",
    Location: item.location || "",
    "Conference Start Date": formatDateForCSV(item.conferenceStartDate),
    "Conference End Date": formatDateForCSV(item.conferenceEndDate),
    Status: item.status,
    "Status Date": formatDateForCSV(item.statusDate),
    "Paper Link/DOI": item.paperLinkDOI || "",
    "Registration Fees": item.registrationFees || "",
    "Reimbursement Status": item.reimbursementStatus || "",
    "Reimbursement Date": formatDateForCSV(item.reimbursementDate),
    Authors: getAuthorNames(item.authors),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Transactions to CSV
 */
export function exportTransactionsToCSV(transactions: any[]): string {
  const data = transactions.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Transaction Name": item.transactionName,
    "Type of Transaction": item.typeOfTransaction || "",
    "Index of Transaction": item.indexOfTransaction || "",
    "Impact Factor": item.impactFactor || "",
    "Impact Factor Date": formatDateForCSV(item.impactFactorDate),
    Publisher: item.publisher || "",
    Status: item.status,
    "Status Date": formatDateForCSV(item.statusDate),
    "Paper Link/DOI": item.paperLinkDOI || "",
    "Registration Fees": item.registrationFees || "",
    "Reimbursement Status": item.reimbursementStatus || "",
    "Reimbursement Date": formatDateForCSV(item.reimbursementDate),
    Authors: getAuthorNames(item.authors),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Book Chapters to CSV
 */
export function exportBookChaptersToCSV(bookChapters: any[]): string {
  const data = bookChapters.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Book Title": item.bookTitle || "",
    "Chapter Number": item.chapterNumber || "",
    Publisher: item.publisher || "",
    Edition: item.edition || "",
    Status: item.status,
    "Status Date": formatDateForCSV(item.statusDate),
    "ISBN/ISSN": item.isbnIssn || "",
    "Page Numbers": item.pageNumbers || "",
    "Registration Fees": item.registrationFees || "",
    "Reimbursement Status": item.reimbursementStatus || "",
    "Reimbursement Date": formatDateForCSV(item.reimbursementDate),
    Authors: getAuthorNames(item.authors),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Grants to CSV
 */
export function exportGrantsToCSV(grants: any[]): string {
  const data = grants.map((item) => ({
    Title: item.title,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Project Code": item.projectCode || "",
    "Funding Agency": item.fundingAgency || "",
    Status: item.status || "",
    "Applied Date": formatDateForCSV(item.appliedAt),
    "Granted Date": formatDateForCSV(item.grantedAt),
    "Completed Date": formatDateForCSV(item.completedAt),
    "Duration (Months)": item.durationMonths || "",
    "Grant Amount": item.grantAmount || "",
    "Utilized Amount": item.utilizedAmount || "",
    "Remaining Amount": item.remainingAmount || "",
    Publication: item.publication || "",
    "Publication Details": item.publicationDetails || "",
    Investigators: getAuthorNames(item.investigators),
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export FDPs to CSV
 */
export function exportFDPsToCSV(fdps: any[]): string {
  const data = fdps.map((item) => ({
    Name: item.name,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Organized By": item.organizedBy || "",
    "Sponsored By": item.sponsoredBy || "",
    Venue: item.venue || "",
    Duration: item.duration || "",
    "Start Date": formatDateForCSV(item.startDate),
    "End Date": formatDateForCSV(item.endDate),
    Topic: item.topic || "",
    "Certificate URL": item.certificateUrl || "",
    Remarks: item.remarks || "",
    Participants: item.participants?.map((p: any) => p.teacher?.user?.name || "").filter(Boolean).join(", ") || "",
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export Certifications to CSV
 */
export function exportCertificationsToCSV(certifications: any[]): string {
  const data = certifications.map((item) => ({
    "Certification Name": item.certificationName,
    Description: item.description || "",
    Keywords: item.keywords?.join("; ") || "",
    "Offered By": item.offeredBy || "",
    Platform: item.platform || "",
    "Certificate Number": item.certificateNumber || "",
    "Start Date": formatDateForCSV(item.startDate),
    "Completed Date": formatDateForCSV(item.completedAt),
    "Expires Date": formatDateForCSV(item.expiresAt),
    Link: item.link || "",
    "Certificate URL": item.certificateUrl || "",
    Remarks: item.remarks || "",
    Holders: item.holders?.map((h: any) => h.teacher?.user?.name || "").filter(Boolean).join(", ") || "",
    "Created At": formatDateForCSV(item.createdAt),
  }));
  
  return jsonToCSV(data);
}

/**
 * Export all research works to a single CSV with type indicator
 */
export function exportAllResearchWorksToCSV(data: any): string {
  const allRows: any[] = [];
  
  // Add copyrights
  data.copyrights?.forEach((item: any) => {
    allRows.push({
      Type: "Copyright",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.copyrightNumber || "",
      Status: "",
      Date: formatDateForCSV(item.grantedAt || item.publishedAt || item.filedAt),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add patents
  data.patents?.forEach((item: any) => {
    allRows.push({
      Type: "Patent",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.patentNumber || item.applicationNo || "",
      Status: "",
      Date: formatDateForCSV(item.grantedAt || item.publishedAt || item.filedAt),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add journals
  data.journals?.forEach((item: any) => {
    allRows.push({
      Type: "Journal",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.journalName || "",
      Status: item.status,
      Date: formatDateForCSV(item.statusDate),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add conferences
  data.conferences?.forEach((item: any) => {
    allRows.push({
      Type: "Conference",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.conferenceName || "",
      Status: item.status,
      Date: formatDateForCSV(item.conferenceStartDate),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add transactions
  data.transactions?.forEach((item: any) => {
    allRows.push({
      Type: "Transaction",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.transactionName || "",
      Status: item.status,
      Date: formatDateForCSV(item.statusDate),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add book chapters
  data.bookChapters?.forEach((item: any) => {
    allRows.push({
      Type: "Book Chapter",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.bookTitle || "",
      Status: item.status,
      Date: formatDateForCSV(item.statusDate),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add grants
  data.grants?.forEach((item: any) => {
    allRows.push({
      Type: "Grant",
      Title: item.title,
      Description: item.description || "",
      "Reference Number": item.projectCode || "",
      Status: item.status || "",
      Date: formatDateForCSV(item.grantedAt || item.appliedAt),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add FDPs
  data.fdps?.forEach((item: any) => {
    allRows.push({
      Type: "FDP",
      Title: item.name,
      Description: item.description || "",
      "Reference Number": item.organizedBy || "",
      Status: "",
      Date: formatDateForCSV(item.startDate),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  // Add certifications
  data.certifications?.forEach((item: any) => {
    allRows.push({
      Type: "Certification",
      Title: item.certificationName,
      Description: item.description || "",
      "Reference Number": item.certificateNumber || "",
      Status: "",
      Date: formatDateForCSV(item.completedAt),
      "Created At": formatDateForCSV(item.createdAt),
    });
  });
  
  return jsonToCSV(allRows);
}
