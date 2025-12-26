import IMenuRepository from "@domain/interfaces/IMenuRepository";
import { useMenuMaster, updateDrawerState, handlerActiveItem } from "@infrastructure/api/menuApi";

export default class LocalMenuRepository extends IMenuRepository {
  getMenuMaster() {
    return useMenuMaster(); // hook SWR
  }

  updateDrawerState(isDashboardDrawerOpened) {
    return updateDrawerState(isDashboardDrawerOpened);
  }

  setActiveItem(openedItem) {
    return handlerActiveItem(openedItem);
  }
}