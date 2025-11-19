import React, { useState } from "react";

export default function Login() {
    const [view, setView] = useState("login"); // login | register | forgot | success

    const showForm = (form) => setView(form);

    // ----------------------------------------------------------
    // Load Game
    // ----------------------------------------------------------
    const loadGame = () => {
        // Activate fullscreen game mode
        document.body.classList.add("game-active");

        const root = document.getElementById("game-root");

        if (root) {
            root.classList.add("full-screen");
            root.innerHTML = `<canvas id="game-canvas"></canvas>`;
        }

        // Load game script (Vite module)
        const script = document.createElement("script");
        script.type = "module";
        script.src = "/main.js";
        document.body.appendChild(script);
    };

    // ----------------------------------------------------------
    // Form Handlers
    // ----------------------------------------------------------
    const handleLogin = () => {
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        if (!username || !password) {
            alert("Please fill in all fields!");
            return;
        }

        alert(`Welcome back, ${username}! Starting your adventure...`);
        loadGame();
    };

    const handleRegister = () => {
        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirm = document.getElementById("register-confirm-password").value;

        if (!username || !email || !password || !confirm) {
            alert("Please complete all fields!");
            return;
        }

        if (password !== confirm) {
            alert("Passwords do not match.");
            return;
        }

        alert(`Welcome to Chiikawa Nature, ${username}!`);
        setView("login");
    };

    const handleReset = () => {
        const email = document.getElementById("forgot-email").value;

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        setView("success");
        setTimeout(() => {
            setView("login");
            const input = document.getElementById("forgot-email");
            if (input) input.value = "";
        }, 3000);
    };

    // ----------------------------------------------------------
    // Component Output
    // ----------------------------------------------------------

    return (
        <div id="main-content">

            <div className="overlay"></div>

            <div id="game-root" className="game-container">
                {/* HEADER */}
                <div className="game-header">
                    <h1 className="game-title">Chiikawa Nature</h1>
                    <p className="game-subtitle">Join the forest adventure with your friends!</p>
                </div>

                <div className="form-container">

                    {/* -------------------- LOGIN -------------------- */}
                    {view === "login" && (
                        <div id="login-form">
                            <div className="form-group">
                                <label>Username</label>
                                <input id="login-username" type="text" placeholder="Enter your username" />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input id="login-password" type="password" placeholder="Enter your password" />
                            </div>

                            <div className="forgot-password">
                                <a onClick={() => showForm("forgot")}>Forgot Password?</a>
                            </div>

                            <button className="btn btn-primary" onClick={handleLogin}>
                                Login to Adventure
                            </button>

                            <div className="form-toggle">
                                New here?{" "}
                                <a onClick={() => showForm("register")}>Create Account</a>
                            </div>
                        </div>
                    )}

                    {/* -------------------- REGISTER -------------------- */}
                    {view === "register" && (
                        <div id="register-form">
                            <div className="form-group">
                                <label>Username</label>
                                <input id="register-username" type="text" placeholder="Choose a username" />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input id="register-email" type="email" placeholder="Enter your email" />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input id="register-password" type="password" placeholder="Create a password" />
                            </div>

                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input id="register-confirm-password" type="password" placeholder="Confirm your password" />
                            </div>

                            <button className="btn btn-primary" onClick={handleRegister}>
                                Start Adventure
                            </button>

                            <div className="form-toggle">
                                Already have an account?{" "}
                                <a onClick={() => showForm("login")}>Login</a>
                            </div>
                        </div>
                    )}

                    {/* -------------------- FORGOT PASSWORD -------------------- */}
                    {view === "forgot" && (
                        <div id="forgot-password-form">
                            <div className="message">Enter your email to receive a reset link.</div>

                            <div className="form-group">
                                <label>Email</label>
                                <input id="forgot-email" type="email" placeholder="Enter your email" />
                            </div>

                            <button className="btn btn-primary" onClick={handleReset}>
                                Send Reset Link
                            </button>

                            <div className="form-toggle">
                                Remember it?{" "}
                                <a onClick={() => showForm("login")}>Back to Login</a>
                            </div>
                        </div>
                    )}

                    {/* -------------------- SUCCESS -------------------- */}
                    {view === "success" && (
                        <div className="message success">
                            Password reset link sent! Check your email.
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
