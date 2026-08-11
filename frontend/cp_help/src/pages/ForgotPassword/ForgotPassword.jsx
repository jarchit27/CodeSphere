import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { Code, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    
    setError("");
    setSubmitting(true);
    
    try {
      const response = await authService.forgotPassword({ email });
      if (response.data?.error) {
        setError(response.data.message);
        return;
      }
      
      // Save the current time so the ResetPassword countdown knows when it started
      localStorage.setItem("lastResetOtpTime", Date.now().toString());
      
      // Navigate to Reset Password page
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden text-slate-200">
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Code className="w-10 h-10 text-cyan-400 mr-2" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Reset Password
              </h1>
            </div>
            <p className="text-gray-300 text-sm">
              Enter your email to receive a reset code
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm -z-10"></div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? "Sending OTP..." : "Send Reset Link"}
              </button>

              <p className="text-center mt-6">
                <Link
                  to="/login"
                  className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                >
                  Back to Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
