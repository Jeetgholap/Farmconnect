from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_edge_litert.interpreter import Interpreter
import numpy as np
from PIL import Image
import json
import io
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

interpreter = Interpreter(model_path=os.path.join(BASE_DIR, 'plant_model.tflite'))
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

with open(os.path.join(BASE_DIR, 'class_names.json'), 'r') as f:
    class_names = json.load(f)

print("TFLite model loaded and ready.")


@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['image']
    img = Image.open(io.BytesIO(file.read())).convert('RGB')
    img = img.resize((224, 224))

    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)

    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]['index'])[0]

    predicted_index = int(np.argmax(predictions))
    confidence = float(predictions[predicted_index])
    disease_name = class_names[predicted_index]

    return jsonify({
        'disease': disease_name,
        'confidence': round(confidence * 100, 2)
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)