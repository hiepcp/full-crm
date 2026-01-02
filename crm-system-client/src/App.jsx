import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { RoleProfileProvider } from '@app/contexts/RoleProfileContext';
import { EmailConnectionProvider } from '@app/contexts/EmailConnectionContext';
import { NotificationProvider } from '@app/contexts/NotificationContext';
import { TeamProvider } from '@app/contexts/TeamContext';

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
                  <TeamProvider>
                    <RouterProvider router={router} />
                  </TeamProvider>
                </NotificationProvider>
              </EmailConnectionProvider>
            </RoleProfileProvider>
          </LocalizationProvider>
        </ScrollTop>
      </ThemeCustomization>
  );
}
