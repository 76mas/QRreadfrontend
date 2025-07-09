import React, { useRef, useEffect, useState } from "react";
import { FaCamera, FaPlayCircle, FaStopCircle } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { MdMarkEmailRead } from "react-icons/md";
import Footer from "./Footer";

import axios from "axios";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import "./App.css";

function QRScanner() {
  const webcamRef = useRef(null);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");
  const [count, setCount] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const captureAndScan = () => {
    if (!webcamRef.current || loading) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data && !scanned) {
        setScanned(true);
        setEmail(code.data);
        checkIn(code.data).finally(() => {
            setTimeout(() => {
            setScanned(false);
            setEmail("");
            setResult("");
          }, 3000);
        });
      }
    };
  };

  const checkIn = async (email) => {
    console.log("📧 محاولة إرسال الإيميل:", email);
    setLoading(true);

    try {
      const res = await axios.post(
        "https://223697be-dba2-4e1a-967b-05417df13393-00-1imqs6jxkgayy.pike.replit.dev/check-in",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (res.data.guest?.name) {
        setResult(`✅ تم تسجيل الحضور: ${res.data.guest.name}`);
      } else {
        setResult(res.data.message);
      }

      if (res.data.count !== undefined) {
        setCount(res.data.count);
      } else {
        await fetchCount();
      }
    } catch (error) {
      console.error("❌ خطأ في الإرسال:", error);

      if (error.response) {
        setResult(error.response.data.message || "❌ خطأ من السيرفر");
      } else if (error.request) {
        setResult("❌ لا يمكن الاتصال بالسيرفر - تأكد من تشغيل السيرفر");
      } else {
        setResult("❌ خطأ في الإرسال");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async () => {
    try {
      const res = await axios.get(
        "https://223697be-dba2-4e1a-967b-05417df13393-00-1imqs6jxkgayy.pike.replit.dev/count",
        {
          timeout: 5000,
        }
      );
      setCount(res.data.count);
    } catch (err) {
      console.error("خطأ في جلب العدد:", err);
    }
  };

  useEffect(() => {
    fetchCount();

    if (cameraOn) {
      intervalRef.current = setInterval(() => {
        captureAndScan();
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [cameraOn, scanned, loading]);

  // ************************************

  return (
    <div className="qrreder">
      <img className="IQGC" src="iqgc.png" />
      <img className="LOGOI" src="finallogo.png" />
      <div className="qr-scanner-container">
        <div className="qr-scanner-card">
          <div className="header">
            <h1 className="title">
              <span className="icon">
                <FaCamera />
              </span>
              Read QR
            </h1>
          </div>

          <div className="controls">
            <button
              className={`main-btn ${cameraOn ? "stop-btn" : "start-btn"}`}
              onClick={() => {
                setScanned(false);
                setResult("");
                setEmail("");
                setCameraOn(!cameraOn);
              }}
              disabled={loading}
            >
              <span className="btn-icon">
                {cameraOn ? <FaStopCircle /> : <FaPlayCircle />}
              </span>
              {cameraOn ? "Stop camera" : "turn on the camera"}
            </button>
          </div>

          {cameraOn && (
            <div className="camera-container">
              <div className="camera-wrapper">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/png"
                  videoConstraints={{ facingMode: "environment" }}
                  className="camera"
                />
                <div className="scanning-overlay">
                  <div className="scanning-frame"></div>
                </div>
              </div>
            </div>
          )}

          <div className="info-section">
            <div className="email-display">
              <span className="label">
                <MdMarkEmailRead style={{ color: "#667eea " }} /> Scanned mail:
              </span>
              <span className="value">{email || "Not scanned yet"}</span>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <span>Sending...</span>
              </div>
            )}

            {result && (
              <div
                className={`result ${
                  result.includes("✅") ? "success" : "error"
                }`}
              >
                {result}
              </div>
            )}

            <div className="count-section">
              <div className="count-card">
                <span className="count-icon">
                  <IoIosPeople />
                </span>
                <div className="count-info">
                  <div className="count-value">{count}</div>{" "}
                  <div className="count-label">Number of attendees</div>
                </div>
              </div>
            </div>

            {result.includes("❌") && (
              <button
                className="retry-btn"
                onClick={() => email && checkIn(email)}
                disabled={loading || !email}
              >
                <span className="btn-icon">🔄</span>
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default QRScanner;
