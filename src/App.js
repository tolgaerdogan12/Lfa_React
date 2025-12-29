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

  const [ip, setIp] = useState("192.168.1.36"); // Senin IP'yi buraya varsayılan yazabilirsin
  const [study, setStudy] = useState("LFA_Proje");
  const [hid, setHid] = useState("Numune_01");

  // --- EKRAN AYARLARI (Can Alıcı Kısım) ---
  const videoConstraints = {
    facingMode: "environment", // Arka Kamera
    // Genişlik ve yükseklik ayarını serbest bırakıyoruz ki CSS ile ezelim
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
      // Blob formatına çevir
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, "analyze.jpg");
      formData.append('study', study);
      formData.append('hid', hid);
      formData.append('conc', "0");

      // Sunucuya Yolla
      const res = await axios.post(`http://${ip}:8000/analyze`, formData);
      setResult(res.data);
    } catch (error) {
      alert("Hata: Sunucuya ulaşılamadı. IP adresini ve server.py'ın açık olduğunu kontrol et.\nDetay: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SONUÇ EKRANI ---
  if (result) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white p-3">
        <div className="card bg-secondary text-white shadow-lg w-100" style={{ maxWidth: '400px', borderRadius: '20px' }}>
          <div className="card-header bg-success text-center py-3" style={{ borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
            <h3 className="m-0"><i className="bi bi-check-circle-fill"></i> Analiz Tamamlandı</h3>
          </div>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h5 className="text-light opacity-75">{study}</h5>
              <h2 className="fw-bold">{hid}</h2>
            </div>
            {/* Sonuç Barları */}
            <div className="mb-3">
              <div className="d-flex justify-content-between"><span>Kontrol (C)</span><span className="fw-bold">{result.c_val}</span></div>
              <div className="progress" style={{ height: '10px' }}><div className="progress-bar bg-info" style={{ width: `${Math.min(result.c_val, 100)}%` }}></div></div>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between"><span>Test (T)</span><span className="fw-bold">{result.t_val}</span></div>
              <div className="progress" style={{ height: '10px' }}><div className="progress-bar bg-warning" style={{ width: `${Math.min(result.t_val, 100)}%` }}></div></div>
            </div>
            {/* Ratio Kutusu */}
            <div className="bg-dark rounded p-3 text-center border border-secondary mb-4">
              <span className="d-block text-muted small">T/C ORANI</span>
              <h1 className="display-4 fw-bold text-success m-0">{result.ratio}</h1>
            </div>
            <button className="btn btn-outline-light w-100 py-3 rounded-pill fw-bold" onClick={retake}>
              <i className="bi bi-camera-fill me-2"></i> YENİ TEST
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- KAMERA EKRANI ---
  return (
    <div className="bg-black min-vh-100 d-flex flex-column position-relative overflow-hidden">
      
      {/* Üst Bar */}
      <div className="d-flex justify-content-between align-items-center p-3 text-white position-absolute top-0 start-0 w-100" style={{ zIndex: 20, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <h5 className="m-0"><i className="bi bi-activity text-success"></i> LFA AI</h5>
        <button className="btn btn-sm btn-dark rounded-circle border border-secondary" onClick={() => setShowSettings(!showSettings)}>
          <i className="bi bi-gear-fill"></i>
        </button>
      </div>

      {/* Ayarlar Menüsü */}
      {showSettings && (
        <div className="position-absolute top-0 start-0 w-100 bg-dark p-3 text-white border-bottom border-secondary" style={{ zIndex: 30, marginTop: '60px' }}>
          <div className="row g-2">
            <div className="col-12"><input type="text" className="form-control form-control-sm bg-secondary text-white border-0" placeholder="Sunucu IP" value={ip} onChange={e => setIp(e.target.value)} /></div>
            <div className="col-6"><input type="text" className="form-control form-control-sm bg-secondary text-white border-0" placeholder="Çalışma Adı" value={study} onChange={e => setStudy(e.target.value)} /></div>
            <div className="col-6"><input type="text" className="form-control form-control-sm bg-secondary text-white border-0" placeholder="Numune ID" value={hid} onChange={e => setHid(e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* KAMERA ALANI (Tam Ekran Zorlama) */}
      <div className="flex-grow-1 position-relative d-flex align-items-center justify-content-center bg-black">
        {imgSrc ? (
          <img src={imgSrc} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            forceScreenshotSourceSize={true}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover', // Ekrana sığdırma, doldur
            }}
          />
        )}
        
        {/* Yeşil Hedef Kutusu */}
        {!imgSrc && (
          <div style={{
            position: 'absolute', width: '70%', height: '25%',
            border: '3px solid #00ff00', borderRadius: '15px',
            boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
             <div className="position-absolute start-50 translate-middle-x bg-black bg-opacity-50 px-3 py-1 rounded text-white small" style={{bottom: '-40px', whiteSpace: 'nowrap'}}>
               Kaseti Çerçeveye Hizala
             </div>
          </div>
        )}
      </div>

      {/* Alt Kontrol Barı */}
      <div className="position-absolute bottom-0 start-0 w-100 p-4 d-flex justify-content-center align-items-center" 
           style={{ zIndex: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', minHeight: '150px' }}>
        {!imgSrc ? (
          <button onClick={capture} className="btn btn-light rounded-circle border-4 border-secondary shadow-lg d-flex align-items-center justify-content-center" 
            style={{ width: '80px', height: '80px' }}>
            <div className="bg-danger rounded-circle" style={{ width: '64px', height: '64px' }}></div>
          </button>
        ) : (
          <div className="d-flex gap-3 w-100 px-3">
             <button onClick={retake} className="btn btn-dark bg-opacity-75 flex-grow-1 py-3 rounded-pill fw-bold border border-secondary">
              <i className="bi bi-arrow-counterclockwise"></i> TEKRAR
            </button>
            <button onClick={sendToServer} disabled={loading} className="btn btn-success flex-grow-1 py-3 rounded-pill fw-bold shadow">
              {loading ? <span className="spinner-border spinner-border-sm"></span> : <span><i className="bi bi-send-fill me-2"></i> ANALİZ</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;