import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AuthForm from "../../components/AuthForm/AuthForm";
import authService from "../../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await authService.verifyToken();
      if (authenticated) {
        navigate("/select-user");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate("/select-user");
  };

  return (
    <div className="login-page">
      <AuthForm onSuccess={handleAuthSuccess} />
    </div>
  );
}
