import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Code } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  const { setUser } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(() => {
    const lastOtpTime = localStorage.getItem("lastOtpTime");
    if (lastOtpTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastOtpTime, 10)) / 1000);
      if (elapsed < 60) {
        return 60 - elapsed;
      }
      return 0; // Cooldown has expired, stay at 0
    }
    return 0; // Default to 0 if there's no timestamp
  });

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      
      const response = await authService.verifyEmail({ email, otp });
      
      if (response.data?.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        localStorage.removeItem("lastOtpTime"); // Clean up
        setUser(response.data.user); // Save roundtrip instead of fetchUser()
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      
      await authService.resendOtp({ email });
      setSuccessMsg("A new OTP has been sent to your email!");
      localStorage.setItem("lastOtpTime", Date.now().toString());
      setCountdown(60); // Reset cooldown
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-transparent relative overflow-hidden text-slate-200 flex items-center justify-center">
        <div className="text-center bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-8 rounded-2xl">
          <p className="text-gray-300">Invalid verification link.</p>
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors mt-4 inline-block font-medium underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden text-slate-200">
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Code className="w-10 h-10 text-cyan-400 mr-2" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Verify Email
              </h1>
            </div>
            <p className="text-gray-300 text-sm">
              We sent a 6-digit verification code to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
          </div>

          {/* OTP Card */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm -z-10"></div>
            
            <form onSubmit={handleVerify}>
              <h4 className="text-2xl font-semibold text-white text-center mb-6">Enter OTP</h4>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                disabled={loading}
                className="w-full px-4 py-4 mb-4 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 text-center tracking-widest text-3xl font-mono"
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-xs text-center">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                  <p className="text-green-400 text-xs text-center">{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <p className="text-sm text-center mt-6 text-gray-300">
                Didn't receive the code?{" "}
                {countdown > 0 ? (
                  <span className="text-gray-500">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="font-medium text-cyan-400 underline hover:text-cyan-300 transition-colors duration-200 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
