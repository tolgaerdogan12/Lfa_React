import React, { useState, useRef, useCallback } from 'react';
import Webcam from "react-webcam";
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Varsayılan Ayarlar
  const [ip, setIp] = useState("localhost"); 
  const [study, setStudy] = useState("LFA_Proje");
  const [hid, setHid] = useState("Numune_01");

  // KAMERA AYARLARI (Tam Ekran ve Yüksek Kalite İçin)
  const videoConstraints = {
    facingMode: "environment", // Arka kamera
    aspectRatio: 0.5625, // 9:16 (Dikey telefon formatı)
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setResult(null);
  };

  const sendToServer = async () => {
    if (!imgSrc) return;
    setLoading(true);
    try {
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, "analyze.jpg");
      formData.append('study', study);
      formData.append('hid', hid);
      formData.append('conc', "0");

      // Senin server.py adresin
      const res = await axios.post(`http://${ip}:8000/analyze`, formData);
      setResult(res.data);
    } catch (error) {
      alert("Hata: Sunucuya ulaşılamadı. IP adresini kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  // --- SONUÇ SAYFASI TASARIMI ---
  if (result) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white p-3">
        <div className="card bg-secondary text-white shadow-lg" style={{ width: '100%', maxWidth: '400px', borderRadius: '20px' }}>
          <div className="card-header bg-success text-center py-3" style={{ borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
            <h3 className="m-0"><i className="bi bi-check-circle-fill"></i> Analiz Tamamlandı</h3>
          </div>
          <div className="card-body p-4">
            {/* Numune Bilgisi */}
            <div className="text-center mb-4">
              <h5 className="text-light opacity-75">{study}</h5>
              <h2 className="fw-bold">{hid}</h2>
            </div>

            {/* Grafikler */}
            <div className="mb-3">
              <div className="d-flex justify-content-between">
                <span>Kontrol (C)</span>
                <span className="fw-bold">{result.c_val}</span>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar bg-info" style={{ width: `${Math.min(result.c_val / 50, 100)}%` }}></div>
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between">
                <span>Test (T)</span>
                <span className="fw-bold">{result.t_val}</span>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar bg-warning" style={{ width: `${Math.min(result.t_val / 50, 100)}%` }}></div>
              </div>
            </div>

            {/* Büyük Sonuç Kutusu */}
            <div className="bg-dark rounded p-3 text-center border border-secondary mb-4">
              <span className="d-block text-muted small">T/C ORANI (RATIO)</span>
              <h1 className="display-4 fw-bold text-success m-0">{result.ratio}</h1>
            </div>

            <button className="btn btn-outline-light w-100 py-3 rounded-pill fw-bold" onClick={retake}>
              <i className="bi bi-camera-fill me-2"></i> YENİ TEST YAP
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ANA EKRAN (KAMERA) TASARIMI ---
  return (
    <div className="bg-black min-vh-100 d-flex flex-column">
      
      {/* Üst Bar (Ayarlar) */}
      <div className="d-flex justify-content-between align-items-center p-3 text-white absolute-top" style={{ zIndex: 10 }}>
        <h5 className="m-0"><i className="bi bi-activity text-success"></i> LFA AI</h5>
        <button className="btn btn-sm btn-dark rounded-circle" onClick={() => setShowSettings(!showSettings)}>
          <i className="bi bi-gear-fill"></i>
        </button>
      </div>

      {/* Ayarlar Menüsü (Açılır/Kapanır) */}
      {showSettings && (
        <div className="bg-dark p-3 text-white border-bottom border-secondary">
          <div className="row g-2">
            <div className="col-12">
              <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" 
                placeholder="Sunucu IP (Örn: 192.168.1.35)" value={ip} onChange={e => setIp(e.target.value)} />
            </div>
            <div className="col-6">
              <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" 
                placeholder="Çalışma Adı" value={study} onChange={e => setStudy(e.target.value)} />
            </div>
            <div className="col-6">
              <input type="text" className="form-control form-control-sm bg-secondary text-white border-0" 
                placeholder="Numune ID" value={hid} onChange={e => setHid(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Kamera Alanı (Esnek Büyüme) */}
      <div className="flex-grow-1 position-relative d-flex align-items-center justify-content-center bg-black overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} // Ekrana tam oturtur
            />
            {/* Yeşil Kılavuz Kutusu */}
            <div style={{
              position: 'absolute', width: '60%', height: '30%',
              border: '2px solid #00ff00', borderRadius: '10px',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
              pointerEvents: 'none'
            }}>
              {/* Köşe Süsleri */}
              <div className="position-absolute top-0 start-0 border-top border-start border-3 border-white" style={{width: '20px', height: '20px'}}></div>
              <div className="position-absolute top-0 end-0 border-top border-end border-3 border-white" style={{width: '20px', height: '20px'}}></div>
              <div className="position-absolute bottom-0 start-0 border-bottom border-start border-3 border-white" style={{width: '20px', height: '20px'}}></div>
              <div className="position-absolute bottom-0 end-0 border-bottom border-end border-3 border-white" style={{width: '20px', height: '20px'}}></div>
            </div>
            <div className="position-absolute text-white bg-dark bg-opacity-50 px-3 py-1 rounded-pill bottom-0 mb-5">
              <small>Kaseti Çerçeveye Hizala</small>
            </div>
          </>
        )}
      </div>

      {/* Alt Kontrol Barı */}
      <div className="p-4 bg-black d-flex justify-content-center align-items-center" style={{ minHeight: '120px' }}>
        {!imgSrc ? (
          // Çekme Butonu
          <button onClick={capture} className="btn btn-light rounded-circle border-4 border-secondary d-flex align-items-center justify-content-center" 
            style={{ width: '80px', height: '80px', boxShadow: '0 0 15px rgba(255,255,255,0.5)' }}>
            <div className="bg-danger rounded-circle" style={{ width: '60px', height: '60px' }}></div>
          </button>
        ) : (
          // Onay Butonları
          <div className="d-flex gap-3 w-100">
             <button onClick={retake} className="btn btn-secondary flex-grow-1 py-3 rounded-pill fw-bold">
              <i className="bi bi-arrow-counterclockwise"></i> TEKRAR
            </button>
            <button onClick={sendToServer} disabled={loading} className="btn btn-success flex-grow-1 py-3 rounded-pill fw-bold shadow">
              {loading ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span> İŞLENİYOR...</span>
              ) : (
                <span><i className="bi bi-send-fill me-2"></i> ANALİZ ET</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;