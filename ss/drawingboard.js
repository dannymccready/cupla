// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const uploadModal = document.getElementById('uploadModal');
const revisionModal = document.getElementById('revisionModal');
const uploadForm = document.getElementById('uploadForm');
const revisionForm = document.getElementById('revisionForm');
const uploadPdfBtn = document.getElementById('uploadPdfBtn');
const revisionCheckerBtn = document.getElementById('revisionCheckerBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const cancelRevisionBtn = document.getElementById('cancelRevisionBtn');
const pdfViewer = document.getElementById('pdfViewer');

let currentPdf = null;

// Show upload modal
uploadPdfBtn.addEventListener('click', () => {
    uploadModal.style.display = 'flex';
});

// Show revision checker modal
revisionCheckerBtn.addEventListener('click', () => {
    revisionModal.style.display = 'flex';
});

// Cancel upload
cancelUploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    uploadForm.reset();
});

// Cancel revision checker
cancelRevisionBtn.addEventListener('click', () => {
    revisionModal.style.display = 'none';
    revisionForm.reset();
});

// Handle PDF upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('pdfFile').files[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        currentPdf = pdf;
        await displayPdf(pdf);
        uploadModal.style.display = 'none';
        uploadForm.reset();
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error loading PDF. Please try again.');
    }
});

// Handle revision checker
revisionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalFile = document.getElementById('originalPdf').files[0];
    const revisionFile = document.getElementById('revisionPdf').files[0];
    if (!originalFile || !revisionFile) return;

    try {
        const originalArrayBuffer = await originalFile.arrayBuffer();
        const revisionArrayBuffer = await revisionFile.arrayBuffer();
        const originalPdf = await pdfjsLib.getDocument(originalArrayBuffer).promise;
        const revisionPdf = await pdfjsLib.getDocument(revisionArrayBuffer).promise;
        
        await comparePdfs(originalPdf, revisionPdf);
        revisionModal.style.display = 'none';
        revisionForm.reset();
    } catch (error) {
        console.error('Error comparing PDFs:', error);
        alert('Error comparing PDFs. Please try again.');
    }
});

// Display PDF in viewer
async function displayPdf(pdf) {
    pdfViewer.innerHTML = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.appendChild(canvas);
        pdfViewer.appendChild(pageContainer);
    }
}

// Compare PDFs for revision checking
async function comparePdfs(originalPdf, revisionPdf) {
    pdfViewer.innerHTML = '';
    
    for (let pageNum = 1; pageNum <= originalPdf.numPages; pageNum++) {
        const originalPage = await originalPdf.getPage(pageNum);
        const revisionPage = await revisionPdf.getPage(pageNum);
        
        const viewport = originalPage.getViewport({ scale: 1.5 });
        
        // Create canvas for original PDF (red)
        const originalCanvas = document.createElement('canvas');
        const originalContext = originalCanvas.getContext('2d');
        originalCanvas.height = viewport.height;
        originalCanvas.width = viewport.width;
        
        // Create canvas for revision PDF (blue)
        const revisionCanvas = document.createElement('canvas');
        const revisionContext = revisionCanvas.getContext('2d');
        revisionCanvas.height = viewport.height;
        revisionCanvas.width = viewport.width;
        
        // Render original PDF
        await originalPage.render({
            canvasContext: originalContext,
            viewport: viewport
        }).promise;
        
        // Render revision PDF
        await revisionPage.render({
            canvasContext: revisionContext,
            viewport: viewport
        }).promise;
        
        // Process the canvases
        const originalData = originalContext.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const revisionData = revisionContext.getImageData(0, 0, revisionCanvas.width, revisionCanvas.height);
        
        // Convert non-white pixels to red in original
        for (let i = 0; i < originalData.data.length; i += 4) {
            if (originalData.data[i] !== 255 || originalData.data[i + 1] !== 255 || originalData.data[i + 2] !== 255) {
                originalData.data[i] = 255;     // R
                originalData.data[i + 1] = 0;   // G
                originalData.data[i + 2] = 0;   // B
            }
        }
        
        // Convert non-white pixels to blue in revision and make white pixels transparent
        for (let i = 0; i < revisionData.data.length; i += 4) {
            if (revisionData.data[i] === 255 && revisionData.data[i + 1] === 255 && revisionData.data[i + 2] === 255) {
                revisionData.data[i + 3] = 0;   // Make white pixels transparent
            } else {
                revisionData.data[i] = 0;       // R
                revisionData.data[i + 1] = 0;   // G
                revisionData.data[i + 2] = 255; // B
            }
        }
        
        // Create final canvas
        const finalCanvas = document.createElement('canvas');
        const finalContext = finalCanvas.getContext('2d');
        finalCanvas.height = viewport.height;
        finalCanvas.width = viewport.width;
        
        // Draw original (red) first
        finalContext.putImageData(originalData, 0, 0);
        
        // Draw revision (blue) on top
        finalContext.putImageData(revisionData, 0, 0);
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.appendChild(finalCanvas);
        pdfViewer.appendChild(pageContainer);
    }
} 