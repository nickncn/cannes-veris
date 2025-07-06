import { Web3Storage, getFilesFromPath } from 'web3.storage';
import 'dotenv/config';

async function main() {
    const token = process.env.WEB3STORAGE_TOKEN;
    if (!token) {
        throw new Error('Missing WEB3STORAGE_TOKEN in .env');
    }

    const storage = new Web3Storage({ token });

    // Path to your metadata folder
    const files = await getFilesFromPath('./metadata');

    console.log('Uploading files...');
    const cid = await storage.put(files);
    console.log('Content added with CID:', cid);
}

main().catch(console.error);
