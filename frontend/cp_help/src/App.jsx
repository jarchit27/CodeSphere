import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import Profile from "./pages/Profile/Profile";
import Problems from "./pages/Problems/Problems";
import Compare from './pages/Compare/Compare';
import Contests from './pages/Contests/Contests';
import Modal from 'react-modal';
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import './CosmicBackground.css';

Modal.setAppElement('#root');

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="home-page min-h-screen relative">
          {/* Cosmic Background Elements */}
          <div className="background-elements absolute inset-0 z-0">
            <div className="stars"></div>
            <div className="nebula-purple"></div>
            <div className="nebula-blue"></div>
            <div className="nebula-cyan"></div>
            <div className="cosmic-dust"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star"></div>
            <div className="planet planet-1"></div>
            <div className="planet planet-2"></div>
          </div>
          
          <div className="relative z-10">
            <Routes>
              <Route path='/' element={<Navigate to="/dashboard" replace />} />
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<SignUp />} />
              <Route path='/verify-email' element={<VerifyEmail />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path='/dashboard' element={<Home />} />
                <Route path='/profile/:handle' element={<Profile />} />
                <Route path='/problems' element={<Problems />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/contests" element={<Contests />} />
              </Route>

              {/* Catch-all route to prevent blank screens on invalid URLs */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;