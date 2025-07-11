// blobStorage.js
import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "techradar-images";

async function uploadImageToBlob(file, fileName) {
  try {
    // Create the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    // Upload the file
    await blockBlobClient.upload(file.buffer, file.size);
    
    // Return the URL of the uploaded blob
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading to blob storage:", error);
    throw error;
  }
}

export { uploadImageToBlob };