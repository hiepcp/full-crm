import { Paper, Typography } from '@mui/material'

export default function Home(){
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">Welcome</Typography>
      <Typography>Clean Architecture</Typography>
    </Paper>
  )
}
