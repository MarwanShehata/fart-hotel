import { AuthManager } from '../auth/auth-manager'

class GameEngine {
  private authManager: AuthManager
  selectedFarters: string[] = []
  isSubmissionPhase = false
  currentRoundScore = 0

  constructor() {
    this.authManager = AuthManager.getInstance()
  }

  startGame(): void {
    const _user = this.authManager.getGuestUser()
    // biome-ignore lint/suspicious/noConsole: sda
    console.log(`Starting game for user: ${_user.username} (${_user.uid})`)
    // Add your game initialization logic here
  }
}

export { GameEngine }
