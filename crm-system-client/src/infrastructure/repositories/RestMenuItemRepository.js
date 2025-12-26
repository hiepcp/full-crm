// src/infrastructure/repositories/RestMenuItemRepository.js
import axiosInstance from "@infrastructure/api/axiosInstance";
import { toCamelCase } from "@utils/string-utils";
import IMenuItemRepository from "@domain/interfaces/IMenuItemRepository";

const API_URL = "/MenuGroups";

export default class RestMenuItemRepository extends IMenuItemRepository {
  async getAll() {
    const response = await axiosInstance.get(`${API_URL}/items`);
    return response.data
      .sort((a, b) => (a.order_by || 0) - (b.order_by || 0))
      .map((d) => toCamelCase(d));
  }
}
