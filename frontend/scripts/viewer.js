document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const filename = urlParams.get('file');
    
    if (!filename) {
        showError('No se especificó ningún archivo para visualizar');
        return;
    }
    
    loadFile(filename);
});

async function loadFile(filename) {
    try {
        const response = await fetch(`/api/files/${filename}`);
        const fileData = await response.json();
        
        updateFileInfo(fileData);
        renderPreview(fileData);
        renderRawJSON(fileData);
        renderStructure(fileData);
        
    } catch (error) {
        console.error('Error cargando archivo:', error);
        showError('Error al cargar el archivo. Por favor, intente nuevamente.');
    }
}

function updateFileInfo(fileData) {
    // Actualizar título
    document.getElementById('fileName').textContent = fileData.filename;
    
    // Extraer ID del nombre del archivo
    const match = fileData.filename.match(/^(\d{2})_/);
    const fileId = match ? match[1] : 'N/A';
    
    // Actualizar detalles
    document.getElementById('detailFilename').textContent = fileData.filename;
    document.getElementById('detailId').textContent = fileId;
    
    const modDate = new Date(fileData.lastModified);
    document.getElementById('detailModified').textContent = modDate.toLocaleString();
    
    // Contar celdas
    const cellCount = fileData.content.cells ? fileData.content.cells.length : 0;
    document.getElementById('detailCells').textContent = cellCount;
}

function renderPreview(fileData) {
    const previewContainer = document.getElementById('notebookPreview');
    
    if (!fileData.content.cells || fileData.content.cells.length === 0) {
        previewContainer.innerHTML = `
            <div class="no-content">
                <i class="fas fa-exclamation-circle"></i>
                No hay celdas para mostrar en este notebook.
            </div>
        `;
        return;
    }
    
    let previewHTML = '';
    
    fileData.content.cells.forEach((cell, index) => {
        const cellType = cell.cell_type || 'code';
        const cellNumber = index + 1;
        
        let cellContent = '';
        
        if (cellType === 'markdown' && cell.source) {
            const markdownText = Array.isArray(cell.source) 
                ? cell.source.join('') 
                : cell.source;
            cellContent = `
                <div class="markdown-content">
                    ${marked.parse(markdownText)}
                </div>
            `;
        } else if (cellType === 'code' && cell.source) {
            const codeText = Array.isArray(cell.source) 
                ? cell.source.join('') 
                : cell.source;
            cellContent = `
                <div class="code-content">
                    <code>${escapeHtml(codeText)}</code>
                </div>
            `;
            
            if (cell.outputs && cell.outputs.length > 0) {
                cellContent += `
                    <div class="cell-outputs">
                        <div class="output-label">Salidas:</div>
                        ${cell.outputs.map(output => {
                            if (output.data && output.data['text/plain']) {
                                const outputText = Array.isArray(output.data['text/plain'])
                                    ? output.data['text/plain'].join('')
                                    : output.data['text/plain'];
                                return `<pre class="output-content">${escapeHtml(outputText)}</pre>`;
                            }
                            return '';
                        }).join('')}
                    </div>
                `;
            }
        }
        
        previewHTML += `
            <div class="notebook-cell">
                <div class="cell-header">
                    <div class="cell-type ${cellType}">
                        <i class="fas ${cellType === 'markdown' ? 'fa-markdown' : 'fa-code'}"></i>
                        ${cellType === 'markdown' ? 'Markdown' : 'Código'} (Celda ${cellNumber})
                    </div>
                    <div class="cell-execution-count">
                        ${cell.execution_count ? `Ejecución: #${cell.execution_count}` : ''}
                    </div>
                </div>
                <div class="cell-content">
                    ${cellContent}
                </div>
            </div>
        `;
    });
    
    previewContainer.innerHTML = previewHTML;
}

function renderRawJSON(fileData) {
    const rawContainer = document.getElementById('jsonRaw');
    rawContainer.textContent = JSON.stringify(fileData.content, null, 2);
    
    // Opcional: aplicar syntax highlighting
    // rawContainer.innerHTML = Prism.highlight(
    //     JSON.stringify(fileData.content, null, 2),
    //     Prism.languages.json,
    //     'json'
    // );
}

function renderStructure(fileData) {
    const structureContainer = document.getElementById('structureViewer');
    
    const structure = analyzeStructure(fileData.content);
    
    let structureHTML = '';
    
    // Información general
    structureHTML += `
        <div class="structure-item">
            <h4><i class="fas fa-info-circle"></i> Información General</h4>
            <div class="structure-details">
                <div class="structure-detail">
                    <span>Formato:</span>
                    <span>${structure.format}</span>
                </div>
                <div class="structure-detail">
                    <span>Versión:</span>
                    <span>${structure.version}</span>
                </div>
                <div class="structure-detail">
                    <span>Total Celdas:</span>
                    <span>${structure.cellCount}</span>
                </div>
                <div class="structure-detail">
                    <span>Celdas Markdown:</span>
                    <span>${structure.markdownCount}</span>
                </div>
                <div class="structure-detail">
                    <span>Celdas Código:</span>
                    <span>${structure.codeCount}</span>
                </div>
            </div>
        </div>
    `;
    
    // Metadatos
    if (structure.metadata) {
        structureHTML += `
            <div class="structure-item">
                <h4><i class="fas fa-cog"></i> Metadatos</h4>
                <div class="structure-details">
                    ${Object.entries(structure.metadata).map(([key, value]) => `
                        <div class="structure-detail">
                            <span>${key}:</span>
                            <span>${typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Lenguajes detectados
    if (structure.languages && structure.languages.length > 0) {
        structureHTML += `
            <div class="structure-item">
                <h4><i class="fas fa-language"></i> Lenguajes</h4>
                <div class="structure-details">
                    ${structure.languages.map(lang => `
                        <div class="structure-detail">
                            <span>Lenguaje:</span>
                            <span>${lang}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    structureContainer.innerHTML = structureHTML;
}

function analyzeStructure(content) {
    const structure = {
        format: content.nbformat || 'Desconocido',
        version: content.nbformat_minor || 'N/A',
        cellCount: content.cells ? content.cells.length : 0,
        markdownCount: 0,
        codeCount: 0,
        metadata: content.metadata || {},
        languages: []
    };
    
    if (content.cells) {
        content.cells.forEach(cell => {
            if (cell.cell_type === 'markdown') {
                structure.markdownCount++;
            } else if (cell.cell_type === 'code') {
                structure.codeCount++;
                
                if (cell.metadata && cell.metadata.language) {
                    if (!structure.languages.includes(cell.metadata.language)) {
                        structure.languages.push(cell.metadata.language);
                    }
                }
            }
        });
    }
    
    return structure;
}

// Funciones de utilidad
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const previewContainer = document.getElementById('notebookPreview');
    previewContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId + 'Tab');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function switchTab(tabName) {
    // Desactivar todas las pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    document.querySelector(`.tab-btn[onclick*="${tabName}"]`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function printContent() {
    window.print();
}

function downloadJSON() {
    const rawContainer = document.getElementById('jsonRaw');
    const content = rawContainer.textContent;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notebook.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
