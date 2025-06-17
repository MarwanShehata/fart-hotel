import type {
	AudioState,
	AvatarStyle,
	DOMElements,
	GameSession,
	GameState,
	LeaderboardEntry,
	PlayerStats,
	SoundType,
	TimerState,
	UserData,
	BaseUserData, // Import BaseUserData
} from '../types/types.ts'

class FartHotel {
	// --- DOM Elements ---
	private readonly dom: DOMElements

	// --- Game State Logic ---
	private readonly gameState: GameState = {
		round: 1,
		score: 0,
		highScore: 0,
		timeLeft: 15,
		fartersArray: [],
		gameActive: false,
	}

	// --- Timers & Intervals ---
	private readonly timersState: TimerState = {
		roundTimer: null,
		nextRoundTimeout: null,
		musicLoop: null,
	}

	// --- Audio ---
	private readonly audioState: AudioState = {
		musicEnabled: true,
		soundEnabled: true,
		audioContext: null,
		backgroundMusicContext: null,
	}

	// --- User Data ---
	private readonly userDataState: UserData = this.generateAnonymousUser()

	// --- Player Stats ---
	private readonly playerStatsState: PlayerStats = {
		score: 0,
		highScore: 0,
		totalPlayedGames: 0,
		totalCorrectGuesses: 0,
		averageTimePerGuess: 0,
		lastPlayedAt: 0,
		finalScore: 0,
	}

	// --- Game Session ---
	private sessionStartTime: number = 0
	private currentSession: GameSession | null = null

	// --- Round Data ---
	private roundStartTime: number = 0
	private roundExpectedEndTime: number = 0
	private roundActualEndTime: number = 0
	private fartersArray: any[] = [] // TODO: Define proper type for player objects

	// --- Messages ---
	private readonly messages = {
		wrong: [
			'Nope! Not the farter, you amateur nose detective! 👃',
			"Wrong! They're laughing at your terrible guessing skills! 😂",
			'Absolutely not! Your fart-detection skills need serious work! 💩',
			'Nada! Innocent of this particular stink crime! 🚫',
			'Not even close! Maybe invest in a better nose? 👃❌',
		],
		correct: [
			'Bingo! You caught the fart bandit red-handed! 🎯',
			'Correct! Your nose knows, apparently! 👃✨',
			"Yes! You've successfully identified the gas-passer! 💨🎉",
			"Right on! That's our stinky suspect! 🕵️‍♂️",
			'Bullseye! You nailed the fart perpetrator! 🎯💩',
		],
		timeout: [
			"Time's up! The farter(s) got away! 🏃‍♂️💨",
			"Too slow! The culprit(s) escaped! ⏰💩",
			"Time ran out! The gas bandits fled the scene! 🚨💨",
			"Clock's ticking stopped! The farter(s) vanished! ⏰👻",
		],
	} as const

	constructor() {
		// Initialize DOM Elements
		this.dom = {
			score: document.getElementById('score')!,
			round: document.getElementById('round')!,
			timer: document.getElementById('timer')!,
			highScore: document.getElementById('high-score')!,
			message: document.getElementById('message')!,
			grid: document.getElementById('character-grid')!,
			startBtn: document.getElementById('start-btn') as HTMLButtonElement,
			nextBtn: document.getElementById('next-btn') as HTMLButtonElement,
			musicToggleBtn: document.getElementById(
				'music-toggle'
			) as HTMLButtonElement,
			soundToggleBtn: document.getElementById(
				'sound-toggle'
			) as HTMLButtonElement,
			gameContainer: document.querySelector('.game-container')!,
			userAvatar: document.getElementById('user-avatar') as HTMLImageElement,
			userName: document.getElementById('user-name')!,
			userId: document.getElementById('user-id')!,
			loginBtn: document.getElementById('login-btn') as HTMLButtonElement,
			authModal: document.getElementById('auth-modal')!,
			googleLoginBtn: document.getElementById('google-login') as HTMLButtonElement,
			emailLoginForm: document.getElementById('email-login-form') as HTMLFormElement,
			emailRegisterForm: document.getElementById('email-register-form') as HTMLFormElement,
			forgotPasswordForm: document.getElementById('forgot-password-form') as HTMLFormElement,
			showRegisterBtn: document.getElementById('show-register') as HTMLButtonElement,
			showLoginBtn: document.getElementById('show-login') as HTMLButtonElement,
			showForgotBtn: document.getElementById('forgot-password') as HTMLButtonElement,
			backToLoginBtn: document.getElementById('back-to-login') as HTMLButtonElement,
			continueGuestBtn: document.getElementById('continue-guest') as HTMLButtonElement,
			closeModalBtn: document.getElementById('close-modal') as HTMLButtonElement,
		}

		// Load high score from localStorage (will be replaced by Firebase)
		this.gameState.highScore = parseInt(
			localStorage.getItem('fartHotelHighScore') || '0',
			10
		)

		this.init()
	}

	private init(): void {
		this.updateHighScoreDisplay()
		this.updateUserDisplay()
		this.setupEventListeners()
		this.setupPageVisibilityHandlers()
		this.dom.message.textContent =
			"🏨 Welcome to Fart Hotel! Click 'New Game' to start! 🕵️‍♂️"
	}

	private setupEventListeners(): void {
		this.dom.startBtn.addEventListener('click', () => this.startGame())
		this.dom.nextBtn.addEventListener('click', () => {
			if (this.timersState.nextRoundTimeout)
				clearTimeout(this.timersState.nextRoundTimeout)
			this.nextRound()
		})
		this.dom.musicToggleBtn.addEventListener('click', () => this.toggleMusic())
		this.dom.soundToggleBtn.addEventListener('click', () => this.toggleSound())
		this.dom.grid.addEventListener('click', (e: MouseEvent) =>
			this.handleGuess(e)
		)
		this.dom.loginBtn.addEventListener('click', () => this.showAuthModal())
		this.dom.closeModalBtn.addEventListener('click', () => this.hideAuthModal())
		this.dom.continueGuestBtn.addEventListener('click', () => this.hideAuthModal())
		this.dom.showRegisterBtn.addEventListener('click', () => this.showAuthTab('register-tab'))
		this.dom.showLoginBtn.addEventListener('click', () => this.showAuthTab('login-tab'))
		this.dom.showForgotBtn.addEventListener('click', () => this.showAuthTab('forgot-tab'))
		this.dom.backToLoginBtn.addEventListener('click', () => this.showAuthTab('login-tab'))
	}

	private initAudioContext(): void {
		if (!this.audioState.audioContext) {
			this.audioState.audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)()
		}
	}

	private showEmptyGrid(): void {
		this.dom.grid.innerHTML = ''
		for (let i = 0;i < 12;i++) {
			const placeholder = document.createElement('div')
			placeholder.classList.add('character', 'skeleton')
			placeholder.dataset.index = i.toString()
			this.dom.grid.appendChild(placeholder)
		}
	}

	private async loadCharacters(): Promise<void> {
		this.dom.grid.innerHTML = ''
		const avatarStyles: AvatarStyle[] = [
			'adventurer',
			'avataaars',
			'big-ears',
			'big-smile',
			'croodles',
			'fun-emoji',
			'micah',
			'miniavs',
			'personas',
		]

		const characterPromises = Array.from({ length: 12 }, (_, i) => {
			return new Promise<void>((resolve) => {
				const charContainer = document.createElement('div')
				charContainer.classList.add('character', 'skeleton')
				charContainer.dataset.index = i.toString()

				this.dom.grid.appendChild(charContainer)

				const style =
					avatarStyles[Math.floor(Math.random() * avatarStyles.length)]
				const seed = Math.random().toString(36).substring(7)
				const img = document.createElement('img')
				img.src = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=110`
				img.alt = `Character ${i + 1}`

				img.onload = () => {
					charContainer.innerHTML = ''
					charContainer.appendChild(img)
					charContainer.classList.remove('skeleton')
					resolve()
				}

				img.onerror = () => {
					charContainer.classList.remove('skeleton')
					const emojis = [
						'👨‍💼',
						'👩‍💼',
						'👨‍🎓',
						'👩‍🎓',
						'👨‍🍳',
						'👩‍🍳',
						'👨‍⚕️',
						'👩‍⚕️',
						'👨‍🔧',
						'👩‍🔧',
						'👨‍🎨',
						'👩‍🎨',
					]
					charContainer.textContent = emojis[i % emojis.length]
					charContainer.style.fontSize = '3rem'
					resolve()
				}
			})
		})

		await Promise.all(characterPromises)
	}

	private startGame(): void {
		this.gameState.score = 0
		this.gameState.round = 1
		this.sessionStartTime = Date.now()

		this.dom.startBtn.classList.add('hidden')
		this.initAudioContext()

		if (this.audioState.musicEnabled) {
			this.playBackgroundMusic()
		}

		this.startRound()
	}

	private async startRound(): Promise<void> {
		this.gameState.gameActive = false
		this.resetMessageStyle()

		const numFarters = Math.floor(Math.random() * 5) + 1 // 1-5 farters
		this.gameState.fartersArray = []

		while (this.gameState.fartersArray.length < numFarters) {
			const randomIndex = Math.floor(Math.random() * 12)
			const newFarter: BaseUserData = {
				id: `farter-${randomIndex}`,
				username: `Farter ${randomIndex + 1}`,
				avatar: '', // You might want to generate some dummy avatar data
				email: `farter${randomIndex}@example.com`,
				createdAt: Date.now(),
				farterIndex: randomIndex, // Add a property to store the index
			}
			if (
				!this.gameState.fartersArray.some(
					(farter) => farter.farterIndex === randomIndex
				)
			) {
				this.gameState.fartersArray.push(newFarter)
			}
		}
		// --- DEBUGGING ---
		console.log(
			'Farters in this round:',
			this.gameState.fartersArray.map((farter) => farter.farterIndex)
		)
		this.gameState.fartersArray.forEach((farter) => {
			const farterIndex = farter.farterIndex
			const farterElement = document.querySelector(
				`.character[data-index="${farterIndex}"]`
			) as HTMLElement
			if (farterElement) {
				farterElement.style.border = '1px solid red'
			}
		})
		// --- END DEBUGGING ---

		this.gameState.timeLeft = 15
		this.roundStartTime = Date.now()
		this.dom.message.textContent = `💨 Round ${this.gameState.round}: Who is the culprit?! 💨`

		this.updateDisplay()
		await this.loadCharacters()
		this.startTimer()
		this.gameState.gameActive = true
	}

	private startTimer(): void {
		if (this.timersState.roundTimer) clearInterval(this.timersState.roundTimer)

		this.timersState.roundTimer = setInterval(() => {
			this.gameState.timeLeft--
			this.dom.timer.textContent = `${this.gameState.timeLeft}s`

			if (this.gameState.timeLeft <= 0) {
				// Show timeout message and reveal farters
				const randomTimeoutMessage = this.messages.timeout[
					Math.floor(Math.random() * this.messages.timeout.length)
				]
				this.endRound(false, randomTimeoutMessage, null, true)
			}
		}, 1000)
	}

	private handleGuess(e: MouseEvent): void {
		if (!this.gameState.gameActive) return

		const target = e.target as HTMLElement
		const characterDiv = target.closest<HTMLDivElement>(
			'.character:not(.skeleton)'
		)
		if (!characterDiv) return

		const guess = parseInt(characterDiv.dataset.index!, 10)
		const isCorrect = this.gameState.fartersArray.some(
			(farter) => farter.farterIndex === guess
		)
		this.endRound(isCorrect, null, characterDiv, false)
	}

	private endRound(
		isCorrect: boolean,
		customMessage: string | null = null,
		clickedElement: HTMLDivElement | null = null,
		isTimeout: boolean = false
	): void {
		if (!this.gameState.gameActive) return

		this.gameState.gameActive = false
		this.roundActualEndTime = Date.now()

		if (this.timersState.roundTimer) {
			clearInterval(this.timersState.roundTimer)
			this.timersState.roundTimer = null
		}

		// If timeout, reveal all farters
		if (isTimeout) {
			this.revealFarters()
		}

		if (clickedElement) {
			clickedElement.classList.add(isCorrect ? 'correct' : 'wrong')
		}

		if (isCorrect && !isTimeout) {
			const randomMessage =
				this.messages.correct[
				Math.floor(Math.random() * this.messages.correct.length)
				]
			this.dom.message.textContent = randomMessage
			this.gameState.score++

			if (this.gameState.score > this.gameState.highScore) {
				this.gameState.highScore = this.gameState.score
				localStorage.setItem(
					'fartHotelHighScore',
					this.gameState.highScore.toString()
				)
				this.updateHighScoreDisplay()
			}

			this.playSound('correct')
			this.dom.message.classList.add('correct')
			this.showFartConfetti()
		} else {
			let messageToShow: string

			if (isTimeout) {
				messageToShow = customMessage || "Time's up! The farter(s) got away! ⏰💨"
			} else {
				const randomMessage =
					this.messages.wrong[
					Math.floor(Math.random() * this.messages.wrong.length)
					]
				messageToShow = customMessage || randomMessage
			}

			this.dom.message.textContent = messageToShow
			this.playSound('wrong')
			this.dom.message.classList.add('wrong')

			// If it's a wrong guess (not timeout), also reveal the correct farters
			if (!isTimeout) {
				this.revealFarters()
			}
		}

		this.updateDisplay()
		this.dom.nextBtn.classList.remove('hidden')

		if (!document.hidden) {
			this.timersState.nextRoundTimeout = setTimeout(() => this.nextRound(), 3000)
		}
	}

	private revealFarters(): void {
		// Highlight all the correct farters
		this.gameState.fartersArray.forEach((farter) => {
			const farterIndex = farter.farterIndex
			const farterElement = document.querySelector(
				`.character[data-index="${farterIndex}"]`
			) as HTMLElement
			if (farterElement) {
				farterElement.classList.add('revealed-farter')
				// Add a pulsing animation or special styling to make it obvious
				farterElement.style.border = '3px solid #ff6b6b'
				farterElement.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.7)'
				farterElement.style.transform = 'scale(1.05)'
			}
		})
	}

	private nextRound(): void {
		this.dom.nextBtn.classList.add('hidden')
		// Clear any revealed farter styling
		document.querySelectorAll('.character').forEach(char => {
			char.classList.remove('revealed-farter', 'correct', 'wrong')
			const element = char as HTMLElement
			element.style.border = ''
			element.style.boxShadow = ''
			element.style.transform = ''
		})
		this.gameState.round++
		this.startRound()
	}

	/**
	 * This is for separating concerns - DOM updates happen in dedicated methods"
	 */
	private updateDisplay(): void {
		this.dom.score.textContent = this.gameState.score.toString()
		this.dom.round.textContent = this.gameState.round.toString()
		this.dom.timer.textContent = `${this.gameState.timeLeft}s`
	}

	private updateHighScoreDisplay(): void {
		this.dom.highScore.textContent = this.gameState.highScore.toString()
	}

	private resetMessageStyle(): void {
		this.dom.message.classList.remove('correct', 'wrong')
	}

	private showFartConfetti(): void {
		const emojis = ['💨', '💩', '🎉', '😂', '💥']

		for (let i = 0;i < 30;i++) {
			const confetti = document.createElement('div')
			confetti.classList.add('confetti-piece')
			confetti.innerText = emojis[Math.floor(Math.random() * emojis.length)]

			const x = (Math.random() - 0.5) * 500
			const y = (Math.random() - 0.5) * 500
			confetti.style.setProperty('--x', `${x}px`)
			confetti.style.setProperty('--y', `${y}px`)
			confetti.style.left = '50%'
			confetti.style.top = '50%'

			this.dom.gameContainer.appendChild(confetti)

			setTimeout(() => {
				confetti.remove()
			}, 2000)
		}
	}

	private playSound(type: SoundType): void {
		if (!this.audioState.soundEnabled || !this.audioState.audioContext) return

		const oscillator = this.audioState.audioContext.createOscillator()
		const gainNode = this.audioState.audioContext.createGain()
		oscillator.connect(gainNode)
		gainNode.connect(this.audioState.audioContext.destination)

		if (type === 'correct') {
			oscillator.frequency.setValueAtTime(
				523.25,
				this.audioState.audioContext.currentTime
			)
			oscillator.frequency.linearRampToValueAtTime(
				783.99,
				this.audioState.audioContext.currentTime + 0.2
			)
		} else {
			oscillator.type = 'sawtooth'
			oscillator.frequency.setValueAtTime(
				200,
				this.audioState.audioContext.currentTime
			)
			oscillator.frequency.linearRampToValueAtTime(
				100,
				this.audioState.audioContext.currentTime + 0.3
			)
		}

		gainNode.gain.setValueAtTime(0.2, this.audioState.audioContext.currentTime)
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			this.audioState.audioContext.currentTime + 0.3
		)
		oscillator.start(this.audioState.audioContext.currentTime)
		oscillator.stop(this.audioState.audioContext.currentTime + 0.3)
	}

	private playBackgroundMusic(): void {
		if (!this.audioState.musicEnabled || !this.audioState.audioContext) return
		this.stopBackgroundMusic()

		this.audioState.backgroundMusicContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)()
		const melody = [261, 293, 329, 261, 293, 329, 392, 329]
		let noteTime = this.audioState.backgroundMusicContext.currentTime

		const playLoop = (): void => {
			if (!this.audioState.backgroundMusicContext) return

			melody.forEach((freq) => {
				if (!this.audioState.backgroundMusicContext) return
				if (!freq) {
					noteTime += 0.4
					return
				}

				const osc = this.audioState.backgroundMusicContext.createOscillator()
				const gain = this.audioState.backgroundMusicContext.createGain()
				osc.connect(gain)
				gain.connect(this.audioState.backgroundMusicContext.destination)
				osc.frequency.value = freq
				gain.gain.setValueAtTime(0.08, noteTime)
				gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.35)
				osc.start(noteTime)
				osc.stop(noteTime + 0.35)
				noteTime += 0.4
			})

			if (this.audioState.musicEnabled && this.gameState.gameActive) {
				this.timersState.musicLoop = setTimeout(playLoop, 3200)
			}
		}
		playLoop()
	}

	private stopBackgroundMusic(): void {
		if (this.timersState.musicLoop) clearTimeout(this.timersState.musicLoop)

		if (this.audioState.backgroundMusicContext) {
			this.audioState.backgroundMusicContext
				.close()
				.catch((e) => console.error('Error closing audio context:', e))
			this.audioState.backgroundMusicContext = null
		}
	}

	public toggleMusic(): void {
		this.audioState.musicEnabled = !this.audioState.musicEnabled
		this.dom.musicToggleBtn.textContent = this.audioState.musicEnabled ? '🎵' : '🔇'

		if (this.audioState.musicEnabled && this.gameState.gameActive) {
			this.initAudioContext()
			this.playBackgroundMusic()
		} else {
			this.stopBackgroundMusic()
		}
	}

	public toggleSound(): void {
		this.audioState.soundEnabled = !this.audioState.soundEnabled
		this.dom.soundToggleBtn.textContent = this.audioState.soundEnabled ? '🔊' : '🔇'

		if (this.audioState.soundEnabled) {
			this.initAudioContext()
		}
	}

	private pauseGame(): void {
		// Stop all timers
		if (this.timersState.roundTimer) {
			clearInterval(this.timersState.roundTimer)
			this.timersState.roundTimer = null
		}

		if (this.timersState.nextRoundTimeout) {
			clearTimeout(this.timersState.nextRoundTimeout)
			this.timersState.nextRoundTimeout = null
		}

		this.stopBackgroundMusic()

		if (this.audioState.audioContext && this.audioState.audioContext.state !== 'closed') {
			this.audioState.audioContext
				.close()
				.catch((e) => console.error('Error closing audio context:', e))
			this.audioState.audioContext = null
		}
	}

	private resumeGame(): void {
		if (this.gameState.gameActive && this.gameState.timeLeft > 0) {
			this.startTimer()

			if (this.audioState.musicEnabled) {
				this.initAudioContext()
				this.playBackgroundMusic()
			}
		}
	}

	private cleanupGame(): void {
		// Clear all timers
		Object.values(this.timersState).forEach((timer) => {
			if (timer) clearTimeout(timer)
		})

		this.stopBackgroundMusic()

		if (this.audioState.audioContext && this.audioState.audioContext.state !== 'closed') {
			this.audioState.audioContext
				.close()
				.catch((e) => console.error('Error closing audio context:', e))
		}

		this.gameState.gameActive = false
	}

	private setupPageVisibilityHandlers(): void {
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.pauseGame()
				console.log('you switched the tab so we paused the game for you')
			} else {
				this.resumeGame()
				console.log('thank you for resuming the game')
			}
		})

		window.addEventListener('blur', () => this.pauseGame())
		window.addEventListener('focus', () => this.resumeGame())
		window.addEventListener('beforeunload', () => this.cleanupGame())
	}
	private generateAnonymousUser(): UserData {
		const adjectives = ['Sneaky', 'Stinky', 'Gassy', 'Silent', 'Deadly', 'Mysterious', 'Cheeky', 'Noisy', 'Quick', 'Sly']
		const nouns = ['Farter', 'Tooter', 'Gasser', 'Pooter', 'Windbag', 'Stinker', 'Bomber', 'Squeaker', 'Blaster', 'Whiffer']

		const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
		const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
		const randomNumber = Math.floor(Math.random() * 9999) + 1

		const avatarStyles: AvatarStyle[] = [
			'adventurer', 'avataaars', 'big-ears', 'big-smile', 'croodles',
			'fun-emoji', 'micah', 'miniavs', 'personas'
		]

		const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)]
		const seed = Math.random().toString(36).substring(7)

		return {
			id: `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`,
			username: `${randomAdjective}${randomNoun}${randomNumber}`,
			avatar: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}&size=64`,
			email: '', // Anonymous users don't have email
			createdAt: Date.now(),
			farterIndex: 0,
			isBanned: false,
			isAuthenticated: false,
		}
	}
	private updateUserDisplay(): void {
		this.dom.userName.textContent = this.userDataState.username
		this.dom.userId.textContent = `ID: ${this.userDataState.id.substring(0, 8)}...`
		this.dom.userAvatar.src = this.userDataState.avatar
		this.dom.userAvatar.alt = `${this.userDataState.username}'s avatar`
	}
	private showAuthModal(): void {
		this.dom.authModal.classList.add('active')
	}

	private hideAuthModal(): void {
		this.dom.authModal.classList.remove('active')
	}

	private showAuthTab(tabId: string): void {
		document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'))
		document.getElementById(tabId)?.classList.add('active')
	}
	public setAuthenticatedUser(userData: UserData): void {
		// Will be called after successful login
		Object.assign(this.userDataState, userData)
		this.userDataState.isAuthenticated = true
		this.updateUserDisplay()
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
		return true
	}

	private async updatePlayerStats(): Promise<boolean> {
		// Will update player statistics
		return true
	}

	private async updateLeaderboard(): Promise<boolean> {
		// Will update global leaderboard
		return true
	}

	private async loadLeaderboard(): Promise<LeaderboardEntry[]> {
		// Will fetch top players
		return []
	}

	private async loadHighScore(): Promise<number> {
		// Will load from Firebase
		return 0
	}

	private async saveHighScore(): Promise<boolean> {
		// Will save to Firebase
		return true
	}
}

// Start the game once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
	new FartHotel()
})