import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import RestRoleProfileRepository from "@infrastructure/repositories/RestRoleProfileRepository";
import GetCurrentUserRoleUseCase from "@application/usecases/GetCurrentUserRoleUseCase";

const RoleProfileContext = createContext(null);

export const RoleProfileProvider = ({ children }) => {
  const [roleProfile, setRoleProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleProfile = useCallback(async () => {
    try {
      const repo = new RestRoleProfileRepository();
      const getRoleUseCase = new GetCurrentUserRoleUseCase(repo);
      const result = await getRoleUseCase.execute();      
      setRoleProfile(result);
    } catch (error) {
      console.error("Error loading role profile", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoleProfile();
  }, [fetchRoleProfile]);

  return (
    <RoleProfileContext.Provider
      value={{
        roleProfile,
        canAccessMenu: (id) => roleProfile?.canAccessMenu(id),
        reloadPermissions: fetchRoleProfile,
        loading,
      }}
    >
      {children}
    </RoleProfileContext.Provider>
  );
};

export const useRoleProfile = () => useContext(RoleProfileContext);
