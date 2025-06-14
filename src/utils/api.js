import axios from "axios";

// const API_BASE_URL = "http://localhost:8080/api";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_BASE_URL
    : "http://localhost:8080";
const API_BASE_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Get agent recommendations
export const getAgentRecommendations = async (agentType) => {
  try {
    const response = await api.post("/agent-recommendations", { agentType });
    return response.data;
  } catch (error) {
    console.error("Error getting agent recommendations:", error);
    throw error;
  }
};

// Update agent type
export const updateAgentType = async (sessionId, agentType) => {
  try {
    const response = await api.post("/agent-type", { sessionId, agentType });
    return response.data;
  } catch (error) {
    console.error("Error updating agent type:", error);
    throw error;
  }
};

// Upload documents
export const uploadDocuments = async (sessionId, documents) => {
  try {
    const response = await api.post("/documents", { sessionId, documents });
    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};

// Get session data
export const getSession = async (sessionId) => {
  try {
    const response = await api.get(`/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting session:", error);
    throw error;
  }
};
