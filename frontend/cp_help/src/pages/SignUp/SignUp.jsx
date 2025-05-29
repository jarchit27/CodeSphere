import React, { useState } from 'react';
import PasswordInput from '../../components/Inputs/PasswordInput';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import {Code, User, Mail, Trophy } from 'lucide-react';

const SignUp = () => {
  const [name, setName] = useState("");
  const [codeforcesHandle, setCodeforcesHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("Please enter your name.");
      return;
    }
    if (!codeforcesHandle) {
      setError("Please enter your Codeforces handle.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter the password.");
      return;
    }
    setError("");

    try {
      const response = await axiosInstance.post("/create-account", {
        fullname: name,
        codeforcesHandle,
        email,
        password,
      });

      if (response.data?.error) {
        setError(response.data.message);
        return;
      }
      if (response.data?.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "An unexpected error occurred."
      );
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
            <p className="text-gray-300 text-sm">Join the coding universe</p>
          </div>

          {/* SignUp Card */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-8 relative">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm -z-10"></div>
            
            <div>
              <h4 className="text-2xl font-semibold text-white text-center mb-6">Sign Up</h4>

              {/* Name Input */}
              <div className="relative mb-4">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Codeforces Handle Input */}
              <div className="relative mb-4">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Codeforces Handle"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  value={codeforcesHandle}
                  onChange={(e) => setCodeforcesHandle(e.target.value)}
                />
              </div>

              {/* Email Input */}
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div className="mb-4">
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* Sign Up Button */}
              <button 
                type="button"
                onClick={handleSignUp}
                className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Create Account
              </button>

              {/* Login Link */}
              <p className="text-sm text-center mt-4 text-gray-300">
                Already have an account?{" "}
                <Link to="/login" 
                  className="font-medium text-cyan-400 underline hover:text-cyan-300 transition-colors duration-200"

                >
                 Login
                </Link>

              </p>
            </div>
          </div>

          {/* Footer
          <div className="text-center mt-8 text-gray-400 text-sm">
            <p>© 2025 CodeSphere. Elevate your coding journey.</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
