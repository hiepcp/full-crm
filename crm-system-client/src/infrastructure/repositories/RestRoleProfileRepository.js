import IRoleProfileRepository from "@domain/interfaces/IRoleProfileRepository";
//import axiosInstance from "@infrastructure/api/axiosInstance";
import { RoleProfile } from "@domain/entities/RoleProfile";

export default class RestRoleProfileRepository extends IRoleProfileRepository {
  async getCurrentUser() {
    //const response = await axiosInstance.get("/users/login/CurrentUser");

    const response = {
      data: {
        data: {
          id: 39,
          firstName: "Thien",
          lastName: "Nguyen Hoang",
          email: "thiennh@response.com.vn",
          roles: "Admin,User",
          roleProfile: "Administrator",
        },
        menuItems: [],
        message: "Get user info success",
      },
    };

    const userInfo = response.data.data;
    const menuItems = response.data.menuItems || [];

    const accessibleMenuIds = menuItems
      .filter((item) => item.canAccess)
      .map((item) => item.code);

    const isAdmin = userInfo.roleProfile.split(",").includes("Administrator");

    return new RoleProfile(userInfo.roleProfile, accessibleMenuIds, isAdmin);
  }
}
