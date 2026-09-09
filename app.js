// Home Inventory

const API_URL = "https://script.google.com/macros/s/AKfycbyMkiyIDlkzbya3BC6_6KxQmh6yOkRCw322SBETEQ4M6mUFQPVaHVsA8yj2uJA4WwsrbQ/exec";

let inventory = [];
let selectedLocation = "All";

const inventoryList = document.getElementById("inventoryList");
const searchInput = document.getElementById("searchInput");
const locationCards = document.querySelectorAll(".location-card");
const showAllButton = document.getElementById("showAllButton");


function formatExpiryDate(dateValue) {

    if (!dateValue) return "";

    // Normal yyyy-mm-dd value
    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
        const parts = dateValue.split("-");

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Handle a full date/time returned from Google Sheets
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function getExpiryStatus(dateValue) {

    if (!dateValue) return "";

    let expiryDate;

    // Normal yyyy-mm-dd value
    if (
        typeof dateValue === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
        const parts = dateValue.split("-");

        expiryDate = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );
    } else {
        expiryDate = new Date(dateValue);
    }

    if (isNaN(expiryDate.getTime())) {
        return "";
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const millisecondsPerDay =
        1000 * 60 * 60 * 24;

    const daysRemaining =
        Math.round(
            (expiryDate - today) /
            millisecondsPerDay
        );

    if (daysRemaining < 0) {
        return " — EXPIRED";
    }

    if (daysRemaining === 0) {
        return " — Expires today";
    }

    if (daysRemaining === 1) {
        return " — Expires tomorrow";
    }

    if (daysRemaining <= 7) {
        return ` — Expires in ${daysRemaining} days`;
    }

    return "";
}

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
                ${item.expiry ? `<p>📅 Expiry: ${formatExpiryDate(item.expiry)}${getExpiryStatus(item.expiry)}</p>` : ""}
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
// EDIT ITEM
// --------------------------------------------------

const editItemModal =
    document.getElementById("editItemModal");

const closeEditModal =
    document.getElementById("closeEditModal");

const editItemForm =
    document.getElementById("editItemForm");

const editIndex =
    document.getElementById("editIndex");

const editProductName =
    document.getElementById("editProductName");

const editBarcode =
    document.getElementById("editBarcode");

const editCategory =
    document.getElementById("editCategory");

const editQuantity =
    document.getElementById("editQuantity");

const editUnit =
    document.getElementById("editUnit");

const editLocation =
    document.getElementById("editLocation");

const editExpiryDate =
    document.getElementById("editExpiryDate");


function editItem(index) {

    const item = inventory[index];

    editIndex.value = index;

    editProductName.value =
        item.product || "";

    editBarcode.value =
        item.barcode || "";

    editCategory.value =
        item.category || "Food";

    editQuantity.value =
        item.quantity || 1;

    editUnit.value =
        item.unit || "item";

    editLocation.value =
        item.location || "Pantry 1";

    editExpiryDate.value =
        item.expiry || "";

    editItemModal.style.display = "block";
}


closeEditModal.onclick = () => {

    editItemModal.style.display = "none";

};


editItemForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const index =
            Number(editIndex.value);

        inventory[index] = {

            product:
                editProductName.value,

            barcode:
                editBarcode.value,

            category:
                editCategory.value,

            quantity:
                Number(editQuantity.value),

            unit:
                editUnit.value,

            location:
                editLocation.value,

            expiry:
                editExpiryDate.value
        };

        await saveInventory();

        editItemModal.style.display = "none";

        updateLocationCounts();

        displayInventory();
    }
);

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
            ".json?fields=product_name,brands,categories_tags,packaging_tags"
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

        const packaging =
            data.product.packaging_tags || [];

        const categoryText =
            categories.join(" ").toLowerCase();

        const packagingText =
            packaging.join(" ").toLowerCase();

        const productNameText =
            productName.toLowerCase();


        // -----------------------------
        // CATEGORY
        // -----------------------------

        let appCategory = "Food";

        if (
            categoryText.includes("beverage") ||
            categoryText.includes("drink") ||
            categoryText.includes("juice") ||
            categoryText.includes("water") ||
            categoryText.includes("soft-drink") ||
            categoryText.includes("milk") ||
            productNameText.includes("milk")
        ) {
            appCategory = "Drinks";
        }


        // -----------------------------
        // UNIT
        // -----------------------------

        let appUnit = "item";

        if (
            packagingText.includes("can") ||
            packagingText.includes("tin") ||
            productNameText.includes("canned")
        ) {
            appUnit = "can";

        } else if (
            packagingText.includes("bottle")
        ) {
            appUnit = "bottle";

        } else if (
            packagingText.includes("jar")
        ) {
            appUnit = "jar";

        } else if (
            packagingText.includes("box") ||
            packagingText.includes("carton")
        ) {
            appUnit = "box";

        } else if (
            packagingText.includes("bag")
        ) {
            appUnit = "bag";

        } else if (
            packagingText.includes("packet") ||
            packagingText.includes("wrapper") ||
            packagingText.includes("pouch")
        ) {
            appUnit = "packet";
        }


        // Milk is usually sold as a bottle/carton,
        // so use bottle as our inventory unit.
        if (
            productNameText.includes("milk")
        ) {
            appUnit = "bottle";
        }


        return {
            name: productName,
            category: appCategory,
            unit: appUnit
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

                    unit.value = found.unit;

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