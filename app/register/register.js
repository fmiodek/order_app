const serverPort = 8080;
const socket = io(`ws://localhost:${serverPort}`);

// Constants for getIngredients method -> easy to change
const OPTION1 = document.getElementById("opt1").innerText; // "Klassisch"
const OPTION2 = document.getElementById("opt2").innerText; // "mit Käse"
const OPTION3 = document.getElementById("opt3").innerText; // "Vegi"
const OPTION4 = document.getElementById("opt4").innerText; // "Individuell"
const Zutaten1 = ["Speck", "Zwiebeln"];
const Zutaten2 = ["Speck", "Zwiebeln", "Käse"];
const Zutaten3 = ["Lauch", "Pilze"];

// Elements
const ulZubereitung = document.querySelector(".ul-zubereitung");
const ulAbholung = document.querySelector(".ul-abholung");

const addBtn = document.querySelector("#enter");
const optionBtns = document.querySelectorAll(".option");
const individualBtn = document.querySelector("#opt4");
const closeIndividualBtn = document.querySelector("#closeIndividual");

const orderNumElement = document.querySelector(".order-num");
const checkBoxes = document.querySelectorAll("#popup input");
const itemsZubereitung = {};
const itemsAbholung = {}
const currentItems = [itemsZubereitung, itemsAbholung];

// Event Listeners
addBtn.addEventListener("click", addOrder);

optionBtns.forEach( (optionBtn) => {
    optionBtn.addEventListener("click", () => {    
        optionBtns.forEach( (other) => {
            other.classList.remove("clicked");
        })
        optionBtn.classList.toggle("clicked");
    })
})

individualBtn.addEventListener("click", openPopup);
closeIndividualBtn.addEventListener("click", closePopup);

function addOrder() {
    const orderNum = orderNumElement.innerText;

    // check if a product is selected
    let selected = false;
    let selectedBtn;
    optionBtns.forEach( (optionBtn) => {
        if (optionBtn.classList.contains("clicked")) {
            selected = true;
            selectedBtn = optionBtn;
        }
    })
    if (!selected) {
        return
    }

    // create order element
    /*<div class="order-element">
        <button class="cancel"><i class="fas fa-x"></i></button>
        <span>{Bestellnummer}</span>
        <button class="ready"><i class="fas fa-arrow-right"></i></button>
    </div>*/

    let orderDiv = document.createElement("div");
    orderDiv.classList.add("order-element");

    let cancelBtn = document.createElement("button");
    cancelBtn.classList.add("cancel")
    let cancelIcon = document.createElement("i");
    cancelIcon.classList.add("fas");
    cancelIcon.classList.add("fa-x");
    cancelBtn.appendChild(cancelIcon);

    let orderText = document.createElement("span");
    orderText.innerHTML = orderNum;

    let readyBtn = document.createElement("button");
    readyBtn.classList.add("ready")
    let readyIcon = document.createElement("i");
    readyIcon.classList.add("fas");
    readyIcon.classList.add("fa-check");
    readyBtn.appendChild(readyIcon);

    cancelBtn.addEventListener("click", cancel);
    readyBtn.addEventListener("click", ready);

    orderDiv.appendChild(cancelBtn);
    orderDiv.appendChild(orderText);
    orderDiv.appendChild(readyBtn);

    ulZubereitung.appendChild(orderDiv);

    // save the data (ingredients of the order) in currenItems Object (in itemsZubereitung)
    let selectedProduct = selectedBtn.innerText;
    let data = getIngredients(selectedProduct);
    currentItems[0][orderNum] = data;
    
    // increment order Number
    orderNumElement.innerText = Number(orderNum) + 1;
    
    // remove click animation
    selectedBtn.classList.remove("clicked");

    // remove checked boxes for individual choice
    checkBoxes.forEach( checkBox => {
        checkBox.checked = false;
    })
    
    // send the data over to the Display
    sendData(currentItems);
}

function ready(e) {
    let clickedBtn = e.target
    let clickedElement = clickedBtn.parentNode;
    let currentUl = clickedElement.parentNode;
    
    if (currentUl.classList[0] === "ul-zubereitung") {
        // append element for pick-up
        ulAbholung.appendChild(clickedElement);
        // get the data (id: [product, amount]) an pass it to itemsAbholung
        let id = clickedElement.innerText;
        currentItems[1][id] = currentItems[0][id];
        delete currentItems[0][id];
    } else if (currentUl.classList[0] === "ul-abholung") {
        // delete element
        clickedElement.remove();
        // remove from current items list
        let id = clickedElement.innerText;
        delete currentItems[1][id];
    }
    sendData(currentItems);
}

function cancel(e) {
    let clickedElement = e.target.parentNode;
    let currentUl = clickedElement.parentNode;
    if (currentUl.classList[0] === "ul-zubereitung") {      
        // Popup to confirm if you really want to delete the item
        openDeletePopup();
        let confirmDeleteBtn = document.querySelector("#confirmDelete");
        let cancelDeleteBtn = document.querySelector("#cancelDelete");
        confirmDeleteBtn.addEventListener("click", () => {
            // delete Element
            clickedElement.remove();
            // remove from current items list
            let id = clickedElement.innerText;
            delete currentItems[0][id];
            sendData(currentItems);
            closeDeletePopup();
        });
        cancelDeleteBtn.addEventListener("click", closeDeletePopup);

    } else if (currentUl.classList[0] === "ul-abholung") {
        // append element back to "in production" list
        ulZubereitung.appendChild(clickedElement);
        // get the data (id: [product, amount]) an pass it to itemsZubereitung
        let id = clickedElement.innerText;
        currentItems[0][id] = currentItems[1][id];
        delete currentItems[1][id];
        sendData(currentItems);
    }
}


function getIngredients(selectedProduct) {
    let ingredients = [];
    switch(selectedProduct) {
        case OPTION1:
            ingredients.push(...Zutaten1);
            break;
        case OPTION2:
            ingredients.push(...Zutaten2);
            break;
        case OPTION3:
            ingredients.push(...Zutaten3);
            break;
        case OPTION4:
            checkBoxes.forEach( checkbox => {
                if (checkbox.checked) {
                    let ingredient = checkbox.parentElement.innerText;
                    ingredients.push(ingredient);
                }
            })
            break;
    }
    console.log(ingredients);
    return ingredients;
}

function openPopup() {
    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

function openDeletePopup() {
    document.getElementById('deletePopup').style.display = 'block';
}

function closeDeletePopup() {
    document.getElementById('deletePopup').style.display = 'none';
}


// Websocket functions
function sendData(dataToSend) {
    socket.emit("message", dataToSend);
}