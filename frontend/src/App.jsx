import { useState, useRef, useCallback } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const REPORT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScwoFMdOZXK6rpLpoAy-4AnPwUgXpkI1vmrWUHBTcShdj30gg/viewform?usp=pp_url&entry.1506487444=';
const CONTACT_URL =
  'https://mail.google.com/mail/?view=cm&fs=1&to=jeetgholap114@gmail.com&su=Farm%20Connect%20Inquiry';
const CURRENT_YEAR = new Date().getFullYear();

// Static reference data, keyed by the exact class names the model was trained on.
// None of this is AI-generated - the model only outputs a disease name + confidence.
// Severity and description are informational categorization written by hand.
const DISEASE_INFO = {
  'Pepper,_bell___Bacterial_spot': {
    description: 'Small, dark, water-soaked spots on leaves that may merge and cause defoliation.',
    severity: 'Moderate',
    treatment: 'Remove and destroy infected leaves. Avoid overhead watering, and rotate crops next season to reduce soil-borne spread.',
  },
  'Pepper,_bell___healthy': {
    description: 'No visible signs of disease or stress. Leaf coloration and shape appear normal.',
    severity: 'Low',
    treatment: 'No treatment required. Keep monitoring weekly, especially after heavy rain.',
  },
  'Potato___Early_blight': {
    description: 'Concentric dark rings on older leaves, often called a "target spot" pattern.',
    severity: 'Moderate',
    treatment: 'Prune lower infected leaves, improve airflow between plants, and apply a copper-based fungicide if spread continues.',
  },
  'Potato___Late_blight': {
    description: 'Fast-spreading water-soaked lesions that turn brown-black, especially in humid weather.',
    severity: 'High',
    treatment: 'Act quickly - remove infected foliage and consider a protective fungicide spray. Isolate affected plants if possible.',
  },
  'Potato___healthy': {
    description: 'No visible signs of disease or stress. Leaf coloration and shape appear normal.',
    severity: 'Low',
    treatment: 'No treatment required. Keep monitoring weekly, especially after heavy rain.',
  },
  'Tomato___Bacterial_spot': {
    description: 'Small, dark, greasy-looking spots on leaves and fruit caused by Xanthomonas bacteria.',
    severity: 'Moderate',
    treatment: 'Avoid working with plants when leaves are wet. Remove affected leaves and disinfect tools between plants.',
  },
  'Tomato___Early_blight': {
    description: 'Concentric dark rings on older leaves, often starting near the base of the plant.',
    severity: 'Moderate',
    treatment: 'Mulch around the base to prevent soil splash onto leaves, and remove the lowest infected leaves promptly.',
  },
  'Tomato___Late_blight': {
    description: 'Fast-spreading water-soaked lesions that turn brown-black, especially in humid weather.',
    severity: 'High',
    treatment: 'Isolate affected plants if possible. This can spread rapidly - remove severely infected plants entirely.',
  },
  'Tomato___Leaf_Mold': {
    description: 'Pale yellow patches on top of leaves with olive-green fuzzy mold underneath.',
    severity: 'Moderate',
    treatment: 'Increase ventilation, especially in greenhouses or dense plantings, and avoid wetting leaves when watering.',
  },
  'Tomato___Septoria_leaf_spot': {
    description: 'Numerous small circular spots with dark borders and pale centers on lower leaves.',
    severity: 'Moderate',
    treatment: 'Remove infected lower leaves and avoid overhead watering. Rotate planting location next season.',
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    description: 'Tiny yellow speckling on leaves, often with fine webbing on the underside.',
    severity: 'Moderate',
    treatment: 'Spray leaves (especially undersides) with water or insecticidal soap. Mites thrive in hot, dry conditions.',
  },
  'Tomato___Target_Spot': {
    description: 'Brown lesions with concentric rings, similar to early blight but usually smaller.',
    severity: 'Moderate',
    treatment: 'Remove infected leaves and improve air circulation. A fungicide may help if the spread is severe.',
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    description: 'Upward-curling, yellowing leaves and stunted growth, spread by whiteflies.',
    severity: 'High',
    treatment: 'Control whitefly populations and remove infected plants to protect the rest of the field.',
  },
  'Tomato___Tomato_mosaic_virus': {
    description: 'Mottled light and dark green patterns on leaves, sometimes with distorted growth.',
    severity: 'High',
    treatment: 'No cure once infected. Remove and destroy affected plants, and wash hands/tools before touching healthy ones.',
  },
  'Tomato___healthy': {
    description: 'No visible signs of disease or stress. Leaf coloration and shape appear normal.',
    severity: 'Low',
    treatment: 'No treatment required. Keep monitoring weekly, especially after heavy rain.',
  },
};

// Short actionable chips per class, for the "Recommended Treatment" chip row.
// Same information as the longer treatment sentences above, just broken into
// scannable items - written by hand, not generated by the model.
const TREATMENT_CHIPS = {
  'Pepper,_bell___Bacterial_spot': ['✂️ Remove infected leaves', '💧 Avoid overhead watering', '🔁 Rotate crops'],
  'Pepper,_bell___healthy': ['✅ No treatment needed', '👀 Keep monitoring'],
  'Potato___Early_blight': ['✂️ Prune infected leaves', '🌬️ Improve airflow', '🧪 Copper fungicide'],
  'Potato___Late_blight': ['🚨 Isolate plants', '✂️ Remove infected foliage', '🧪 Fungicide spray'],
  'Potato___healthy': ['✅ No treatment needed', '👀 Keep monitoring'],
  'Tomato___Bacterial_spot': ['🚫 Avoid wet-leaf handling', '✂️ Remove affected leaves', '🧴 Disinfect tools'],
  'Tomato___Early_blight': ['🌾 Mulch the base', '✂️ Remove lower leaves'],
  'Tomato___Late_blight': ['🚨 Isolate plants', '✂️ Remove infected plants'],
  'Tomato___Leaf_Mold': ['🌬️ Increase ventilation', '💧 Avoid wetting leaves'],
  'Tomato___Septoria_leaf_spot': ['✂️ Remove infected leaves', '💧 Avoid overhead watering', '🔁 Rotate planting site'],
  'Tomato___Spider_mites Two-spotted_spider_mite': ['💦 Spray water or soap', '☀️ Manage dry conditions'],
  'Tomato___Target_Spot': ['✂️ Remove infected leaves', '🌬️ Improve air circulation'],
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': ['🦟 Control whiteflies', '✂️ Remove infected plants'],
  'Tomato___Tomato_mosaic_virus': ['✂️ Remove & destroy plants', '🧼 Wash hands and tools'],
  'Tomato___healthy': ['✅ No treatment needed', '👀 Keep monitoring'],
};

function formatDiseaseName(raw) {
  if (!raw) return { crop: '', disease: '' };
  const [cropRaw, ...rest] = raw.split('___');
  const crop = cropRaw.replace(',', '').replace(/_/g, ' ');
  const disease = rest.join(' ').replace(/_/g, ' ');
  return { crop, disease: disease || 'Healthy' };
}

function severityStyle(sev) {
  if (sev === 'High') return { cls: 'sev-high', label: 'High' };
  if (sev === 'Moderate') return { cls: 'sev-moderate', label: 'Moderate' };
  return { cls: 'sev-low', label: 'Low' };
}

export default function App() {
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [predState, setPredState] = useState('idle'); // idle | analyzing | done
  const [prediction, setPrediction] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | correct | incorrect
  const [cameraActive, setCameraActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const runAnalysis = useCallback(async (file, dataUrl) => {
    setImage(dataUrl);
    setSelectedFile(file);
    setPredState('analyzing');
    setPrediction(null);
    setFeedback(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const info = DISEASE_INFO[data.disease] || {
        description: 'No additional information available for this class.',
        severity: 'Moderate',
        treatment: 'No specific notes available for this result.',
      };
      setPrediction({
        raw: data.disease,
        confidence: data.confidence,
        ...formatDiseaseName(data.disease),
        ...info,
      });
      setPredState('done');
    } catch (err) {
      alert('Something went wrong. Is the backend running?');
      console.error(err);
      setPredState('idle');
    }
  }, []);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) runAnalysis(file, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      alert("Couldn't access the camera. Check your browser's camera permission for this site.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stopCamera();
    canvas.toBlob((blob) => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      handleFile(file);
    }, 'image/jpeg', 0.92);
  };

  const reset = () => {
    setImage(null);
    setSelectedFile(null);
    setPredState('idle');
    setPrediction(null);
    setFeedback(null);
    stopCamera();
  };

  return (
    <div className="app-root">
      <div className="bg-texture" aria-hidden="true" />

      {/* HEADER */}
      <header className="site-header">
        <div className="header-inner">
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22V12M12 12C12 12 7 10 4 6c4 1 8 6 8 6zM12 12c0 0 5-2 8-6-4 1-8 6-8 6z" />
              <path d="M12 12V2" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Farm Connect</div>
            <div className="brand-sub">LEAF DISEASE DETECTION · v1.0</div>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            MODEL ACTIVE
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="hero-wrap">
        <div className="hero-band">
          <div className="hero-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 22V12M12 12C12 12 7 10 4 6c4 1 8 6 8 6zM12 12c0 0 5-2 8-6-4 1-8 6-8 6z" />
              <path d="M12 12V2" />
            </svg>
          </div>
          <div className="hero-copy">
            <span className="hero-eyebrow">AI-powered diagnosis</span>
            <h1 className="hero-title">Plant Disease Detection</h1>
            <p className="hero-desc">
              Upload or capture a leaf image — the model identifies the disease, estimates
              severity, and suggests a treatment direction in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <main className="main-grid">
        {/* LEFT: input */}
        <div className="col">
          <div className="col-heading">
            <h2>Leaf Image Input</h2>
            <span className="step-tag">STEP 01</span>
          </div>

          <div className="action-row">
            <button type="button" className="btn-ghost" onClick={() => fileInputRef.current.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload File
            </button>

            <button
              type="button"
              className={`btn-ghost ${cameraActive ? 'btn-ghost-active' : ''}`}
              onClick={cameraActive ? capturePhoto : openCamera}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {cameraActive ? 'Capture Photo' : 'Open Camera'}
            </button>

            {(image || cameraActive) && (
              <button type="button" className="btn-reset" onClick={reset}>Reset</button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {!image && !cameraActive && (
              <>
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
              </>
            )}

            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
            ) : image ? (
              <img src={image} alt="Uploaded plant leaf" className="preview-img" />
            ) : (
              <div className="drop-empty">
                <div className="drop-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="drop-title">Drop a leaf image here</p>
                <p className="drop-sub">or use the buttons above to upload or capture</p>
                <p className="drop-meta">JPG · PNG · WEBP</p>
              </div>
            )}

            {predState === 'analyzing' && (
              <div className="scan-overlay">
                <div className="spinner">
                  <svg viewBox="0 0 50 50" className="spinner-svg">
                    <circle cx="25" cy="25" r="20" className="spinner-track" />
                    <circle cx="25" cy="25" r="20" className="spinner-arc" />
                  </svg>
                  <div className="spinner-dot" />
                </div>
                <p className="scan-label">ANALYZING LEAF...</p>
                <p className="scan-sub">Running the image through the model</p>
                <div className="scan-line" />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: results */}
        <div className="col">
          <div className="col-heading">
            <h2>Prediction Results</h2>
            <span className="step-tag">STEP 02</span>
          </div>

          <div className="result-card">
            {predState === 'idle' && (
              <div className="result-idle">
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <div className="ghost-tag">Awaiting image input</div>

                <div className="ghost-strip">
                  <div className="confidence-top">
                    <span className="mono-label">CONFIDENCE SCORE</span>
                    <span className="confidence-num ghost-text">—%</span>
                  </div>
                  <div className="confidence-track"><div className="ghost-fill" /></div>
                </div>

                <div className="ghost-body">
                  <div>
                    <div className="mono-label">DETECTED CONDITION</div>
                    <div className="ghost-line ghost-line-lg" />
                    <div className="ghost-line ghost-line-sm" />
                  </div>

                  <div className="severity-badge sev-ghost">
                    <span className="severity-dot" />
                    SEVERITY: —
                  </div>

                  <div>
                    <div className="mono-label">DESCRIPTION</div>
                    <div className="ghost-line" style={{ marginTop: 8 }} />
                    <div className="ghost-line" style={{ width: '80%' }} />
                  </div>

                  <div className="treatment-box treatment-box-ghost">
                    <div className="mono-label">RECOMMENDED TREATMENT</div>
                    <div className="ghost-line" style={{ marginTop: 8 }} />
                    <div className="ghost-line" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
            )}

            {predState === 'analyzing' && (
              <div className="result-skeleton">
                {[75, 55, 88, 42, 65].map((w, i) => (
                  <div key={i} className="skel-bar" style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
                <p className="scan-sub" style={{ marginTop: 22 }}>PROCESSING...</p>
              </div>
            )}

            {predState === 'done' && prediction && (
              <div className="result-filled">
                <div className="confidence-strip">
                  <div className="confidence-top">
                    <span className="mono-label">CONFIDENCE SCORE</span>
                    <span className="confidence-num">{prediction.confidence}%</span>
                  </div>
                  <div className="confidence-track">
                    <div className="confidence-fill" style={{ width: `${prediction.confidence}%` }} />
                  </div>
                </div>

                <div className="result-body">
                  <div>
                    <div className="mono-label">DETECTED CONDITION</div>
                    <div className="disease-name">{prediction.disease}</div>
                    <div className="crop-name">{prediction.crop}</div>
                  </div>

                  <div className={`severity-badge ${severityStyle(prediction.severity).cls}`}>
                    <span className="severity-dot" />
                    SEVERITY: {severityStyle(prediction.severity).label.toUpperCase()}
                  </div>

                  <div>
                    <div className="mono-label">DESCRIPTION</div>
                    <p className="body-text">{prediction.description}</p>
                  </div>

                  <div className="treatment-box">
                    <div className="mono-label">RECOMMENDED TREATMENT</div>
                    <p className="body-text">{prediction.treatment}</p>
                  </div>
                </div>

                <div className="feedback-block">
                  <div className="mono-label" style={{ marginBottom: 12 }}>IS THIS PREDICTION ACCURATE?</div>

                  {feedback === null && (
                    <div className="feedback-row">
                      <button type="button" className="btn-feedback btn-feedback-good" onClick={() => setFeedback('correct')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        Prediction is Right
                      </button>
                      <a
                        className="btn-feedback btn-feedback-bad"
                        href={`${REPORT_FORM_URL}${encodeURIComponent(prediction.raw)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setFeedback('incorrect')}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Prediction is Wrong
                      </a>
                    </div>
                  )}

                  {feedback === 'correct' && (
                    <div className="feedback-msg feedback-msg-good">✓ Thanks for confirming — this helps improve future results.</div>
                  )}
                  {feedback === 'incorrect' && (
                    <div className="feedback-msg feedback-msg-bad">Opening the report form...</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="disclaimer-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>
              Results are generated by a CNN model trained on a trimmed PlantVillage dataset.
              For real agricultural decisions, consult a qualified expert.
            </p>
          </div>
        </div>
      </main>

      {/* CONTACT */}
      <section className="contact-section">
        <div className="contact-card">
          <div className="contact-left">
            <div className="contact-heading">
              <span className="contact-emoji">📬</span>
              <h3>Get in Touch</h3>
            </div>
            <p className="contact-text">
              Have questions about Farm Connect, want to know more about the model, or found a
              misclassification? Reach out — feedback from real users helps.
            </p>
            <a className="contact-btn" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              <span>✉️</span> Get in Touch
            </a>
          </div>
          <div className="contact-right">
            <div className="contact-heading">
              <div className="notice-icon">⚠</div>
              <h3>Project Notice</h3>
            </div>
            <div className="notice-list">
              <div className="notice-item">
                <span>🌱</span>
                <p>Farm Connect is a personal academic project built as an MSBTE diploma submission.</p>
              </div>
              <div className="notice-item">
                <span>🚫</span>
                <p>This tool is strictly for personal, educational, and non-commercial use only.</p>
              </div>
              <div className="notice-item">
                <span>📋</span>
                <p>Redistribution, commercial deployment, or monetization of this software is not permitted.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-copy">© {CURRENT_YEAR} Farm Connect.</span>
          <div className="footer-right">
            <span className="footer-tag">PERSONAL USE ONLY · NOT FOR COMMERCIAL USE</span>
            <div className="footer-version">
              <span className="version-dot" /> v1.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}