import requests
import os

# --- Configuration ---
# Use an example image from the uploads folder
IMAGE_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "uploads", "771968657fee428d94cac3448c4d764c_cow(1)_SIH.jpeg"))
API_URL = "http://127.0.0.1:8000/detect_lameness"
# -------------------

def test_lameness_detection():
    """
    Sends an image file to the lameness detection API and prints the result.
    """
    if not os.path.exists(IMAGE_FILE_PATH):
        print(f"Error: Image file not found at '{IMAGE_FILE_PATH}'")
        return

    print(f"Testing API endpoint: {API_URL}")
    print(f"Sending image: {IMAGE_FILE_PATH}")

    try:
        # Prepare the file and form data
        with open(IMAGE_FILE_PATH, "rb") as image_file:
            files = {"file": (os.path.basename(IMAGE_FILE_PATH), image_file, "image/jpeg")}
            data = {"method": "heuristic"}

            # Send the POST request
            response = requests.post(API_URL, files=files, data=data)

            # Check the response
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

            print("\n✅ Success! API Response:")
            print(response.json())

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error connecting to the API: {e}")
        print("Please ensure the FastAPI server is running correctly.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    test_lameness_detection()
