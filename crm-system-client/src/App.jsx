import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { RoleProfileProvider } from '@app/contexts/RoleProfileContext';
import { EmailConnectionProvider } from '@app/contexts/EmailConnectionContext';
import { NotificationProvider } from '@app/contexts/NotificationContext';

// project import
import router from '@app/routes';
import ThemeCustomization from '@presentation/themes';

import ScrollTop from '@presentation/components/ScrollTop';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
      <ThemeCustomization>
        <ScrollTop>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RoleProfileProvider>
              <EmailConnectionProvider>
                <NotificationProvider>
                  <RouterProvider router={router} />
                </NotificationProvider>
              </EmailConnectionProvider>
            </RoleProfileProvider>
          </LocalizationProvider>
        </ScrollTop>
      </ThemeCustomization>
  );
}
