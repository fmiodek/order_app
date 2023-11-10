const socket = io("ws://localhost:8080");

const ulZubereitung = document.querySelector(".ul-zubereitung");
const ulAbholung = document.querySelector(".ul-abholung");

socket.on("message", data => {
    
    ulZubereitung.innerHTML = "";
    ulAbholung.innerHTML = "";
    

    Object.keys(data).forEach( (key) => {
        let orderDiv = document.createElement("div");
        orderDiv.classList.add("order-element");
        let orderText = document.createElement("span");
        orderText.innerHTML = key;
        orderDiv.appendChild(orderText);
        ulZubereitung.appendChild(orderDiv);
    });
});
