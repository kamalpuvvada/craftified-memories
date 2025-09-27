const { setAuthorizationTokenHeaderUsingMasterKey } = require('@azure/cosmos');
const { app } = require('@azure/functions');
const multipart = require('parse-multipart-data');
const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');

app.http('upload-photo', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Photo upload context triggered');

        try {
            if (request.method === 'GET') {

                //Handle get testing
                const name = request.query.name || 'unknown';
                return {
                    status: 200,
                    headers: {
                        'content-type': 'application/json'
                    },
                    jsonBody: {
                        success: true,
                        message: `Hello ${name}, function is ready for uploads!`,
                        method: 'GET'
                    }
                };
            }
            // Handle POST requests file uploads
            if (request.method === 'POST') {
                context.log('Processing request for file uploads');

                // Get content type - try different ways to access it
                const contentType = request.headers.get('content-type') ||
                    request.headers.get('Content-Type') ||
                    request.headers['content-type'] ||
                    request.headers['Content-Type'] || '';

                context.log("content-type:", contentType);

                if (!contentType.includes('multipart/form-data')) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            error: 'Content-type must be multipart/form-data'
                        }
                    };
                }

                // Get the body as buffer
                const body = await request.arrayBuffer();
                const bodyBuffer = Buffer.from(body);
                context.log('Body size:', bodyBuffer.length);

                //extract boundary from content-type
                const boundary = contentType.split('boundary=')[1];
                if (!boundary) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            error: 'No boundary in content-type'
                        }
                    };
                }

                //parse multipart data
                const parts = multipart.parse(bodyBuffer, boundary);
                context.log('Parsed parts count:', parts.length);

                if (parts.length === 0) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            error: 'No parts found in multipart data'
                        }
                    };
                }

                // find the file part
                const filePart = parts.find(part => part.filename);
                if (!filePart) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            error: 'No file found in upload'
                        }
                    };
                }

                context.log('File found:', filePart.filename, 'size:', filePart.data.length);

                //step1: upload to blob storage
                const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

                if (!storageConnectionString) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            error: 'Storage connection string not found'
                        }
                    };
                }

                const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
                const containerName = 'photos'
                const containerClient = blobServiceClient.getContainerClient(containerName);

                //create container if doesn't exist
                await containerClient.createIfNotExists({ access: 'blob' });

                // generate unique file name
                const timeStamp = Date.now();
                // Sanitize filename for Azure Blob Storage
                const sanitizeFilename = (filename) => {
                    return filename
                        .toLowerCase()                    // Convert to lowercase
                        .replace(/[^a-z0-9.-]/g, '-')    // Replace invalid chars with hyphens
                        .replace(/-+/g, '-')             // Replace multiple hyphens with single
                        .replace(/^-|-$/g, '')           // Remove leading/trailing hyphens
                        .substring(0, 200);              // Limit length
                };

                const sanitizedFilename = sanitizeFilename(filePart.filename);
                context.log('fileName:', filePart.filename, 'sanitized:', sanitizeFilename);
                const fileName = `${timeStamp}-${sanitizedFilename}`;
                const blockBlobClient = containerClient.getBlockBlobClient(fileName);

                //upload file
                context.log("Uploading to Azure blob storage");

                await blockBlobClient.upload(filePart.data, filePart.data.length, {
                    blobHTTPHeaders: { blobContentType: filePart.type }
                });

                const imageUrl = blockBlobClient.url;
                context.log('Image uploaded to:', imageUrl);

                //step 2:save metadata to cosmos db
                const cosmosConnectionString = process.env.COSMOS_DB_CONNECTION_STRING;
                if (!cosmosConnectionString) {
                    return {
                        status: 500,
                        jsonBody: {
                            success: false,
                            error: 'Cosmos db connection string not configured'
                        }
                    };
                }

                const cosmosClient = new CosmosClient(cosmosConnectionString);
                const database = cosmosClient.database('CraftifiedMemories');
                const container = database.container('Products');

                const productData = {
                    id: timeStamp.toString(),
                    fileName: fileName,
                    originalName: filePart.filename,
                    imageUrl: imageUrl,
                    fileSize: filePart.data.length,
                    fileType: filePart.type,
                    uploadedAt: new Date().toISOString(),
                    status: 'active'
                };

                context.log('Saving to cosmos db');

                const { resource } = await container.items.create(productData);


                // success response with file details
                return {
                    status: 200,
                    jsonBody: {
                        success: true,
                        message: 'File upload parsed successfully!',
                        file: {
                            id: resource.id,
                            name: filePart.name,
                            size: filePart.data.length,
                            type: filePart.type,
                            imageUrl: imageUrl
                        }
                    }
                };
            }

        }
        catch (error) {
            context.log('Error:', error);
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    error: error.message
                }
            };
        }
    }
});

