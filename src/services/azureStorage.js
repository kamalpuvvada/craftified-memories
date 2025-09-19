
const connectionString = process.env.REACT_APP_AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'product-images';

// ✅ This works in browser
import { BlobServiceClient } from '@azure/storage-blob';

export const uploadToBlobStorage = async (file, sasUrl) => {
  try {
    const blobServiceClient = new BlobServiceClient(sasUrl);
    const containerClient = blobServiceClient.getContainerClient('products');
    const blobName = `${Date.now()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.uploadData(file);
    return blockBlobClient.url.split('?')[0];
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

