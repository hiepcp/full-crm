// src/presentation/hooks/useMenuItems.js
import { useEffect, useState } from "react";
import RestMenuItemRepository from "@infrastructure/repositories/RestMenuItemRepository";
import GetAllMenuItemsUseCase from "@application/usecases/menu-item/GetAllMenuItemsUseCase";

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const repo = new RestMenuItemRepository();
    const getMenuItems = new GetAllMenuItemsUseCase(repo);

    getMenuItems.execute()
      .then((items) => setMenuItems(items))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { menuItems, loading };
}
