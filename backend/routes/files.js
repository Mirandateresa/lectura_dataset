const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '../data');

// Obtener lista de archivos disponibles
router.get('/', async (req, res) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const fileList = files
            .filter(file => /^\d{2}_/.test(file))
            .map(file => {
                const match = file.match(/^(\d{2})_(.+?)\.ipynb$/);
                if (match) {
                    return {
                        id: match[1],
                        name: match[2].replace(/_/g, ' '),
                        filename: file,
                        path: `/data/${file}`
                    };
                }
                return null;
            })
            .filter(Boolean)
            .sort((a, b) => parseInt(a.id) - parseInt(b.id));

        res.json(fileList);
    } catch (error) {
        console.error('Error reading files:', error);
        res.status(500).json({ error: 'Error al leer los archivos' });
    }
});

// Obtener contenido de un archivo específico
router.get('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(DATA_DIR, filename);
        
        const content = await fs.readFile(filePath, 'utf-8');
        const fileData = {
            filename: filename,
            content: JSON.parse(content),
            lastModified: (await fs.stat(filePath)).mtime
        };
        
        res.json(fileData);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(404).json({ error: 'Archivo no encontrado' });
    }
});

module.exports = router;
