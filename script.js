// Data storage
let groceryData = JSON.parse(localStorage.getItem('groceryData')) || [];
let chart = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set today's date as default
    document.getElementById('purchaseDate').valueAsDate = new Date();
    
    // Event listeners
    document.getElementById('processReceipt').addEventListener('click', processReceipt);
    document.getElementById('manualForm').addEventListener('submit', handleManualEntry);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('timeFilter').addEventListener('change', handleTimeFilterChange);
    document.getElementById('startScanner').addEventListener('click', startBarcodeScanner);
    
    // Initial render
    renderItems();
    updateSummary();
    updateChart();
}

// Receipt Processing with OCR
async function processReceipt() {
    const fileInput = document.getElementById('receiptUpload');
    const statusDiv = document.getElementById('ocrStatus');
    
    if (!fileInput.files[0]) {
        alert('Please select a receipt image');
        return;
    }
    
    statusDiv.className = 'processing';
    statusDiv.textContent = 'Processing receipt... This may take a moment.';
    
    try {
        const result = await Tesseract.recognize(
            fileInput.files[0],
            'eng',
            {
                logger: m => console.log(m)
            }
        );
        
        const parsedItems = parseReceiptText(result.data.text);
        
        if (parsedItems.length > 0) {
            parsedItems.forEach(item => addGroceryItem(item));
            statusDiv.className = 'success';
            statusDiv.textContent = `Successfully added ${parsedItems.length} items!`;
            fileInput.value = '';
            renderItems();
            updateSummary();
            updateChart();
        } else {
            statusDiv.className = 'error';
            statusDiv.textContent = 'Could not parse any items from the receipt. Try manual entry.';
        }
    } catch (error) {
        statusDiv.className = 'error';
        statusDiv.textContent = 'Error processing receipt. Please try again.';
        console.error('OCR Error:', error);
    }
}

// Parse OCR text to extract items
function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];
    const priceRegex = /\$?\d+\.?\d*/;
    
    lines.forEach(line => {
        // Simple parsing - looks for lines with prices
        const priceMatch = line.match(priceRegex);
        if (priceMatch) {
            const price = parseFloat(priceMatch[0].replace('$', ''));
            const itemName = line.replace(priceMatch[0], '').trim();
            
            if (itemName && price > 0) {
                items.push({
                    name: itemName,
                    quantity: 1,
                    price: price,
                    date: new Date().toISOString().split('T')[0],
                    store: 'Receipt Upload',
                    id: Date.now() + Math.random()
                });
            }
        }
    });
    
    return items;
}

// Manual entry handler
function handleManualEntry(e) {
    e.preventDefault();
    
    const item = {
        name: document.getElementById('itemName').value,
        quantity: parseInt(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value),
        date: document.getElementById('purchaseDate').value,
        store: document.getElementById('store').value || 'Unknown',
        id: Date.now()
    };
    
    addGroceryItem(item);
    document.getElementById('manualForm').reset();
    document.getElementById('purchaseDate').valueAsDate = new Date();
    renderItems();
    updateSummary();
    updateChart();
}

// Add item to storage
function addGroceryItem(item) {
    // Check if item exists and combine quantities
    const existingItem = groceryData.find(
        g => g.name.toLowerCase() === item.name.toLowerCase() && 
        g.date === item.date
    );
    
    if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.price += item.price;
    } else {
        groceryData.push(item);
    }
    
    localStorage.setItem('groceryData', JSON.stringify(groceryData));
}

// Filter handlers
function handleTimeFilterChange() {
    const filter = document.getElementById('timeFilter').value;
    const customRange = document.getElementById('customDateRange');
    
    if (filter === 'custom') {
        customRange.style.display = 'block';
    } else {
        customRange.style.display = 'none';
        applyFilters();
    }
}

function applyFilters() {
    renderItems();
    updateSummary();
    updateChart();
}

function getFilteredData() {
    let filtered = [...groceryData];
    const timeFilter = document.getElementById('timeFilter').value;
    const itemFilter = document.getElementById('
