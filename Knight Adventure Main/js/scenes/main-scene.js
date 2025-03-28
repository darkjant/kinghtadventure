/**
 * Escena principal del juego
 * Maneja la lógica central y coordina todos los componentes
 */

import { Board } from '../components/board.js';
import { Knight } from '../entities/knight.js';
import { PawnManager } from '../entities/pawn.js';
import { AudioManager } from '../components/audio-manager.js';
import { isIOS } from '../utils/responsive.js';
import { levelConfig, levelThresholds } from '../core/game-config.js';
import { saveHighScore } from '../data/score-manager.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        
        // Variables de estado del juego
        this.score = 0;
        this.gameOver = false;
        this.level = 1;
        this.startTime = 0;
        
        // Referencias a componentes
        this.board = null;
        this.knight = null;
        this.pawnManager = null;
        this.audioManager = null;
        
        // Referencias a elementos UI
        this.timeText = null;
        this.scoreText = null;
        this.levelText = null;
    }

    /**
     * Carga de recursos
     */
    preload() {
        // Imágenes
        this.load.image('knight', 'assets/knight.png');
        this.load.image('pawn', 'assets/pawn.png');
        
        // Efectos de sonido
        this.load.audio('move-self', 'assets/sounds/move-self.mp3');
        this.load.audio('capture', 'assets/sounds/capture.mp3');
        this.load.audio('pawnSpawn', 'assets/sounds/pawnSpawn.mp3');
        this.load.audio('PawnMove', 'assets/sounds/PawnMove.mp3');
        this.load.audio('game-lose-long', 'assets/sounds/game-lose-long.mp3');
        this.load.audio('levelUp', 'assets/sounds/levelUp.mp3');
        this.load.audio('illegal', 'assets/sounds/illegal.mp3');
        this.load.audio('game-start', 'assets/sounds/game-start.mp3');
        
        // Música de fondo
        this.load.audio('bgMusic1', 'assets/sounds/bgMusic1.mp3');
        this.load.audio('bgMusic2', 'assets/sounds/bgMusic2.mp3');
        this.load.audio('bgMusic3', 'assets/sounds/bgMusic3.mp3');
        this.load.audio('bgMusic4', 'assets/sounds/bgMusic4.mp3');
        this.load.audio('bgMusic5', 'assets/sounds/bgMusic5.mp3');
        this.load.audio('bgMusic6', 'assets/sounds/bgMusic6.mp3');
    }

    /**
     * Inicialización y creación de componentes
     */
    create() {
        // Inicializar tiempo
        this.startTime = this.time.now;
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        
        // Crear componentes en orden
        this.audioManager = new AudioManager(this).create();
        this.board = new Board(this).create();
        this.setupUI();
        this.knight = new Knight(this, this.board).create();
        this.pawnManager = new PawnManager(this, this.board, this.knight).create();
        
        // Configurar entrada
        this.setupInput();
        
        // En iOS, forzar scroll hacia arriba
        if (isIOS()) {
            setTimeout(() => window.scrollTo(0, 1), 200);
        }
    }

    /**
     * Lógica que se ejecuta cada fotograma
     */
    update() {
        if (this.gameOver) return;

        // Actualizar tiempo
        this.updateTimer();
        
        // Actualizar nivel según puntuación
        this.updateLevel();
    }

    /**
     * Configura la interfaz de usuario
     */
    setupUI() {
        const isPortrait = this.sys.game.canvas.height > this.sys.game.canvas.width;
        
        // Determinar tamaño de fuente adaptativo
        const baseFontSize = Math.min(
            this.sys.game.canvas.width * 0.05,
            this.sys.game.canvas.height * 0.03
        );
        
        const fontSize = Math.min(Math.max(baseFontSize, 16), 36) + 'px';
        
        // Estilo para textos
        const uiStyle = {
            fontSize: fontSize,
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        };
        
        // Posicionamiento
        const centerX = this.sys.game.canvas.width / 2;
        const topOffset = 5;
        const line2Y = 40;
        const spacing = this.sys.game.canvas.width * 0.25;
        
        // Crear textos informativos
        this.timeText = this.add.text(centerX, topOffset, '⏱️ 0:00.0', uiStyle)
            .setOrigin(0.5, 0).setDepth(11);
        
        this.scoreText = this.add.text(centerX - spacing, line2Y, '♟️ 0', uiStyle)
            .setOrigin(0.5, 0).setDepth(11);
        
        this.levelText = this.add.text(centerX + spacing, line2Y, '📶 1', uiStyle)
            .setOrigin(0.5, 0).setDepth(11);
        
        // Fondo para UI
        const uiWidth = isPortrait ? this.sys.game.canvas.width * 0.95 : this.sys.game.canvas.width * 0.8;
        
        this.add.rectangle(
            centerX,
            40,
            uiWidth,
            80,
            0x222222,
            0.95
        ).setOrigin(0.5).setStrokeStyle(2, 0x444444).setDepth(10);
    }

    /**
     * Configura la entrada de usuario
     */
    setupInput() {
        this.input.on('pointerdown', (pointer) => {
            // Intentar mover el caballo
            const success = this.knight.handleMovementAttempt(pointer.x, pointer.y);
            
            // Si el movimiento es inválido, reproducir sonido
            if (!success && !this.gameOver && this.knight.canMove) {
                this.audioManager.playSound('illegal');
            }
        });
    }

    /**
     * Verifica capturas de peones después de un movimiento
     */
    checkCaptures(col, row) {
        if (this.pawnManager.tryCapturePawnAt(col, row)) {
            // Incrementar puntuación
            this.score++;
            this.scoreText.setText(`♟️ ${this.score}`);
        }
    }

    /**
     * Actualiza el nivel basado en la puntuación
     */
    updateLevel() {
        // Determinar nuevo nivel basado en puntuación
        let newLevel = 1;
        
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (this.score >= levelThresholds[i]) {
                newLevel = i + 1;
                break;
            }
        }
        
        // Si hay cambio de nivel
        if (newLevel !== this.level) {
            // Actualizar nivel
            this.level = newLevel;
            
            // Actualizar texto
            this.levelText.setText(`📶 ${this.level}`);
            
            // Obtener configuración del nuevo nivel
            const [spawnRate, moveDelay, maxPawns] = levelConfig[this.level];
            
            // Actualizar configuración de peones
            this.pawnManager.updateSettings(spawnRate, moveDelay, maxPawns);
            
            // Reproducir sonido de subida de nivel
            this.audioManager.playSound('levelUp');
        }
    }

    /**
     * Actualiza el temporizador
     */
    updateTimer() {
        const elapsedTime = (this.time.now - this.startTime) / 1000;
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);
        const tenths = Math.floor((elapsedTime * 10) % 10);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
        
        this.timeText.setText(`⏱️ ${formattedTime}`);
    }

    /**
     * Maneja el fin del juego
     */
    endGame() {
        this.gameOver = true;
        
        // Pausar música
        this.audioManager.pauseMusic();
        
        // Mostrar panel de resultados
        this.displayEndGamePanel();
        
        // Guardar puntuación
        saveHighScore(this.score);
    }

    /**
     * Muestra el panel de fin de juego
     */
    displayEndGamePanel() {
        // Calcular tiempo final
        const elapsedTime = (this.time.now - this.startTime) / 1000;
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);
        const tenths = Math.floor((elapsedTime * 10) % 10);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;

        // Dimensiones adaptativas
        const panelWidth = Math.min(this.sys.game.canvas.width * 0.8, 400);
        const panelHeight = Math.min(this.sys.game.canvas.height * 0.6, 300);

        // Overlay oscuro
        this.add.rectangle(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2,
            this.sys.game.canvas.width,
            this.sys.game.canvas.height,
            0x000000, 
            0.7
        ).setOrigin(0.5).setDepth(90);

        // Panel
        this.add.rectangle(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2,
            panelWidth, 
            panelHeight, 
            0x222222
        ).setOrigin(0.5).setStrokeStyle(4, 0xffffff).setDepth(91);

        // Tamaños de fuente adaptativos
        const titleSize = Math.min(Math.max(panelWidth * 0.06, 20), 36) + 'px';
        const textSize = Math.min(Math.max(panelWidth * 0.05, 16), 30) + 'px';
        const buttonSize = Math.min(Math.max(panelWidth * 0.05, 18), 32) + 'px';

        // Título
        this.add.text(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2 - panelHeight * 0.35,
            "Juego Terminado",
            { fontSize: titleSize, fill: '#FFD700', fontFamily: 'Roboto', align: 'center' }
        ).setOrigin(0.5).setDepth(92);

        // Resultados
        this.add.text(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2 - panelHeight * 0.15,
            `Peones capturados: ${this.score}`,
            { fontSize: textSize, fill: '#ffffff', fontFamily: 'Roboto', align: 'center' }
        ).setOrigin(0.5).setDepth(92);

        this.add.text(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2,
            `Tiempo: ${formattedTime}`,
            { fontSize: textSize, fill: '#ffffff', fontFamily: 'Roboto', align: 'center' }
        ).setOrigin(0.5).setDepth(92);

        this.add.text(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2 + panelHeight * 0.15,
            `Nivel alcanzado: ${this.level}`,
            { fontSize: textSize, fill: '#ffffff', fontFamily: 'Roboto', align: 'center' }
        ).setOrigin(0.5).setDepth(92);

        // Botón de reinicio
        const restartButton = this.add.text(
            this.sys.game.canvas.width / 2,
            this.sys.game.canvas.height / 2 + panelHeight * 0.35,
            "Reiniciar",
            {
                fontSize: buttonSize,
                fill: '#FFFFFF',
                backgroundColor: '#1E90FF',
                padding: { x: 15, y: 10 }
            }
        ).setOrigin(0.5).setInteractive().setDepth(92);

        // Eventos del botón
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
        
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ fill: '#FFD700' });
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ fill: '#FFFFFF' });
        });
    }
}