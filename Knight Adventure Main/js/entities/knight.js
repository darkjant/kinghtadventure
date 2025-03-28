/**
 * Entidad del caballo de ajedrez
 * Maneja la lógica y visualización del caballo
 */

export class Knight {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.sprite = null;
        this.col = 4; // Posición inicial en e4
        this.row = 4;
        this.canMove = true;
    }

    /**
     * Crea y posiciona la pieza del caballo
     */
    create() {
        // Obtener posición en pantalla
        const { x, y } = this.board.boardToScreen(this.col, this.row);
        
        // Calcular escala basada en tamaño de casilla
        const scale = this.board.tileSize / 50;
        
        // Crear sprite del caballo
        this.sprite = this.scene.add.image(x, y, 'knight')
            .setScale(scale)
            .setDepth(10);
            
        return this;
    }

    /**
     * Mueve el caballo a una nueva posición
     */
    moveTo(newCol, newRow, onComplete = null) {
        if (!this.canMove || this.scene.gameOver) return false;
        
        // Verificar si es un movimiento válido de caballo
        if (!this.board.isValidKnightMove(this.col, this.row, newCol, newRow)) {
            return false;
        }
        
        // Bloquear movimientos mientras se anima
        this.canMove = false;
        
        // Configuración de la animación
        const moveDuration = 500;
        const moveEase = 'Power2';
        
        // Obtener nueva posición en pantalla
        const { x: newX, y: newY } = this.board.boardToScreen(newCol, newRow);
        
        // Reproducir sonido de movimiento
        this.scene.audioManager.playSound('move');
        
        // Verificar si saltó a una casilla donde puede ser capturado
        const willBeCapturadInNewPosition = this.willBeCapturedAt(newCol, newRow);
        
        // Animar movimiento
        this.scene.tweens.add({
            targets: this.sprite,
            x: newX,
            y: newY,
            duration: moveDuration,
            ease: moveEase,
            onComplete: () => {
                // Actualizar posición lógica
                this.col = newCol;
                this.row = newRow;
                
                // Ejecutar callback si se proporcionó
                if (onComplete) onComplete(newCol, newRow);
                
                // Si salta a una casilla donde será capturado
                if (willBeCapturadInNewPosition) {
                    // Mantener bloqueado y permitir captura inmediata
                    this.scene.pawnManager.captureKnightImmediately();
                } else {
                    // Si no hay peligro, restaurar capacidad de movimiento
                    this.canMove = true;
                }
            }
        });
        
        return true;
    }
    
    /**
     * Verifica si el caballo será capturado en la posición indicada
     */
    willBeCapturedAt(col, row) {
        // Verificar si hay peones que puedan capturar en esta posición
        return this.scene.pawnManager.canCaptureKnightAt(col, row);
    }
    
    /**
     * Maneja un intento de movimiento del usuario
     */
    handleMovementAttempt(pointerX, pointerY) {
        if (!this.canMove || this.scene.gameOver) return false;
        
        // Convertir posición del puntero a coordenadas del tablero
        const { col, row } = this.board.screenToBoard(pointerX, pointerY);
        
        // Verificar que está dentro del tablero
        if (!this.board.isInsideBoard(col, row)) return false;
        
        // Intentar mover el caballo
        return this.moveTo(col, row, (newCol, newRow) => {
            // Después del movimiento, verificar capturas de peones
            this.scene.checkCaptures(newCol, newRow);
        });
    }

    /**
     * Oculta el sprite del caballo
     */
    hide() {
        if (this.sprite) {
            this.sprite.setVisible(false);
        }
    }
    
    /**
     * Obtiene la posición actual
     */
    getPosition() {
        return { col: this.col, row: this.row };
    }
}