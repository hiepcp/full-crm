import * as React from 'react';
import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NotFound() {
	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			minHeight="60vh"
			textAlign="center"
		>
			<ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
			<Typography variant="h2" color="error" gutterBottom>
				404
			</Typography>
			<Typography variant="h5" gutterBottom>
				Page not found
			</Typography>
			<Typography variant="body1" color="text.secondary">
				The page you are looking for does not exist or has been removed.<br />
				Please check the URL or return to the homepage.
			</Typography>
		</Box>
	);
}