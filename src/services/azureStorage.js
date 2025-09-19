import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.REACT_APP_AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'product-images';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export const uploadImageToAzure = async (file) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${Date.now()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(file, file.size);
    
    return blockBlobClient.url; // This is your public image URL
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
