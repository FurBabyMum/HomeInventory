// Home Inventory

const API_URL = "https://script.google.com/macros/s/AKfycbyMkiyIDlkzbya3BC6_6KxQmh6yOkRCw322SBETEQ4M6mUFQPVaHVsA8yj2uJA4WwsrbQ/exec";

let inventory = [];
let selectedLocation = "All";

const inventoryList = document.getElementById("inventoryList");
const searchInput = document.getElementById("searchInput");
const locationCards = document.querySelectorAll(".location-card");
const showAllButton = document.getElementById("showAllButton");

// --------------------------------------------------
// DISPLAY INVENTORY
// --------------------------------------------------

function displayInventory() {

    const searchText = searchInput.value.toLowerCase();

    const filteredInventory = inventory
        .map((item, index) => ({ item, index }))
        .filter(entry => {

            const item = entry.item;

            return (
                (selectedLocation === "All" ||
                    item.location === selectedLocation) &&

                item.product.toLowerCase().includes(searchText)
            );
        });

    inventoryList.innerHTML = "";

    if (filteredInventory.length === 0) {
        inventoryList.innerHTML = "<p>No items found.</p>";
        return;
    }

    filteredInventory.forEach(entry => {

        const item = entry.item;
        const index = entry.index;

        let displayUnit = item.unit;

        if (item.quantity !== 1 && !displayUnit.endsWith("s")) {
            displayUnit += "s";
        }

        const itemDiv = document.createElement("div");

        itemDiv.className = "food-item";

        itemDiv.innerHTML = `
            <div class="item-details">
                <h3>${item.product}</h3>
                <p>${item.category || "Uncategorised"} · ${item.quantity} ${displayUnit}</p>
                <p>📍 ${item.location}</p>
            </div>

            <div class="item-actions">
                <button onclick="editItem(${index})">Edit</button>
                <button onclick="deleteItem(${index})">Delete</button>
            </div>
        `;

        inventoryList.appendChild(itemDiv);
    });
}

// --------------------------------------------------
// LOCATION COUNTS
// --------------------------------------------------

function updateLocationCounts() {

    locationCards.forEach(card => {

        const location = card.dataset.location;

        const count = inventory.filter(item =>
            item.location === location
        ).length;

        card.querySelector(".location-count").textContent = count;
    });
}

// --------------------------------------------------
// SAVE INVENTORY
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

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error);
    }
}

// --------------------------------------------------
// ADD ITEM
// --------------------------------------------------

const addItemButton = document.getElementById("addItemButton");
const addItemModal = document.getElementById("addItemModal");
const closeModal = document.getElementById("closeModal");
const addItemForm = document.getElementById("addItemForm");

addItemButton.onclick = () =>
    addItemModal.style.display = "block";

closeModal.onclick = () =>
    addItemModal.style.display = "none";

addItemForm.addEventListener("submit", async event => {

    event.preventDefault();

    inventory.push({
        product: productName.value,
        barcode: barcode.value,
        category: category.value,
        quantity: Number(quantity.value),
        unit: unit.value,
        location: location.value,
        expiry: expiryDate.value
    });

    await saveInventory();

    addItemForm.reset();

    addItemModal.style.display = "none";

    updateLocationCounts();
    displayInventory();
});

// --------------------------------------------------
// EDIT
// --------------------------------------------------

async function editItem(index) {

    const item = inventory[index];

    const newQuantity = prompt(
        "Quantity",
        item.quantity
    );

    if (newQuantity === null) return;

    item.quantity = Number(newQuantity);

    await saveInventory();

    displayInventory();
}

// --------------------------------------------------
// DELETE
// --------------------------------------------------

async function deleteItem(index) {

    if (!confirm("Delete this item?")) return;

    inventory.splice(index, 1);

    await saveInventory();

    updateLocationCounts();
    displayInventory();
}

// --------------------------------------------------
// PRODUCT LOOKUP
// --------------------------------------------------

async function lookupProductByBarcode(code) {

    try {

        const response = await fetch(
            "https://world.openfoodfacts.org/api/v2/product/" +
            encodeURIComponent(code) +
            ".json?fields=product_name,brands,categories_tags"
        );

        const data = await response.json();

        if (!data.product) {
            return null;
        }

        const productName =
            data.product.product_name || "";

        if (!productName) {
            return null;
        }

        const categories =
            data.product.categories_tags || [];

        const categoryText =
            categories.join(" ").toLowerCase();

        let appCategory = "Food";

        if (
            categoryText.includes("beverage") ||
            categoryText.includes("drink") ||
            categoryText.includes("juice") ||
            categoryText.includes("water") ||
            categoryText.includes("soft-drink")
        ) {
            appCategory = "Drinks";
        }

        return {
            name: productName,
            category: appCategory
        };

    } catch (error) {

        console.error(
            "Product lookup failed:",
            error
        );

        return null;
    }
}

// --------------------------------------------------
// BARCODE SCANNER
// --------------------------------------------------

const scanBarcodeButton =
    document.getElementById("scanBarcodeButton");

const scannerModal =
    document.getElementById("scannerModal");

const scannerVideo =
    document.getElementById("scannerVideo");

const scannerStatus =
    document.getElementById("scannerStatus");

let scannerControls = null;

scanBarcodeButton.addEventListener("click", async () => {

    scannerModal.style.display = "block";

    const reader =
        new ZXingBrowser.BrowserMultiFormatOneDReader();

    scannerControls =
        await reader.decodeFromConstraints(
            {
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                }
            },
            scannerVideo,
            async result => {

                if (!result) return;

                scannerControls.stop();

                const code = result.getText();

                scannerModal.style.display = "none";

                const existing =
                    inventory.find(item =>
                        item.barcode === code
                    );

                if (existing) {

                    if (confirm("Increase quantity by 1?")) {

                        existing.quantity += 1;

                        await saveInventory();

                        displayInventory();
                    }

                    return;
                }

                barcode.value = code;

                addItemModal.style.display = "block";

                productName.value =
                    "Looking up product...";

                const found =
                    await lookupProductByBarcode(code);

                if (found) {

                    productName.value = found.name;

                    category.value = found.category;

                } else {

                    productName.value = "";
                }

productName.focus();
            }
        );
});

// --------------------------------------------------
// LOAD INVENTORY
// --------------------------------------------------

async function loadInventory() {

    const response = await fetch(API_URL);

    const data = await response.json();

    inventory = data.inventory || [];

    updateLocationCounts();
    displayInventory();
}

locationCards.forEach(card =>
    card.addEventListener("click", () => {

        selectedLocation = card.dataset.location;

        displayInventory();
    })
);

showAllButton.onclick = () => {

    selectedLocation = "All";

    displayInventory();
};

searchInput.oninput = displayInventory;

loadInventory();