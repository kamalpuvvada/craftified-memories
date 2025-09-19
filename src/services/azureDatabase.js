import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.REACT_APP_COSMOS_ENDPOINT;
const key = process.env.REACT_APP_COSMOS_KEY;
const databaseId = 'CraftifiedMemories';
const containerId = 'Products';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container(containerId);

export const saveProductToAzure = async (product) => {
  try {
    const { resource } = await container.items.create(product);
    return resource;
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

export const getAllProductsFromAzure = async () => {
  try {
    const { resources } = await container.items.readAll().fetchAll();
    return resources;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const deleteProductFromAzure = async (id) => {
  try {
    await container.item(id, id).delete();
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
