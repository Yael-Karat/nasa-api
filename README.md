# <img src="https://github.com/user-attachments/assets/5d03bfdd-0ebd-4210-9058-44e7934d16f7" alt="NASA Aircraft GIF" style="width: 100px; height: auto;"> NASA Rover Images Viewer
Welcome to the NASA Rover Images Viewer!
This project is a web application that interacts with the NASA API to fetch and display images taken by Mars rovers.
Users can search for images by selecting a rover, specifying a date, and choosing a camera.
The application also allows users to save their favorite images and view them in a carousel.

## Author
**Yael Karat** - [@Yael-Karat](https://github.com/Yael-Karat)

### An introductory exercise in a web programming course in undergraduate studies in computer science at Hadassah College.

## The purpose of the exercise
Building an access website to NASA's Mars image database using REST API.

## More information about the exercise

### Features:
- **Search Images**: Retrieve images taken by Mars rovers by selecting the rover, date format (Earth date or Martian sol), and camera.
- **Save Images**: Save your favorite images and avoid duplicates.
- **Carousel View**: View saved images in a carousel for an enhanced browsing experience.
- **Error Handling**: Robust error handling ensures the application gracefully handles API errors and user mistakes.
- **Form Validation**: Ensures user input is valid before making API requests.

### Technologies in use:
- **JavaScript**: for handling API requests and managing user interactions.
- **HTML/CSS**: structure and design of the application.
- **Bootstrap 5**: Responsive design framework for carousel layout and implementation.
- **NASA Mars Rover API**: Main data source for the project.

### Error Handling:
The application checks for and handles common API errors such as:
- Rate limits (API restricts to 1000 requests per hour).
- Invalid API key or request errors, displaying a message like:
"Nasa servers are not available right now, please try again later."

### Known bug:
There are bugs such as these:
1. An error message for images that are saved more than once does not appear, but there is a function for it and it is called for execution.  
2. The actual image is not saved more than once.

**Therefore, there is room for improving the site and its use.**

### Future Enhancements:
- Enhance the UI with better styling and responsiveness.
- Add more filtering options for images.
- Implement user authentication to save images across sessions.

## Credits
- NASA's [Mars Rover Photos API](https://api.nasa.gov) for providing the images and data.
- Bootstrap for layout and design components.

## Assumptions
The site use bootstrap CDN therefore assumes an internet connection is available.

## Getting Started
### API Key Setup:
1. Visit [NASA's API website](https://api.nasa.gov).
2. Sign up and generate an API key.
3. Replace the placeholder `DEMO_KEY` in the code with your generated key.

Example usage:
const API_KEY = 'your_api_key_here';

### Usage Instructions:
1. Clone the repository to your local machine.
2. Open `index.html` in your browser.
3. Make sure you replace the `API_KEY` in the JavaScript file.
4. The application will fetch images from the Mars Rover API based on your selection of rovers and camera types.

### Prerequisites:
Ensure you have the following installed:
- A modern web browser (Chrome, Firefox, Edge, etc.)
- Internet connection to access the NASA API

### Installation:
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/nasa-api.git
    ```
    
2. Navigate to the project directory:
    ```bash
    cd nasa-api
    ```

3. Open `index.html` in your web browser to run the application.

### Usage:
1. On the home page, select a rover, date format (Earth date or Martian sol), and camera from the dropdown menus.
2. Click the "Search" button to fetch images from the NASA API.
3. Save any image you like by clicking the save button on the image.
4. View saved images by clicking the "Saved Images" button and starting the carousel.
5. You can stop the carousel or go back to the search page using the respective buttons.
