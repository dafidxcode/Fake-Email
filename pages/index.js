import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css'; 

export default function Home() {
  const [tempEmail, setTempEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [messageBody, setMessageBody] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null); // Waktu kedaluwarsa

  // Fungsi untuk menyimpan data email ke localStorage
  const saveToLocalStorage = (email, expiry) => {
    localStorage.setItem('tempEmail', email);
    localStorage.setItem('expiryTime', expiry.toString());
  };

  // Fungsi untuk memuat data email dari localStorage
  const loadFromLocalStorage = () => {
    const savedEmail = localStorage.getItem('tempEmail');
    const savedExpiryTime = localStorage.getItem('expiryTime');
    if (savedEmail && savedExpiryTime) {
      const currentTime = Date.now();
      if (currentTime < parseInt(savedExpiryTime, 10)) {
        setTempEmail(savedEmail);
        setExpiryTime(parseInt(savedExpiryTime, 10));
      } else {
        // Hapus email jika sudah kadaluarsa
        localStorage.removeItem('tempEmail');
        localStorage.removeItem('expiryTime');
      }
    }
  };

  // Fungsi untuk membuat email baru
  const generateEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email');
      const data = await res.json();

      if (res.ok) {
        setTempEmail(data.email);
        setInbox([]);
        setMessageBody(null); // Reset detail pesan
        const expiry = Date.now() + 300000; // Waktu kadaluarsa 5 menit
        setExpiryTime(expiry);
        saveToLocalStorage(data.email, expiry); // Simpan ke localStorage
      } else {
        alert('Failed to generate email: ' + data.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const fetchInbox = async () => {
    if (!tempEmail) return;
    setLoading(true);
    try {
      const encodedEmail = encodeURIComponent(tempEmail);
      const res = await fetch(`/api/inbox?email=${encodedEmail}`);
      const data = await res.json();

      if (res.ok) {
        setInbox(data.items || []);
      } else {
        alert('Failed to fetch inbox: ' + data.message);
      }
    } catch (error) {
      alert('Error fetching inbox: ' + error.message);
    }
    setLoading(false);
  };

  const fetchMessageBody = async (id) => {
    setLoading(true);
    try {
      const encodedEmail = encodeURIComponent(tempEmail);
      const res = await fetch(`/api/message?email=${encodedEmail}&id=${id}`);
      const data = await res.json();

      if (res.ok) {
        setMessageBody(data.html); // Gunakan data HTML untuk menampilkan isi pesan
      } else {
        alert('Failed to fetch message body: ' + data.message);
      }
    } catch (error) {
      alert('Error fetching message body: ' + error.message);
    }
    setLoading(false);
  };

  // Jalankan saat komponen pertama kali dimuat
  useEffect(() => {
    loadFromLocalStorage(); // Muat email dari localStorage saat halaman dimuat
  }, []);

  // Timer untuk mengecek waktu kadaluarsa secara periodik
  useEffect(() => {
    if (expiryTime) {
      const interval = setInterval(() => {
        if (Date.now() >= expiryTime) {
          setTempEmail('');
          setInbox([]);
          setMessageBody(null);
          localStorage.removeItem('tempEmail');
          localStorage.removeItem('expiryTime');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expiryTime]);

  useEffect(() => {
    if (tempEmail) {
      const interval = setInterval(fetchInbox, 15000); // Refresh inbox setiap 15 detik
      return () => clearInterval(interval);
    }
  }, [tempEmail]);

  return (
    <div className={styles.container}>
      <h1>Temporary Email Generator</h1>
      <button
        onClick={generateEmail}
        className={styles.button}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Email'}
      </button>

      {tempEmail && (
        <div>
          <p className={styles.emailText}>
            Your Temporary Email: <span className={styles.email}>{tempEmail}</span>
          </p>
          <p className={styles.timerText}>
            This email will expire in{' '}
            {Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000))} seconds.
          </p>
          <button onClick={fetchInbox} className={styles.button}>
            Refresh Inbox
          </button>
          <ul className={styles.inboxList}>
            {inbox.length > 0 ? (
              inbox.map((item) => (
                <li key={item.id} className={styles.inboxItem}>
                  <strong>From:</strong> {item.from} <br />
                  <strong>Subject:</strong> {item.subject} <br />
                  <strong>Time:</strong> {item.time} <br />
                  <button
                    onClick={() => {
                      setSelectedMessage(item);
                      fetchMessageBody(item.id);
                    }}
                    className={styles.viewButton}
                  >
                    View Message
                  </button>
                </li>
              ))
            ) : (
              <p>No messages yet.</p>
            )}
          </ul>

          {selectedMessage && messageBody && (
            <div className={styles.messageDetail}>
              <h2>Message Details</h2>
              <p>
                <strong>From:</strong> {selectedMessage.from}
              </p>
              <p>
                <strong>Subject:</strong> {selectedMessage.subject}
              </p>
              <div
                className={styles.messageContent}
                dangerouslySetInnerHTML={{ __html: messageBody }}
              ></div>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setMessageBody(null);
                }}
                className={styles.closeButton}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
