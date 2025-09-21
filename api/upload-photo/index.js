const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');
const multipart = require('parse-multipart-data');

module.exports = async function (context, req) {
    context.log('Photo upload function triggered');

    // CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    if (req.method !== 'POST') {
        context.res = {
            status: 405,
            body: 'Method not allowed'
        };
        return;
    }

    try {
        // Parse multipart form data
        const boundary = multipart.getBoundary(req.headers['content-type']);
        const parts = multipart.parse(Buffer.from(req.body), boundary);
        
        if (!parts || parts.length === 0) {
            context.res = {
                status: 400,
                body: { error: 'No file uploaded' }
            };
            return;
        }

        const file = parts[0];
        const fileName = `${Date.now()}-${file.filename}`;
        
        // Upload to Blob Storage
        const blobServiceClient = new BlobServiceClient(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient('products');
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        
        const uploadResult = await blockBlobClient.upload(file.data, file.data.length, {
            blobHTTPHeaders: { blobContentType: file.type }
        });

        const imageUrl = blockBlobClient.url;

        // Store metadata in Cosmos DB
        const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
        const database = cosmosClient.database('craftified');
        const container = database.container('products');

        const productData = {
            id: Date.now().toString(),
            name: req.query.name || 'Untitled Product',
            description: req.query.description || '',
            price: parseInt(req.query.price) || 0,
            category: req.query.category || 'general',
            imageUrl: imageUrl,
            fileName: fileName,
            uploadedAt: new Date().toISOString(),
            status: 'active'
        };

        const { resource } = await container.items.create(productData);

        context.res = {
            status: 200,
            body: {
                success: true,
                product: resource,
                message: 'Photo uploaded successfully'
            }
        };

    } catch (error) {
        context.log('Error:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Upload failed',
                details: error.message
            }
        };
    }
};
