const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');
const multipart = require('parse-multipart-data');

module.exports = async function (context, req) {
    context.log('Photo upload function triggered');

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders
        };
        return;
    }

    if (req.method !== 'POST') {
        context.res = {
            status: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
        return;
    }

    try {
        // Log request details for debugging
        context.log('Content-Type:', req.headers['content-type']);
        context.log('Body type:', typeof req.body);
        context.log('Body length:', req.body ? req.body.length : 'No body');

        // Check if environment variables exist
        if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable not found');
        }
        
        if (!process.env.COSMOS_DB_CONNECTION_STRING) {
            throw new Error('COSMOS_DB_CONNECTION_STRING environment variable not found');
        }

        // Check if body exists
        if (!req.body) {
            throw new Error('No request body found');
        }

        // Parse multipart form data
        const boundary = multipart.getBoundary(req.headers['content-type']);
        if (!boundary) {
            throw new Error('No boundary found in content-type header');
        }

        const parts = multipart.parse(Buffer.from(req.body), boundary);
        context.log('Parsed parts:', parts.length);
        
        if (!parts || parts.length === 0) {
            throw new Error('No file parts found in request');
        }

        const file = parts.find(part => part.filename);
        if (!file) {
            throw new Error('No file found in request parts');
        }

        const fileName = `${Date.now()}-${file.filename}`;
        context.log('Processing file:', fileName);
        
        // Upload to Blob Storage
        const blobServiceClient = new BlobServiceClient(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient('products');
        
        // Ensure container exists
        await containerClient.createIfNotExists({
            access: 'blob'
        });
        
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        
        const uploadResult = await blockBlobClient.upload(file.data, file.data.length, {
            blobHTTPHeaders: { blobContentType: file.type }
        });

        const imageUrl = blockBlobClient.url;
        context.log('Image uploaded to:', imageUrl);

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

        context.log('Saving to Cosmos DB:', productData);
        const { resource } = await container.items.create(productData);

        // Return success response
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                product: resource,
                message: 'Photo uploaded successfully'
            })
        };

    } catch (error) {
        context.log('Error details:', error);
        
        // Return proper error response
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Upload failed',
                details: error.message,
                stack: error.stack
            })
        };
    }
};
