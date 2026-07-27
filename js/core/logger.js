// js/core/logger.js

// ===== ПРОСТОЙ ЛОГГЕР С ВИЗУАЛЬНЫМ ОТОБРАЖЕНИЕМ =====

var Logger = {
    enabled: true,
    logs: [],
    maxLogs: 50,
    
    // ===== ОСНОВНОЙ МЕТОД ЛОГИРОВАНИЯ =====
    log: function(message, type) {
        if (!this.enabled) return;
        
        var timestamp = new Date().toLocaleTimeString();
        var logEntry = {
            time: timestamp,
            message: message,
            type: type || 'info'
        };
        
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Показываем в консоли (если она есть)
        try {
            if (type === 'error') {
                console.error('[' + timestamp + '] ' + message);
            } else if (type === 'warn') {
                console.warn('[' + timestamp + '] ' + message);
            } else {
                console.log('[' + timestamp + '] ' + message);
            }
        } catch (_) {}
        
        // Показываем на экране (маленькое уведомление)
        this.showToast(message, type);
    },
    
    // ===== ПОКАЗАТЬ УВЕДОМЛЕНИЕ НА ЭКРАНЕ =====
    showToast: function(message, type) {
        var colors = {
            info: 'rgba(100, 200, 255, 0.9)',
            warn: 'rgba(255, 200, 50, 0.9)',
            error: 'rgba(255, 80, 80, 0.9)',
            success: 'rgba(80, 255, 80, 0.9)'
        };
        
        var bgColor = colors[type] || colors.info;
        
        var toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-family: monospace;
            z-index: 9999;
            border-left: 3px solid ${bgColor};
            max-width: 90%;
            text-align: center;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        toast.textContent = '🔵 ' + message;
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '1';
        }, 50);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },
    
    // ===== СПЕЦИАЛЬНЫЕ МЕТОДЫ =====
    info: function(message) {
        this.log(message, 'info');
    },
    
    warn: function(message) {
        this.log(message, 'warn');
    },
    
    error: function(message) {
        this.log(message, 'error');
    },
    
    success: function(message) {
        this.log(message, 'success');
    },
    
    // ===== ПОКАЗАТЬ ВСЕ ЛОГИ =====
    showAll: function() {
        var text = '📋 ЛОГИ (' + this.logs.length + '):\n';
        text += '='.repeat(40) + '\n';
        for (var i = 0; i < this.logs.length; i++) {
            var entry = this.logs[i];
            text += '[' + entry.time + '] ' + entry.message + '\n';
        }
        alert(text);
    }
};

// ===== СОЗДАЁМ ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ =====
window.logger = Logger;

// ===== ПЕРЕХВАТЫВАЕМ console.log =====
var originalLog = console.log;
var originalWarn = console.warn;
var originalError = console.error;

console.log = function() {
    var args = Array.from(arguments);
    var message = args.join(' ');
    Logger.log(message, 'info');
    originalLog.apply(console, args);
};

console.warn = function() {
    var args = Array.from(arguments);
    var message = args.join(' ');
    Logger.log(message, 'warn');
    originalWarn.apply(console, args);
};

console.error = function() {
    var args = Array.from(arguments);
    var message = args.join(' ');
    Logger.log(message, 'error');
    originalError.apply(console, args);
};

Logger.info('📋 Логгер инициализирован!');