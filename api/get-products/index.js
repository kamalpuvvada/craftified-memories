const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
    context.log('Get products function triggered');

    // CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
        const database = cosmosClient.database('craftified');
        const container = database.container('products');

        const { resources } = await container.items
            .query('SELECT * FROM c WHERE c.status = "active" ORDER BY c.uploadedAt DESC')
            .fetchAll();

        context.res = {
            status: 200,
            body: {
                success: true,
                products: resources
            }
        };

    } catch (error) {
        context.log('Error:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Failed to fetch products',
                details: error.message
            }
        };
    }
};
