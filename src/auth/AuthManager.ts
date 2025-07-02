import { StorageManager } from "../utils/StorageManager";

class AuthManager {
  private static instance: AuthManager;
  private storageManager: StorageManager;

  private constructor() {
    this.storageManager = new StorageManager();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  public getGuestUser(): { uid: string; username: string } {
    let user = this.storageManager.getItem<{ uid: string; username: string }>("user");
    if (!user) {
      user = {
        uid: this.generateUniqueId(),
        username: "Guest",
      };
      this.storageManager.setItem("user", user);
    }
    return user;
  }

  private generateUniqueId(): string {
    return "guest-" + Math.random().toString(36).substr(2, 9);
  }
}

export { AuthManager };
