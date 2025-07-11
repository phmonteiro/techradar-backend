import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";

dotenv.config();

// Connection string from Azure Portal
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "technology-images";

function getBlobServiceClient() {
  if (!connectionString) {
    throw new Error('Azure Storage connection string is not configured');
  }
  return BlobServiceClient.fromConnectionString(connectionString);
}

export { getBlobServiceClient, containerName };
