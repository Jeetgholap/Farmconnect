from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import json
import io
import os

# Render's free tier only allocates 0.1 CPU. TensorFlow defaults to spinning up
# several background threads, which causes severe contention (and periodic
# stalls/crashes) on such a small CPU allocation. Forcing it to use just one
# thread avoids that fight for CPU time.
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = tf.keras.models.load_model(
    os.path.join(BASE_DIR, 'plant_model.h5')
)

with open(os.path.join(BASE_DIR, 'class_names.json'), 'r') as f:
    class_names = json.load(f)

# Warm up the model once at startup. TensorFlow's very first prediction after
# loading is much slower than every call after it (it builds an internal
# execution graph). Doing that slow first call here, at boot, means real
# user requests never have to pay that cost.
_warmup_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
model.predict(_warmup_input)
print("Model warmed up and ready.")

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