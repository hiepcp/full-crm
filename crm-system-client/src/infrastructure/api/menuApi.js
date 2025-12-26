import useSWR, { mutate } from "swr";
import { useMemo } from "react";
import axiosInstance from "./menuAxiosInstance";

const initialState = {
  isDashboardDrawerOpened: false,
  openedItem: null // để lưu item đang active
};

const endpoints = {
  key: "api-menu",
  master: "master",
  dashboard: '/dashboard' // server URL
};

export function useMenuMaster() {
  const { data, isLoading } = useSWR(
    endpoints.key + endpoints.master,
    () => initialState,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const memoizedValue = useMemo(
    () => ({
      menuMaster: data,
      menuMasterLoading: isLoading
    }),
    [data, isLoading]
  );

  return memoizedValue;
}

export function updateDrawerState(isDashboardDrawerOpened) {
  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, isDashboardDrawerOpened };
    },
    false
  );
}

export function handlerActiveItem(openedItem) {
  mutate(
    endpoints.key + endpoints.master,
    (currentMenuMaster) => {
      return { ...currentMenuMaster, openedItem };
    },
    false
  );
}

const menuApi = {
  getMenuOfUser: (_appCode, _email) =>
    axiosInstance.get(`/menu/permissions`, {
      params: {
        appCode: _appCode,
        email: _email,
      },
    }),
};

export default menuApi;