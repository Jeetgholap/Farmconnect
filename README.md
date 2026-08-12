🌱 Farm Connect — AI-Based Plant Leaf Disease Detection System

Farm Connect is an internship project developed to demonstrate the practical use of Artificial Intelligence, Machine Learning, and Full-Stack Web Development in agriculture.

The application allows users to upload, select, or capture a photograph of a plant leaf directly through their browser. The image is processed by a trained MobileNetV2 deep learning model, which provides a disease prediction along with a confidence score, severity level, description, and recommended treatment.

🚀 Live Demo

Website: https://farmconnect-azure.vercel.app/

The project has been successfully deployed as a live web application with the frontend and backend hosted independently.

🤖 AI Model

The disease detection system uses transfer learning with MobileNetV2, a lightweight convolutional neural network pretrained on ImageNet. The trained model was converted to TensorFlow Lite to reduce memory usage and improve inference performance on resource-limited cloud hosting.

Due to dataset and storage limitations during the internship, the currently deployed AI model is trained on a limited set of 3 plant-leaf classes, including selected disease categories such as Tomato Late Blight. The current model is therefore a proof-of-concept and is not intended to represent a complete plant disease detection system.

🛠️ Technology Stack

- Frontend: React + Vite
- Backend: Python + Flask
- AI/ML: TensorFlow, TensorFlow Lite, MobileNetV2
- Model Training: Google Colab
- Dataset: PlantVillage — trimmed/limited subset
- API: Flask REST API
- Frontend Deployment: Vercel
- Backend Deployment: Render
- Production Server: Gunicorn

✨ Features

- 📷 Upload a plant leaf image
- 📱 Capture a leaf photograph using the device camera
- 🤖 AI-based disease prediction
- 📊 Confidence score
- ⚠️ Disease severity classification
- 💊 Recommended treatment information
- 📝 Disease description
- 👍 Prediction feedback mechanism
- 🌐 Accessible directly through a web browser
- ☁️ Fully deployed frontend and backend

The frontend communicates with the Flask backend through a REST API. The backend preprocesses the uploaded image, performs TensorFlow Lite inference, and returns the prediction to the frontend.

📈 Model Performance

During development, the model achieved approximately 97.9% training accuracy and 93% validation accuracy on the available training/validation data. The model was trained for 10 epochs using transfer learning.

«Note: Model accuracy can vary depending on image quality, lighting conditions, and how closely the uploaded leaf resembles the training data.»

💡 Key Learning Outcomes

This internship project provided practical experience in:

- Deep Learning and Transfer Learning
- Image Classification
- MobileNetV2
- TensorFlow & TensorFlow Lite
- REST API development using Flask
- React frontend development
- Frontend–backend integration
- Cloud deployment using Vercel and Render
- Working with limited computing and hosting resources
- Debugging real-world deployment issues

A major deployment challenge was the memory requirement of the full TensorFlow runtime. Converting the model to TensorFlow Lite significantly reduced resource usage and allowed the backend to run reliably on the free-tier cloud environment.

🔮 Future Scope

- Expand the dataset with more plant species and diseases
- Increase the number of supported disease classes
- Improve model accuracy with additional training data
- Use user feedback and misclassified images for future retraining
- Add multilingual support
- Add user accounts and disease history
- Explore offline/on-device AI inference

⚠️ Disclaimer

Farm Connect is an academic/internship project and proof-of-concept. It is not a certified agricultural diagnostic tool. AI predictions should be verified by a qualified agricultural expert before making real-world treatment decisions.

---

👨‍💻 Project Status

Internship Project — Successfully Deployed 🚀

Farm Connect demonstrates an end-to-end AI application, from model training and REST API development to modern frontend development and cloud deployment.
