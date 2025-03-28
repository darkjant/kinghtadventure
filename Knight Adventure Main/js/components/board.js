/**
 * Componente del tablero de ajedrez
 * Maneja la creación, visualización y gestión del tablero
 */

import { calculateAdaptiveFontSize, isTablet } from '../utils/responsive.js';

export class Board {
    constructor(scene) {
        this.scene = scene;
        this.boardSize = 8;
        this.tileSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isMobile = window.innerWidth < 768;
        this.showCoordinates = !this.isMobile; // No mostrar coordenadas en móvil
    }

    /**
     * Crea y configura el tablero
     */
    create() {
        // Calcular tamaño óptimo de casillas
        this.calculateTileSize();
        
        // Configurar fondo del tablero
        this.createBoardBackground();
        
        // Crear etiquetas (A-H, 1-8) solo si no estamos en móvil
        if (this.showCoordinates) {
            this.createBoardLabels();
        }
        
        // Crear casillas
        this.createBoardSquares();
        
        return this;
    }

    /**
     * Calcula el tamaño ideal para las casillas del tablero
     */
    calculateTileSize() {
        // Obtener dimensiones del contenedor
        const gameWidth = this.scene.sys.game.canvas.width;
        const gameHeight = this.scene.sys.game.canvas.height;
        
        // Determinar orientación
        const isPortrait = gameHeight > gameWidth;
        
        // Determinar el espacio disponible (sin reservar espacio para etiquetas en móvil)
        const availableSpace = {
            width: gameWidth * (this.isMobile ? 0.98 : 0.9), // Más ancho en móvil
            height: gameHeight * (this.isMobile ? 0.85 : 0.75) // Más alto en móvil
        };
        
        // Reservar espacio para interfaz (menos espacio en móvil para etiquetas)
        const uiSpace = {
            top: 80, // Espacio para UI superior
            bottom: isPortrait ? (this.isMobile ? 60 : 100) : (this.isMobile ? 30 : 50)
        };
        
        // Calcular espacio efectivo
        const effectiveHeight = gameHeight - uiSpace.top - uiSpace.bottom;
        
        // Calcular tamaño óptimo
        let tileSize;
        
        if (isPortrait) {
            // En modo retrato, ajustar al ancho disponible
            tileSize = Math.min(
                availableSpace.width / this.boardSize,
                effectiveHeight / this.boardSize
            );
        } else {
            // En modo horizontal, usar proporción del espacio efectivo
            tileSize = Math.min(
                effectiveHeight / this.boardSize,
                availableSpace.width / this.boardSize
            );
        }
        
        // Garantizar un tamaño mínimo usable
        this.tileSize = Math.max(tileSize, 30);
        
        // Calcular posicionamiento del tablero
        this.calculateBoardPosition(isPortrait);
        
        return this.tileSize;
    }

    /**
     * Calcula la posición del tablero en la pantalla
     */
    calculateBoardPosition(isPortrait) {
        // Calcular dimensiones totales del tablero
        const boardWidth = this.boardSize * this.tileSize;
        const boardHeight = this.boardSize * this.tileSize;
        
        // Centrar horizontalmente - sin espacio extra para coordenadas en móvil
        this.offsetX = (this.scene.sys.game.canvas.width - boardWidth) / 2;
        
        // Posicionar verticalmente según orientación
        if (isPortrait) {
            // En modo vertical, posicionar más arriba
            this.offsetY = (this.scene.sys.game.canvas.height - boardHeight) * 0.4;
        } else {
            // En modo horizontal, centrar verticalmente
            this.offsetY = (this.scene.sys.game.canvas.height - boardHeight) / 2;
        }
        
        // Garantizar espacio mínimo para UI
        this.offsetY = Math.max(this.offsetY, 80);
        
        // Eliminar espacios para etiquetas en móvil
        if (this.isMobile) {
            // Reducir offsets para aumentar tamaño efectivo
            this.offsetX = Math.max(this.offsetX - (this.showCoordinates ? 0 : this.tileSize * 0.3), 0);
            this.offsetY = Math.max(this.offsetY - (this.showCoordinates ? 0 : this.tileSize * 0.3), 80);
        }
    }

    /**
     * Crea el fondo del tablero
     */
    createBoardBackground() {
        const boardWidth = this.boardSize * this.tileSize;
        const boardHeight = this.boardSize * this.tileSize;
        const isPortrait = this.scene.sys.game.canvas.height > this.scene.sys.game.canvas.width;
        
        // Crear rectángulo de fondo con borde (más ajustado en móvil)
        this.scene.add.rectangle(
            this.offsetX + (boardWidth / 2),
            this.offsetY + (boardHeight / 2),
            boardWidth + (this.isMobile ? 4 : (isPortrait ? 10 : 20)),
            boardHeight + (this.isMobile ? 4 : (isPortrait ? 10 : 20)),
            0x444444,
            1
        ).setOrigin(0.5).setStrokeStyle(this.isMobile ? 1 : 2, 0x333333).setDepth(0);
    }

    /**
     * Crea las etiquetas alrededor del tablero (A-H, 1-8)
     * Solo se llama si showCoordinates es true
     */
    createBoardLabels() {
        const letters = 'ABCDEFGH';
        
        // Calcular tamaño de fuente adaptativo
        const fontSize = calculateAdaptiveFontSize(this.tileSize);
        
        // Estilo para las etiquetas
        const labelStyle = {
            fontSize: fontSize,
            fill: '#fff',
            fontFamily: 'Arial',
            padding: { x: 2, y: 2 }
        };
        
        // Crear letras (A-H)
        for (let i = 0; i < this.boardSize; i++) {
            this.scene.add.text(
                this.offsetX + i * this.tileSize + this.tileSize / 2,
                this.offsetY + this.boardSize * this.tileSize + this.tileSize * 0.3,
                letters[i],
                labelStyle
            ).setOrigin(0.5).setDepth(5);
        }
        
        // Crear números (1-8)
        for (let i = 0; i < this.boardSize; i++) {
            this.scene.add.text(
                this.offsetX - this.tileSize * 0.3,
                this.offsetY + i * this.tileSize + this.tileSize / 2,
                (this.boardSize - i).toString(),
                labelStyle
            ).setOrigin(0.5).setDepth(5);
        }
    }

    /**
     * Crea las casillas del tablero
     */
    createBoardSquares() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const x = this.offsetX + col * this.tileSize;
                const y = this.offsetY + row * this.tileSize;
                
                // Alternar colores blanco y azul
                const color = ((row + col) % 2 === 0) ? 0xffffff : 0x4a90e2;
                
                // Crear casilla con borde (más ajustada en móvil)
                const tile = this.scene.add.rectangle(
                    x + this.tileSize / 2,
                    y + this.tileSize / 2,
                    this.isMobile ? this.tileSize : this.tileSize - 1,
                    this.isMobile ? this.tileSize : this.tileSize - 1,
                    color
                ).setDepth(1);
                
                // Añadir borde sutil (más fino en móvil)
                tile.setStrokeStyle(this.isMobile ? 0.5 : 1, 0x555555);
            }
        }
    }

    /**
     * Convierte coordenadas de pantalla a coordenadas del tablero
     */
    screenToBoard(x, y) {
        const col = Math.floor((x - this.offsetX) / this.tileSize);
        const row = Math.floor((y - this.offsetY) / this.tileSize);
        return { col, row };
    }

    /**
     * Convierte coordenadas del tablero a coordenadas de pantalla
     */
    boardToScreen(col, row) {
        const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
        const y = this.offsetY + row * this.tileSize + this.tileSize / 2;
        return { x, y };
    }

    /**
     * Verifica si un movimiento de caballo es válido
     */
    isValidKnightMove(fromCol, fromRow, toCol, toRow) {
        const dx = Math.abs(toCol - fromCol);
        const dy = Math.abs(toRow - fromRow);
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
    }

    /**
     * Verifica si una posición está dentro del tablero
     */
    isInsideBoard(col, row) {
        return col >= 0 && col < this.boardSize && row >= 0 && row < this.boardSize;
    }
}