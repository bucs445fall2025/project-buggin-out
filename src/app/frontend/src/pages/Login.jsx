import "../styles/Login.css";

export default function Login() {
    return (
        <div className="login-container">
            <form className="login-form">
                <h2 className="form-title">Login</h2>
                <div className="form-group">
                    <label htmlFor="username"></label>
                    <input type="text" 
                    name="username" 
                    placeholder="Username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password"></label>
                    <input type="text" 
                        name="password" 
                        placeholder="Password"
                        />
                </div>
                <button className="login-button" type="submit">Login</button>
            </form>
        </div>
    );
}

