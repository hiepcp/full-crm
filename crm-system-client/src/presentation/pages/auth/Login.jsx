import React from 'react';
import { Link } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Typography, Card, CardContent, Box } from '@mui/material';

// project import
import AuthWrapper from './AuthWrapper';
import AzureLogin from './AzureLogin';

// ================================|| LOGIN ||================================ //

export default function Login() {
  return (
    <AuthWrapper>
      <AzureLogin />
    </AuthWrapper>
  );
}
