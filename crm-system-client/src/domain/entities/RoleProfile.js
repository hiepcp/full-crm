  export class RoleProfile {
    constructor(role, allowedMenus = [], isAdmin = false) {
      this.role = role;
      this.allowedMenus = allowedMenus;
      this.isAdmin = isAdmin;
    }

    canAccessMenu(menuId) {
      if (this.isAdmin) return true;
      return this.allowedMenus.map(m => m.toLowerCase()).includes(menuId.toLowerCase());
    }
  }
