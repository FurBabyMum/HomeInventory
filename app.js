// Home Inventory - temporary test data

const API_URL = "https://script.google.com/macros/s/AKfycbyMkiyIDlkzbya3BC6_6KxQmh6yOkRCw322SBETEQ4M6mUFQPVaHVsA8yj2uJA4WwsrbQ/exec";

let inventory = [];
    
let selectedLocation = "All";

const inventoryList = document.getElementById("inventoryList");
const searchInput = document.getElementById("searchInput");
const locationCards = document.querySelectorAll(".location-card");
const showAllButton = document.getElementById("showAllButton");


// Display inventory
function displayInventory() {

    const searchText = searchInput.value.toLowerCase();

    const filteredInventory = inventory
        .map((item, index) => ({ item, index }))
        .filter(entry => {

            const item = entry.item;

            const matchesLocation =
                selectedLocation === "All" ||
                item.location === selectedLocation;

            const matchesSearch =
                item.product.toLowerCase().includes(searchText);

            return matchesLocation && matchesSearch;
        });

    inventoryList.innerHTML = "";

    if (filteredInventory.length === 0) {
        inventoryList.innerHTML = "<p>No items found.</p>";
        return;
    }

    filteredInventory.forEach(entry => {

        const item = entry.item;
        const index = entry.index;

        const itemDiv = document.createElement("div");

        itemDiv.className = "food-item";

        // Make unit plural when quantity is more than 1
        let displayUnit = item.unit;

        if (item.quantity !== 1 && !displayUnit.endsWith("s")) {
            displayUnit += "s";
        }

        // Format expiry date
        let expiryText = "";

        if (item.expiry) {

            const expiryDate = new Date(item.expiry + "T00:00:00");

            expiryText = `
                <div class="item-expiry">
                    📅 Expiry: ${expiryDate.toLocaleDateString("en-AU")}
                </div>
            `;
        }

        // Category - older test items may not have one
        const categoryText = item.category
            ? item.category
            : "Uncategorised";

        itemDiv.innerHTML = `
            <div class="item-details">

                <h3>${item.product}</h3>

                <p>
                    ${categoryText} ·
                    ${item.quantity} ${displayUnit}
                </p>

                <p>
                    📍 ${item.location}
                </p>

                ${expiryText}

            </div>

            <div class="item-actions">

                <button
                    class="edit-button"
                    onclick="editItem(${index})">
                    Edit
                </button>

                <button
                    class="delete-button"
                    onclick="deleteItem(${index})">
                    Delete
                </button>

            </div>
        `;

        inventoryList.appendChild(itemDiv);
    });
}


// Location buttons
locationCards.forEach(card => {

    card.addEventListener("click", function () {

        selectedLocation = card.dataset.location;

        displayInventory();
    });

});


// Show all button
if (showAllButton) {

    showAllButton.addEventListener("click", function () {

        selectedLocation = "All";

        displayInventory();
    });

}


// Search
searchInput.addEventListener("input", function () {

    displayInventory();

});

function updateLocationCounts() {

    locationCards.forEach(card => {

        const location = card.dataset.location;

        const count = inventory.filter(item =>
            item.location === location
        ).length;

        const countElement = card.querySelector(".location-count");

        countElement.textContent = count;
    });
}

// --------------------------------------------------
// SAVE INVENTORY TO GOOGLE SHEETS
// --------------------------------------------------

async function saveInventory() {

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: "saveInventory",
            inventory: inventory
        })
    });

    if (!response.ok) {
        throw new Error("Unable to save inventory.");
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(
            data.error || "Unable to save inventory."
        );
    }

    return data;
}

// Add Item form

const addItemButton = document.getElementById("addItemButton");
const addItemModal = document.getElementById("addItemModal");
const closeModal = document.getElementById("closeModal");
const addItemForm = document.getElementById("addItemForm");

addItemButton.addEventListener("click", function () {
    addItemModal.style.display = "block";
});

closeModal.addEventListener("click", function () {
    addItemModal.style.display = "none";
});

window.addEventListener("click", function (event) {
    if (event.target === addItemModal) {
        addItemModal.style.display = "none";
    }
});

addItemForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const newItem = {
        product: document.getElementById("productName").value,
        barcode: document.getElementById("barcode").value,
        category: document.getElementById("category").value,
        quantity: Number(document.getElementById("quantity").value),
        unit: document.getElementById("unit").value,
        location: document.getElementById("location").value,
        expiry: document.getElementById("expiryDate").value
    };

    inventory.push(newItem);

    try {

        await saveInventory();

    } catch (error) {

        console.error(error);

        inventory.pop();

        alert(
            "The item could not be saved. Please try again."
        );

        return;
    }

    addItemForm.reset();

    document.getElementById("quantity").value = 1;

    addItemModal.style.display = "none";

    selectedLocation = "All";

    updateLocationCounts();
    displayInventory();
});

// --------------------------------------------------
// EDIT ITEM
// --------------------------------------------------

const editItemModal =
    document.getElementById("editItemModal");

const editItemForm =
    document.getElementById("editItemForm");

const closeEditModal =
    document.getElementById("closeEditModal");


function editItem(index) {

    const item = inventory[index];

    document.getElementById("editIndex").value = index;

    document.getElementById("editProductName").value =
        item.product || "";

    document.getElementById("editBarcode").value =
        item.barcode || "";

    document.getElementById("editCategory").value =
        item.category || "Food";

    document.getElementById("editQuantity").value =
        item.quantity || 1;

    document.getElementById("editUnit").value =
        item.unit || "item";

    document.getElementById("editLocation").value =
        item.location;

    document.getElementById("editExpiryDate").value =
        item.expiry || "";

    editItemModal.style.display = "block";
}


closeEditModal.addEventListener("click", function () {

    editItemModal.style.display = "none";

});


editItemForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const index =
        Number(document.getElementById("editIndex").value);

    inventory[index] = {

        product:
            document.getElementById("editProductName").value,

        barcode:
            document.getElementById("editBarcode").value,

        category:
            document.getElementById("editCategory").value,

        quantity:
            Number(document.getElementById("editQuantity").value),

        unit:
            document.getElementById("editUnit").value,

        location:
            document.getElementById("editLocation").value,

        expiry:
            document.getElementById("editExpiryDate").value
    };

    try {

        await saveInventory();

    } catch (error) {

        console.error(error);

        alert(
            "The changes could not be saved. Please try again."
        );

        return;
    }

    editItemModal.style.display = "none";

    updateLocationCounts();
    displayInventory();

});


window.addEventListener("click", function (event) {

    if (event.target === editItemModal) {
        editItemModal.style.display = "none";
    }

});

// --------------------------------------------------
// DELETE ITEM
// --------------------------------------------------

async function deleteItem(index) {

    const item = inventory[index];

    const confirmed = confirm(
        "Delete " + item.product + " from your inventory?"
    );

    if (!confirmed) {
        return;
    }

    const deletedItem = inventory[index];

    inventory.splice(index, 1);

    try {

        await saveInventory();

    } catch (error) {

        console.error(error);

        inventory.splice(index, 0, deletedItem);

        alert(
            "The item could not be deleted. Please try again."
        );

        return;
    }

    updateLocationCounts();
    displayInventory();
}

// --------------------------------------------------
// BARCODE SCANNER
// --------------------------------------------------

const scanBarcodeButton =
    document.getElementById("scanBarcodeButton");

const scannerModal =
    document.getElementById("scannerModal");

const closeScanner =
    document.getElementById("closeScanner");

const scannerVideo =
    document.getElementById("scannerVideo");

const scannerStatus =
    document.getElementById("scannerStatus");


let barcodeReader = null;
let scannerControls = null;
let barcodeDetected = false;


// Open scanner
scanBarcodeButton.addEventListener("click", async function () {

    scannerModal.style.display = "block";

    scannerStatus.textContent =
        "Camera ready — hold the barcode steady in the centre.";

    barcodeDetected = false;

    try {

        barcodeReader =
            new ZXingBrowser.BrowserMultiFormatOneDReader();

        scannerControls =
            await barcodeReader.decodeFromConstraints(

                {
                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    }
                },

                scannerVideo,

                function (result, error, controls) {

                    if (result && !barcodeDetected) {

                        barcodeDetected = true;

                        const barcode = result.getText();

                        scannerStatus.textContent =
                            "Barcode found: " + barcode;

                        controls.stop();

                        handleScannedBarcode(barcode);
                    }
                }
            );

            scannerStatus.textContent =
                "Camera ready — hold a barcode in front of the camera.";

    } catch (error) {

        console.error(error);

        scannerStatus.textContent =
            "Unable to start camera. Please check camera permission.";
    }

});


// Close scanner
function stopScanner() {

    if (scannerControls) {

        scannerControls.stop();

        scannerControls = null;
    }

    scannerModal.style.display = "none";
}


closeScanner.addEventListener("click", function () {

    stopScanner();

});


window.addEventListener("click", function (event) {

    if (event.target === scannerModal) {

        stopScanner();
    }

});


// --------------------------------------------------
// HANDLE SCANNED BARCODE
// --------------------------------------------------

async function handleScannedBarcode(barcode) {

    stopScanner();


    // Look for an existing product with the same barcode
    const existingIndex = inventory.findIndex(item =>
        item.barcode === barcode
    );


    if (existingIndex !== -1) {

        const existingItem = inventory[existingIndex];

        const increaseQuantity = confirm(
            existingItem.product +
            " is already in your inventory.\n\n" +
            "Increase quantity by 1?"
        );


        if (increaseQuantity) {

    existingItem.quantity += 1;

    try {

        await saveInventory();

    } catch (error) {

        console.error(error);

        existingItem.quantity -= 1;

        alert(
            "The quantity could not be saved. Please try again."
        );

        return;
    }

    updateLocationCounts();
    displayInventory();
}

        return;
    }


    // New barcode - try to identify the product
document.getElementById("barcode").value = barcode;

addItemModal.style.display = "block";

const productNameField =
    document.getElementById("productName");

productNameField.value = "Looking up product...";

const foundProduct =
    await lookupProductByBarcode(barcode);

if (foundProduct) {

    productNameField.value = foundProduct;

} else {

    productNameField.value = "";

    alert(
        "Product not found automatically. Please enter the product name."
    );
}

productNameField.focus();


// --------------------------------------------------
// LOAD INVENTORY FROM GOOGLE SHEETS
// --------------------------------------------------

async function loadInventory() {

    try {

        inventoryList.innerHTML =
            "<p>Loading inventory...</p>";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                "Unable to load inventory."
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.error || "Unable to load inventory."
            );
        }

        inventory = data.inventory || [];

        updateLocationCounts();
        displayInventory();

    } catch (error) {

        console.error(error);

        inventoryList.innerHTML =
            "<p>Unable to load inventory from Google Sheets.</p>";
    }
}


// Load inventory when app opens
loadInventory();