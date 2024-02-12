'use strict'

/**
 * Purpose: Executes the provided callback function when the DOMContentLoaded event is fired, indicating that the initial HTML document has been completely loaded and parsed.
 * Parameters: callback (function): The function to be executed when the event is fired.
 * Returns: None.
 */

document.addEventListener('DOMContentLoaded', function () {
    const API_KEY = "8DWkvDy8fbVdx7mQKq8AqHKCCUc7bqnFHGY92v1s";
    const baseUrl = "https://api.nasa.gov/mars-photos/api/v1/";
    const MAX_IMAGES = 15;
    let savedImages = JSON.parse(localStorage.getItem('savedImages')) || [];

    resetForm();

    // Event listener for changing date format
    document.getElementById('selectDateFormat').addEventListener('change', function () {
        const regularDateBox = document.getElementById('regularDateBox');
        const solDateBox = document.getElementById('solDateBox');
        if (this.value === 'Mars Date (Sol)') {
            regularDateBox.style.display = 'none';
            solDateBox.style.display = 'block';
        } else {
            regularDateBox.style.display = 'block';
            solDateBox.style.display = 'none';
        }
    });

    /**
     * Purpose: Fetches data from the NASA API to determine the minimum and maximum Earth dates available for the Mars rover photos and sets the date range for the Earth date picker accordingly.
     * Parameters: None.
     * Returns: None.
     */
    function setEarthDateRange() {
        fetch(baseUrl + "manifests/curiosity?api_key=" + API_KEY)
            .then(response => response.json())
            .then(data => {
                const minEarthDate = data.photo_manifest.landing_date; // Minimum Earth date
                const maxEarthDate = data.photo_manifest.max_date; // Maximum Earth date

                // Set min and max attributes of the inputDate element
                document.getElementById("inputDate").setAttribute("min", minEarthDate);
                document.getElementById("inputDate").setAttribute("max", maxEarthDate);
                document.getElementById('loadingBuffer').classList.add('loaded');
            })
            .catch(error => {
                showError("Error fetching cameras data. Please try again.")
            });
    }

    // Call setEarthDateRange function on page load
    setEarthDateRange();

    /**
     * Purpose: Validates the user input based on the specified type (in this case, Mars Sol date) and returns an error message if the input is invalid.
     * Parameters: input (string): The user input to be validated and type (string): The type of input being validated.
     * Returns: (string) Error message if input is invalid, empty string ('') otherwise.
     */
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

    /**
     * Purpose: Checks if the provided date is a valid Earth date within the specified range.
     * Parameters: date (string): The date to be validated.
     * Returns: (boolean) True if the date is valid and within range, false otherwise.
     */
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

    /**
     * Purpose: Fetches data about the available Mars rovers from the NASA API and populates the rover selection dropdown menu.
     * Parameters: None.
     * Returns: None.
     */
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

    /**
     * Purpose: Fetches data about the cameras available for the selected Mars rover from the NASA API and populates the camera selection dropdown menu.
     * Parameters: None.
     * Returns: None.
     */
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

    /**
     * Purpose: Fetches Mars rover photos based on user input (rover, camera, date) from the NASA API and displays the search results.
     * Parameters: None.
     * Returns: None.
     */
    function searchData() {
        // Clear previous error messages and "no images found" message
        document.getElementById("dateError").innerHTML = "";
        document.getElementById("dateSolError").innerHTML = "";
        document.getElementById("searchResults").innerHTML = "";

        const dateFormat = document.getElementById("selectDateFormat").value;
        let date;
        let inputType;
        const errorMessageElement = document.getElementById('dateSolError');

        if (dateFormat === "Earth Date") {
            date = document.getElementById("inputDate").value;
            inputType = 'dateEarth';
            errorMessageElement.innerHTML = ''; // Clear previous error message
            if (!isValidEarthDate(date)) {
                errorMessageElement.innerHTML = "Invalid date format or date out of range. Please enter a valid date."; // Display error message
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
        const searchResults = document.getElementById("searchResults");

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
                const filteredPhotos = photos.filter(photo => {
                    return (photo.camera.full_name === camera || camera === "");
                });
                if (filteredPhotos.length === 0) {
                    const messageContainer = document.createElement("div");
                    messageContainer.className = "alert alert-warning";
                    messageContainer.role = "alert";
                    messageContainer.style.fontSize = "larger";
                    messageContainer.textContent = "No images found!";

                    // Append the message container to the search results
                    searchResults.appendChild(messageContainer);
                } else {
                    displaySearchResults(filteredPhotos);
                }
            })
            .catch(error => showError(error.message));
    }

    /**
     * Purpose: Displays the search results (Mars rover photos) in the UI.
     * Parameters: photos (array of objects): An array containing information about the Mars rover photos to be displayed.
     * Returns: None.
     */
    function displaySearchResults(photos) {
        const searchResults = document.getElementById("searchResults");
        searchResults.innerHTML = ""; // Clear previous results

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
            details.innerHTML = dateDetails + `<p><strong>Rover:</strong> ${photos[index].rover.name}</p>` + `<p><strong>Camera:</strong> ${photos[index].camera.full_name}</p>`;

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

    // Event listener for clicking on "Back to Search" button
    document.getElementById('backToSearchButton').addEventListener('click', function () {
        const imagesSearchForm = document.getElementById("imagesSearchForm");
        const savedImagesContent = document.getElementById("savedImagesContent");
        imagesSearchForm.style.display = "block"; // Show search form
        savedImagesContent.style.display = 'none'; // Hide saved images content
    });

    // Event listener for clicking on the save button of images displayed in search results
    document.getElementById('searchResults').addEventListener('click', function (event) {
        if (event.target.classList.contains('save-button')) {
            const index = event.target.dataset.index;
            const photos = JSON.parse(localStorage.getItem('savedImages')) || [];
            const photo = photos.find((item, i) => i === parseInt(index));
            if (photo) {
                saveImage(photo);
                updateSavedImagesList();
            }
        }
    });

    // Event listener for clicking on the delete button in the saved images list
    document.getElementById('savedImagesList').addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-button')) {
            const index = parseInt(event.target.dataset.index); // Parse index as an integer
            let photos = JSON.parse(localStorage.getItem('savedImages')) || [];

            // Check if the index is valid
            if (index >= 0 && index < photos.length) {
                photos.splice(index, 1); // Remove the image at the specified index
                localStorage.setItem('savedImages', JSON.stringify(photos)); // Update storage
                updateSavedImagesList();
            } else {
                showError('Invalid index:', index);
            }
        }
    });

    /**
     * Purpose: Updates the list of saved Mars rover images displayed in the UI menu.
     * Parameters: None.
     * Returns: None.
     */
    const updateSavedImagesList = () => {
        savedImages = JSON.parse(localStorage.getItem('savedImages')) || [];
        const savedImagesList = document.getElementById('savedImagesList');
        savedImagesList.innerHTML = ''; // Clear previous list

        savedImages.forEach((photo, index) => {
            const row = document.createElement('div');
            row.classList.add('row', 'mb-2');
            row.innerHTML = `
            <div class="col">Id Image: ${photo.id}</div>
            <div class="col">Earth Date: ${photo.earth_date}</div>
            <div class="col">Sol: ${photo.sol}</div>
            <div class="col">Camera: ${photo.camera.name}</div>
            <div class="col"><button class="btn btn-danger btn-sm delete-button" data-index="${index}">Delete</button></div>
        `;
            savedImagesList.appendChild(row);
        });

        // Show carousel control buttons if there are saved images
        const carouselControls = document.getElementById('carouselControls');
        if (savedImages.length > 0) {
            carouselControls.style.display = 'block';
        } else {
            carouselControls.style.display = 'none';
        }
    };

    /**
     * Purpose: Handles the click event on the save button of images displayed in search results.
     * Parameters: event (Event object): The event object representing the click event.
     * Returns: None.
     */
        // Function to handle search result click
    const handleSearchResultClick = (event) => {
            if (event.target.classList.contains('save-button')) {
                // Event listener for clicking on "Saved Images" button in the menu
                document.querySelector('.nav-link[href="#"]').addEventListener('click', function () {
                    // Hide search form and related text
                    document.getElementById('imagesSearchForm').style.display = 'none';

                    // Show saved images content
                    document.getElementById('savedImagesContent').style.display = 'block';

                    // Show "Back to Search" button
                    document.getElementById('backToSearchButton').style.display = 'block';
                });

                const index = event.target.dataset.index;
                saveImage(photos[index]);
            }
        };

    // Event listener for clicking on the save button of images displayed in search results
    document.getElementById('searchResults').addEventListener('click', handleSearchResultClick);

    /**
     * Purpose: Hides the saved images content and associated elements.
     * Parameters: None.
     * Returns: None.
     */
    function hideSavedImagesPage() {
        // Hide saved images content
        document.getElementById('savedImagesContent').style.display = 'none';

        // Hide carousel control buttons
        document.getElementById('carouselControls').style.display = 'none';
    }

    /**
     * Purpose: Creates a carousel of saved images in the UI.
     * Parameters: None.
     * Returns: None.
     */
    function createCarousel() {
        const carouselInner = document.querySelector('.carousel-inner');
        carouselInner.innerHTML = ''; // Clear previous carousel items

        savedImages.forEach((photo, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            if (index === 0) {
                carouselItem.classList.add('active');
            }
            const imageContainer = document.createElement('div');
            imageContainer.className = 'd-flex justify-content-center';

            // Create image element
            const img = document.createElement("img");
            img.src = photo.img_src;
            img.alt = "Mars Rover Image";

            imageContainer.appendChild(img);
            carouselItem.appendChild(imageContainer);
            carouselInner.appendChild(carouselItem);
        });
    }

    /**
     * Purpose: Updates the saved images list and associated elements in the UI.
     * Parameters: None.
     * Returns: None.
     */
    // Function to update the saved images list and carousel
    function updateSavedImages() {
        // Update saved images list
        updateSavedImagesList();
    }

    /**
     * Purpose: Initiates the carousel to display saved images in a slideshow.
     * Parameters: None.
     * Returns: None.
     */
    function startCarousel() {
        document.getElementById('carouselExampleFade').style.display = 'block';
        // Update carousel
        createCarousel();

        $('.carousel').carousel('cycle');
    }

    /**
     * Purpose: Displays the saved images page and associated elements.
     * Parameters: None.
     * Returns: None.
     */
    // Function to show saved images page
    function showSavedImagesPage() {
        // Show saved images content
        document.getElementById('savedImagesContent').style.display = 'block';
        // Show carousel control buttons
        document.getElementById('carouselControls').style.display = 'block';
    }

    // Event listener for clicking on "Saved Images" button in the menu
    document.querySelector('.nav-link[data-target="#savedImages"]').addEventListener('click', function () {
        showSavedImagesPage();
        updateSavedImages(); // Update saved images and carousel
    });

    // Attach event listener for the carousel start button
    document.getElementById('carouselStartButton').addEventListener('click', startCarousel);

    // Update saved images and carousel on page load
    updateSavedImages();

    // Attach event listener for the carousel start button
    document.getElementById('carouselStopButton').addEventListener('click', function () {
        document.getElementById('carouselExampleFade').style.display = 'none';
    });

    // Event listener for clicking on "Home" button using event delegation
    document.body.addEventListener('click', function (event) {
        if (event.target.closest('.nav-link[data-target="#home"]')) {
            const imagesSearchForm = document.getElementById("imagesSearchForm");
            const savedImagesContent = document.getElementById("savedImagesContent");
            const carouselControls = document.getElementById('carouselControls');

            // Show the search form
            imagesSearchForm.style.display = 'block';

            // Hide saved images content
            savedImagesContent.style.display = 'none';

            // Hide carousel controls if needed
            if (carouselControls) {
                carouselControls.style.display = 'none';
            }
        }
    });

    // Event listener for clicking on "Saved Images" button in the menu
    document.querySelector('.nav-link[data-target="#savedImages"]').addEventListener('click', function () {
        const imagesSearchForm = document.getElementById("imagesSearchForm");
        imagesSearchForm.style.display = "none";

        showSavedImagesPage();
    });

    // Event listener for clicking on "Back to Search" button
    document.getElementById('backToSearchButton').addEventListener('click', function () {
        hideSavedImagesPage();
    });

    /**
     * Purpose: Displays a message to the user for a specified duration.
     * Parameters: message (string): The message to be displayed and duration (number): The duration (in milliseconds) for which the message should be displayed.
     * Returns: None.
     */
    const displayMessage = (message, duration) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'alert alert-success';
        messageElement.role = 'alert';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, duration);
    };

    /**
     * Purpose: Saves the selected image to the list of saved images in the localStorage.
     * Parameters: photo (object): Information about the photo to be saved.
     * Returns: None.
     */
    const saveImage = (photo) => {
        const exists = savedImages.some(img => img.id === photo.id); // Compare by id
        const id = photo.id;

        if (exists) {
            showErrorForSavedImage("This image has already been saved.", id);
            return;
        } else {
            savedImages.push(photo);
            localStorage.setItem('savedImages', JSON.stringify(savedImages));
            updateSavedImagesList();
            displayMessage("The image has been successfully saved.", 3000);
        }
    };

    /**
     * Purpose: Opens the selected image in full size in a new window.
     * Parameters: imgSrc (string): The URL of the image to be opened.
     * Returns: None.
     */
    function openFullSize(imgSrc) {
        // Open full-size image in a new window
        window.open(imgSrc, "_blank");
    }

    /**
     * Purpose: Resets the search form and associated elements to their initial state.
     * Parameters: None.
     * Returns: None.
     */
    function resetForm() {
        // Clear all input fields and previous error messages
        document.getElementById("selectDateFormat").value = "Earth Date";
        document.getElementById("regularDateBox").style.display = "block";
        document.getElementById("inputDate").value = "";
        document.getElementById("solDateBox").style.display = "none";
        document.getElementById("inputSolDate").value = "";
        document.getElementById("selectRover").value = "";

        // Clear options and reset value for cameras dropdown
        const camerasDropdown = document.getElementById("selectCamera");
        camerasDropdown.innerHTML = "<option value='' selected>Please select a Rover first</option>";
        camerasDropdown.value = "";

        document.getElementById("dateError").innerHTML = "";
        document.getElementById("dateSolError").innerHTML = "";
        document.getElementById("searchResults").innerHTML = "";

        // Clear saved images from localStorage
        localStorage.removeItem('savedImages');
        savedImages = [];
    }

    /**
     * Purpose: Displays an error message using Bootstrap modal.
     * Parameters: message (string): The error message to be displayed.
     * Returns: None.
     */
    function showError(message) {
        // Show error message using Bootstrap modal
        document.getElementById("errorMessageBody").innerHTML = message;
        const errorMessageModal = new bootstrap.Modal(document.getElementById("errorMessageModal"));
        errorMessageModal.show();
    }

    /**
     * Purpose: Displays an error message using Bootstrap modal.
     * Parameters: message (string): The error message to be displayed and id (string): The ID of the saved image associated with the error.
     * Returns: None.
     */
    function showErrorForSavedImage(message, id) {
        // Append error message using Bootstrap modal
        const errorMessageBody = document.getElementById("errorMessageBody");
        errorMessageBody.innerHTML += `<div>${message} ID: ${id}</div>`;
        const errorMessageModal = new bootstrap.Modal(document.getElementById("errorMessageModal"));

        document.querySelector("#errorMessageModal .modal-footer").innerHTML = `
        <button type="button" class="btn btn-primary" id="errorMessageOKButton">OK</button>
    `;
        // Show the modal
        errorMessageModal.show();

        // Add event listener to the OK button to close the modal
        document.getElementById("errorMessageOKButton").addEventListener("click", () => {
            errorMessageModal.hide();
            // Clear error messages after closing the modal
            errorMessageBody.innerHTML = '';
        });
    }
});