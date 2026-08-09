from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import json
import io
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = tf.keras.models.load_model(
    os.path.join(BASE_DIR, 'plant_model.h5')
)

with open(os.path.join(BASE_DIR, 'class_names.json'), 'r') as f:
    class_names = json.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['image']
    img = Image.open(io.BytesIO(file.read())).convert('RGB')
    img = img.resize((224, 224))

    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)
    predicted_index = np.argmax(predictions[0])
    confidence = float(predictions[0][predicted_index])
    disease_name = class_names[predicted_index]

    return jsonify({
        'disease': disease_name,
        'confidence': round(confidence * 100, 2)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)