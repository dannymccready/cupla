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
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

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

// Measure state
let measurePoints = [];
let knownDistance = 0;
let isSettingPoints = false;
let isMeasuring = false;
let isMeasuringArea = false;
let scaleFactor = 0;
let areaPoints = [];
let areaPolygon = null;

// Add new state variables for length measurement
let isSettingLengthPoints = false;
let currentLengthItem = null;
let lengthPoints = [];
let lengthScaleFactor = 0;
let knownLengthDistance = 0;

// Take Off functions
function toggleToolMenu() {
    // Close other tool menus first
    overlayToolMenu.classList.remove('active');
    measureToolMenu.classList.remove('active');
    
    toolMenu.classList.toggle('active');
    ensureDropdownVisible();
    
    // Update selected state
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('selected'));
    takeOffBtn.classList.add('selected');
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
        countType: document.getElementById('countType').value,
        markers: [],
        lengthPoints: []
    };
    
    takeOffItems.push(item);
    updateItemList();
    closeAddItemModal();
    ensureDropdownVisible();

    // If count type is perLength, start setting up length measurement
    if (item.countType === 'perLength') {
        currentLengthItem = item;
        isSettingLengthPoints = true;
        alert('Please set two points to establish the scale. Click two points on the PDF.');
    }
});

// Handle PDF click for markers
pdfViewer.addEventListener('click', (e) => {
    // Handle measure tool clicks first
    if (isSettingPoints || isMeasuring || isMeasuringArea) {
        handleMeasureToolClick(e);
        return;
    }

    // Handle length measurement setup
    if (isSettingLengthPoints) {
        const pageContainer = e.target.closest('.pdf-page');
        if (!pageContainer) return;

        const pageRect = pageContainer.getBoundingClientRect();
        const x = (e.clientX - pageRect.left) / currentScale;
        const y = (e.clientY - pageRect.top) / currentScale;

        const marker = document.createElement('div');
        marker.className = 'measure-marker';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.style.transform = `translate(-50%, -50%) scale(${1 / currentScale})`;
        pageContainer.appendChild(marker);

        lengthPoints.push({ x, y });

        if (lengthPoints.length === 2) {
            const distance = calculateDistance(lengthPoints[0], lengthPoints[1]);
            const value = prompt('Enter the known distance in units:');
            if (value !== null) {
                knownLengthDistance = parseFloat(value);
                lengthScaleFactor = knownLengthDistance / distance;
                isSettingLengthPoints = false;
                alert('Scale set! Now click pairs of points to measure lengths. Click the same point twice to finish.');
            }
        }
        return;
    }

    // Handle length measurement
    if (selectedItem && selectedItem.countType === 'perLength') {
        const pageContainer = e.target.closest('.pdf-page');
        if (!pageContainer) return;

        const pageRect = pageContainer.getBoundingClientRect();
        const x = (e.clientX - pageRect.left) / currentScale;
        const y = (e.clientY - pageRect.top) / currentScale;

        const marker = document.createElement('div');
        marker.className = 'measure-marker';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.style.transform = `translate(-50%, -50%) scale(${1 / currentScale})`;
        pageContainer.appendChild(marker);

        selectedItem.lengthPoints.push({ x, y });

        if (selectedItem.lengthPoints.length % 2 === 0) {
            const lastTwoPoints = selectedItem.lengthPoints.slice(-2);
            const distance = calculateDistance(lastTwoPoints[0], lastTwoPoints[1]);
            const scaledDistance = distance * lengthScaleFactor;
            selectedItem.count += scaledDistance;

            // Create and add the measurement line
            const line = createMeasureLine(lastTwoPoints[0], lastTwoPoints[1]);
            pageContainer.appendChild(line);

            // Update the distance label
            const label = line.querySelector('.measure-distance');
            if (label) {
                label.textContent = `${scaledDistance.toFixed(2)} units`;
            }

            updateItemList();
        }
        return;
    }

    // Handle regular take-off clicks
    handleTakeOffClick(e);
});

// Event listeners
takeOffBtn.addEventListener('click', toggleToolMenu);
closeToolMenuBtn.addEventListener('click', () => {
    toolMenu.classList.remove('active');
    clearSelectedState();
});
addItemBtn.addEventListener('click', showAddItemModal);
cancelAddItemBtn.addEventListener('click', closeAddItemModal);
exportBtn.addEventListener('click', exportTakeOffData);
importBtn.addEventListener('click', importTakeOffData);

// Zoom functions
function zoomIn() {
    currentScale += 0.25;
    if (currentPdf) {
        displayPdf(currentPdf);
    }
    ensureDropdownVisible();
    clearSelectedState();
}

function zoomOut() {
    if (currentScale > 0.5) {
        currentScale -= 0.25;
        if (currentPdf) {
            displayPdf(currentPdf);
        }
        ensureDropdownVisible();
        clearSelectedState();
    }
}

// Add zoom event listeners
zoomInBtn.addEventListener('click', () => {
    currentScale += 0.25;
    updateMarkerPositions();
    displayPdf(currentPdf);
});

zoomOutBtn.addEventListener('click', () => {
    if (currentScale > 0.5) {
        currentScale -= 0.25;
        updateMarkerPositions();
        displayPdf(currentPdf);
    }
});

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
    clearSelectedState();
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
        
        const countDisplay = item.countType === 'perLength' 
            ? `${item.count.toFixed(2)} units`
            : item.count;
        
        itemCard.innerHTML = `
            <div class="item-info">
                <div class="item-color" style="background-color: ${item.color}"></div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-code">${item.code}</div>
                </div>
            </div>
            <div class="item-count">${countDisplay}</div>
        `;
        
        itemCard.addEventListener('click', () => {
            selectedItem = item;
            document.querySelectorAll('.item-card').forEach(card => card.classList.remove('selected'));
            itemCard.classList.add('selected');
            
            const toolMenu = document.getElementById('toolMenu');
            toolMenu.classList.add('active');
            document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('selected'));
            takeOffBtn.classList.add('selected');
        });
        itemList.appendChild(itemCard);
    });
}

// Overlay functions
function toggleOverlayMenu() {
    // Close other tool menus first
    toolMenu.classList.remove('active');
    measureToolMenu.classList.remove('active');
    
    overlayToolMenu.classList.toggle('active');
    ensureDropdownVisible();
    
    // Update selected state
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('selected'));
    revisionCheckerBtn.classList.add('selected');
}

// Add event listeners for overlay menu
const overlayToolMenu = document.getElementById('overlayToolMenu');
const closeOverlayMenuBtn = document.getElementById('closeOverlayMenu');
const uploadOverlayBtn = document.getElementById('uploadOverlayBtn');
const toggleOverlayBtn = document.getElementById('toggleOverlayBtn');
const switchOverlayBtn = document.getElementById('switchOverlayBtn');
const overlayControls = document.querySelector('.overlay-controls');

revisionCheckerBtn.addEventListener('click', toggleOverlayMenu);
closeOverlayMenuBtn.addEventListener('click', () => {
    overlayToolMenu.classList.remove('active');
    clearSelectedState();
});

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

// Measure functions
function toggleMeasureMenu() {
    // Close other tool menus first
    toolMenu.classList.remove('active');
    overlayToolMenu.classList.remove('active');
    
    measureToolMenu.classList.toggle('active');
    ensureDropdownVisible();
    
    // Update selected state
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('selected'));
    measureBtn.classList.add('selected');
}

function calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

function createMeasureMarker(x, y) {
    const marker = document.createElement('div');
    marker.className = 'measure-marker';
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    return marker;
}

function createMeasureLine(point1, point2) {
    const line = document.createElement('div');
    line.className = 'measure-line';
    
    const distance = calculateDistance(point1, point2);
    const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
    
    line.style.width = `${distance}px`;
    line.style.left = `${point1.x}px`;
    line.style.top = `${point1.y}px`;
    line.style.transform = `rotate(${angle}rad)`;
    
    // Add distance label
    const label = document.createElement('div');
    label.className = 'measure-distance';
    label.textContent = `${(distance * scaleFactor).toFixed(2)} units`;
    label.style.left = `${distance / 2}px`;
    line.appendChild(label);
    
    return line;
}

function createAreaLine(point1, point2) {
    const line = document.createElement('div');
    line.className = 'area-line';
    
    const distance = calculateDistance(point1, point2);
    const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
    
    line.style.width = `${distance}px`;
    line.style.left = `${point1.x}px`;
    line.style.top = `${point1.y}px`;
    line.style.transform = `rotate(${angle}rad)`;
    
    return line;
}

function createAreaPolygon(points) {
    // Remove existing polygon if any
    if (areaPolygon) {
        areaPolygon.remove();
    }
    
    // Create SVG polygon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '8';
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    polygon.setAttribute('points', pointsString);
    polygon.setAttribute('fill', 'rgba(40, 167, 69, 0.1)');
    polygon.setAttribute('stroke', '#28a745');
    polygon.setAttribute('stroke-width', '2');
    
    svg.appendChild(polygon);
    pdfViewer.appendChild(svg);
    areaPolygon = svg;
}

function calculateArea(points) {
    // Using the Shoelace formula (Surveyor's formula)
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

// Measure tool specific functions
function handleMeasureToolClick(e) {
    const pageContainer = e.target.closest('.pdf-page');
    if (!pageContainer) return;

    const pageRect = pageContainer.getBoundingClientRect();
    const x = (e.clientX - pageRect.left) / currentScale;
    const y = (e.clientY - pageRect.top) / currentScale;
    
    if (isSettingPoints) {
        const marker = createMeasureMarker(x, y);
        pageContainer.appendChild(marker);
        measurePoints.push({ x, y });
        
        // Create a line between points if we have two points
        if (measurePoints.length === 2) {
            const line = createMeasureLine(measurePoints[0], measurePoints[1]);
            pageContainer.appendChild(line);
            
            // Ask for known distance after both points are set
            const value = prompt('Enter the known distance in units:');
            if (value !== null) {
                knownDistance = parseFloat(value);
                scaleFactor = knownDistance / calculateDistance(measurePoints[0], measurePoints[1]);
                document.getElementById('knownDistance').textContent = knownDistance;
                document.querySelector('.measure-info').style.display = 'flex';
                document.getElementById('measureLineBtn').disabled = false;
                document.getElementById('measureAreaBtn').disabled = false;
                isSettingPoints = false;
                measurePoints = [];
            } else {
                // If user cancels, remove the line and second point
                line.remove();
                marker.remove();
                measurePoints.pop();
            }
        }
    } else if (isMeasuring) {
        handleMeasuring(x, y, pageContainer);
    } else if (isMeasuringArea) {
        handleMeasuringArea(x, y, pageContainer);
    }
}

function handleMeasuring(x, y, pageContainer) {
    const marker = createMeasureMarker(x, y);
    pageContainer.appendChild(marker);
    measurePoints.push({ x, y });
    
    if (measurePoints.length === 2) {
        const line = createMeasureLine(measurePoints[0], measurePoints[1]);
        pageContainer.appendChild(line);
        measurePoints = [];
    }
}

function handleMeasuringArea(x, y, pageContainer) {
    const marker = createMeasureMarker(x, y);
    pageContainer.appendChild(marker);
    areaPoints.push({ x, y });
    
    // Create lines between points
    if (areaPoints.length > 1) {
        const line = createAreaLine(areaPoints[areaPoints.length - 2], areaPoints[areaPoints.length - 1]);
        pageContainer.appendChild(line);
    }
    
    // Update polygon
    createAreaPolygon(areaPoints);
}

// Take-off tool specific functions
function handleTakeOffClick(e) {
    if (!selectedItem) {
        alert('Please select an item from the list before adding markers');
        return;
    }

    const pageContainer = e.target.closest('.pdf-page');
    if (!pageContainer) return;
    
    const canvas = pageContainer.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const pageRect = pageContainer.getBoundingClientRect();
    
    const x = (e.clientX - pageRect.left) / currentScale;
    const y = (e.clientY - pageRect.top) / currentScale;
    
    const marker = document.createElement('div');
    marker.className = 'take-off-marker';
    marker.style.backgroundColor = selectedItem.color;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.style.transform = `translate(-50%, -50%) scale(${1 / currentScale})`;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    tooltip.textContent = selectedItem.name;
    marker.appendChild(tooltip);
    
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
}

// Add event listeners for measure menu
const measureToolMenu = document.getElementById('measureToolMenu');
const closeMeasureMenuBtn = document.getElementById('closeMeasureMenu');
const setPointsBtn = document.getElementById('setPointsBtn');
const measureLineBtn = document.getElementById('measureLineBtn');
const measureAreaBtn = document.getElementById('measureAreaBtn');
const calculateAreaBtn = document.getElementById('calculateAreaBtn');

measureBtn.addEventListener('click', toggleMeasureMenu);
closeMeasureMenuBtn.addEventListener('click', () => {
    measureToolMenu.classList.remove('active');
    clearSelectedState();
});

setPointsBtn.addEventListener('click', () => {
    isSettingPoints = true;
    isMeasuring = false;
    isMeasuringArea = false;
    measurePoints = [];
    areaPoints = [];
    document.getElementById('measureLineBtn').disabled = true;
    document.getElementById('measureAreaBtn').disabled = true;
    document.querySelector('.area-controls').style.display = 'none';
    document.querySelector('.area-result').style.display = 'none';
    alert('Click two points on the PDF to set up the scale. After setting both points, you will be asked to enter the known distance.');
});

measureLineBtn.addEventListener('click', () => {
    isSettingPoints = false;
    isMeasuring = true;
    isMeasuringArea = false;
    measurePoints = [];
    areaPoints = [];
    if (areaPolygon) {
        areaPolygon.remove();
        areaPolygon = null;
    }
});

measureAreaBtn.addEventListener('click', () => {
    isSettingPoints = false;
    isMeasuring = false;
    isMeasuringArea = true;
    measurePoints = [];
    areaPoints = [];
    document.querySelector('.area-controls').style.display = 'flex';
    document.querySelector('.area-result').style.display = 'none';
});

calculateAreaBtn.addEventListener('click', () => {
    if (areaPoints.length < 3) {
        alert('Please add at least 3 points to calculate an area');
        return;
    }
    
    const area = calculateArea(areaPoints);
    const scaledArea = area * (scaleFactor * scaleFactor);
    document.getElementById('areaValue').textContent = scaledArea.toFixed(2);
    document.querySelector('.area-result').style.display = 'flex';
});

// Add function to clear selected state
function clearSelectedState() {
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('selected'));
}

// Report functions
function toggleReportMenu() {
    // Close other tool menus first
    overlayToolMenu.classList.remove('active');
    measureToolMenu.classList.remove('active');
    
    reportToolMenu.classList.toggle('active');
    ensureDropdownVisible();
    
    // Update selected state
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('selected'));
    reportBtn.classList.add('selected');
}

// Add event listeners for report menu
const reportToolMenu = document.getElementById('reportToolMenu');
const closeReportMenuBtn = document.getElementById('closeReportMenu');
const uploadReportBtn = document.getElementById('uploadReportBtn');
const toggleReportBtn = document.getElementById('toggleReportBtn');
const switchReportBtn = document.getElementById('switchReportBtn');
const reportControls = document.querySelector('.report-controls');

reportBtn.addEventListener('click', toggleReportMenu);
closeReportMenuBtn.addEventListener('click', () => {
    reportToolMenu.classList.remove('active');
    clearSelectedState();
});

// Handle report toggle
toggleReportBtn.addEventListener('click', async () => {
    isReportEnabled = !isReportEnabled;
    toggleReportBtn.querySelector('i').className = isReportEnabled ? 'fas fa-eye-slash' : 'fas fa-eye';
    toggleReportBtn.querySelector('span').textContent = isReportEnabled ? 'Hide Report' : 'Show Report';
    
    if (currentReport) {
        if (isReportEnabled) {
            await displayReport(currentReport);
        } else {
            await displayPdf(currentPdf);
        }
    }
});

// Handle report order switch
switchReportBtn.addEventListener('click', async () => {
    if (!isReportEnabled || !currentReport) return;
    
    isReportOnTop = !isReportOnTop;
    await displayReport(currentReport);
});

// Handle report PDF upload
uploadReportBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            // Add to report list
            const report = {
                id: Date.now(),
                name: file.name,
                pdf: pdf
            };
            reports.push(report);
            updateReportList();
            
            // If this is the first report, make it current
            if (!currentReport) {
                currentReport = report;
                reportControls.style.display = 'block';
                isReportEnabled = false;
                isReportOnTop = true;
                toggleReportBtn.querySelector('i').className = 'fas fa-eye';
                toggleReportBtn.querySelector('span').textContent = 'Show Report';
                await displayPdf(currentPdf);
            }
        } catch (error) {
            console.error('Error loading report PDF:', error);
            alert('Error loading report PDF. Please try again.');
        }
    };
    input.click();
});

// Update report list in tool menu
function updateReportList() {
    const reportList = document.querySelector('.report-list');
    reportList.innerHTML = '';
    
    reports.forEach(report => {
        const reportCard = document.createElement('div');
        reportCard.className = 'report-card';
        if (currentReport && currentReport.id === report.id) {
            reportCard.classList.add('selected');
        }
        
        reportCard.innerHTML = `
            <div class="report-info">
                <div class="report-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="report-details">
                    <div class="report-name">${report.name}</div>
                </div>
            </div>
            <div class="report-actions">
                <button class="icon-button select-report" title="Select Report">
                    <i class="fas fa-check${currentReport && currentReport.id === report.id ? '' : '-circle'}"></i>
                </button>
                <button class="icon-button remove-report" title="Remove Report">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Select report
        reportCard.querySelector('.select-report').addEventListener('click', async () => {
            currentReport = report;
            updateReportList();
            if (isReportEnabled) {
                await displayReport(report);
            }
        });
        
        // Remove report
        reportCard.querySelector('.remove-report').addEventListener('click', async () => {
            if (confirm('Are you sure you want to remove this report?')) {
                reports = reports.filter(r => r.id !== report.id);
                if (currentReport && currentReport.id === report.id) {
                    currentReport = null;
                    reportControls.style.display = 'none';
                    isReportEnabled = false;
                    toggleReportBtn.querySelector('i').className = 'fas fa-eye';
                    toggleReportBtn.querySelector('span').textContent = 'Show Report';
                    await displayPdf(currentPdf);
                }
                updateReportList();
            }
        });
        
        reportList.appendChild(reportCard);
    });
}

// Display report
async function displayReport(report) {
    pdfViewer.innerHTML = '';
    
    for (let pageNum = 1; pageNum <= report.pdf.numPages; pageNum++) {
        const page = await report.pdf.getPage(pageNum);
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

// Export take-off data to CSV
function exportTakeOffData() {
    if (takeOffItems.length === 0) {
        alert('No items to export');
        return;
    }

    // Create CSV header
    let csvContent = 'Name,Code,Description,Count\n';

    // Add data rows
    takeOffItems.forEach(item => {
        // Escape commas and quotes in the data
        const escapedName = item.name.replace(/"/g, '""');
        const escapedCode = item.code.replace(/"/g, '""');
        const escapedDescription = item.description.replace(/"/g, '""');

        // Wrap fields in quotes to handle special characters
        csvContent += `"${escapedName}","${escapedCode}","${escapedDescription}",${item.count}\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `take-off-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import take-off data from CSV
function importTakeOffData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvContent = event.target.result;
            const lines = csvContent.split('\n');
            
            // Skip header row
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Parse CSV line, handling quoted fields
                const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (!matches || matches.length < 4) continue;

                // Remove quotes and handle escaped quotes
                const name = matches[0].replace(/^"|"$/g, '').replace(/""/g, '"');
                const code = matches[1].replace(/^"|"$/g, '').replace(/""/g, '"');
                const description = matches[2].replace(/^"|"$/g, '').replace(/""/g, '"');
                const count = parseInt(matches[3]);

                // Create new item
                const item = {
                    id: Date.now() + i, // Unique ID for each item
                    name,
                    code,
                    description,
                    color: getNextColor(), // Assign a color from the color palette
                    count,
                    markers: []
                };

                takeOffItems.push(item);
            }

            // Update the UI
            updateItemList();
            alert('Import completed successfully!');
        };

        reader.onerror = () => {
            alert('Error reading the CSV file');
        };

        reader.readAsText(file);
    };
    input.click();
}

// Helper function to get the next color from the palette
function getNextColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const currentColorCount = takeOffItems.length % colors.length;
    return colors[currentColorCount];
}

// Update marker positions when zooming
function updateMarkerPositions() {
    const markers = document.querySelectorAll('.take-off-marker');
    markers.forEach(marker => {
        const x = parseFloat(marker.style.left);
        const y = parseFloat(marker.style.top);
        marker.style.transform = `translate(-50%, -50%) scale(${1 / currentScale})`;
    });
} 