const API_KEY = "8DWkvDy8fbVdx7mQKq8AqHKCCUc7bqnFHGY92v1s"

/**
function status(response) {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response)
    } else {
        return Promise.reject(new Error(response.statusText))
    }
}

function json(response) {
    return response.json()
}

fetch('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=2015-6-3&api_key=API_KEY')
    .then(status)
    .then(json)
    .then(function (data) {
        console.log('Request succeeded with NASA response', data);
    }).catch(function (error) {
    console.log('Request failed', error);
});*/