const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");

// Upload Photo function
app.http("upload-photo", {
  methods: ["POST"],
  authLevel: "function",
  handler: async (request, context) => {
    try {
      const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
      const containerName = "photos"; // change if needed

      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(containerName);

      // Read file from request
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return { status: 400, body: "No file uploaded" };
      }

      const blobName = Date.now() + "-" + file.name;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(Buffer.from(await file.arrayBuffer()));

      return {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: { message: "Upload successful", url: blockBlobClient.url }
      };
    } catch (err) {
      context.log.error(err);
      return { status: 500, body: { error: err.message } };
    }
  }
});

// List Photos function
app.http("list-photos", {
  methods: ["GET"],
  authLevel: "function",
  handler: async (request, context) => {
    try {
      const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
      const containerName = "photos"; // change if needed

      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(containerName);

      let blobs = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        blobs.push({ name: blob.name, url: `${containerClient.url}/${blob.name}` });
      }

      return {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: blobs
      };
    } catch (err) {
      context.log.error(err);
      return { status: 500, body: { error: err.message } };
    }
  }
});
