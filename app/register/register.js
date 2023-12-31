// Websocket
const serverPort = 8080;
const serverIP = window.location.href.split("//")[1].split(":")[0];
const socket = io(`ws://${serverIP}:${serverPort}`);

// Constants for getIngredients method -> easy to change
const OPTION1 = document.getElementById("opt1").innerText; // "Klassisch"
const OPTION2 = document.getElementById("opt2").innerText; // "mit Käse"
const OPTION3 = document.getElementById("opt3").innerText; // "Vegi"
const OPTION4 = document.getElementById("opt4").innerText; // "Apfel"
const OPTION5 = document.getElementById("opt5").innerText; // "Individuell"

// Elements
const ulZubereitung = document.querySelector(".ul-zubereitung");
const ulAbholung = document.querySelector(".ul-abholung");
var arrayZubereitung = [] // array for sorting the unordered lists
var arrayAbholung = [] // array for sorting the unordered lists

const addBtn = document.querySelector("#enter");
const optionBtns = document.querySelectorAll(".option");
const individualBtn = document.querySelector("#opt5");
const closeIndividualBtn = document.querySelector("#closeIndividual");
const printInfoBtn = document.querySelector("#info");

const orderNumElement = document.querySelector(".order-num");
const checkBoxes = document.querySelectorAll("#popup input");
const itemsZubereitung = {};
const itemsAbholung = {}
const currentItems = [itemsZubereitung, itemsAbholung];

// Event Listeners
document.addEventListener("DOMContentLoaded", loadData);
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
printInfoBtn.addEventListener("click", printInfo);


function addOrder() {
    const orderNum = Number(orderNumElement.innerText);

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
    cancelIcon.classList.add("fa-times");
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

    
    arrayZubereitung.push(orderDiv);
    ulZubereitung.appendChild(orderDiv);

    // save the data (ingredients of the order) in currenItems Object (in itemsZubereitung)
    let selectedProduct = selectedBtn.innerText;
    let ingredients = getIngredients(selectedProduct);
    currentItems[0][orderNum] = ingredients;

    //send data to backend for database
    insertOrder(orderNum, ingredients);

    // increment order Number
    orderNumElement.innerText = orderNum + 1;
    
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
        arrayAbholung.push(clickedElement);
        arrayAbholung.sort( (a,b) => {
            return Number(a.innerText) - Number(b.innerText);
        })
        arrayAbholung.forEach( element => {
            ulAbholung.appendChild(element);
        })
        
        // get the data (id: [product, amount]), pass it to itemsAbholung an delete it from Zubereitung
        let id = Number(clickedElement.innerText);
        currentItems[1][id] = currentItems[0][id];
        delete currentItems[0][id];
        arrayZubereitung = arrayZubereitung.filter( element => {
            return Number(element.innerText) != id;
        })

        // send data to backend
        updateOrder(id, 2);
    } else if (currentUl.classList[0] === "ul-abholung") {
        
        // delete element
        clickedElement.remove();
        
        // remove from current items list and sorting-helper-array
        let id = Number(clickedElement.innerText);
        delete currentItems[1][id];
        arrayAbholung = arrayAbholung.filter( element => {
            return Number(element.innerText) != id;
        })

        // send data to backend
        updateOrder(id, 3);
    }
    // send data to display
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
            
            // remove from current items list and sorting-helper-array
            let id = Number(clickedElement.innerText);
            delete currentItems[0][id];
            arrayZubereitung = arrayZubereitung.filter( element => {
                return Number(element.innerText) != id;
            })

            // send data to backend
            updateOrder(id, 0);
            // send data to display
            sendData(currentItems);
            closeDeletePopup();
        });
        cancelDeleteBtn.addEventListener("click", closeDeletePopup);

    } else if (currentUl.classList[0] === "ul-abholung") {
        // append element back to "in production" list
        arrayZubereitung.push(clickedElement);
        arrayZubereitung.sort( (a,b) => {
            return Number(a.innerText) - Number(b.innerText);
        })
        arrayZubereitung.forEach( element => {
            ulZubereitung.appendChild(element);
        })
        
        // get the data (id: [product, amount]), pass it to itemsZubereitung and delete from itemsAbholung
        let id = Number(clickedElement.innerText);
        currentItems[0][id] = currentItems[1][id];
        delete currentItems[1][id];
        arrayAbholung = arrayAbholung.filter( element => {
            return Number(element.innerText) != id;
        })

        // send data to backend
        updateOrder(id, 1);
        // send data to display
        sendData(currentItems);
    }
}


function getIngredients(selectedProduct) {
    let ingredients = [];
    switch(selectedProduct) {
        case OPTION1:
            //ingredients.push(...Zutaten1);
            ingredients.push(OPTION1);
            break;
        case OPTION2:
            //ingredients.push(...Zutaten2);
            ingredients.push(OPTION2);
            break;
        case OPTION3:
            //ingredients.push(...Zutaten3);
            ingredients.push(OPTION3);
            break;
        case OPTION4:
            //ingredients.push(...Zutaten4);
            ingredients.push(OPTION4);
            break;
        case OPTION5:
            checkBoxes.forEach( checkbox => {
                if (checkbox.checked) {
                    let ingredient = checkbox.parentElement.innerText;
                    ingredients.push(ingredient);
                }
            })
            break;
    }
    return ingredients;
}

function openPopup() {
    document.getElementById('popup').style.display = 'flex';
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

// Backend
function insertOrder(id, ingredients) { 
    data = {
        id: id,
        ingredients: ingredients
    };

    fetch('/insert', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
          },
    }).then(response => {
        if (response.ok) {
          console.log('Data submitted successfully');
        } else {
          console.error('Error submitting data');
        }
    });
}

function updateOrder(id, status) {
    data = {
        id: id,
        status: status
    }

    fetch('/update', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => {
        if (response.ok) {
          console.log('Data submitted successfully');
        } else {
          console.error('Error submitting data');
        }
    });
}

function loadData() {
    console.log(serverIP);
    fetch('/load')
      .then(response => {
        return response.json();
      })
      .then(data => {
        data.prep.forEach( item => {
            let id = item["id"];
            let status = item["status"];
            itemsZubereitung[id] = ["dummy data"];
            loadItem(id, status);
        })
        data.pickup.forEach( item => {
            let id = item["id"];
            let status = item["status"];
            itemsAbholung[id] = ["dummy data"];
            loadItem(id, status);
        })
        orderNumElement.innerText = Number(data.latestId) + 1;

      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
}


function loadItem(id, status) {
    const orderNum = id;

    // create order element
    /*
    <div class="order-element">
        <button class="cancel"><i class="fas fa-x"></i></button>
        <span>{Bestellnummer}</span>
        <button class="ready"><i class="fas fa-arrow-right"></i></button>
    </div>
    */

    let orderDiv = document.createElement("div");
    orderDiv.classList.add("order-element");

    let cancelBtn = document.createElement("button");
    cancelBtn.classList.add("cancel")
    let cancelIcon = document.createElement("i");
    cancelIcon.classList.add("fas");
    cancelIcon.classList.add("fa-times");
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

    if (status === 1) {
        arrayZubereitung.push(orderDiv);
        ulZubereitung.appendChild(orderDiv);
    }
    else if (status === 2) {
        arrayAbholung.push(orderDiv);
        ulAbholung.appendChild(orderDiv);
    }
    // send the data over to the Display
    sendData(currentItems);
}


function printInfo() {
    fetch('/print', {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        console.log('Anfrage an den Server erfolgreich gesendet');
    })
    .catch(error => {
        console.error('Fehler beim Senden der Anfrage:', error);
    });
}