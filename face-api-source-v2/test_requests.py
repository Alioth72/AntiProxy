import requests

url = "http://127.0.0.1:5000/process_image"
file_path = "aims-fotu.jpg"

with open(file_path, "rb") as image_file:
    files = {"image": image_file}
    response = requests.post(url, files=files)

print(response.json())