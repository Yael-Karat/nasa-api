const API_KEY = "8DWkvDy8fbVdx7mQKq8AqHKCCUc7bqnFHGY92v1s"

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector("#getData").addEventListener("click", getData);
});

function checkFound(){

}

const status = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response)
    } else {
        return Promise.reject(new Error(response.statusText))
    }
}

const toggleValidation = (element, show) => {
    if (show) {
        element.classList.add("is-invalid");
        element.nextElementSibling.classList.remove("d-none");
    } else {
        element.classList.remove("is-invalid");
        element.nextElementSibling.classList.add("d-none");
    }
}
const getData = () => {
    const userNameElement = document.getElementById("username");
    const dataElement = document.getElementById("data");
    // hide validation div
    toggleValidation(userNameElement, false)

    dataElement.innerHTML = "<img src='img/loading-buffering.gif'>";
    fetch('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=2015-6-3&api_key=API_KEY')
        .then(status)
        .then(res => res.json())
        .then(json => {
            dataElement.innerHTML = `User ${json.login} has ${json.followers} followers`; // remove the loading message
        })
        .catch(function (err) {
            dataElement.innerHTML = 'Request failed';
        }).finally(function () {
        // always executed
        userNameElement.value = "";
    });
}
