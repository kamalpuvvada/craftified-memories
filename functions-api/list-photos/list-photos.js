const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
    const containerName = "photos"; // replace with your container name

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    let blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobUrl = `${containerClient.url}/${blob.name}`;
      blobs.push({ name: blob.name, url: blobUrl });
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: blobs
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: err.message }
    };
  }
};
