export type SoundType = "correct" | "wrong";
export type AvatarStyle =
  | "adventurer"
  | "avataaars"
  | "big-ears"
  | "big-smile"
  | "croodles"
  | "fun-emoji"
  | "micah"
  | "miniavs"
  | "personas";
export interface DOMElements {
  score: HTMLElement;
  round: HTMLElement;
  timer: HTMLElement;
  highScore: HTMLElement;
  message: HTMLElement;
  grid: HTMLElement;
  startBtn: HTMLButtonElement;
  submitBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  musicToggleBtn: HTMLButtonElement;
  soundToggleBtn: HTMLButtonElement;
  gameContainer: HTMLElement;
  userAvatar: HTMLImageElement;
  userName: HTMLElement;
  userId: HTMLElement;
  loginBtn: HTMLButtonElement;
  authModal: HTMLElement;
  googleLoginBtn: HTMLButtonElement;
  emailLoginForm: HTMLFormElement;
  emailRegisterForm: HTMLFormElement;
  forgotPasswordForm: HTMLFormElement;
  showRegisterBtn: HTMLButtonElement;
  showLoginBtn: HTMLButtonElement;
  showForgotBtn: HTMLButtonElement;
  backToLoginBtn: HTMLButtonElement;
  continueGuestBtn: HTMLButtonElement;
  closeModalBtn: HTMLButtonElement;
}
export interface GameSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  rounds: RoundData[];
  finalScore: number;
  totalCorrectGuesses: number;
  averageReactionTime: number;
}
export interface Farters {
  fartersArray: BaseUserData[];
}
export interface RoundData extends Farters {
  roundNumber: number;
  userGuesses?: number;
  isCorrect: boolean;
  timeLeft: number;
  startTime: number;
  endTime: number;
  reactionTime: number;
}
export interface PlayerStats extends ScoreData {
  totalPlayedGames: number;
  totalCorrectGuesses: number;
  averageTimePerGuess: number;
  lastPlayedAt: number;
  finalScore: number;
}
export interface UserIdentity {
  id: string;
  username: string;
  avatar: string;
}
export interface BaseUserData extends UserIdentity {
  email: string;
  createdAt: number;
  farterIndex: number;
}
export interface AuthenticationData {
  isAuthenticated: boolean;
  isBanned: boolean;
}
export type UserData = BaseUserData & AuthenticationData;
export interface TimerState {
  roundTimer: NodeJS.Timeout | null;
  nextRoundTimeout: NodeJS.Timeout | null;
  musicLoop: NodeJS.Timeout | null;
}
export interface AudioState {
  musicEnabled: boolean;
  soundEnabled: boolean;
  audioContext: AudioContext | null;
  backgroundMusicContext: AudioContext | null;
}
export interface ScoreData {
  highScore: number;
  score: number;
}
export interface GameState extends ScoreData, Farters {
  round: number;
  timeLeft: number;
  gameActive: boolean;
  selectedGuesses: number[];
}
export interface LeaderboardEntry extends UserIdentity, ScoreData {
  totalGames: number;
  accuracy: number;
  lastPlayed: number;
}
export type Leaderboard = LeaderboardEntry[];
