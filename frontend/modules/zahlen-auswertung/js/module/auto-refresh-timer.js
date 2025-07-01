/**
 * Auto-Refresh Timer für Zahlen-Auswertung
 * Automatische Aktualisierung alle 60 Sekunden mit visuellem Countdown
 * Version: 1.0
 */

export class AutoRefreshTimer {
    constructor(refreshCallback) {
        this.duration = 60; // 60 Sekunden
        this.currentTime = this.duration;
        this.interval = null;
        this.isRunning = false;
        this.isPaused = false;
        this.refreshCallback = refreshCallback;
        
        this.timerButton = document.getElementById('auto-refresh-timer');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerIcon = document.getElementById('timer-icon');
        
        this.setupVisibilityHandling();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        this.interval = setInterval(() => {
            if (this.isPaused) return;
            
            this.currentTime--;
            this.updateDisplay();
            
            // Bei 0 automatisch aktualisieren
            if (this.currentTime <= 0) {
                this.triggerRefresh();
            }
            
        }, 1000);
        
        console.log('⏰ Auto-Refresh Timer gestartet (60s)');
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        this.isPaused = false;
        console.log('⏰ Auto-Refresh Timer gestoppt');
    }
    
    reset() {
        this.currentTime = this.duration;
        this.updateDisplay();
        console.log('⏰ Auto-Refresh Timer zurückgesetzt');
    }
    
    pause() {
        this.isPaused = true;
        if (this.timerButton) {
            this.timerButton.classList.add('btn-outline-warning');
            this.timerButton.classList.remove('btn-outline-success');
            this.timerButton.title = 'Timer pausiert (Tab nicht sichtbar)';
        }
        console.log('⏰ Auto-Refresh Timer pausiert (Tab nicht sichtbar)');
    }
    
    resume() {
        this.isPaused = false;
        if (this.timerButton) {
            this.timerButton.classList.remove('btn-outline-warning');
            this.timerButton.classList.add('btn-outline-success');
        }
        this.updateDisplay();
        console.log('⏰ Auto-Refresh Timer fortgesetzt (Tab sichtbar)');
    }
    
    async triggerRefresh() {
        console.log('🔄 Auto-Refresh ausgelöst');
        
        // Visuelles Feedback
        if (this.timerIcon) {
            this.timerIcon.classList.add('spinning');
        }
        if (this.timerButton) {
            this.timerButton.classList.add('btn-success');
            this.timerButton.classList.remove('btn-outline-success');
            this.timerButton.title = 'Aktualisierung läuft...';
        }
        if (this.timerDisplay) {
            this.timerDisplay.textContent = '...';
        }
        
        try {
            // Refresh-Callback aufrufen
            if (this.refreshCallback) {
                await this.refreshCallback();
            }
            
            this.reset();
            
            // Visual Reset nach 2 Sekunden
            setTimeout(() => {
                if (this.timerIcon) {
                    this.timerIcon.classList.remove('spinning');
                }
                if (this.timerButton) {
                    this.timerButton.classList.remove('btn-success');
                    this.timerButton.classList.add('btn-outline-success');
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Auto-Refresh Fehler:', error);
            this.reset();
            
            if (this.timerIcon) {
                this.timerIcon.classList.remove('spinning');
            }
            if (this.timerButton) {
                this.timerButton.classList.remove('btn-success');
                this.timerButton.classList.add('btn-outline-danger');
                this.timerButton.title = 'Fehler beim Aktualisieren';
            }
            
            setTimeout(() => {
                if (this.timerButton) {
                    this.timerButton.classList.remove('btn-outline-danger');
                    this.timerButton.classList.add('btn-outline-success');
                }
            }, 3000);
        }
    }
    
    updateDisplay() {
        if (!this.timerDisplay) return;
        
        this.timerDisplay.textContent = `${this.currentTime}s`;
        
        // Farbwechsel basierend auf verbleibender Zeit
        if (this.timerButton) {
            if (this.currentTime <= 10) {
                this.timerButton.classList.add('btn-outline-warning');
                this.timerButton.classList.remove('btn-outline-success');
            } else {
                this.timerButton.classList.remove('btn-outline-warning');
                this.timerButton.classList.add('btn-outline-success');
            }
            
            // Progress in Button-Title
            const progress = Math.round((this.currentTime / this.duration) * 100);
            this.timerButton.title = `Automatische Aktualisierung in ${this.currentTime}s (${progress}%)`;
        }
    }
    
    setupVisibilityHandling() {
        // Page Visibility API für Timer-Pause
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Window Blur/Focus Events als Fallback
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }
    
    setupEventListeners() {
        // Click Handler für Timer-Button (manuell zurücksetzen)
        if (this.timerButton) {
            this.timerButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.reset();
                console.log('🔄 Timer manuell zurückgesetzt');
            });
        }
    }
    
    // Cleanup-Methode
    destroy() {
        this.stop();
        
        // Event-Listener entfernen
        if (this.timerButton) {
            this.timerButton.replaceWith(this.timerButton.cloneNode(true));
        }
        
        console.log('⏰ Auto-Refresh Timer zerstört');
    }
}

// CSS für Spinning-Animation über JavaScript hinzufügen
if (!document.querySelector('#auto-refresh-styles')) {
    const style = document.createElement('style');
    style.id = 'auto-refresh-styles';
    style.textContent = `
        .spinning {
            animation: spin 1s linear infinite !important;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        #auto-refresh-timer {
            transition: all 0.3s ease;
        }
        
        #auto-refresh-timer:hover {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
} 