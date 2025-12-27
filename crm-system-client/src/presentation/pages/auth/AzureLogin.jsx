import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import PrimaryButton from "@presentation/components/common/PrimaryButton";
import { Navigate, useLocation } from "react-router-dom";

import { LocalAuthRepository } from "@infrastructure/repositories/LocalAuthRepository";
import { AzureAuthRepository } from "@infrastructure/repositories/AzureAuthRepository";
import { LoginUseCase } from "@application/usecases/auth/LoginUseCase";
import { GetTokenUseCase } from "@application/usecases/auth/GetTokenUseCase";

const localRepo = new LocalAuthRepository();
const azureRepo = new AzureAuthRepository(localRepo);

const loginUseCase = new LoginUseCase(azureRepo);
const getTokenUseCase = new GetTokenUseCase(localRepo);

export default function AzureLogin() {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // load token từ LocalStorage
  useEffect(() => {
    (async () => {
      const token = await getTokenUseCase.execute();
      setAccessToken(token);
      setLoading(false);
    })();
  }, []);

  // Lắng nghe message từ popup Azure
  useEffect(() => {
    const handler = async (event) => {
      const token = await azureRepo.handleMessage(event);
      if (token) setAccessToken(token);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleLogin = useCallback(() => {
    loginUseCase.execute();
  }, []);

  if (loading) return null; // hoặc một Loader
  
  if (accessToken) {
    return <Navigate to={from} replace />;
  }

  return (    
    <Card sx={{ p: 4, borderRadius: 3, boxShadow: 0 }}>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
          Sign in with your Azure AD account
        </Typography>

        <PrimaryButton
          fullWidth
          size="large"
          sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600 }}
          onClick={handleLogin}
        >
          Login with Azure
        </PrimaryButton>
      </CardContent>
    </Card>
  );
}
