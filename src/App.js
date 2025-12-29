import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from "react-webcam";
import axios from 'axios';
import { HashRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- STİL & TEMA AYARLARI ---
const theme = {
  bg: "bg-black",
  card: "bg-dark",
  text: "text-white",
  accent: "text-success"
};

// --- 1. BİLEŞEN: ANA SAYFA ---
function HomeScreen() {
  return (
    <div className={`min-vh-100 d-flex flex-column align-items-center justify-content-center ${theme.bg} ${theme.text} p-4`}>
      <div className="text-center mb-5">
        <i className={`bi bi-activity ${theme.accent}`} style={{ fontSize: '4rem' }}></i>
        <h1 className="fw-bold mt-3 display-4">LFA AI</h1>
        <p className="text-muted">Hızlı Tanı ve Analiz Sistemi</p>
      </div>

      <div className="d-grid gap-3 w-100" style={{ maxWidth: '350px' }}>
        <Link to="/camera" className="btn btn-success btn-lg py-3 rounded-pill fw-bold shadow">
          <i className="bi bi-camera-fill me-2"></i> YENİ TEST YAP
        </Link>
        <Link to="/history" className="btn btn-secondary btn-lg py-3 rounded-pill fw-bold border-secondary">
          <i className="bi bi-clock-history me-2"></i> TEST GEÇMİŞİ
        </Link>
      </div>
      <div className="mt-5 text-muted small">v1.0.1 • Web Build</div>
    </div>
  );
}

// --- 2. BİLEŞEN: GEÇMİŞ SAYFASI ---
function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('lfa_history') || '[]');
    setHistory(saved);
  }, []);

  const clearHistory = () => {
    if(window.confirm("Tüm geçmiş silinecek?")) {
      localStorage.removeItem('lfa_history');
      setHistory([]);
    }
  };

  return (
    <div className={`min-vh-100 ${theme.bg} ${theme.text} p-3`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate('/')} className="btn btn-dark rounded-circle"><i className="bi bi-arrow-left"></i></button>
        <h4 className="m-0">Geçmiş Sonuçlar</h4>
        <button onClick={clearHistory} className="btn btn-danger btn-sm rounded-circle"><i className="bi bi-trash"></i></button>
      </div>
      {history.length === 0 ? (
        <div className="text-center text-muted mt-5">
          <i className="bi bi-inbox display-1"></i>
          <p className="mt-3">Henüz kayıtlı test yok.</p>
        </div>
      ) : (
        <div className="list-group list-group-flush rounded">
          {history.map((item, idx) => (
            <div key={idx} className="list-group-item bg-dark text-white border-secondary mb-2 rounded p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1 text-success fw-bold">{item.ratio} Ratio</h5>
                  <small className="text-muted">{item.study} - {item.hid}</small>
                </div>
                <small className="text-muted">{item.date}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- 3. BİLEŞEN: KAMERA VE ANALİZ ---
function CameraScreen() {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // --- DÜZELTME: DOĞRU IP ADRESİ ---
  const [ip, setIp] = useState("192.168.1.127"); // <--- ARTIK DOĞRU!
  
  const [study, setStudy] = useState("Proje_A");
  const [hid, setHid] = useState("N01");

  const videoConstraints = { facingMode: "environment" };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImgSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const sendToServer = async () => {
    if (!imgSrc) return;
    setLoading(true);
    try {
      // Base64'ten Blob üretme
      const resBlob = await fetch(imgSrc);
      const blob = await resBlob.blob();
      
      const formData = new FormData();
      formData.append('file', blob, "upload.jpg");
      formData.append('study', study);
      formData.append('hid', hid);
      formData.append('conc', "0");

      // İstek gönderiliyor
      console.log(`İstek atılıyor: http://${ip}:8000/analyze`);
      const res = await axios.post(`http://${ip}:8000/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      const data = res.data;
      setResult(data);

      const newRecord = {
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        ratio: data.ratio,
        c_val: data.c_val,
        t_val: data.t_val,
        study: study,
        hid: hid
      };
      const currentHistory = JSON.parse(localStorage.getItem('lfa_history') || '[]');
      localStorage.setItem('lfa_history', JSON.stringify([newRecord, ...currentHistory]));

    } catch (error) {
      console.error(error);
      alert(`HATA OLUŞTU!\n\n1. IP Doğru mu? (${ip})\n2. Sunucu açık mı?\n3. Bilgisayar Firewall kapalı mı?\n\nHata Detayı: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setImgSrc(null);
    setResult(null);
  };

  // Sonuç ekranı
  if (result) {
    return (
      <div className={`d-flex flex-column align-items-center justify-content-center min-vh-100 ${theme.bg} ${theme.text} p-3`}>
        <div className="card bg-secondary text-white shadow-lg w-100" style={{ maxWidth: '400px', borderRadius: '20px' }}>
           <div className="card-header bg-success text-center py-3 position-relative">
            <button onClick={() => navigate('/')} className="btn btn-sm btn-light bg-opacity-25 border-0 position-absolute start-0 top-0 m-3 text-white">
                <i className="bi bi-house-fill"></i>
            </button>
            <h3 className="m-0">Sonuç</h3>
          </div>
          <div className="card-body p-4 text-center">
             <h6 className="text-light opacity-75">{study} / {hid}</h6>
             <h1 className="display-3 fw-bold text-success my-4">{result.ratio}</h1>
             <div className="row g-2 mb-4">
                <div className="col-6"><div className="bg-dark p-2 rounded"><small>C</small><span className="fw-bold d-block">{result.c_val}</span></div></div>
                <div className="col-6"><div className="bg-dark p-2 rounded"><small>T</small><span className="fw-bold d-block">{result.t_val}</span></div></div>
             </div>
            <button className="btn btn-light w-100 py-3 rounded-pill fw-bold text-dark mb-2" onClick={retake}>YENİ TEST</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-vh-100 d-flex flex-column position-relative overflow-hidden">
      <div className="d-flex justify-content-between align-items-center p-3 position-absolute top-0 w-100" style={{zIndex:20, background: 'linear-gradient(rgba(0,0,0,0.8), transparent)'}}>
        <button onClick={() => navigate('/')} className="btn btn-sm btn-dark rounded-circle"><i className="bi bi-arrow-left"></i></button>
        <button className="btn btn-sm btn-dark rounded-circle" onClick={() => setShowSettings(!showSettings)}><i className="bi bi-gear-fill"></i></button>
      </div>

      {showSettings && (
         <div className="position-absolute w-100 bg-dark p-3 text-white" style={{zIndex:30, top:'60px'}}>
             <div className="row g-2">
                 <div className="col-12"><input type="text" className="form-control form-control-sm bg-secondary text-white border-0" placeholder="IP" value={ip} onChange={e=>setIp(e.target.value)} /></div>
                 <div className="col-6"><input type="text" className="form-control form-control-sm bg-secondary text-white border-0" placeholder="Çalışma" value={study} onChange={e=>setStudy(e.target.value)} /></div>
                 <div className="col-6"><input type="text" className="form-control form-control-sm bg-secondary text-white border-0" placeholder="ID" value={hid} onChange={e=>setHid(e.target.value)} /></div>
             </div>
         </div>
      )}

      <div className="flex-grow-1 position-relative d-flex align-items-center justify-content-center bg-black">
        {imgSrc ? (
            <img src={imgSrc} alt="Preview" style={{width:'100%', height:'100%', objectFit:'contain'}} />
        ) : (
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{position:'absolute', width:'100%', height:'100%', objectFit:'cover'}}
            />
        )}
      </div>

      <div className="p-4 d-flex justify-content-center align-items-center position-absolute bottom-0 w-100" style={{zIndex:20, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', minHeight:'120px'}}>
         {!imgSrc ? (
             <div className="d-flex align-items-center gap-4">
                 <button className="btn btn-dark rounded-circle border border-secondary" style={{width:'50px', height:'50px'}} onClick={() => fileInputRef.current.click()}><i className="bi bi-image"></i></button>
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} />
                 <button onClick={capture} className="btn btn-light rounded-circle border-4 border-secondary d-flex align-items-center justify-content-center shadow-lg" style={{width:'80px', height:'80px'}}>
                     <div className="bg-danger rounded-circle" style={{width:'60px', height:'60px'}}></div>
                 </button>
                 <div style={{width:'50px'}}></div>
             </div>
         ) : (
            <div className="d-flex gap-3 w-100">
                <button onClick={retake} className="btn btn-secondary flex-grow-1 py-3 rounded-pill fw-bold">TEKRAR</button>
                <button onClick={sendToServer} disabled={loading} className="btn btn-success flex-grow-1 py-3 rounded-pill fw-bold">{loading ? '...' : 'ANALİZ ET'}</button>
            </div>
         )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>
    </Router>
  );
}

export default App;