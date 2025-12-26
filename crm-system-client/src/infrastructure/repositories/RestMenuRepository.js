import IMenuRepository from "@domain/interfaces/IMenuRepository";
import menuApi from "@infrastructure/api/menuApi";

export default class RestMenuRepository extends IMenuRepository {
  async getMenuOfUser(_appCode, _email) {
    const res = await menuApi.getMenuOfUser(_appCode, _email);
    return res.data
  }
}