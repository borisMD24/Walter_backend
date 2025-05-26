import fs from 'fs'; 
import path from 'path';
import { pipeline } from 'stream/promises';

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf'];

class BlobManager {
    static async create(blob, name, type = "uploads") {
        if (typeof blob?.pipe !== 'function') {
            throw new TypeError('Blob should be a readable stream.');
        }

        name = this.sanitizeFilename(name);
        const safeFilename = path.basename(name);

        if (!allowedExtensions.includes(path.extname(safeFilename).toLowerCase())) {
            throw new Error('File type not allowed.');
        }

        const uploadPath = path.join(process.cwd(), 'public', type, safeFilename);

        await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });
        await pipeline(blob, fs.createWriteStream(uploadPath));

        const url = `/public/${type}/${safeFilename}`;
        return url;
    }

    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9_\-\.]/gi, '_')
            .replace(/_{2,}/g, '_'); 
    }

    static async replace(oldName, newBlob, newName, type = "uploads") {
        const oldPath = path.join(process.cwd(), 'public', type, this.sanitizeFilename(oldName));

        try {
            await fs.promises.unlink(oldPath);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }

        // Créer le nouveau fichier
        return await this.create(newBlob, newName, type);
    }

    static async delete(name, type = "uploads") {
        const filePath = path.join(process.cwd(), 'public', type, this.sanitizeFilename(name));

        try {
            await fs.promises.unlink(filePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error('File not found.');
            }
            throw err;
        }
    }
}

export default BlobManager;
