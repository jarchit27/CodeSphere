import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../../components/Inputs/PasswordInput';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import {Code } from 'lucide-react';

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter password.");
      return;
    }
    setError("");
    try {
      const { data } = await axiosInstance.post("/login", { email, password });
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Code className="w-10 h-10 text-cyan-400 mr-2" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                CodeSphere
              </h1>
            </div>
            <p className="text-gray-300 text-sm">Welcome back to your coding universe</p>
          </div>

          {/* Login Card */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-8 relative">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm -z-10"></div>
            
            <form onSubmit={handleLogin}>
              <h4 className="text-2xl font-semibold text-white text-center mb-6">Login</h4>

              <input
                type="text"
                placeholder="Email"
                className="w-full px-4 py-3 mb-4 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="mb-4">
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs pt-2 mb-2">{error}</p>
              )}

              <button 
                type="submit" 
                className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white 
                font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 
                focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Login
              </button>

              <p className="text-sm text-center mt-6 text-gray-300">
                Not registered yet?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-cyan-400 underline hover:text-cyan-300 transition-colors duration-200"
                >
                  Create an Account
                </Link>
              </p>
            </form>
          </div>

          {/* Footer */}
          {/* <div className="text-center mt-8 text-gray-400 text-sm">
            <p>© 2025 CodeSphere. Elevate your coding journey.</p>
          </div> */}
        </div>
      </div>
    </div>

  );
};

export default Login;
