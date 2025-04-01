// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const uploadModal = document.getElementById('uploadModal');
const uploadForm = document.getElementById('uploadForm');
const uploadPdfBtn = document.getElementById('uploadPdfBtn');
const revisionCheckerBtn = document.getElementById('revisionCheckerBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const pdfViewer = document.getElementById('pdfViewer');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const takeOffBtn = document.getElementById('takeOffBtn');
const toolMenu = document.getElementById('toolMenu');
const closeToolMenuBtn = document.getElementById('closeToolMenu');
const addItemBtn = document.getElementById('addItemBtn');
const addItemModal = document.getElementById('addItemModal');
const addItemForm = document.getElementById('addItemForm');
const cancelAddItemBtn = document.getElementById('cancelAddItemBtn');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const itemPhoto = document.getElementById('itemPhoto');
const photoPreview = document.getElementById('photoPreview');

// Dropdown Menu Management
const dropdown = document.querySelector('.dropdown');
const dropdownMenu = document.querySelector('.dropdown-menu');

// Show dropdown by default when page loads
dropdown.classList.add('active');

// Ensure modals are hidden by default
uploadModal.style.display = 'none';
addItemModal.style.display = 'none';

// Initialize zoom state
let currentScale = 1.5; // Initial scale
let currentPdf = null;

// Take Off state
let takeOffItems = [];
let selectedItem = null;

// Overlay state
let overlayPdfs = [];
let currentOverlay = null;
let isOverlayEnabled = false;
let isOverlayOnTop = true; // true = overlay on top, false = base on top

// Take Off functions
function toggleToolMenu() {
    toolMenu.classList.toggle('active');
    ensureDropdownVisible();
}

function showAddItemModal() {
    addItemModal.style.display = 'flex';
    ensureDropdownVisible();
}

function closeAddItemModal() {
    addItemModal.style.display = 'none';
    addItemForm.reset();
    photoPreview.innerHTML = '';
    ensureDropdownVisible();
}

// Handle photo upload
uploadPhotoBtn.addEventListener('click', () => {
    itemPhoto.click();
});

itemPhoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.innerHTML = `
                <div class="photo-preview-item">
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-photo">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            photoPreview.querySelector('.remove-photo').addEventListener('click', () => {
                photoPreview.innerHTML = '';
                itemPhoto.value = '';
            });
        };
        reader.readAsDataURL(file);
    }
});

// Handle color selection
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('selectedColor').value = option.dataset.color;
    });
});

// Handle add item form submission
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const item = {
        id: Date.now(),
        name: document.getElementById('itemName').value,
        code: document.getElementById('itemCode').value,
        description: document.getElementById('itemDescription').value,
        color: document.getElementById('selectedColor').value,
        photo: photoPreview.querySelector('img')?.src || null,
        count: 0,
        markers: []
    };
    
    takeOffItems.push(item);
    updateItemList();
    closeAddItemModal();
    ensureDropdownVisible();
});

// Handle PDF click for markers
pdfViewer.addEventListener('click', (e) => {
    if (!selectedItem) return;
    
    const pageContainer = e.target.closest('.pdf-page');
    if (!pageContainer) return;
    
    const canvas = pageContainer.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = pageContainer.scrollLeft;
    const scrollTop = pageContainer.scrollTop;
    
    // Calculate position relative to the canvas, accounting for scroll and scale
    const x = (e.clientX - rect.left + scrollLeft) / currentScale;
    const y = (e.clientY - rect.top + scrollTop) / currentScale;
    
    const marker = document.createElement('div');
    marker.className = 'take-off-marker';
    marker.style.backgroundColor = selectedItem.color;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    tooltip.textContent = selectedItem.name;
    marker.appendChild(tooltip);
    
    // Only trigger delete on marker click, not tooltip
    marker.addEventListener('click', (e) => {
        if (e.target === marker) {
            if (confirm(`Are you sure you want to delete this ${selectedItem.name} point?`)) {
                marker.remove();
                selectedItem.count--;
                updateItemList();
            }
        }
    });
    
    pageContainer.appendChild(marker);
    selectedItem.count++;
    selectedItem.markers.push({ x, y });
    updateItemList();
});

// Event listeners
takeOffBtn.addEventListener('click', toggleToolMenu);
closeToolMenuBtn.addEventListener('click', toggleToolMenu);
addItemBtn.addEventListener('click', showAddItemModal);
cancelAddItemBtn.addEventListener('click', closeAddItemModal);

// Zoom functions
function zoomIn() {
    currentScale += 0.25;
    if (currentPdf) {
        displayPdf(currentPdf);
    }
    ensureDropdownVisible();
}

function zoomOut() {
    if (currentScale > 0.5) {
        currentScale -= 0.25;
        if (currentPdf) {
            displayPdf(currentPdf);
        }
        ensureDropdownVisible();
    }
}

// Add zoom event listeners
zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);

// Toggle dropdown on click
dropdown.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.classList.toggle('active');
});

// Ensure dropdown stays visible after any view changes
function ensureDropdownVisible() {
    if (!dropdown.classList.contains('active')) {
        dropdown.classList.add('active');
    }
}

// Show upload modal
uploadPdfBtn.addEventListener('click', () => {
    uploadModal.style.display = 'flex';
    ensureDropdownVisible();
});

// Cancel upload
cancelUploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    uploadForm.reset();
    ensureDropdownVisible();
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
        uploadModal.style.display = 'none';
        uploadForm.reset();
    }
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
        displayPdf(pdf);
        uploadModal.style.display = 'none';
        uploadForm.reset();
        ensureDropdownVisible();
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Error loading PDF. Please try again.');
    }
});

// Display PDF in viewer
async function displayPdf(pdf) {
    pdfViewer.innerHTML = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentScale });
        
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

// Update item list in tool menu
function updateItemList() {
    const itemList = document.querySelector('.item-list');
    itemList.innerHTML = '';
    
    takeOffItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        if (selectedItem && selectedItem.id === item.id) {
            itemCard.classList.add('selected');
        }
        
        itemCard.innerHTML = `
            <div class="item-info">
                <div class="item-color" style="background-color: ${item.color}"></div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-code">${item.code}</div>
                </div>
            </div>
            <div class="item-count">${item.count}</div>
        `;
        
        itemCard.addEventListener('click', () => {
            selectedItem = item;
            document.querySelectorAll('.item-card').forEach(card => card.classList.remove('selected'));
            itemCard.classList.add('selected');
        });
        itemList.appendChild(itemCard);
    });
}

// Overlay functions
function toggleOverlayMenu() {
    overlayToolMenu.classList.toggle('active');
    ensureDropdownVisible();
}

// Add event listeners for overlay menu
const overlayToolMenu = document.getElementById('overlayToolMenu');
const closeOverlayMenuBtn = document.getElementById('closeOverlayMenu');
const uploadOverlayBtn = document.getElementById('uploadOverlayBtn');
const toggleOverlayBtn = document.getElementById('toggleOverlayBtn');
const switchOverlayBtn = document.getElementById('switchOverlayBtn');
const overlayControls = document.querySelector('.overlay-controls');

revisionCheckerBtn.addEventListener('click', toggleOverlayMenu);
closeOverlayMenuBtn.addEventListener('click', toggleOverlayMenu);

// Handle overlay toggle
toggleOverlayBtn.addEventListener('click', async () => {
    isOverlayEnabled = !isOverlayEnabled;
    toggleOverlayBtn.querySelector('i').className = isOverlayEnabled ? 'fas fa-eye-slash' : 'fas fa-eye';
    toggleOverlayBtn.querySelector('span').textContent = isOverlayEnabled ? 'Hide Overlay' : 'Show Overlay';
    
    if (currentOverlay) {
        if (isOverlayEnabled) {
            await displayPdfWithOverlay(currentPdf, currentOverlay.pdf);
        } else {
            await displayPdf(currentPdf);
        }
    }
});

// Handle overlay order switch
switchOverlayBtn.addEventListener('click', async () => {
    if (!isOverlayEnabled || !currentOverlay) return;
    
    isOverlayOnTop = !isOverlayOnTop;
    await displayPdfWithOverlay(currentPdf, currentOverlay.pdf);
});

// Handle overlay PDF upload
uploadOverlayBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            // Add to overlay list
            const overlay = {
                id: Date.now(),
                name: file.name,
                pdf: pdf
            };
            overlayPdfs.push(overlay);
            updateOverlayList();
            
            // If this is the first overlay, make it current
            if (!currentOverlay) {
                currentOverlay = overlay;
                overlayControls.style.display = 'block';
                isOverlayEnabled = false;
                isOverlayOnTop = true;
                toggleOverlayBtn.querySelector('i').className = 'fas fa-eye';
                toggleOverlayBtn.querySelector('span').textContent = 'Show Overlay';
                await displayPdf(currentPdf);
            }
        } catch (error) {
            console.error('Error loading overlay PDF:', error);
            alert('Error loading overlay PDF. Please try again.');
        }
    };
    input.click();
});

// Update overlay list in tool menu
function updateOverlayList() {
    const overlayList = document.querySelector('.overlay-list');
    overlayList.innerHTML = '';
    
    overlayPdfs.forEach(overlay => {
        const overlayCard = document.createElement('div');
        overlayCard.className = 'overlay-card';
        if (currentOverlay && currentOverlay.id === overlay.id) {
            overlayCard.classList.add('selected');
        }
        
        overlayCard.innerHTML = `
            <div class="overlay-info">
                <div class="overlay-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="overlay-details">
                    <div class="overlay-name">${overlay.name}</div>
                </div>
            </div>
            <div class="overlay-actions">
                <button class="icon-button select-overlay" title="Select Overlay">
                    <i class="fas fa-check${currentOverlay && currentOverlay.id === overlay.id ? '' : '-circle'}"></i>
                </button>
                <button class="icon-button remove-overlay" title="Remove Overlay">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Select overlay
        overlayCard.querySelector('.select-overlay').addEventListener('click', async () => {
            currentOverlay = overlay;
            updateOverlayList();
            if (isOverlayEnabled) {
                await displayPdfWithOverlay(currentPdf, overlay.pdf);
            }
        });
        
        // Remove overlay
        overlayCard.querySelector('.remove-overlay').addEventListener('click', async () => {
            if (confirm('Are you sure you want to remove this overlay?')) {
                overlayPdfs = overlayPdfs.filter(o => o.id !== overlay.id);
                if (currentOverlay && currentOverlay.id === overlay.id) {
                    currentOverlay = null;
                    overlayControls.style.display = 'none';
                    isOverlayEnabled = false;
                    toggleOverlayBtn.querySelector('i').className = 'fas fa-eye';
                    toggleOverlayBtn.querySelector('span').textContent = 'Show Overlay';
                    await displayPdf(currentPdf);
                }
                updateOverlayList();
            }
        });
        
        overlayList.appendChild(overlayCard);
    });
}

// Display PDF with overlay
async function displayPdfWithOverlay(basePdf, overlayPdf) {
    pdfViewer.innerHTML = '';
    
    for (let pageNum = 1; pageNum <= basePdf.numPages; pageNum++) {
        const basePage = await basePdf.getPage(pageNum);
        const overlayPage = await overlayPdf.getPage(pageNum);
        
        const viewport = basePage.getViewport({ scale: currentScale });
        
        // Create canvas for base PDF
        const baseCanvas = document.createElement('canvas');
        const baseContext = baseCanvas.getContext('2d');
        baseCanvas.height = viewport.height;
        baseCanvas.width = viewport.width;
        
        // Create canvas for overlay PDF
        const overlayCanvas = document.createElement('canvas');
        const overlayContext = overlayCanvas.getContext('2d');
        overlayCanvas.height = viewport.height;
        overlayCanvas.width = viewport.width;
        
        // Render base PDF
        await basePage.render({
            canvasContext: baseContext,
            viewport: viewport
        }).promise;
        
        // Render overlay PDF
        await overlayPage.render({
            canvasContext: overlayContext,
            viewport: viewport
        }).promise;
        
        // Process the canvases
        const baseData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
        const overlayData = overlayContext.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
        
        // Make non-white pixels red in base PDF
        for (let i = 0; i < baseData.data.length; i += 4) {
            if (baseData.data[i] !== 255 || baseData.data[i + 1] !== 255 || baseData.data[i + 2] !== 255) {
                // Make non-white pixels red
                baseData.data[i] = 255;     // R
                baseData.data[i + 1] = 0;   // G
                baseData.data[i + 2] = 0;   // B
            } else {
                // Make white pixels transparent
                baseData.data[i + 3] = 0;
            }
        }
        
        // Make non-white pixels blue in overlay PDF
        for (let i = 0; i < overlayData.data.length; i += 4) {
            if (overlayData.data[i] !== 255 || overlayData.data[i + 1] !== 255 || overlayData.data[i + 2] !== 255) {
                // Make non-white pixels blue
                overlayData.data[i] = 0;     // R
                overlayData.data[i + 1] = 0; // G
                overlayData.data[i + 2] = 255; // B
            } else {
                // Make white pixels transparent
                overlayData.data[i + 3] = 0;
            }
        }
        
        // Create final canvas
        const finalCanvas = document.createElement('canvas');
        const finalContext = finalCanvas.getContext('2d');
        finalCanvas.height = viewport.height;
        finalCanvas.width = viewport.width;
        
        // Draw PDFs in the correct order
        if (isOverlayOnTop) {
            // Draw base PDF first, then overlay on top
            finalContext.putImageData(baseData, 0, 0);
            finalContext.putImageData(overlayData, 0, 0);
        } else {
            // Draw overlay first, then base PDF on top
            finalContext.putImageData(overlayData, 0, 0);
            finalContext.putImageData(baseData, 0, 0);
        }
        
        // Make any pixels that aren't red or blue transparent
        const finalData = finalContext.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
        for (let i = 0; i < finalData.data.length; i += 4) {
            const r = finalData.data[i];
            const g = finalData.data[i + 1];
            const b = finalData.data[i + 2];
            
            // Check if pixel is not red (255,0,0) or blue (0,0,255)
            if (!(r === 255 && g === 0 && b === 0) && !(r === 0 && g === 0 && b === 255)) {
                finalData.data[i + 3] = 0; // Make transparent
            }
        }
        finalContext.putImageData(finalData, 0, 0);
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.appendChild(finalCanvas);
        pdfViewer.appendChild(pageContainer);
    }
} 