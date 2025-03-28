/**
 * Gestión de los peones
 * Maneja la lógica y visualización de los peones enemigos
 */

export class PawnManager {
    constructor(scene, board, knight) {
        this.scene = scene;
        this.board = board;
        this.knight = knight;
        this.pawns = null;
        this.pawnScale = 0;
        this.spawnRate = 5000; // Tiempo entre generaciones (ms)
        this.moveDelay = 3000; // Tiempo entre movimientos (ms)
        this.maxPawns = 3;     // Máximo peones en pantalla
        this.peonsQueAmenazanAlCaballo = []; // Peones que pueden capturar al caballo
    }

    /**
     * Configura el sistema de peones
     */
    create() {
        // Crear grupo para los peones
        this.pawns = this.scene.add.group();
        
        // Calcular escala basada en tamaño de casilla
        this.pawnScale = this.board.tileSize / 50;
        
        // Generar primer peón
        this.spawnPawn();
        
        // Configurar generación periódica
        this.setupSpawnTimer();
        
        return this;
    }

    /**
     * Configura el temporizador para la generación de peones
     */
    setupSpawnTimer() {
        this.scene.time.addEvent({
            delay: this.spawnRate,
            callback: () => {
                if (!this.scene.gameOver) {
                    if (this.pawns.countActive(true) < this.maxPawns) {
                        this.spawnPawn();
                    }
                    
                    // Generar otro peón después de un tiempo si hay espacio
                    this.scene.time.delayedCall(this.spawnRate, () => {
                        if (!this.scene.gameOver && this.pawns.countActive(true) < this.maxPawns) {
                            this.spawnPawn();
                        }
                    });
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Genera un nuevo peón en el tablero
     */
    spawnPawn() {
        // Verificar si se pueden generar más peones
        if (this.pawns.countActive(true) >= this.maxPawns || this.scene.gameOver) {
            return null;
        }

        const spawnRow = -1;  // Fila inicial (fuera del tablero)
        const finalRow = 8;   // Fila final

        // Encontrar columnas ocupadas por peones existentes
        let occupiedColumns = new Set();
        this.pawns.children.each(p => {
            let pCol = Math.floor((p.x - this.board.offsetX) / this.board.tileSize);
            occupiedColumns.add(pCol);
        });

        // Determinar columnas disponibles
        let availableColumns = [];
        for (let i = 0; i < this.board.boardSize; i++) {
            if (!occupiedColumns.has(i)) {
                availableColumns.push(i);
            }
        }
        
        // Si no hay columnas disponibles, salir
        if (availableColumns.length === 0) {
            return null;
        }

        // Seleccionar columna aleatoria disponible
        let col = Phaser.Math.RND.pick(availableColumns);
        
        // Calcular posición en pantalla
        let { x, y } = this.board.boardToScreen(col, spawnRow);

        // Crear peón y añadirlo al grupo
        let pawn = this.scene.add.image(x, y, 'pawn')
            .setScale(this.pawnScale)
            .setDepth(8);
        
        // Guardar posición lógica y estado
        pawn.boardCol = col;
        pawn.boardRow = spawnRow;
        pawn.canCaptureKnight = false;  // Indicador de que puede capturar al caballo
        pawn.waitingToCapture = false;  // Indicador de que está esperando para capturar
            
        this.pawns.add(pawn);
        
        // Sonido de aparición
        this.scene.audioManager.playSound('spawn');
        
        // Iniciar movimiento
        this.startPawnMovement(pawn, col, spawnRow, finalRow);
        
        return pawn;
    }

    /**
     * Controla el movimiento de un peón
     */
    startPawnMovement(pawn, col, row, finalRow) {
        this.scene.time.delayedCall(this.moveDelay, () => this.moveStep(pawn, col, row, finalRow));
    }

    /**
     * Lógica para un paso de movimiento de peón
     */
    moveStep(pawn, col, row, finalRow) {
        if (row >= finalRow || this.scene.gameOver || !this.pawns.contains(pawn)) return;

        const nextRow = row + 1;
        
        // Verificar si hay un caballo en posición de ser capturado (de movimiento anterior)
        if (pawn.waitingToCapture) {
            const knightPos = this.knight.getPosition();
            
            // Si el caballo sigue en la misma posición, lo capturamos
            if (this.canPawnCaptureKnightAt(col, row, knightPos.col, knightPos.row)) {
                this.capturePawn(pawn, knightPos.col, knightPos.row);
                return;
            } else {
                // El caballo escapó, reiniciar bandera
                pawn.waitingToCapture = false;
                pawn.canCaptureKnight = false;
            }
        }
        
        // Verificar si el peón puede avanzar
        if (this.canAdvanceTo(col, nextRow)) {
            // Verificar si al avanzar podría capturar al caballo
            const knightPos = this.knight.getPosition();
            const willBeAbleToCapture = this.canPawnCaptureKnightAt(col, nextRow, knightPos.col, knightPos.row);

            // Avanzar normalmente
            this.advancePawn(pawn, col, row, nextRow, finalRow, willBeAbleToCapture);
        } else {
            // Peón bloqueado, reintentar más tarde
            this.scene.time.delayedCall(this.moveDelay, () => this.moveStep(pawn, col, row, finalRow));
        }
    }

    /**
     * Verifica si un peón puede avanzar a una posición
     */
    canAdvanceTo(col, row) {
        // Verificar si hay otro peón bloqueando
        let isBlocked = false;
        
        this.pawns.children.each(otherPawn => {
            const oCol = Math.floor((otherPawn.x - this.board.offsetX) / this.board.tileSize);
            const oRow = Math.floor((otherPawn.y - this.board.offsetY) / this.board.tileSize);
            
            if (oCol === col && oRow === row) {
                isBlocked = true;
            }
        });
        
        // Verificar si el caballo bloquea
        const knightPos = this.knight.getPosition();
        if (knightPos.col === col && knightPos.row === row) {
            isBlocked = true;
        }
        
        return !isBlocked;
    }

    /**
     * Verifica si un peón en (pawnCol, pawnRow) puede capturar un caballo en (knightCol, knightRow)
     */
    canPawnCaptureKnightAt(pawnCol, pawnRow, knightCol, knightRow) {
        // Los peones capturan en diagonal hacia adelante
        return (knightCol === pawnCol - 1 || knightCol === pawnCol + 1) && 
               knightRow === pawnRow + 1;
    }

    /**
     * Avanza un peón una casilla
     */
    advancePawn(pawn, col, row, nextRow, finalRow, willBeAbleToCapture) {
        const pawnMoveDuration = 700;
        
        // Calcular nueva posición
        const { y: newY } = this.board.boardToScreen(col, nextRow);
        
        // Actualizar la posición lógica en el peón
        pawn.boardCol = col;
        pawn.boardRow = nextRow;
        
        // Animar movimiento
        this.scene.tweens.add({
            targets: pawn,
            y: newY,
            duration: pawnMoveDuration,
            ease: 'Power1',
            onComplete: () => {
                // Si el peón llega al final, terminar juego
                if (nextRow === finalRow && this.pawns.contains(pawn)) {
                    this.scene.audioManager.playSound('lose');
                    this.scene.endGame();
                } else {
                    // Sonido de movimiento
                    this.scene.audioManager.playSound('pawnMove');
                    
                    // Si después de moverse puede capturar al caballo, marcar para capturar en el próximo turno
                    if (willBeAbleToCapture) {
                        pawn.canCaptureKnight = true;
                        pawn.waitingToCapture = true;
                        
                        // Almacenar este peón en la lista de amenazas
                        this.peonsQueAmenazanAlCaballo.push(pawn);
                    }
                    
                    // Programar siguiente movimiento
                    this.scene.time.delayedCall(
                        this.moveDelay, 
                        () => this.moveStep(pawn, col, nextRow, finalRow)
                    );
                }
            }
        });
    }

    /**
     * Anima un peón capturando al caballo
     */
    capturePawn(pawn, knightCol, knightRow) {
        // Bloquear movimiento del caballo
        this.knight.canMove = false;
        
        // Calcular posición del caballo
        const { x: knightX, y: knightY } = this.board.boardToScreen(knightCol, knightRow);
        
        // Reproducir sonido de fin de juego
        this.scene.audioManager.playSound('lose');
        
        // Animar captura
        this.scene.tweens.add({
            targets: pawn,
            x: knightX,
            y: knightY,
            duration: 500,
            ease: 'Power1',
            onComplete: () => {
                // Ocultar caballo
                this.knight.hide();
                
                // Fin del juego
                this.scene.endGame();
            }
        });
    }

    /**
     * Verifica si algún peón puede capturar al caballo en la posición especificada
     */
    canCaptureKnightAt(col, row) {
        let canCapture = false;
        
        // Verificar cada peón
        this.pawns.children.each(pawn => {
            // Obtener posición del peón
            const pawnCol = pawn.boardCol !== undefined ? pawn.boardCol : 
                        Math.floor((pawn.x - this.board.offsetX) / this.board.tileSize);
            const pawnRow = pawn.boardRow !== undefined ? pawn.boardRow : 
                        Math.floor((pawn.y - this.board.offsetY) / this.board.tileSize);
            
            // Verificar si el peón puede capturar al caballo en la posición especificada
            if (this.canPawnCaptureKnightAt(pawnCol, pawnRow, col, row)) {
                canCapture = true;
            }
        });
        
        return canCapture;
    }
    
    /**
     * Busca y captura al caballo inmediatamente con el peón más cercano
     * Se llama cuando el caballo salta a una posición peligrosa
     */
    captureKnightImmediately() {
        if (this.scene.gameOver) return;
        
        const knightPos = this.knight.getPosition();
        let capturingPawn = null;
        let closestDistance = Infinity;
        
        // Buscar el peón más cercano que pueda capturar
        this.pawns.children.each(pawn => {
            const pawnCol = pawn.boardCol !== undefined ? pawn.boardCol : 
                        Math.floor((pawn.x - this.board.offsetX) / this.board.tileSize);
            const pawnRow = pawn.boardRow !== undefined ? pawn.boardRow : 
                        Math.floor((pawn.y - this.board.offsetY) / this.board.tileSize);
            
            if (this.canPawnCaptureKnightAt(pawnCol, pawnRow, knightPos.col, knightPos.row)) {
                // Calcular distancia
                const dx = Math.abs(pawnCol - knightPos.col);
                const dy = Math.abs(pawnRow - knightPos.row);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    capturingPawn = pawn;
                }
            }
        });
        
        // Si encontramos un peón capturador, ejecutar captura
        if (capturingPawn) {
            this.capturePawn(capturingPawn, knightPos.col, knightPos.row);
        }
    }

    /**
     * Intenta capturar un peón en una posición específica
     * Retorna verdadero si se capturó algún peón
     */
    tryCapturePawnAt(col, row) {
        let captured = false;
        const { x: targetX, y: targetY } = this.board.boardToScreen(col, row);
        const captureDist = this.board.tileSize / 2;
        
        // Verificar cada peón
        this.pawns.children.each(pawn => {
            const dist = Phaser.Math.Distance.Between(pawn.x, pawn.y, targetX, targetY);
            
            if (dist < captureDist) {
                // Eliminar peón de la lista de amenazas si estaba allí
                this.peonsQueAmenazanAlCaballo = this.peonsQueAmenazanAlCaballo.filter(p => p !== pawn);
                
                // Eliminar peón
                pawn.destroy();
                
                // Marcar como capturado
                captured = true;
                
                // Sonido de captura
                this.scene.audioManager.playSound('capture');
                
                // Generar nuevo peón
                this.spawnPawn();
            }
        });
        
        return captured;
    }

    /**
     * Actualiza parámetros de generación de peones según nivel
     */
    updateSettings(spawnRate, moveDelay, maxPawns) {
        this.spawnRate = spawnRate;
        this.moveDelay = moveDelay;
        this.maxPawns = maxPawns;
    }
}