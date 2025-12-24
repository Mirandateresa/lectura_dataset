const express = require('express');
const cors = require('cors');
const path = require('path');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.use('/api/files', fileRoutes);

// Ruta para las páginas de visualización
app.get('/file/:id', (req, res) => {
    const fileId = req.params.id;
    res.sendFile(path.join(__dirname, '../frontend/file-viewer.html'));
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
