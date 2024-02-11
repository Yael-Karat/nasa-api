document.addEventListener('DOMContentLoaded', function () {
    const API_KEY = "8DWkvDy8fbVdx7mQKq8AqHKCCUc7bqnFHGY92v1s";
    const baseUrl = "https://api.nasa.gov/mars-photos/api/v1/";
    const MAX_IMAGES = 15;

    resetSite();

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

    // Fetch data and set date range for Earth date picker
    function setEarthDateRange() {
        fetch(baseUrl + "manifests/curiosity?api_key=" + API_KEY)
            .then(response => response.json())
            .then(data => {
                const minEarthDate = data.photo_manifest.landing_date; // Minimum Earth date
                const maxEarthDate = data.photo_manifest.max_date; // Maximum Earth date

                // Set min and max attributes of the inputDate element
                document.getElementById("inputDate").setAttribute("min", minEarthDate);
                document.getElementById("inputDate").setAttribute("max", maxEarthDate);
            })
            .catch(error => console.error("Error fetching data:", error));
    }

    // Call setEarthDateRange function on page load
    setEarthDateRange();

    const validateInput = (input, type) => {
        const trimmedInput = input.trim();
        switch (type) {
            case 'dateSol':
                const maxSolValue = 4074;
                const solInt = parseInt(trimmedInput, 10);
                if (isNaN(solInt) || solInt < 0) {
                    return '<div class="text-danger">Sol value must be a non-negative integer.</div>';
                } else if (solInt > maxSolValue) {
                    // If Sol value exceeds the maximum allowed value, set it to the maximum value
                    document.getElementById("inputSolDate").value = maxSolValue;
                    return `<div class="text-danger">Sol maximum value is ${maxSolValue}.</div>`;
                }
                return '';
            default:
                return '';
        }
    };

    // Add event listener for inputDate change
    document.getElementById("inputDate").addEventListener("input", function () {
        const dateInput = this.value;
        const errorMessageElement = document.getElementById("dateError");

        // Clear previous error message
        errorMessageElement.innerHTML = "";

        // Check if the input is empty
        if (dateInput.trim() === "") {
            return;
        }
    });

    function isValidEarthDate(date) {
        const minDate = document.getElementById("inputDate").min;
        const maxDate = document.getElementById("inputDate").max;
        const inputDate = new Date(date);

        // Check if the input is a valid Date object
        if (isNaN(inputDate.getTime())) {
            return false;
        }

        // Check if the input date is within the fetched range
        return inputDate >= new Date(minDate) && inputDate <= new Date(maxDate);
    }

    // Fetch rovers data on page load
    fetchRoversData();

    // Event listener for changing the selected rover
    document.getElementById('selectRover').addEventListener('change', function () {
        fetchCamerasForRover();
    });

    // Event listeners for search button and reset button
    document.getElementById("getData").addEventListener("click", searchData);
    document.getElementById("searchForm").addEventListener("reset", resetForm);

    function resetSite() {
        // Clear saved images from localStorage
        localStorage.removeItem('savedImages');
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
                // Fetch cameras data for the initially selected rover
                fetchCamerasForRover();
            })
            .catch(error => showError("Error fetching rovers data."));
    }

    function fetchCamerasForRover() {
        const selectedRover = document.getElementById("selectRover").value;
        const camerasDropdown = document.getElementById("selectCamera");

        // Check if a rover has been selected
        if (selectedRover === "") {
            return;
        }

        fetch(baseUrl + "rovers/" + selectedRover.toLowerCase() + "?api_key=" + API_KEY)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error fetching cameras data.");
                }
                return response.json();
            })
            .then(data => {
                // Clear existing options
                camerasDropdown.innerHTML = "";

                // Populate camera options dynamically based on selected rover
                const cameras = data.rover.cameras.map(camera => camera.full_name); // Use full_name instead of name
                cameras.forEach(cameraFullName => {
                    const option = document.createElement("option");
                    option.value = cameraFullName;
                    option.textContent = cameraFullName;
                    camerasDropdown.appendChild(option);
                });
            })
            .catch(error => {
                // Show error message
                showError("Error fetching cameras data. Please try again.");
                // Restore the previous selected option in the camera dropdown
                camerasDropdown.value = "";
            });
    }

    function searchData() {
        const dateFormat = document.getElementById("selectDateFormat").value;
        let date;
        let inputType;
        let errorMessageElement = document.getElementById('dateSolError');

        if (dateFormat === "Earth Date") {
            date = document.getElementById("inputDate").value;
            inputType = 'dateEarth';
            errorMessageElement.innerHTML = ''; // Clear previous error message
            if (!isValidEarthDate(date)) {
                const errorMessage = "Invalid date format or date out of range. Please enter a valid date.";
                errorMessageElement.innerHTML = errorMessage; // Display error message
                return;
            }
        } else {
            date = document.getElementById("inputSolDate").value;
            inputType = 'dateSol';
            const errorMessage = validateInput(date, inputType);
            errorMessageElement.innerHTML = errorMessage; // Display error message
            if (errorMessage) {
                return;
            }
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

        // Fetch images data
        fetch(apiUrl + "&api_key=" + API_KEY)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error fetching images data.");
                }
                return response.json();
            })
            .then(data => {
                const photos = data.photos;
                if (photos.length === 0) {
                    showError("No images found.");
                } else {
                    // Check if photos are available for the selected camera
                    if (camera) {
                        const filteredPhotos = photos.filter(photo => photo.camera.full_name === camera);
                        if (filteredPhotos.length === 0) {
                            showError("No images found for the selected camera.");
                            return;
                        }
                    }
                    displaySearchResults(photos);
                }
            })
            .catch(error => showError(error.message));
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
            saveButton.className = "btn btn-info btn-sm save-button"; // Add save-button class
            saveButton.dataset.index = index; // Set data-index attribute for later retrieval
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
    }

    function showError(message) {
        // Show error message using Bootstrap modal
        document.getElementById("errorMessageBody").innerHTML = message;
        const errorMessageModal = new bootstrap.Modal(document.getElementById("errorMessageModal"));
        errorMessageModal.show();
    }
});
