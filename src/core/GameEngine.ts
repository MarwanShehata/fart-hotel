import { AuthManager } from "../auth/AuthManager";

class GameEngine {
  private authManager: AuthManager;
  public selectedFarters: string[] = [];
  public isSubmissionPhase: boolean = false;
  public currentRoundScore: number = 0;

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