// Teacher API fetching functions
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE_URL = "/api/teacher";

// Fetch Teachers List
export const fetchTeachers = async (params?: {
  limit?: number;
  page?: number;
  department?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.department) queryParams.append("department", params.department);
    if (params?.search) queryParams.append("search", params.search);

    const response = await axios.get(
      `${API_BASE_URL}?${queryParams.toString()}`
    );
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching teachers");
    throw error;
  }
};

// Book Chapter APIs
export const fetchBookChapters = async (params?: {
  limit?: number;
  page?: number;
  isPublic?: boolean;
  status?: string;
  title?: string;
  minFees?: number;
  maxFees?: number;
  isbnIssn?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  all?: boolean;
  teacherName?: string[];
}) => {
  try {
    const queryParams = new URLSearchParams();

    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/bookchapter`);
      return response.data;
    }

    // Build query params dynamically
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          queryParams.append(key, value.join(","));
        } else if (!Array.isArray(value)) {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    const response = await axios.get(
      `${API_BASE_URL}/bookchapter${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Error fetching book chapters";
    toast.error(errorMessage);
    throw error;
  }
};

export const createBookChapter = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bookchapter`, data);
    toast.success("Book chapter created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating book chapter");
    throw error;
  }
};

export const updateBookChapter = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/bookchapter/${id}`,
      data
    );
    toast.success("Book chapter updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating book chapter");
    throw error;
  }
};

export const deleteBookChapter = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/bookchapter/${id}`);
    toast.success("Book chapter deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting book chapter");
    throw error;
  }
};

export const deleteMultipleBookChapters = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/bookchapter`, {
      data: { ids },
    });
    toast.success(`${ids.length} book chapter(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error deleting book chapters"
    );
    throw error;
  }
};

// Certification APIs
export const fetchCertifications = async (params?:{
  page?: number;
  limit?: number;
  all?: boolean;
  isPublic?: boolean;
  title?: string;
  offeredBy?: string;
  remarks?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  completedAfter?: string;
  completedBefore?: string;
  teacherName?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  try {
    const queryParams = new URLSearchParams();

    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/certification`);
      return response.data;
    }

    // Build query params dynamically
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          queryParams.append(key, value.join(","));
        } else if (!Array.isArray(value)) {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    const response = await axios.get(
      `${API_BASE_URL}/certification${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error fetching certifications"
    );
    throw error;
  }
};

export const createCertification = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/certification`, data);
    toast.success("Certification created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error creating certification"
    );
    throw error;
  }
};

export const updateCertification = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/certification/${id}`,
      data
    );
    toast.success("Certification updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error updating certification"
    );
    throw error;
  }
};

export const deleteCertification = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/certification/${id}`);
    toast.success("Certification deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error deleting certification"
    );
    throw error;
  }
};

export const deleteMultipleCertifications = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/certification`, {
      data: { ids },
    });
    toast.success(`${ids.length} certification(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error deleting certifications"
    );
    throw error;
  }
};

// Conference APIs
export const fetchConferences = async (params?:{
  page?: number;
  limit?: number;
  all?: boolean;

  conferenceName?: string | null;
  mode?: string | null;
  typeOfConference?: string | null;
  indexOfConference?: string | null;
  publisher?: string | null;
  location?: string | null;
  status?: string | null;

  registrationFeesMin?: number | null;
  registrationFeesMax?: number | null;
  registrationFees?: number | null;

  reimbursementStatus?: string | null;
  isPublic?: boolean | null;

  createdAfter?: Date | null;
  createdBefore?: Date | null;

  updatedAfter?: Date | null;
  updatedBefore?: Date | null;

  conferenceStartAfter?: Date | null;
  conferenceStartBefore?: Date | null;

  conferenceEndAfter?: Date | null;
  conferenceEndBefore?: Date | null;

  teacherName?: string[];

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/conference`);
      return response.data;
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } else if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    const response = await axios.get(`${API_BASE_URL}/conference?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching conferences");
    throw error;
  }
};

export const createConference = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/conference`, data);
    toast.success("Conference created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating conference");
    throw error;
  }
};

export const updateConference = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/conference/${id}`,
      data
    );
    toast.success("Conference updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating conference");
    throw error;
  }
};

export const deleteConference = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/conference/${id}`);
    toast.success("Conference deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting conference");
    throw error;
  }
};

export const deleteMultipleConferences = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/conference`, {
      data: { ids },
    });
    toast.success(`${ids.length} conference(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting conferences");
    throw error;
  }
};


// Copyright APIs
export const fetchCopyrights = async (params?:{
  [key: string]: string | number | boolean | Date | string[] | null | undefined;
  page?: number;
  limit?: number;
  all?: boolean;

  title?: string | null;
  isPublic?: boolean | null;
  filedAfter?: string | null;
  filedBefore?: string | null;
  submittedAfter?: string | null;
  submittedBefore?: string | null;
  publishedAfter?: string | null;
  publishedBefore?: string | null;
  grantedAfter?: string | null;
  grantedBefore?: string | null;
  createdAfter?: string | null;
  createdBefore?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  teacherName?: string[];

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  try {
    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/copyright`);
      return response.data;
    }
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } 
          else if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          }
          else {
            queryParams.append(key, String(value));
          }

        }
      });
    }

    
    const response = await axios.get(`${API_BASE_URL}/copyright?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching copyrights");
    throw error;
  }
};

export const createCopyright = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/copyright`, data);
    toast.success("Copyright created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating copyright");
    throw error;
  }
};

export const updateCopyright = async (id: string, data: any) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/copyright/${id}`, data);
    toast.success("Copyright updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating copyright");
    throw error;
  }
};

export const deleteCopyright = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/copyright/${id}`);
    toast.success("Copyright deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting copyright");
    throw error;
  }
};

export const deleteMultipleCopyrights = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/copyright`, {
      data: { ids },
    });
    toast.success(`${ids.length} copyright(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting copyrights");
    throw error;
  }
};

// FDP APIs
export const fetchFDPs = async (params?:{
  [key: string]: string | number | boolean | Date | string[] | null | undefined;
  page?: number;
  limit?: number;
  all?: boolean;
  name?: string;
  isPublic?: boolean;
  organizedBy?: string;
  sponsoredBy?: string;
  startDate?: string;
  startAfter?: string;
  startBefore?: string;
  endDate?: string;
  endAfter?: string;
  endBefore?: string;
  topic?: string;
  venue?: string;
  duration?: string;
  certificateUrl?: string;
  remarks?: string;
  teacherName?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";

})=>{
  try {
    if (!params) {
     const response = await axios.get(`${API_BASE_URL}/fdp`);
    return response.data;
    }
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } 
          else if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          }
          else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    const response = await axios.get(`${API_BASE_URL}/fdp?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching FDPs");
    throw error;
  }
};

export const createFDP = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/fdp`, data);
    toast.success("FDP created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating FDP");
    throw error;
  }
};

export const updateFDP = async (id: string, data: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/fdp/${id}`, data);
    toast.success("FDP updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating FDP");
    throw error;
  }
};

export const deleteFDP = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/fdp/${id}`);
    toast.success("FDP deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting FDP");
    throw error;
  }
};

export const deleteMultipleFDPs = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/fdp`, {
      data: { ids },
    });
    toast.success(`${ids.length} FDP(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting FDPs");
    throw error;
  }
};

// Grant APIs
export const fetchGrants = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/grant`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching grants");
    throw error;
  }
};

export const createGrant = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/grant`, data);
    toast.success("Grant created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating grant");
    throw error;
  }
};

export const updateGrant = async (id: string, data: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/grant/${id}`, data);
    toast.success("Grant updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating grant");
    throw error;
  }
};

export const deleteGrant = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/grant/${id}`);
    toast.success("Grant deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting grant");
    throw error;
  }
};

export const deleteMultipleGrants = async (ids: string[]) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/grant?ids=${ids.join(",")}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Error deleting grants";
    throw new Error(errorMessage);
  }
};


export const createJournal = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/journal`, data);
    toast.success("Journal created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating journal");
    throw error;
  }
};

export const updateJournal = async (id: string, data: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/journal/${id}`, data);
    toast.success("Journal updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating journal");
    throw error;
  }
};

export const deleteJournal = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/journal/${id}`);
    toast.success("Journal deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting journal");
    throw error;
  }
};

export const deleteMultipleJournals = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/journal`, {
      data: { ids },
    });
    toast.success(`${ids.length} journal(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting journals");
    throw error;
  }
};

// Add fetchJournals with advanced parameters before deleteJournal
export const fetchJournals = async (params?:{
  [key: string]: string | number | boolean | Date | string[] | null | undefined;
  page?: number;
  limit?: number;
  all?: boolean;

  title?: string | null;
  journalName?: string | null;
  typeOfJournal?: string | null;
  indexOfJournal?: string | null;
  publisher?: string | null;
  status?: string | null;
  isPublic?: boolean | null;
  statusAfter?: string | null;
  statusBefore?: string | null;
  impactFactorAfter?: string | null;
  impactFactorBefore?: string | null;
  reimbursementAfter?: string | null;
  reimbursementBefore?: string | null;
  createdAfter?: string | null;
  createdBefore?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  teacherName?: string[];

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  try {
    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/journal`);
      return response.data;
    }
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } 
          else if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          }
          else {
            queryParams.append(key, String(value));
          }

        }
      });
    }

    
    const response = await axios.get(`${API_BASE_URL}/journal?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching journals");
    throw error;
  }
};

// Patent APIs
export const fetchPatents = async (params?:{
  [key: string]: string | number | boolean | Date | string[] | null | undefined;
  page?: number;
  limit?: number;
  all?: boolean;

  title?: string | null;
  applicant?: string | null;
  applicationNo?: string | null;
  patentNumber?: string | null;
  country?: string | null;
  isPublic?: boolean | null;
  filedAfter?: string | null;
  filedBefore?: string | null;
  submittedAfter?: string | null;
  submittedBefore?: string | null;
  publishedAfter?: string | null;
  publishedBefore?: string | null;
  grantedAfter?: string | null;
  grantedBefore?: string | null;
  createdAfter?: string | null;
  createdBefore?: string | null;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  teacherName?: string[];

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  try {
    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/patent`);
      return response.data;
    }
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } 
          else if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          }
          else {
            queryParams.append(key, String(value));
          }

        }
      });
    }

    
    const response = await axios.get(`${API_BASE_URL}/patent?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching patents");
    throw error;
  }
};

export const createPatent = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/patent`, data);
    toast.success("Patent created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating patent");
    throw error;
  }
};

export const updatePatent = async (id: string, data: any) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/patent/${id}`, data);
    toast.success("Patent updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating patent");
    throw error;
  }
};

export const deletePatent = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/patent/${id}`);
    toast.success("Patent deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting patent");
    throw error;
  }
};

export const deleteMultiplePatents = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/patent`, {
      data: { ids },
    });
    toast.success(`${ids.length} patent(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting patents");
    throw error;
  }
};

// Transaction APIs
export const fetchTransactions = async (params?: {
  page?: number;
  limit?: number;
  all?: boolean;
  title?: string;
  transactionName?: string;
  typeOfTransaction?: string;
  indexOfTransaction?: string;
  publisher?: string;
  status?: string;
  isPublic?: boolean;
  statusAfter?: string;
  statusBefore?: string;
  impactFactorAfter?: string;
  impactFactorBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  teacherName?: string;
  teachersName?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  try {
    const queryParams = new URLSearchParams();

    if (!params) {
      const response = await axios.get(`${API_BASE_URL}/transaction`);
      return response.data;
    }

    // Build query params dynamically
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "teachersName" && Array.isArray(value) && value.length > 0) {
          // Handle teachersName array - send first name or join them
          queryParams.append("teacherName", value[0]);
        } else if (Array.isArray(value) && value.length > 0) {
          queryParams.append(key, value.join(","));
        } else if (!Array.isArray(value)) {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    const response = await axios.get(
      `${API_BASE_URL}/transaction${queryString ? `?${queryString}` : ""}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Error fetching transactions";
    toast.error(errorMessage);
    throw error;
  }
};

export const createTransaction = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/transaction`, data);
    toast.success("Transaction created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating transaction");
    throw error;
  }
};

export const updateTransaction = async (id: string, data: any) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/transaction/${id}`, data);
    toast.success("Transaction updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating transaction");
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/transaction/${id}`);
    toast.success("Transaction deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting transaction");
    throw error;
  }
};

export const deleteMultipleTransactions = async (ids: string[]) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/transaction?ids=${ids.join(",")}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Error deleting transactions";
    throw new Error(errorMessage);
  }
};
