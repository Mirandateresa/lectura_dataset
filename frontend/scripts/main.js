document.addEventListener('DOMContentLoaded', function() {
    const filesGrid = document.getElementById('filesGrid');
    
    // Cargar la lista de archivos
    loadFiles();
    
    async function loadFiles() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            
            // Filtrar solo los archivos del 06 al 10
            const filteredFiles = files.filter(file => {
                const fileNum = parseInt(file.id);
                return fileNum >= 6 && fileNum <= 10;
            });
            
            displayFiles(filteredFiles);
        } catch (error) {
            console.error('Error cargando archivos:', error);
            filesGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar los archivos. Por favor, intente nuevamente.
                </div>
            `;
        }
    }
    
    function displayFiles(files) {
        if (files.length === 0) {
            filesGrid.innerHTML = `
                <div class="no-files">
                    <i class="fas fa-folder-open"></i>
                    No se encontraron archivos del 06 al 10.
                </div>
            `;
            return;
        }
        
        filesGrid.innerHTML = files.map(file => `
            <div class="file-card" onclick="viewFile('${file.filename}')">
                <div class="file-card-header">
                    <div class="file-id">${file.id}</div>
                    <div class="file-name">${file.name}</div>
                </div>
                <div class="file-card-body">
                    <div class="file-info">
                        <div class="info-item">
                            <i class="fas fa-file-alt"></i>
                            <span>Archivo: ${file.filename}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-hashtag"></i>
                            <span>ID: ${file.id}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-tag"></i>
                            <span>${getFileDescription(file.id)}</span>
                        </div>
                    </div>
                </div>
                <div class="file-card-footer">
                    <a href="#" class="view-btn" onclick="event.stopPropagation(); viewFile('${file.filename}')">
                        <i class="fas fa-eye"></i> Ver Contenido
                    </a>
                </div>
            </div>
        `).join('');
    }
    
    // Función para obtener descripción según el ID
    function getFileDescription(id) {
        const descriptions = {
            '06': 'Visualización del Dataset',
            '07': 'Análisis Exploratorio',
            '08': 'Preprocesamiento de Datos',
            '09': 'Modelado de Machine Learning',
            '10': 'Evaluación de Modelos'
        };
        return descriptions[id] || 'Notebook de análisis';
    }
});

// Función para ver un archivo (se abrirá en una nueva ventana/página)
function viewFile(filename) {
    // Crear página de visualización
    const viewerUrl = `/file-viewer.html?file=${encodeURIComponent(filename)}`;
    
    // Abrir en nueva ventana
    window.open(viewerUrl, '_blank');
}
