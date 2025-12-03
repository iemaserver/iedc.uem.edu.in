// Teacher API fetching functions
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE_URL = "/api/teacher";

// Fetch Teachers List
export const fetchTeachers = async (params?: { limit?: number; page?: number; department?: string; search?: string }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.department) queryParams.append("department", params.department);
    if (params?.search) queryParams.append("search", params.search);
    
    const response = await axios.get(`${API_BASE_URL}?${queryParams.toString()}`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching teachers");
    throw error;
  }
};

// Book Chapter APIs
export const fetchBookChapters = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bookchapter`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching book chapters");
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
    const response = await axios.patch(`${API_BASE_URL}/bookchapter/${id}`, data);
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
    const response = await axios.delete(`${API_BASE_URL}/bookchapter`, { data: { ids } });
    toast.success(`${ids.length} book chapter(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting book chapters");
    throw error;
  }
};

// Certification APIs
export const fetchCertifications = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/certification`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching certifications");
    throw error;
  }
};

export const createCertification = async (data: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/certification`, data);
    toast.success("Certification created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating certification");
    throw error;
  }
};

export const updateCertification = async (id: string, data: any) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/certification/${id}`, data);
    toast.success("Certification updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating certification");
    throw error;
  }
};

export const deleteCertification = async (id: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/certification/${id}`);
    toast.success("Certification deleted successfully");
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting certification");
    throw error;
  }
};

export const deleteMultipleCertifications = async (ids: string[]) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/certification`, { data: { ids } });
    toast.success(`${ids.length} certification(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting certifications");
    throw error;
  }
};

// Conference APIs
export const fetchConferences = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/conference`);
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
    const response = await axios.patch(`${API_BASE_URL}/conference/${id}`, data);
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
    const response = await axios.delete(`${API_BASE_URL}/conference`, { data: { ids } });
    toast.success(`${ids.length} conference(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting conferences");
    throw error;
  }
};

// Copyright APIs
export const fetchCopyrights = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/copyright`);
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
    const response = await axios.delete(`${API_BASE_URL}/copyright`, { data: { ids } });
    toast.success(`${ids.length} copyright(s) deleted successfully`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error deleting copyrights");
    throw error;
  }
};

// FDP APIs
export const fetchFDPs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/fdp`);
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
    const response = await axios.delete(`${API_BASE_URL}/fdp`, { data: { ids } });
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
    const response = await axios.delete(`${API_BASE_URL}/grant?ids=${ids.join(",")}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Error deleting grants";
    throw new Error(errorMessage);
  }
};

// Journal APIs
export const fetchJournals = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/journal`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching journals");
    throw error;
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
    const response = await axios.delete(`${API_BASE_URL}/journal?ids=${ids.join(",")}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Error deleting journals";
    throw new Error(errorMessage);
  }
};

// Patent APIs
export const fetchPatents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/patent`);
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
    const response = await axios.delete(`${API_BASE_URL}/patent?ids=${ids.join(",")}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Error deleting patents";
    throw new Error(errorMessage);
  }
};

// Transaction APIs
export const fetchTransactions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transaction`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching transactions");
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
    const response = await axios.put(`${API_BASE_URL}/transaction/${id}`, data);
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
    const response = await axios.delete(`${API_BASE_URL}/transaction?ids=${ids.join(",")}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || "Error deleting transactions";
    throw new Error(errorMessage);
  }
};
