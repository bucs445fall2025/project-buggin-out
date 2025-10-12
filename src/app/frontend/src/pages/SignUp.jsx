import "../styles/SignUp.css";

export default function SignUp() {
    return (
        <div className="signup-container">
            <form className="signup-form">
                <h2 className="form-title">Create Account</h2>
                <div className="form-group">
                    <label htmlFor="username"></label>
                    <input type="text" 
                    name="username" 
                    placeholder="Username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email"></label>
                    <input type="text" 
                    name="email" 
                    placeholder="Email"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password"></label>
                    <input type="text" 
                        name="password" 
                        placeholder="Password"
                        />
                </div>
                <div className="form-group">
                    <label htmlFor="confirm-password"></label>
                    <input type="text" 
                    name="confirm-password" 
                    placeholder="Confirm Password"
                    />
                </div>
                <button className="register-button" type="submit">Register</button>
            </form>
        </div>
    );
}

