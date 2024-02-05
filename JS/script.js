document.addEventListener('DOMContentLoaded', function () {
    const API_KEY = "8DWkvDy8fbVdx7mQKq8AqHKCCUc7bqnFHGY92v1s";
    const baseUrl = "https://api.nasa.gov/mars-photos/api/v1/";
    const MAX_IMAGES = 15;

    // Fetch rovers data on page load
    fetchRoversData();

    // Event listener for changing date format
    document.getElementById('selectDateFormat').addEventListener('change', function () {
        let regularDateBox = document.getElementById('regularDateBox');
        let solDateBox = document.getElementById('solDateBox');
        if (this.value === 'Mars Date (Sol)') {
            regularDateBox.style.display = 'none';
            solDateBox.style.display = 'block';
        } else {
            regularDateBox.style.display = 'block';
            solDateBox.style.display = 'none';
        }
    });

    // Event listeners for search button and reset button
    document.getElementById("getData").addEventListener("click", searchData);
    document.getElementById("searchForm").addEventListener("reset", resetForm);

    function fetchRoversData() {
        fetch(baseUrl + "rovers?api_key=" + API_KEY)
            .then(response => response.json())
            .then(data => {
                const selectRover = document.getElementById("selectRover");
                data.rovers.forEach(rover => {
                    const option = document.createElement("option");
                    option.value = rover.name;
                    option.textContent = rover.name;
                    selectRover.appendChild(option);
                });
            })
            .catch(error => showError("Error fetching rovers data."));
    }

    function searchData() {
        const dateFormat = document.getElementById("selectDateFormat").value;
        let date;
        if (dateFormat === "Earth Date") {
            date = document.getElementById("inputDate").value;
        } else {
            date = document.getElementById("inputSolDate").value;
        }
        const rover = document.getElementById("selectRover").value;
        const camera = document.getElementById("selectCamera").value || "";

        // Construct API URL based on user input
        let apiUrl = baseUrl + "rovers/" + rover + "/photos?";
        if (dateFormat === "Earth Date") {
            apiUrl += "earth_date=" + date;
        } else {
            apiUrl += "sol=" + date;
        }
        if (camera) {
            apiUrl += "&camera=" + camera;
        }
        apiUrl += "&api_key=" + API_KEY;

        // Fetch images data
        fetch(apiUrl)
            .then(status)
            .then(response => response.json())
            .then(data => displaySearchResults(data.photos))
            .catch(error => showError("Error fetching images data."));
    }

    function displaySearchResults(photos) {
        const searchResults = document.getElementById("searchResults");
        searchResults.innerHTML = ""; // Clear previous results

        if (photos.length === 0) {
            searchResults.textContent = "No images found.";
            return;
        }

        // Limit the number of images to display to 15
        const maxImages = MAX_IMAGES;
        const imagesToDisplay = photos.slice(0, maxImages);

        imagesToDisplay.forEach(photo => {
            const img = document.createElement("img");
            img.src = photo.img_src;
            img.alt = "Mars Rover Image";
            img.className = "img-thumbnail";
            searchResults.appendChild(img);
        });
    }


    function resetForm() {
        document.getElementById("selectDateFormat").value = "Earth Date";
        document.getElementById("regularDateBox").style.display = "block";
        document.getElementById("inputDate").value = "";
        document.getElementById("solDateBox").style.display = "none";
        document.getElementById("inputSolDate").value = "";
        document.getElementById("selectRover").value = "";
        document.getElementById("selectCamera").value = "";
        document.getElementById("searchResults").innerHTML = "";
    }


    function showError(message) {
        document.getElementById("errorMessageBody").textContent = message;
        const errorMessageModal = new bootstrap.Modal(document.getElementById("errorMessageModal"));
        errorMessageModal.show();
    }

    const status = (response) => {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response);
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    };
});