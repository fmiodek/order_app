const socket = io("ws://localhost:8080");

// Elements
const addBtn = document.querySelector("#enter");
const ulZubereitung = document.querySelector(".ul-zubereitung");
const ulAbholung = document.querySelector(".ul-abholung");
const optionBtns = document.querySelectorAll(".option");
const orderNumElement = document.querySelector(".order-num");
const selectQuantity = document.querySelector("#quantity");
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
        <p>{Bestellnummer}</p>
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

    // save the data in currenItems Object (in itemsZubereitung)
    let selectedProduct = selectedBtn.innerText;
    let selectedAmount = selectQuantity.selectedIndex + 1;
    let data = [selectedProduct, selectedAmount];
    currentItems[0][orderNum] = data;
    // increment order Number
    orderNumElement.innerText = Number(orderNum) + 1;
    // remove click animation
    selectedBtn.classList.remove("clicked");
    // Select auf default 1 zurück
    selectQuantity.selectedIndex = 0;
    
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
        // get the data (id: [product, amount]) an pass it itemsAbholung
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
        // delete Element
        clickedElement.remove();
        // remove from current items list
        let id = clickedElement.innerText;
        delete currentItems[0][id];
    } else if (currentUl.classList[0] === "ul-abholung") {
        // append element back to "in production" list
        ulZubereitung.appendChild(clickedElement);
        // get the data (id: [product, amount]) an pass it itemsZubereitung
        let id = clickedElement.innerText;
        currentItems[0][id] = currentItems[1][id];
        delete currentItems[1][id];
    }
    sendData(currentItems);
}



// Websocket functions
function sendData(dataToSend) {
    socket.emit("message", dataToSend);
}

