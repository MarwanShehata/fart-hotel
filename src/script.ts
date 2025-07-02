import type {
  AudioState,
  AvatarStyle,
  BaseUserData,
  DOMElements,
  GameState,
  LeaderboardEntry,
  PlayerStats,
  SoundType,
  TimerState,
  UserData,
} from "../types/types.ts";

// === STATE CREATION PURE FUNCTIONS ===

export const createInitialGameState = (): GameState => ({
  round: 1,
  score: 0,
  highScore: 0,
  timeLeft: 15,
  fartersArray: [],
  gameActive: false,
  selectedGuesses: [],
});

export const createInitialTimerState = (): TimerState => ({
  roundTimer: null,
  nextRoundTimeout: null,
  musicLoop: null,
});

export const createInitialAudioState = (): AudioState => ({
  musicEnabled: true,
  soundEnabled: true,
  audioContext: null,
  backgroundMusicContext: null,
});

export const createInitialPlayerStats = (): PlayerStats => ({
  score: 0,
  highScore: 0,
  totalPlayedGames: 0,
  totalCorrectGuesses: 0,
  averageTimePerGuess: 0,
  lastPlayedAt: 0,
  finalScore: 0,
});

// === USER & AUTHENTICATION PURE FUNCTIONS ===

/**
 * Generates a new random anonymous user identity.
 * This is a pure function that creates a user object without any side effects.
 */
export const generateAnonymousUser = (): UserData => {
  const adjectives = [
    "Sneaky",
    "Stinky",
    "Gassy",
    "Silent",
    "Deadly",
    "Mysterious",
    "Cheeky",
    "Noisy",
    "Quick",
    "Sly",
  ];
  const nouns = [
    "Farter",
    "Tooter",
    "Gasser",
    "Pooter",
    "Windbag",
    "Stinker",
    "Bomber",
    "Squeaker",
    "Blaster",
    "Whiffer",
  ];
  const avatarStyles: AvatarStyle[] = [
    "adventurer",
    "avataaars",
    "big-ears",
    "big-smile",
    "croodles",
    "fun-emoji",
    "micah",
    "miniavs",
    "personas",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 9999) + 1;
  const randomStyle =
    avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  const seed = Math.random().toString(36).substring(7);

  return {
    id: `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    username: `${randomAdjective}${randomNoun}${randomNumber}`,
    avatar: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}&size=64`,
    email: "",
    createdAt: Date.now(),
    farterIndex: 0,
    isBanned: false,
    isAuthenticated: false, // Guests are never authenticated
  };
};

/**
 * Retrieves the persistent guest user from localStorage.
 * If no guest user is found, it creates a new one and stores it.
 * This ensures a visitor has a consistent, unmodifiable identity across sessions.
 * @returns {UserData} The guest user data object.
 */
export const getGuestUser = (): UserData => {
  const storedUserJSON = localStorage.getItem("fartHotelGuestUser");
  if (storedUserJSON) {
    try {
      const storedUser = JSON.parse(storedUserJSON) as UserData;
      // Ensure the isAuthenticated flag is always false for guests
      storedUser.isAuthenticated = false;
      return storedUser;
    } catch (error) {
      console.error("Failed to parse guest user from storage:", error);
      // Fallback to creating a new user if JSON is corrupt
    }
  }

  const newGuestUser = generateAnonymousUser();
  localStorage.setItem("fartHotelGuestUser", JSON.stringify(newGuestUser));
  return newGuestUser;
};

/**
 * Removes the guest user data from localStorage.
 * This is called after a user successfully logs in or signs up,
 * replacing their guest identity with their real one.
 */
export const clearGuestUserFromStorage = (): void => {
  localStorage.removeItem("fartHotelGuestUser");
};

/**
 * Loads high score from localStorage (fallback until Firebase is implemented)
 */
export const loadHighScoreFromStorage = (): number => {
  return parseInt(localStorage.getItem("fartHotelHighScore") || "0", 10);
};

/**
 * Saves high score to localStorage (fallback until Firebase is implemented)
 */
export const saveHighScoreToStorage = (score: number): void => {
  localStorage.setItem("fartHotelHighScore", score.toString());
};

// === GAME LOGIC PURE FUNCTIONS ===

export const generateFarters = (numFarters: number): BaseUserData[] => {
  const farters: BaseUserData[] = [];
  const usedIndices = new Set<number>();

  while (farters.length < numFarters) {
    const randomIndex = Math.floor(Math.random() * 12);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      farters.push({
        id: `farter-${randomIndex}`,
        username: `Farter ${randomIndex + 1}`,
        avatar: "",
        email: `farter${randomIndex}@example.com`,
        createdAt: Date.now(),
        farterIndex: randomIndex,
      });
    }
  }
  return farters;
};

export const getRandomFartersCount = (): number =>
  Math.floor(Math.random() * 5) + 1;

export const isCorrectGuess = (
  guess: number,
  farters: BaseUserData[],
): boolean => farters.some((farter) => farter.farterIndex === guess);

export const calculateScore = (
  currentScore: number,
  numCorrectGuesses: number,
): number => currentScore + numCorrectGuesses;

export const updateHighScore = (
  currentScore: number,
  highScore: number,
): number => Math.max(currentScore, highScore);

export const calculateAverageReactionTime = (
  currentAverage: number,
  totalGuesses: number,
  newTime: number,
): number => {
  if (totalGuesses === 0) return newTime;
  return (currentAverage * (totalGuesses - 1) + newTime) / totalGuesses;
};

export const updatePlayerStatsAfterRound = (
  stats: PlayerStats,
  numCorrectGuesses: number,
  reactionTime: number,
): PlayerStats => ({
  ...stats,
  totalCorrectGuesses: stats.totalCorrectGuesses + numCorrectGuesses,
  averageTimePerGuess: calculateAverageReactionTime(
    stats.averageTimePerGuess,
    stats.totalCorrectGuesses,
    reactionTime,
  ),
});

export const startNewGame = (
  gameState: GameState,
  stats: PlayerStats,
): [GameState, PlayerStats] => [
    {
      ...gameState,
      score: 0,
      round: 1,
      gameActive: false,
    },
    {
      ...stats,
      totalPlayedGames: stats.totalPlayedGames + 1,
      lastPlayedAt: Date.now(),
    },
  ];

export const startNewRound = (gameState: GameState): GameState => {
  const numFarters = getRandomFartersCount();
  const farters = generateFarters(numFarters);

  return {
    ...gameState,
    fartersArray: farters,
    timeLeft: 15,
    gameActive: true,
  };
};

export const advanceRound = (gameState: GameState): GameState => ({
  ...gameState,
  round: gameState.round + 1,
});

export const endRound = (gameState: GameState): GameState => ({
  ...gameState,
  gameActive: false,
});

// === MESSAGE FUNCTIONS ===
export const getRandomMessage = (messages: readonly string[]): string =>
  messages[Math.floor(Math.random() * messages.length)];

export const createGameMessages = () => ({
  wrong: [
    "Nope! Not the farter, you amateur nose detective! 👃",
    "Wrong! They're laughing at your terrible guessing skills! 😂",
    "Absolutely not! Your fart-detection skills need serious work! 💩",
    "Nada! Innocent of this particular stink crime! 🚫",
    "Not even close! Maybe invest in a better nose? 👃❌",
  ] as const,
  correct: [
    "Bingo! You caught the fart bandit red-handed! 🎯",
    "Correct! Your nose knows, apparently! 👃✨",
    "Yes! You've successfully identified the gas-passer! 💨🎉",
    "Right on! That's our stinky suspect! 🕵️‍♂️",
    "Bullseye! You nailed the fart perpetrator! 🎯💩",
  ] as const,
  timeout: [
    "Time's up! The farter(s) got away! 🏃‍♂️💨",
    "Too slow! The culprit(s) escaped! ⏰💩",
    "Time ran out! The gas bandits fled the scene! 🚨💨",
    "Clock's ticking stopped! The farter(s) vanished! ⏰👻",
  ] as const,
});

// === DOM MANIPULATION FUNCTIONS (Impure but contained) ===
export const updateGameDisplay = (
  dom: DOMElements,
  gameState: GameState,
): void => {
  dom.score.textContent = gameState.score.toString();
  dom.round.textContent = gameState.round.toString();
  dom.timer.textContent = `${gameState.timeLeft}s`;
};

export const updateHighScoreDisplay = (
  dom: DOMElements,
  highScore: number,
): void => {
  dom.highScore.textContent = highScore.toString();
};

export const updateUserDisplay = (
  dom: DOMElements,
  userData: UserData,
): void => {
  // if (!userData) return
  dom.userName.textContent = userData.username;
  dom.userId.textContent = `ID: ${userData.id.substring(0, 8)}...`;
  dom.userAvatar.src = userData.avatar;
  dom.userAvatar.alt = `${userData.username}'s avatar`;

  // A guest cannot modify their profile, so hide relevant buttons.
  // This logic can be expanded based on actual UI elements for profile editing.
  // const isGuest = !userData.isAuthenticated;
  // Example: document.getElementById('edit-profile-btn').hidden = isGuest;
};

export const showMessage = (
  dom: DOMElements,
  message: string,
  type: "correct" | "wrong" | "neutral" = "neutral",
): void => {
  dom.message.textContent = message;
  dom.message.classList.remove("correct", "wrong");
  if (type !== "neutral") {
    dom.message.classList.add(type);
  }
};

export const revealFarters = (farters: BaseUserData[]): void => {
  // Highlight all the correct farters
  farters.forEach((farter) => {
    const farterIndex = farter.farterIndex;
    const farterElement = document.querySelector(
      `.character[data-index="${farterIndex}"]`,
    ) as HTMLElement;
    if (farterElement) {
      farterElement.classList.add("revealed-farter");
      // Add a pulsing animation or special styling to make it obvious
      farterElement.style.border = "3px solid #ff6b6b";
      farterElement.style.boxShadow = "0 0 15px rgba(255, 107, 107, 0.7)";
      farterElement.style.transform = "scale(1.05)";
    }
  });
};

export const clearCharacterStyling = (): void => {
  document.querySelectorAll(".character").forEach((char) => {
    char.classList.remove("revealed-farter", "correct", "wrong");
    const element = char as HTMLElement;
    element.style.border = "";
    element.style.boxShadow = "";
    element.style.transform = "";
  });
};

export const showFartConfetti = (gameContainer: Element): void => {
  const emojis = ["💨", "💩", "🎉", "😂", "💥"];

  for (let i = 0;i < 30;i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti-piece");
    confetti.innerText = emojis[Math.floor(Math.random() * emojis.length)];

    const x = (Math.random() - 0.5) * 500;
    const y = (Math.random() - 0.5) * 500;
    confetti.style.setProperty("--x", `${x}px`);
    confetti.style.setProperty("--y", `${y}px`);
    confetti.style.left = "50%";
    confetti.style.top = "50%";

    gameContainer.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 2000);
  }
};

// === MAIN GAME CLASS (ORCHESTRATOR) ===
class FartHotel {
  private readonly dom: DOMElements;
  private gameState: GameState;
  private timersState: TimerState;
  private audioState: AudioState;
  private userDataState: UserData;
  private playerStatsState: PlayerStats;
  private readonly messages = createGameMessages();
  private sessionStartTime = 0;
  private roundStartTime = 0;

  constructor() {
    this.dom = this.initializeDOMElements();
    this.gameState = createInitialGameState();
    this.timersState = createInitialTimerState();
    this.audioState = createInitialAudioState();
    // By default, visitors get a persistent guest identity.
    // This is unmodifiable until they log in.
    this.userDataState = getGuestUser();
    this.playerStatsState = createInitialPlayerStats();

    this.gameState.highScore = loadHighScoreFromStorage();
    this.init();
  }

  private initializeDOMElements(): DOMElements {
    return {
      score: document.getElementById("score")!,
      round: document.getElementById("round")!,
      timer: document.getElementById("timer")!,
      highScore: document.getElementById("high-score")!,
      message: document.getElementById("message")!,
      grid: document.getElementById("character-grid")!,
      startBtn: document.getElementById("start-btn") as HTMLButtonElement,
      submitBtn: document.getElementById("submit-btn") as HTMLButtonElement,
      nextBtn: document.getElementById("next-btn") as HTMLButtonElement,
      musicToggleBtn: document.getElementById(
        "music-toggle",
      ) as HTMLButtonElement,
      soundToggleBtn: document.getElementById(
        "sound-toggle",
      ) as HTMLButtonElement,
      gameContainer: document.querySelector(".game-container")!,
      userAvatar: document.getElementById("user-avatar") as HTMLImageElement,
      userName: document.getElementById("user-name")!,
      userId: document.getElementById("user-id")!,
      loginBtn: document.getElementById("login-btn") as HTMLButtonElement,
      authModal: document.getElementById("auth-modal")!,
      googleLoginBtn: document.getElementById(
        "google-login",
      ) as HTMLButtonElement,
      emailLoginForm: document.getElementById(
        "email-login-form",
      ) as HTMLFormElement,
      emailRegisterForm: document.getElementById(
        "email-register-form",
      ) as HTMLFormElement,
      forgotPasswordForm: document.getElementById(
        "forgot-password-form",
      ) as HTMLFormElement,
      showRegisterBtn: document.getElementById(
        "show-register",
      ) as HTMLButtonElement,
      showLoginBtn: document.getElementById("show-login") as HTMLButtonElement,
      showForgotBtn: document.getElementById(
        "forgot-password",
      ) as HTMLButtonElement,
      backToLoginBtn: document.getElementById(
        "back-to-login",
      ) as HTMLButtonElement,
      continueGuestBtn: document.getElementById(
        "continue-guest",
      ) as HTMLButtonElement,
      closeModalBtn: document.getElementById(
        "close-modal",
      ) as HTMLButtonElement,
    };
  }

  private init(): void {
    updateHighScoreDisplay(this.dom, this.gameState.highScore);
    // Display the guest or authenticated user's data
    updateUserDisplay(this.dom, this.userDataState);
    this.setupEventListeners();
    this.setupPageVisibilityHandlers();
    showMessage(
      this.dom,
      "🏨 Welcome to Fart Hotel! Click 'New Game' to start! 🕵️‍♂️",
    );
  }

  private setupEventListeners(): void {
    this.dom.startBtn.addEventListener("click", () => this.startGame());
    this.dom.nextBtn.addEventListener("click", () => {
      if (this.timersState.nextRoundTimeout)
        clearTimeout(this.timersState.nextRoundTimeout);
      this.nextRound();
    });
    this.dom.musicToggleBtn.addEventListener("click", () => this.toggleMusic());
    this.dom.soundToggleBtn.addEventListener("click", () => this.toggleSound());
    this.dom.grid.addEventListener("click", (e: MouseEvent) =>
      this.handleGuess(e),
    );
    this.dom.loginBtn.addEventListener("click", () => this.showAuthModal());
    this.dom.closeModalBtn.addEventListener("click", () =>
      this.hideAuthModal(),
    );
    this.dom.continueGuestBtn.addEventListener("click", () =>
      this.hideAuthModal(),
    );
    this.dom.showRegisterBtn.addEventListener("click", () =>
      this.showAuthTab("register-tab"),
    );
    this.dom.showLoginBtn.addEventListener("click", () =>
      this.showAuthTab("login-tab"),
    );
    this.dom.showForgotBtn.addEventListener("click", () =>
      this.showAuthTab("forgot-tab"),
    );
    this.dom.backToLoginBtn.addEventListener("click", () =>
      this.showAuthTab("login-tab"),
    );
  }

  private initAudioContext(): void {
    if (!this.audioState.audioContext) {
      this.audioState.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  private showEmptyGrid(): void {
    this.dom.grid.innerHTML = "";
    for (let i = 0;i < 12;i++) {
      const placeholder = document.createElement("div");
      placeholder.classList.add("character", "skeleton");
      placeholder.dataset.index = i.toString();
      this.dom.grid.appendChild(placeholder);
    }
  }

  private async loadCharacters(): Promise<void> {
    this.dom.grid.innerHTML = "";
    const avatarStyles: AvatarStyle[] = [
      "adventurer",
      "avataaars",
      "big-ears",
      "big-smile",
      "croodles",
      "fun-emoji",
      "micah",
      "miniavs",
      "personas",
    ];

    const characterPromises = Array.from({ length: 12 }, (_, i) => {
      return new Promise<void>((resolve) => {
        const charContainer = document.createElement("div");
        charContainer.classList.add("character", "skeleton");
        charContainer.dataset.index = i.toString();

        this.dom.grid.appendChild(charContainer);

        const style =
          avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const seed = Math.random().toString(36).substring(7);
        const img = document.createElement("img");
        img.src = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=110`;
        img.alt = `Character ${i + 1}`;

        img.onload = () => {
          charContainer.innerHTML = "";
          charContainer.appendChild(img);
          charContainer.classList.remove("skeleton");
          resolve();
        };

        img.onerror = () => {
          charContainer.classList.remove("skeleton");
          const emojis = [
            "👨‍💼",
            "👩‍💼",
            "👨‍🎓",
            "👩‍🎓",
            "👨‍🍳",
            "👩‍🍳",
            "👨‍⚕️",
            "👩‍⚕️",
            "👨‍🔧",
            "👩‍🔧",
            "👨‍🎨",
            "👩‍🎨",
          ];
          charContainer.textContent = emojis[i % emojis.length];
          charContainer.style.fontSize = "3rem";
          resolve();
        };
      });
    });

    await Promise.all(characterPromises);
  }

  private startGame(): void {
    const [newGameState, newPlayerStats] = startNewGame(
      this.gameState,
      this.playerStatsState,
    );
    this.gameState = newGameState;
    this.playerStatsState = newPlayerStats;

    this.sessionStartTime = Date.now();
    this.dom.startBtn.classList.add("hidden");
    this.initAudioContext();

    if (this.audioState.musicEnabled) {
      this.playBackgroundMusic();
    }

    this.startRound();
  }

  private async startRound(): Promise<void> {
    this.gameState = startNewRound(this.gameState);
    this.gameState.selectedGuesses = []; // Clear selected guesses for new round
    this.dom.submitBtn.classList.add("hidden"); // Hide submit button at start of round
    this.roundStartTime = Date.now();

    // --- DEBUGGING ---
    console.log(
      "Farters in this round:",
      this.gameState.fartersArray.map((farter) => farter.farterIndex),
    );
    this.gameState.fartersArray.forEach((farter) => {
      const farterIndex = farter.farterIndex;
      const farterElement = document.querySelector(
        `.character[data-index="${farterIndex}"]`,
      ) as HTMLElement;
      if (farterElement) {
        farterElement.style.border = "1px solid red";
      }
    });
    // --- END DEBUGGING ---

    clearCharacterStyling(); // Clear any previous styling
    showMessage(
      this.dom,
      `💨 Round ${this.gameState.round}: Who is the culprit?! 💨`,
    );
    updateGameDisplay(this.dom, this.gameState);
    await this.loadCharacters();
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timersState.roundTimer) clearInterval(this.timersState.roundTimer);

    this.timersState.roundTimer = setInterval(() => {
      this.gameState.timeLeft--;
      this.dom.timer.textContent = `${this.gameState.timeLeft}s`;

      if (this.gameState.timeLeft <= 0) {
        // Show timeout message and reveal farters
        const randomTimeoutMessage = getRandomMessage(this.messages.timeout);
        this.endRoundHandler(false, randomTimeoutMessage, true, [], []);
      }
    }, 1000);
  }
  private handleGuess(e: MouseEvent): void {
    if (!this.gameState.gameActive) return;

    const target = e.target as HTMLElement;
    const characterDiv = target.closest<HTMLDivElement>(
      ".character:not(.skeleton)",
    );
    if (!characterDiv) return;

    const guess = parseInt(characterDiv.dataset.index!, 10);

    // Clear previous selections first
    this.gameState.selectedGuesses.forEach((prevGuess) => {
      const prevCharDiv = document.querySelector(
        `.character[data-index="${prevGuess}"]`,
      ) as HTMLElement;
      if (prevCharDiv) {
        prevCharDiv.classList.remove("selected");
        prevCharDiv.style.border = "";
        prevCharDiv.style.boxShadow = "";
      }
    });

    // Set new selection
    this.gameState.selectedGuesses = [guess];
    characterDiv.classList.add("selected");

    // Check if guess is correct
    const isCorrect = isCorrectGuess(guess, this.gameState.fartersArray);

    if (isCorrect) {
      // Correct guess - show green border and positive feedback
      characterDiv.style.border = "3px solid #4CAF50"; // Green border
      characterDiv.style.boxShadow = "0 0 10px rgba(76, 175, 80, 0.5)";

      // Play correct sound
      this.playSound("correct");

      // Show correct message
      const randomCorrectMessage = getRandomMessage(this.messages.correct);
      showMessage(this.dom, randomCorrectMessage, "correct");

      // End round as correct
      this.endRoundHandler(true, randomCorrectMessage, false, [guess], []);
    } else {
      // Incorrect guess - show red border and negative feedback
      characterDiv.style.border = "3px solid #f44336"; // Red border
      characterDiv.style.boxShadow = "0 0 10px rgba(244, 67, 54, 0.5)";

      // Play wrong sound
      this.playSound("wrong");

      // Show wrong message
      const randomWrongMessage = getRandomMessage(this.messages.wrong);
      showMessage(this.dom, randomWrongMessage, "wrong");

      // End round as incorrect (this ends the round immediately)
      this.endRoundHandler(false, randomWrongMessage, false, [], [guess]);
    }
  }

  private endRoundHandler(
    isCorrect: boolean,
    message: string | null,
    isTimeout: boolean,
    correctGuesses: number[],
    incorrectGuesses: number[]
  ): void {
    // Stop the timer
    if (this.timersState.roundTimer) {
      clearInterval(this.timersState.roundTimer);
      this.timersState.roundTimer = null;
    }

    // End the round
    this.gameState = endRound(this.gameState);

    // Calculate reaction time
    const reactionTime = Date.now() - this.roundStartTime;

    if (isCorrect) {
      // Update score for correct guess
      this.gameState.score = calculateScore(this.gameState.score, 1);

      // Update high score if needed
      if (this.gameState.score > this.gameState.highScore) {
        this.gameState.highScore = updateHighScore(this.gameState.score, this.gameState.highScore);
        saveHighScoreToStorage(this.gameState.highScore);
        updateHighScoreDisplay(this.dom, this.gameState.highScore);
      }

      // Update player stats
      this.playerStatsState = updatePlayerStatsAfterRound(
        this.playerStatsState,
        1,
        reactionTime
      );

      // Show confetti for correct answer
      showFartConfetti(this.dom.gameContainer);

      // Show success message
      if (message) {
        showMessage(this.dom, message, "correct");
      }

      // Continue to next round after delay
      this.timersState.nextRoundTimeout = setTimeout(() => {
        this.nextRound();
      }, 2000);

    } else {
      // Game over for incorrect guess or timeout
      if (isTimeout) {
        // Reveal all farters when time runs out
        revealFarters(this.gameState.fartersArray);
        if (message) {
          showMessage(this.dom, message, "wrong");
        }
      } else {
        // Show the correct farters for incorrect guess
        revealFarters(this.gameState.fartersArray);
        if (message) {
          showMessage(this.dom, message, "wrong");
        }
      }

      // Update final score in player stats
      this.playerStatsState.finalScore = this.gameState.score;

      // Show game over after a delay
      setTimeout(() => {
        this.showGameOver();
      }, 3000);
    }

    // Update display
    updateGameDisplay(this.dom, this.gameState);
  }
  private showGameOver(): void {
    // Clear any lingering timers
    if (this.timersState.nextRoundTimeout) {
      clearTimeout(this.timersState.nextRoundTimeout);
      this.timersState.nextRoundTimeout = null;
    }

    // Stop background music
    this.stopBackgroundMusic();

    // Show game over message
    showMessage(
      this.dom,
      `🎮 Game Over! Final Score: ${this.gameState.score} 🎮`,
      "neutral"
    );

    // Show start button again
    this.dom.startBtn.classList.remove("hidden");
    this.dom.startBtn.textContent = "Play Again";

    // Clear character styling
    clearCharacterStyling();  

    // Reset game state
    this.gameState.gameActive = false;
    this.gameState.selectedGuesses = [];
  }

  private nextRound(): void {
    this.dom.nextBtn.classList.add("hidden");
    // Clear any revealed farter styling
    clearCharacterStyling();
    this.gameState = advanceRound(this.gameState);
    this.startRound();
  }

  private playSound(type: SoundType): void {
    if (!this.audioState.soundEnabled || !this.audioState.audioContext) return;

    const oscillator = this.audioState.audioContext.createOscillator();
    const gainNode = this.audioState.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioState.audioContext.destination);

    if (type === "correct") {
      oscillator.frequency.setValueAtTime(
        523.25,
        this.audioState.audioContext.currentTime,
      );
      oscillator.frequency.linearRampToValueAtTime(
        783.99,
        this.audioState.audioContext.currentTime + 0.2,
      );
    } else {
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(
        200,
        this.audioState.audioContext.currentTime,
      );
      oscillator.frequency.linearRampToValueAtTime(
        100,
        this.audioState.audioContext.currentTime + 0.3,
      );
    }

    gainNode.gain.setValueAtTime(0.2, this.audioState.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioState.audioContext.currentTime + 0.3,
    );
    oscillator.start(this.audioState.audioContext.currentTime);
    oscillator.stop(this.audioState.audioContext.currentTime + 0.3);
  }

  private playBackgroundMusic(): void {
    if (!this.audioState.musicEnabled || !this.audioState.audioContext) return;
    this.stopBackgroundMusic();

    this.audioState.backgroundMusicContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const melody = [261, 293, 329, 261, 293, 329, 392, 329];
    let noteTime = this.audioState.backgroundMusicContext.currentTime;

    const playLoop = (): void => {
      if (!this.audioState.backgroundMusicContext) return;

      melody.forEach((freq) => {
        if (!this.audioState.backgroundMusicContext) return;
        if (!freq) {
          noteTime += 0.4;
          return;
        }

        const osc = this.audioState.backgroundMusicContext.createOscillator();
        const gain = this.audioState.backgroundMusicContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioState.backgroundMusicContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.35);
        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
        noteTime += 0.4;
      });

      if (this.audioState.musicEnabled && this.gameState.gameActive) {
        this.timersState.musicLoop = setTimeout(playLoop, 3200);
      }
    };
    playLoop();
  }

  private stopBackgroundMusic(): void {
    if (this.timersState.musicLoop) clearTimeout(this.timersState.musicLoop);
    if (this.audioState.backgroundMusicContext) {
      this.audioState.backgroundMusicContext
        .close()
        .catch((e) => console.error("Error closing audio context:", e));
      this.audioState.backgroundMusicContext = null;
    }
  }
  public toggleMusic(): void {
    this.audioState.musicEnabled = !this.audioState.musicEnabled;
    this.dom.musicToggleBtn.textContent = this.audioState.musicEnabled
      ? "🎵"
      : "🔇";

    if (this.audioState.musicEnabled && this.gameState.gameActive) {
      this.initAudioContext();
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  }

  public toggleSound(): void {
    this.audioState.soundEnabled = !this.audioState.soundEnabled;
    this.dom.soundToggleBtn.textContent = this.audioState.soundEnabled
      ? "🔊"
      : "🔇";

    if (this.audioState.soundEnabled) {
      this.initAudioContext();
    }
  }

  private pauseGame(): void {
    // Stop all timers
    if (this.timersState.roundTimer) {
      clearInterval(this.timersState.roundTimer);
      this.timersState.roundTimer = null;
    }

    if (this.timersState.nextRoundTimeout) {
      clearTimeout(this.timersState.nextRoundTimeout);
      this.timersState.nextRoundTimeout = null;
    }

    this.stopBackgroundMusic();

    if (
      this.audioState.audioContext &&
      this.audioState.audioContext.state !== "closed"
    ) {
      this.audioState.audioContext
        .close()
        .catch((e) => console.error("Error closing audio context:", e));
      this.audioState.audioContext = null;
    }
  }

  private resumeGame(): void {
    if (this.gameState.gameActive && this.gameState.timeLeft > 0) {
      this.startTimer();

      if (this.audioState.musicEnabled) {
        this.initAudioContext();
        this.playBackgroundMusic();
      }
    }
  }

  private cleanupGame(): void {
    // Clear all timers
    Object.values(this.timersState).forEach((timer) => {
      if (timer) clearTimeout(timer);
    });

    this.stopBackgroundMusic();

    if (
      this.audioState.audioContext &&
      this.audioState.audioContext.state !== "closed"
    ) {
      this.audioState.audioContext
        .close()
        .catch((e) => console.error("Error closing audio context:", e));
    }

    this.gameState.gameActive = false;
  }

  private setupPageVisibilityHandlers(): void {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseGame();
        console.log("you switched the tab so we paused the game for you");
      } else {
        this.resumeGame();
        console.log("thank you for resuming the game");
      }
    });

    window.addEventListener("blur", () => this.pauseGame());
    window.addEventListener("focus", () => this.resumeGame());
    window.addEventListener("beforeunload", () => this.cleanupGame());
  }
  private generateAnonymousUser(): UserData {
    const adjectives = [
      "Sneaky",
      "Stinky",
      "Gassy",
      "Silent",
      "Deadly",
      "Mysterious",
      "Cheeky",
      "Noisy",
      "Quick",
      "Sly",
    ];
    const nouns = [
      "Farter",
      "Tooter",
      "Gasser",
      "Pooter",
      "Windbag",
      "Stinker",
      "Bomber",
      "Squeaker",
      "Blaster",
      "Whiffer",
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 9999) + 1;

    const avatarStyles: AvatarStyle[] = [
      "adventurer",
      "avataaars",
      "big-ears",
      "big-smile",
      "croodles",
      "fun-emoji",
      "micah",
      "miniavs",
      "personas",
    ];

    const randomStyle =
      avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const seed = Math.random().toString(36).substring(7);

    return {
      id: `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      username: `${randomAdjective}${randomNoun}${randomNumber}`,
      avatar: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}&size=64`,
      email: "", // Anonymous users don't have email
      createdAt: Date.now(),
      farterIndex: 0,
      isBanned: false,
      isAuthenticated: false,
    };
  }
  private updateUserDisplay(): void {
    this.dom.userName.textContent = this.userDataState.username;
    this.dom.userId.textContent = `ID: ${this.userDataState.id.substring(
      0,
      8,
    )}...`;
    this.dom.userAvatar.src = this.userDataState.avatar;
    this.dom.userAvatar.alt = `${this.userDataState.username}'s avatar`;
  }
  private showAuthModal(): void {
    this.dom.authModal.classList.add("active");
  }

  private hideAuthModal(): void {
    this.dom.authModal.classList.remove("active");
  }

  private showAuthTab(tabId: string): void {
    document
      .querySelectorAll(".auth-tab")
      .forEach((tab) => tab.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active");
  }
  public setAuthenticatedUser(userData: UserData): void {
    // Will be called after successful login
    Object.assign(this.userDataState, userData);
    this.userDataState.isAuthenticated = true;
    this.updateUserDisplay();
  }
  // Firebase methods (to be implemented)
  private async initializeFirebase(): Promise<void> {
    // Will initialize Firebase SDK
  }

  private async authenticatePlayer(): Promise<void> {
    // Will handle anonymous or Google auth
  }

  private async saveGameSession(): Promise<boolean> {
    // Will save complete game session
    return true;
  }

  private async updatePlayerStats(): Promise<boolean> {
    // Will update player statistics
    return true;
  }

  private async updateLeaderboard(): Promise<boolean> {
    // Will update global leaderboard
    return true;
  }

  private async loadLeaderboard(): Promise<LeaderboardEntry[]> {
    // Will fetch top players
    return [];
  }

  private async loadHighScore(): Promise<number> {
    // Will load from Firebase
    return 0;
  }

  private async saveHighScore(): Promise<boolean> {
    // Will save to Firebase
    return true;
  }
  private async savePlayerStats(): Promise<void> {
    // This would save to Firebase
    console.log("Saving player stats:", this.playerStatsState);
  }

  // Method to display stats to user
  public getPlayerStats(): PlayerStats {
    return { ...this.playerStatsState };
  }
}

// Start the game once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new FartHotel();
});
