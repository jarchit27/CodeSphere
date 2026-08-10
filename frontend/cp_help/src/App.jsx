import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import ViewAnalysis from "./pages/ViewAnalysis/ViewAnalysis";
import Problems from "./pages/Problems/Problems";
import Profile from "./pages/Profile/Profile";
import Compare from './pages/Compare/Compare';
import Contests from './pages/Contests/Contests';
import CompareResult from './pages/Compare/CompareResult';
import Modal from 'react-modal';
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

Modal.setAppElement('#root');

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<Navigate to="/login" />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<Home />} />
            <Route path="/viewanalysis/:handle" element={<ViewAnalysis />} />
            <Route path='/profile/:handle' element={<Profile />} />
            <Route path='/problems/:handle' element={<Problems />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare-result" element={<CompareResult />} />
            <Route path="/Contests" element={<Contests />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;