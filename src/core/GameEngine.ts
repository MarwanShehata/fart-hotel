import { AuthManager } from "../auth/AuthManager";

class GameEngine {
  private authManager: AuthManager;

  constructor() {
    this.authManager = AuthManager.getInstance();
  }

  public startGame(): void {
    const user = this.authManager.getGuestUser();
    console.log(`Starting game for user: ${user.username} (${user.uid})`);
    // Add your game initialization logic here
  }
}

export { GameEngine };
