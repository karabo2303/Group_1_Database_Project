import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignUp.css';

const API_URL = 'http://localhost:3000/api';

function LoginSignUp() {
    const navigate = useNavigate();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [action, setAction]     = useState('Login');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const calculateAge = (dateStr) => {
        const today = new Date();
        const dob   = new Date(dateStr);
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age;
    };

    const handleLogin = async () => {
        setError('');
        if (!email.trim())    { setError('Please enter your email');    return; }
        if (!password.trim()) { setError('Please enter your password'); return; }

        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/users/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid email or password');
                return;
            }

            localStorage.setItem('role', data.role);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.role === 'Administrator' || data.role === 'ElectionOfficial') {
                navigate('/admin');
            } else {
                navigate('/voters');
            }

        } catch {
            setError('Cannot connect to server. Make sure the backend is running on port 3000.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setError('');
        if (!fullName.trim())  { setError('Please enter your full name');     return; }
        if (!email.trim())     { setError('Please enter your email');          return; }
        if (!password.trim())  { setError('Please enter a password');          return; }
        if (!birthDate)        { setError('Please enter your date of birth');  return; }

        const age = calculateAge(birthDate);
        if (age < 18) {
            setError(`Access Denied! You are ${age} years old. You must be 18 or older.`);
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/users/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ fullName, email, password, birthDate }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Registration failed. Please try again.');
                return;
            }

            alert('Registration successful! An admin will approve your account. Please log in once approved.');
            setAction('Login');
            setError('');

        } catch {
            setError('Cannot connect to server. Make sure the backend is running on port 3000.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        action === 'Login' ? handleLogin() : handleSignUp();
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Online Voting System</h2>
                <h3 className="login-subtitle">{action}</h3>

                <form onSubmit={handleSubmit} className="login-form">

                    {action === 'Sign Up' && (
                        <div className="form-group">
                            <label className="form-label">
                                Full Name:
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="form-input"
                                />
                            </label>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            Email:
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Password:
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                            />
                        </label>
                    </div>

                    {action === 'Sign Up' && (
                        <div className="form-group">
                            <label className="form-label">
                                Date of Birth:
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="form-input"
                                />
                            </label>
                            <small className="helper-text">Must be 18 years or older to register</small>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="submit"
                        disabled={loading}
                        style={{ width: '100%', marginBottom: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Please wait...' : action}
                    </button>

                    <div className="submit-container">
                        <div
                            className={action === 'Login' ? 'submit gray' : 'submit'}
                            onClick={() => { setAction('Login'); setError(''); }}
                        >
                            Login
                        </div>
                        <div
                            className={action === 'Sign Up' ? 'submit gray' : 'submit'}
                            onClick={() => { setAction('Sign Up'); setError(''); }}
                        >
                            Sign Up
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default LoginSignUp;
