import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

const EmailOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setError(errorDescription || error);
        return;
      }

      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      // Exchange code for tokens using PKCE (NO BACKEND NEEDED)
      // Uses code_verifier instead of client_secret - more secure for SPAs
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
      if (!codeVerifier) {
        throw new Error('PKCE code verifier not found');
      }

      // Use consistent tenant configuration - get from config to match auth URL
      const tenantId = import.meta.env.VITE_TENANT_ID || 'common';
      const clientId = import.meta.env.VITE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Client ID not configured. Please set VITE_CLIENT_ID environment variable.');
      }

      // Use the exact redirect URI that matches Azure app registration
      const redirectUri = (window.location.origin + '/auth/callback');

      const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId, // Safe: public info
          code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      // Clean up
      sessionStorage.removeItem('pkce_code_verifier');

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          errorText,
          clientId: clientId ? 'configured' : 'missing',
          redirectUri,
          tenantId
        });

        // Provide more specific error messages based on common OAuth errors
        if (tokenResponse.status === 400) {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'invalid_grant') {
            throw new Error('Authorization code expired or already used. Please try connecting again.');
          } else if (errorData.error === 'invalid_client') {
            throw new Error('Invalid client configuration. Please check your Azure app registration.');
          } else if (errorData.error === 'redirect_uri_mismatch') {
            throw new Error(`Redirect URI mismatch. Expected: ${redirectUri}. Please update your Azure app registration.`);
          } else {
            throw new Error(`OAuth error: ${errorData.error_description || errorData.error}`);
          }
        } else if (tokenResponse.status === 401) {
          throw new Error('Authentication failed. Please check your client credentials.');
        } else {
          throw new Error(`Token exchange failed (${tokenResponse.status}): ${tokenResponse.statusText}`);
        }
      }

      const tokenData = await tokenResponse.json();

      // Send success message to parent window (for popup flow)
      if (window.opener) {
        window.opener.postMessage({
          type: 'email_auth_success',
          email: tokenData.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token
        }, '*');
        window.close();
        return;
      }

      // If not in popup, redirect to email connect page with success
      setStatus('success');
      setTimeout(() => {
        navigate('/connect/email', {
          state: {
            success: true,
            email: tokenData.email
          }
        });
      }, 2000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setError(error.message || 'Authentication failed');

      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'email_auth_error',
          error: error.message
        }, '*');
        window.close();
        return;
      }

      // If not in popup, redirect to email connect page with error
      setTimeout(() => {
        navigate('/connect/email', {
          state: {
            error: error.message
          }
        });
      }, 3000);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Processing Authentication
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we complete your email connection...
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Authentication Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Redirecting you back to the email connection page...
            </Typography>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Authentication Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You will be redirected back to try again.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2
    }}>
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailOAuthCallback;
