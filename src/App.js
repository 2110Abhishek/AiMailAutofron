import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [pdf, setPdf] = useState(null);
  const [template, setTemplate] = useState(null);
  const [resume, setResume] = useState(null);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [position, setPosition] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const isAppPassword = (password) => {
    const cleaned = password.replace(/\s/g, '');
    return cleaned.length === 16;
  };

  const handleSubmit = async () => {
    if (!pdf || !template || !resume || !senderEmail || !senderPassword || !position) {
      alert("Please fill all fields and upload all files.");
      return;
    }

    if (!isAppPassword(senderPassword)) {
      alert("❗ It looks like you've entered a normal Gmail password.\n\n👉 Please use a 16-digit App Password.\nIf you don’t know how to get it, click the ℹ️ icon beside the password field.");
      return;
    }

    setLoading(true);
    setMessages([]);

    const formData = new FormData();
    formData.append('pdf', pdf);
    formData.append('template', template);
    formData.append('resume', resume);
    formData.append('senderEmail', senderEmail);
    formData.append('senderPassword', senderPassword.replace(/\s/g, ''));
    formData.append('position', position);

    try {
      await axios.post('https://aimailautoback.onrender.com/upload', formData);

      const es = new EventSource(`https://aimailautoback.onrender.com/send-emails?senderEmail=${encodeURIComponent(senderEmail)}`);
      setEventSource(es);

      es.onmessage = (e) => {
        if (e.data === "DONE" || e.data.includes("Stopping")) {
          es.close();
          setEventSource(null);
          setLoading(false);
        }
        setMessages((prev) => [...prev, e.data]);
      };
    } catch (err) {
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  const stopSending = async () => {
    if (eventSource) {
      await axios.get(`http://localhost:5000/stop-sending?senderEmail=${encodeURIComponent(senderEmail)}`);
      eventSource.close();
      setEventSource(null);
      setLoading(false);
      setMessages((prev) => [...prev, "Sending stopped by user."]);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Email Automation Tool</h2>
        <p className="description">Send personalized emails to HRs with your resume and template.</p>

        <input
          type="email"
          placeholder="Your Gmail"
          onChange={(e) => setSenderEmail(e.target.value)}
        />

        <div className="password-field">
          <input
            type="password"
            placeholder="Your Gmail App Password"
            onChange={(e) => setSenderPassword(e.target.value)}
          />
          <span className="info-btn" onClick={() => setShowGuide(true)}>ℹ️</span>
        </div>

        <label className="file-label">
          Job Position
          <span className="info-small" title="Select or type your job role. Common titles are listed below."> 🧠</span>
        </label>
        <input
          type="text"
          list="job-titles"
          placeholder="Job Position"
          className="position-input"
          onChange={(e) => setPosition(e.target.value)}
        />
        <datalist id="job-titles">
          <option value="Software Engineer" />
          <option value="Frontend Developer" />
          <option value="Backend Developer" />
          <option value="Full Stack Developer" />
          <option value="React Developer" />
          <option value="Java Developer" />
          <option value="Python Developer" />
          <option value="Data Analyst" />
          <option value="Data Scientist" />
          <option value="Machine Learning Engineer" />
          <option value="DevOps Engineer" />
          <option value="QA Engineer" />
          <option value="Mobile App Developer" />
          <option value="UI/UX Designer" />
          <option value="Product Manager" />
          <option value="Cloud Engineer" />
        </datalist>

        <label className="file-label">HR Contacts PDF</label>
        <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />

        <label className="file-label">Email Template</label>
        <input type="file" accept=".txt,.html" onChange={(e) => setTemplate(e.target.files[0])} />

        <label className="file-label">Resume PDF</label>
        <input type="file" accept="application/pdf" onChange={(e) => setResume(e.target.files[0])} />

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending..." : "Upload and Send"}
        </button>

        {loading && (
          <button onClick={stopSending} className="stop-btn">
            Stop Sending
          </button>
        )}

        {messages.length > 0 && (
          <div className="message-box">
            <h4>Status:</h4>
            <ul>
              {messages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>How to Get a Gmail App Password</h3>
            <ol>
              <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">Google Account Security</a></li>
              <li>Enable <strong>2-Step Verification</strong> if not already enabled</li>
              <li>Scroll down to <strong>App passwords</strong></li>
              <li>Select app: <em>Mail</em> and device: <em>Other (give a name)</em></li>
              <li>Click <strong>Generate</strong></li>
              <li>Copy the 16-character password shown and paste it here</li>
              <li><strong>Note:</strong> This is required for sending emails via Gmail securely</li>
            </ol>
            <button onClick={() => setShowGuide(false)} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
