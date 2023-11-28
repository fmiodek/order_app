// Websocket
const serverPort = 8080;
const serverIP = window.location.href.split("//")[1].split(":")[0];
const socket = io(`ws://${serverIP}:${serverPort}`);

const ulZubereitung = document.querySelector(".ul-zubereitung");
const ulAbholung = document.querySelector(".ul-abholung");

socket.on("message", data => {
    updateUl(ulZubereitung, data[0]);
    updateUl(ulAbholung, data[1]);
    console.log(data[0])
    console.log(data[1])
});

function updateUl (ul, data) {
    ul.innerHTML = "";
    Object.keys(data).forEach( (key) => {
        let orderDiv = document.createElement("div");
        orderDiv.classList.add("order-element");
        let orderText = document.createElement("span");
        orderText.innerHTML = key;
        orderDiv.appendChild(orderText);
        ul.appendChild(orderDiv);

    });
    
}

