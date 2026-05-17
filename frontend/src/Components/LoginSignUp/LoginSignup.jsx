import { useState } from 'react';
import './LoginSignUp.css';

function LoginSignUp() {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [error, setError] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [action,setAction]=useState("Sign Up");

    
    const calculateAge = (birthDateString) => {
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    
    const isUserAdult = (birthDateString) => {
        if (!birthDateString) return false;
        const age = calculateAge(birthDateString);
        return age >= 18;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        
        if (!userId.trim()) {
            setError("Please enter your User ID");
            return;
        }

        
        if (!password.trim()) {
            setError("Please enter your password");
            return;
        }

        if (!birthDate) {
            setError("Please enter your birth date");
            return;
        }

        
        if (!isUserAdult(birthDate)) {
            const age = calculateAge(birthDate);
            setError(`Access Denied! You are ${age} years old. You must be 18 or older to login.`);
            return;
        }

        
        setIsLoggedIn(true);
        setError('');
    };

    if (isLoggedIn) {
        return (
            <div className="success-container">
                <h2> Welcome, {userId}!</h2>
                <p>You have successfully logged in to the online voting system.</p>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Online Voting System</h2>
                <h3 className="login-subtitle">{action}</h3>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">
                            User ID:
                            <input
                                type="text" 
                                placeholder="Enter your ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
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
                        <small className="helper-text">Required: Must be 18 years or older</small>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    <div className="submit-container">
                    <div className={action=="Sign Up"? "submit gray":"submit"} onClick={() =>{setAction("Login")}}>
                        Login
                    </div>
                    <div type="submit" className={action=="Login"? "submit gray":"submit"} onClick={() =>{setAction("Sign Up")}}>
                        Sign Up
                    </div>
                    </div>
                </form>

               
            </div>
        </div>
    );
}

export default LoginSignUp;
