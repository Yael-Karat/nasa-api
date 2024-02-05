document.addEventListener('DOMContentLoaded', function () {
    const API_KEY = "8DWkvDy8fbVdx7mQKq8AqHKCCUc7bqnFHGY92v1s";
    const baseUrl = "https://api.nasa.gov/mars-photos/api/v1/";
    const MAX_IMAGES = 15;

    resetSite();

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

    function resetSite() {
        // Clear saved images from localStorage
        localStorage.removeItem('savedImages');

        // Clear error message modal
        document.getElementById("errorMessageBody").textContent = "";
    }

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

        let rowDiv;
        for (let index = 0; index < Math.min(photos.length, MAX_IMAGES); index++) {
            // Create a new row div for every third image
            if (index % 3 === 0) {
                rowDiv = document.createElement("div");
                rowDiv.className = "row mb-3";
                searchResults.appendChild(rowDiv);
            }

            // Create a column div for each photo
            const colDiv = document.createElement("div");
            colDiv.className = "col-md-4";

            // Create container div for each photo
            const photoContainer = document.createElement("div");
            photoContainer.className = "photo-container mb-3";

            // Create image element
            const img = document.createElement("img");
            img.src = photos[index].img_src;
            img.alt = "Mars Rover Image";
            img.className = "img-thumbnail"; // Assigning the img-thumbnail class here

            // Create photo details paragraph
            const details = document.createElement("div");
            let dateDetails = `<p><strong>Earth Date:</strong> ${photos[index].earth_date}</p>`;
            if (photos[index].sol) {
                dateDetails += `<p><strong>Mars Date (Sol):</strong> ${photos[index].sol}</p>`;
            }
            details.innerHTML = dateDetails +
                `<p><strong>Rover:</strong> ${photos[index].rover.name}</p>` +
                `<p><strong>Camera:</strong> ${photos[index].camera.full_name}</p>`;

            // Create save button
            const saveButton = document.createElement("button");
            saveButton.textContent = "Save";
            saveButton.className = "btn btn-info btn-sm";
            saveButton.addEventListener("click", () => saveImage(photos[index]));

            // Create full-size button
            const fullSizeButton = document.createElement("button");
            fullSizeButton.textContent = "Full Size";
            fullSizeButton.className = "btn btn-primary btn-sm ms-2";
            fullSizeButton.addEventListener("click", () => openFullSize(photos[index].img_src));

            // Append elements to photo container
            photoContainer.appendChild(img);
            photoContainer.appendChild(details);
            photoContainer.appendChild(saveButton);
            photoContainer.appendChild(fullSizeButton);

            // Append photo container to column div
            colDiv.appendChild(photoContainer);

            // Append column div to row div
            rowDiv.appendChild(colDiv);
        }
        // Attach event listener to save buttons
        const saveButtons = document.querySelectorAll('.save-button');
        saveButtons.forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.dataset.index);
                saveImage(photos[index]);
            });
        });
    }

    function saveImage(photo) {
        let savedImages = JSON.parse(localStorage.getItem('savedImages')) || [];
        const exists = savedImages.some(img => img.img_src === photo.img_src);
        if (exists) {
            showError("This image has already been saved.");
            return;
        }
        savedImages.push(photo);
        localStorage.setItem('savedImages', JSON.stringify(savedImages));
        // Display a modal confirmation message
        const savedModal = new bootstrap.Modal(document.getElementById("savedModal"));
        savedModal.show();
    }

    function openFullSize(imgSrc) {
        // Open full-size image in a new window
        window.open(imgSrc, "_blank");
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

        // Clear saved images from localStorage
        localStorage.removeItem('savedImages');

        // Clear error message modal
        document.getElementById("errorMessageBody").textContent = "";
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