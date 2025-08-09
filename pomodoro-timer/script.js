class PomodoroTimer {
    constructor() {
        this.workDuration = 25;
        this.breakDuration = 5;
        this.isRunning = false;
        this.isPaused = false;
        this.currentSession = 1;
        this.completedSessions = 0;
        this.totalMinutes = 0;
        this.isWorkSession = true;
        this.timeLeft = this.workDuration * 60;
        this.interval = null;
        
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.completedSessionsEl = document.getElementById('completedSessions');
        this.currentSessionEl = document.getElementById('currentSession');
        this.totalTimeEl = document.getElementById('totalTime');
        this.workTimeEl = document.getElementById('workTime');
        this.breakTimeEl = document.getElementById('breakTime');
        this.workMinusBtn = document.getElementById('workMinus');
        this.workPlusBtn = document.getElementById('workPlus');
        this.breakMinusBtn = document.getElementById('breakMinus');
        this.breakPlusBtn = document.getElementById('breakPlus');
        this.timerCircle = document.querySelector('.timer-circle');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.workMinusBtn.addEventListener('click', () => this.adjustTime('work', -1));
        this.workPlusBtn.addEventListener('click', () => this.adjustTime('work', 1));
        this.breakMinusBtn.addEventListener('click', () => this.adjustTime('break', -1));
        this.breakPlusBtn.addEventListener('click', () => this.adjustTime('break', 1));
    }
    
    start() {
        if (!this.isRunning || this.isPaused) {
            this.isRunning = true;
            this.isPaused = false;
            this.startBtn.classList.add('hidden');
            this.pauseBtn.classList.remove('hidden');
            
            this.interval = setInterval(() => {
                this.tick();
            }, 1000);
        }
    }
    
    pause() {
        this.isPaused = true;
        this.isRunning = false;
        this.pauseBtn.classList.add('hidden');
        this.startBtn.classList.remove('hidden');
        clearInterval(this.interval);
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.isWorkSession = true;
        this.timeLeft = this.workDuration * 60;
        
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
        
        clearInterval(this.interval);
        this.updateDisplay();
        this.updateProgress();
    }
    
    tick() {
        this.timeLeft--;
        this.updateDisplay();
        this.updateProgress();
        
        if (this.timeLeft <= 0) {
            this.sessionComplete();
        }
    }
    
    sessionComplete() {
        clearInterval(this.interval);
        this.isRunning = false;
        
        if (this.isWorkSession) {
            this.completedSessions++;
            this.totalMinutes += this.workDuration;
            this.showNotification('Çalışma tamamlandı! 5 saniye sonra mola başlıyor...');
            this.isWorkSession = false;
            this.timeLeft = this.breakDuration * 60;
        } else {
            this.totalMinutes += this.breakDuration;
            this.showNotification('Mola tamamlandı! 5 saniye sonra çalışma başlıyor...');
            this.isWorkSession = true;
            this.currentSession++;
            this.timeLeft = this.workDuration * 60;
        }
        
        this.updateStats();
        this.updateDisplay();
        this.updateProgress();
        this.playNotificationSound();
        
        this.startAutoTransition();
    }
    
    startAutoTransition() {
        let countdown = 5;
        this.sessionType.textContent = `${countdown} saniye sonra ${this.isWorkSession ? 'çalışma' : 'mola'} başlıyor...`;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.sessionType.textContent = `${countdown} saniye sonra ${this.isWorkSession ? 'çalışma' : 'mola'} başlıyor...`;
            } else {
                clearInterval(countdownInterval);
                this.start();
            }
        }, 1000);
    }
    
    adjustTime(type, change) {
        if (this.isRunning) return;
        
        if (type === 'work') {
            this.workDuration = Math.max(1, Math.min(60, this.workDuration + change));
            this.workTimeEl.textContent = this.workDuration;
            if (this.isWorkSession) {
                this.timeLeft = this.workDuration * 60;
                this.updateDisplay();
                this.updateProgress();
            }
        } else {
            this.breakDuration = Math.max(1, Math.min(30, this.breakDuration + change));
            this.breakTimeEl.textContent = this.breakDuration;
            if (!this.isWorkSession) {
                this.timeLeft = this.breakDuration * 60;
                this.updateDisplay();
                this.updateProgress();
            }
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timeDisplay.textContent = timeString;
        this.sessionType.textContent = this.isWorkSession ? 'Çalışma Zamanı' : 'Mola Zamanı';
        
        if (this.isWorkSession) {
            this.sessionType.className = 'text-lg font-medium text-slate-600';
        } else {
            this.sessionType.className = 'text-lg font-medium text-emerald-600';
        }
    }
    
    updateProgress() {
        const totalTime = this.isWorkSession ? this.workDuration * 60 : this.breakDuration * 60;
        const elapsed = totalTime - this.timeLeft;
        const progress = (elapsed / totalTime) * 100;
        
        this.timerCircle.style.setProperty('--progress', `${progress}%`);
        
        if (this.isRunning && this.timeLeft <= 10 && this.timeLeft > 0) {
            this.timeDisplay.classList.add('pulse-animation');
        } else {
            this.timeDisplay.classList.remove('pulse-animation');
        }
    }
    
    updateStats() {
        this.completedSessionsEl.textContent = this.completedSessions;
        this.currentSessionEl.textContent = this.currentSession;
        
        if (this.totalMinutes >= 60) {
            const hours = Math.floor(this.totalMinutes / 60);
            const minutes = this.totalMinutes % 60;
            this.totalTimeEl.textContent = `${hours}h ${minutes}m`;
        } else {
            this.totalTimeEl.textContent = `${this.totalMinutes}m`;
        }
    }
    
    showNotification(message) {
        this.notificationText.textContent = message;
        this.notification.classList.remove('translate-x-full');
        
        setTimeout(() => {
            this.notification.classList.add('translate-x-full');
        }, 3000);
    }
    
    playNotificationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        document.title = 'Birlikte Çalışalım - Pomodoro Timer';
    }
});

setInterval(() => {
    if (document.hidden && window.pomodoroTimer && window.pomodoroTimer.isRunning) {
        const minutes = Math.floor(window.pomodoroTimer.timeLeft / 60);
        const seconds = window.pomodoroTimer.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${timeString} - ${window.pomodoroTimer.isWorkSession ? 'Çalışma' : 'Mola'}`;
    }
}, 1000);
