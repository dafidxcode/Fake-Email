import React, { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";

const Home = () => {
    const [email, setEmail] = useState(null);
    const [inbox, setInbox] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [timer, setTimer] = useState(300);

    // Load email and timer from localStorage on first render
    useEffect(() => {
        const savedEmail = localStorage.getItem("email");
        const expiryTime = localStorage.getItem("expiryTime");

        if (savedEmail && expiryTime) {
            const timeLeft = Math.floor((expiryTime - Date.now()) / 1000);
            if (timeLeft > 0) {
                setEmail(savedEmail);
                setTimer(timeLeft);
            } else {
                localStorage.removeItem("email");
                localStorage.removeItem("expiryTime");
            }
        }
    }, []);

    // Save email and expiry time to localStorage when email is generated
    useEffect(() => {
        if (email) {
            const expiryTime = Date.now() + timer * 1000;
            localStorage.setItem("email", email);
            localStorage.setItem("expiryTime", expiryTime);
        }
    }, [email, timer]);

    // Generate email
    const generateEmail = async () => {
        try {
            const response = await fetch("https://api.paxsenix.biz.id/tempmail/create", {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });

            if (response.headers.get("content-type")?.includes("application/json")) {
                const data = await response.json();
                if (data.ok) {
                    setEmail(data.email);
                    setInbox([]);
                    setTimer(300); // Reset timer
                    localStorage.removeItem("email"); // Clear saved email
                    localStorage.removeItem("expiryTime");
                } else {
                    alert(`Error: ${data.message}`);
                }
            } else {
                throw new Error("Response is not JSON");
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Fetch inbox
    const fetchInbox = async () => {
        if (!email) return;

        try {
            const response = await fetch(
                `https://api.paxsenix.biz.id/tempmail/inbox?email=${encodeURIComponent(email)}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (response.headers.get("content-type")?.includes("application/json")) {
                const data = await response.json();
                if (data.ok) {
                    setInbox(data.items || []);
                } else {
                    alert(`Error: ${data.message}`);
                }
            } else {
                throw new Error("Response is not JSON");
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // View message details
    const viewMessage = async (id) => {
        try {
            const response = await fetch(
                `https://api.paxsenix.biz.id/tempmail/body?email=${encodeURIComponent(email)}&id=${id}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (response.headers.get("content-type")?.includes("application/json")) {
                const data = await response.json();
                if (data.ok) {
                    setSelectedMessage(data);
                } else {
                    alert(`Error: ${data.message}`);
                }
            } else {
                throw new Error("Response is not JSON");
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Countdown timer
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        } else {
            setEmail(null);
            localStorage.removeItem("email");
            localStorage.removeItem("expiryTime");
        }
    }, [timer]);

    // Auto-fetch inbox every 10 seconds
    useEffect(() => {
        if (email) {
            const interval = setInterval(fetchInbox, 10000);
            return () => clearInterval(interval);
        }
    }, [email]);

    return (
        <div className={styles.container}>
            <h1>Temporary Email Generator</h1>
            {!email ? (
                <button onClick={generateEmail} className={styles.button}>
                    Generate Email
                </button>
            ) : (
                <>
                    <p className={styles.emailText}>
                        Your Temporary Email: <span className={styles.email}>{email}</span>
                    </p>
                    <p className={styles.timerText}>
                        Expires in: {Math.floor(timer / 60)}:{timer % 60 < 10 ? `0${timer % 60}` : timer % 60}
                    </p>
                    <button onClick={generateEmail} className={styles.button}>
                        Generate New Email
                    </button>
                    <h2>Inbox</h2>
                    <ul className={styles.inboxList}>
                        {inbox.map((item) => (
                            <li key={item.id} className={styles.inboxItem}>
                                <p>
                                    <strong>Subject:</strong> {item.subject}
                                </p>
                                <p>
                                    <strong>From:</strong> {item.from}
                                </p>
                                <p>
                                    <strong>Time:</strong> {item.time}
                                </p>
                                <button onClick={() => viewMessage(item.id)} className={styles.viewButton}>
                                    View Message
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {selectedMessage && (
                <div className={styles.messageDetail}>
                    <h3>Message Details</h3>
                    <div
                        className={styles.messageContent}
                        dangerouslySetInnerHTML={{ __html: selectedMessage.html }}
                    ></div>
                    <button onClick={() => setSelectedMessage(null)} className={styles.closeButton}>
                        Close
                    </button>
                </div>
            )}
            <footer className={styles.footer}>
            <p>
                Author by <a href="https://github.com/dafidxcode" target="_blank" rel="noopener noreferrer" className={styles.authorLink}>DieckyAwsm</a>
            </p>
        </footer>
        </div>
    );
};

export default Home;
