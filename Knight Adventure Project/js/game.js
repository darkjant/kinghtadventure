/*********************************************************
 * CONFIGURACION DEL JUEGO
 *********************************************************/
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#555',
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// ⚠️ No crees el Phaser.Game aquí. Se creará en showGame() del index.html
// EJEMPLO: const game = new Phaser.Game(config);


function isValidKnightMove(oldX, oldY, newX, newY) {
    const dx = Math.abs(newX - oldX);
    const dy = Math.abs(newY - oldY);
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}





/*********************************************************
 * PRELOAD: Cargar Assets
 *********************************************************/
function preload() {
    this.load.image('knight', 'assets/knight.png');
    this.load.image('pawn', 'assets/pawn.png');
}

/*********************************************************
 * CREATE: Inicializacion de la Escena
 *********************************************************/
function create() {
    console.log("Creando tablero...");

    // Variables de estado
    this.score = 0;
    this.gameOver = false;
    this.endGame = endGame.bind(this);
    this.update = update.bind(this);
    this.startTime = this.time.now;
    this.currentLevel = 1;
    this.canMove = true;

    // Configuracion de peones
    this.pawnSpawnRate = 5000;
    this.pawnMoveDelay = 3000;
    this.maxPawns = 3;

    // Barra superior UI
    const uiBackground = this.add.rectangle(
        this.sys.game.config.width / 2, 40,
        this.sys.game.config.width - 40, 80,
        0x444444, 0.5
    ).setOrigin(0.5);

    const centerX = this.sys.game.config.width / 2;
    const baseY   = 40;
    const spacing = 150;

    const uiStyle = {
        fontSize: '1.8em',
        fill: '#fff',
        fontFamily: 'Roboto'
    };

    // Textos de UI
    this.timeText = this.add.text(centerX, baseY, 'Tiempo: 0:00.0', uiStyle).setOrigin(0.5, 0);
    this.scoreText = this.add.text(centerX - spacing, baseY, 'Peones capturados: 0', uiStyle).setOrigin(0.5, 0);
    this.levelText = this.add.text(centerX + spacing, baseY, 'Nivel: 1', uiStyle).setOrigin(0.5, 0);

    // Configurar Tablero
    const boardSize = 8;
    const tileSize = Math.min(this.sys.game.config.width, this.sys.game.config.height) / (boardSize + 4);
    const offsetX = (this.sys.game.config.width - boardSize * tileSize) / 2;
    const offsetY = (this.sys.game.config.height - boardSize * tileSize) / 2;

    this.boardSize = boardSize;
    this.tileSize = tileSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // Fondo detras del tablero
    const backgroundRect = this.add.rectangle(
        offsetX + (boardSize * tileSize) / 2,
        offsetY + (boardSize * tileSize) / 2,
        boardSize * tileSize + 150,
        boardSize * tileSize + 150,
        0x444444
    ).setOrigin(0.5);

    // Letras A-H debajo del tablero y numeros 1-8 a la izquierda
    const letters = 'ABCDEFGH';
    const smallStyle = {
        fontSize: '1.5em',
        fill: '#fff',
        backgroundColor: 'rgba(0,0,0,0)',
        padding: { x: 3, y: 3 },
        fontFamily: 'Roboto'
    };

    for (let i = 0; i < boardSize; i++) {
        // Letras (columnas) debajo
        this.add.text(
            offsetX + i * tileSize + tileSize / 2, 
            offsetY + boardSize * tileSize + tileSize / 4,
            letters[i],
            smallStyle
        ).setOrigin(0.5);

        // Números (filas) a la izquierda
        this.add.text(
            offsetX - tileSize / 2,
            offsetY + i * tileSize + tileSize / 2,
            (boardSize - i).toString(),
            smallStyle
        ).setOrigin(0.5);
    }

    // Dibujar el propio tablero
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const x = offsetX + col * tileSize;
            const y = offsetY + row * tileSize;
            const color = ((row + col) % 2 === 0) ? 0xffffff : 0x4a90e2;
            const tile = this.add.rectangle(
                x + tileSize / 2,
                y + tileSize / 2,
                tileSize,
                tileSize,
                color
            );
            tile.setStrokeStyle(2, 0x555555);
        }
    }

    // Caballo (inicial en e4)
    this.knightX = 4;
    this.knightY = 4;
    const knightXPos = offsetX + this.knightX * tileSize + tileSize / 2;
    const knightYPos = offsetY + this.knightY * tileSize + tileSize / 2;
    this.knight = this.add.image(knightXPos, knightYPos, 'knight').setScale(tileSize / 50);

    // Peones
    this.pawns = this.add.group();
    this.spawnPawn = spawnPawn.bind(this);
    this.moveKnight = moveKnight.bind(this);

    // Primer peón
    this.spawnPawn();

    // Generación dinámica de peones
    this.time.addEvent({
        delay: this.pawnSpawnRate,
        callback: () => {
            if (!this.gameOver) {
                if (this.pawns.countActive(true) < this.maxPawns) {
                    this.spawnPawn();
                }
                this.time.delayedCall(this.pawnSpawnRate, () => {
                    if (!this.gameOver && this.pawns.countActive(true) < this.maxPawns) {
                        this.spawnPawn();
                    }
                });
            }
        },
        callbackScope: this,
        loop: true
    });

    // Manejar input para mover el caballo
    this.input.on('pointerdown', (pointer) => {
        if (!this.canMove || this.gameOver) return;

        const col = Math.floor((pointer.x - offsetX) / tileSize);
        const row = Math.floor((pointer.y - offsetY) / tileSize);

        if (col < 0 || col > 7 || row < 0 || row > 7) return;

        if (isValidKnightMove(this.knightX, this.knightY, col, row)) {
            this.moveKnight(col, row);
        }
    });
}

/*********************************************************
 * UPDATE: Lógica que se ejecuta en cada frame
 *********************************************************/
function update() {
    if (this.gameOver) return;

    // Calcular tiempo transcurrido (min, seg, décimas)
    const elapsedTime = (this.time.now - this.startTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const tenths = Math.floor((elapsedTime * 10) % 10);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;

    // Actualizar UI
    this.timeText.setText(`Tiempo: ${formattedTime}`);
    this.scoreText.setText(`Peones: ${this.score}`);
    this.levelText.setText(`Nivel: ${this.currentLevel}`);

    // Ajustar dificultad según peones capturados
    let newLevel = 1;
    if (this.score >= 27) {
        this.pawnSpawnRate = 1500;
        this.pawnMoveDelay = 2000;
        this.maxPawns = 6;
        newLevel = 10;
    } else if (this.score >= 24) {
        this.pawnSpawnRate = 1500;
        this.pawnMoveDelay = 2000;
        this.maxPawns = 5;
        newLevel = 9;
    } else if (this.score >= 21) {
        this.pawnSpawnRate = 2000;
        this.pawnMoveDelay = 2000;
        this.maxPawns = 5;
        newLevel = 8;
    } else if (this.score >= 18) {
        this.pawnSpawnRate = 2000;
        this.pawnMoveDelay = 2500;
        this.maxPawns = 5;
        newLevel = 7;
    } else if (this.score >= 15) {
        this.pawnSpawnRate = 2000;
        this.pawnMoveDelay = 2500;
        this.maxPawns = 4;
        newLevel = 6;
    } else if (this.score >= 12) {
        this.pawnSpawnRate = 2500;
        this.pawnMoveDelay = 2500;
        this.maxPawns = 4;
        newLevel = 5;
    } else if (this.score >= 9) {
        this.pawnSpawnRate = 2500;
        this.pawnMoveDelay = 3000;
        this.maxPawns = 4;
        newLevel = 4;
    } else if (this.score >= 6) {
        this.pawnSpawnRate = 2500;
        this.pawnMoveDelay = 3000;
        this.maxPawns = 3;
        newLevel = 3;
    } else if (this.score >= 3) {
        this.pawnSpawnRate = 3000;
        this.pawnMoveDelay = 3000;
        this.maxPawns = 3;
        newLevel = 2;
    } else {
        this.pawnSpawnRate = 3000;
        this.pawnMoveDelay = 3000;
        this.maxPawns = 2;
        newLevel = 1;
    }

    // Subir de nivel
    if (newLevel !== this.currentLevel) {
        this.currentLevel = newLevel;
        this.levelText.setText('Nivel: ' + this.currentLevel);
    }
}

/*********************************************************
 * ENDGAME: Mostrar estadísticas y reiniciar
 *********************************************************/
function endGame() {
    this.gameOver = true;
    this.canMove = false;
    this.input.off('pointerdown');

    // Calcular tiempo final
    const elapsedTime = (this.time.now - this.startTime) / 1000;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = Math.floor(elapsedTime % 60);
    const tenths = Math.floor((elapsedTime * 10) % 10);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;

    // Fondo semi-transparente
    const background = this.add.rectangle(
        this.sys.game.config.width / 2, 
        this.sys.game.config.height / 2, 
        400, 
        300, 
        0x000000, 
        0.8
    ).setOrigin(0.5);

    // Recuadro
    const panel = this.add.rectangle(
        this.sys.game.config.width / 2, 
        this.sys.game.config.height / 2, 
        380, 
        280, 
        0x222222
    ).setOrigin(0.5).setStrokeStyle(4, 0xffffff);

    const textStyle = {
        fontSize: '2em',
        fill: '#ffffff',
        fontFamily: 'Roboto',
        align: 'center'
    };

    this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 80, "Juego Terminado", {
        fontSize: '2.5em',
        fill: '#FFD700',
        fontFamily: 'Roboto',
        align: 'center'
    }).setOrigin(0.5);

    this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 - 30, `Peones capturados: ${this.score}`, textStyle).setOrigin(0.5);
    this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 10, `Tiempo: ${formattedTime}`, textStyle).setOrigin(0.5);
    this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 50, `Nivel alcanzado: ${this.currentLevel}`, textStyle).setOrigin(0.5);

    // Botón de Reiniciar
    const restartButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 100, "Reiniciar", {
        fontSize: '2em',
        fill: '#FFFFFF',
        backgroundColor: '#1E90FF',
        padding: { x: 15, y: 10 },
        borderRadius: 10
    }).setOrigin(0.5).setInteractive();

    restartButton.on('pointerdown', () => {
        this.scene.restart();
    });
    restartButton.on('pointerover', () => {
        restartButton.setStyle({ fill: '#FFD700' });
    });
    restartButton.on('pointerout', () => {
        restartButton.setStyle({ fill: '#FFFFFF' });
    });

    // Guardar el puntaje en Firestore
    saveHighScore(this.score);
}

/*********************************************************
 * GUARDAR PUNTAJE EN FIRESTORE
 *********************************************************/
function saveHighScore(score) {
    const auth       = window.auth;
    const db         = window.db;
    const addDoc     = window.addDoc;
    const collection = window.collection;

    if (!auth.currentUser) {
        console.log("⚠️ Usuario no autenticado, no se guardará el puntaje.");
        return;
    }

    addDoc(collection(db, "highscores"), {
        username: auth.currentUser.email,
        score: score,
        timestamp: new Date()
    })
    .then(() => {
        console.log("✅ Puntaje guardado en Firestore");
    })
    .catch((error) => {
        console.error("❌ Error guardando el puntaje:", error);
    });
}


/*********************************************************
 * FUNCION MOVER CABALLO
 *********************************************************/
function moveKnight(newX, newY) {
    if (!this.canMove || this.gameOver) return;
    this.canMove = false;

    const moveDuration = 500;
    const moveEase = 'Power2';
    const cooldown = 0;
    const captureDist = this.tileSize / 2;

    const newPosX = this.offsetX + newX * this.tileSize + this.tileSize / 2;
    const newPosY = this.offsetY + newY * this.tileSize + this.tileSize / 2;
    console.log(`Moviendo caballo a (${newX}, ${newY})`);

    this.tweens.add({
        targets: this.knight,
        x: newPosX,
        y: newPosY,
        duration: moveDuration,
        ease: moveEase,
        onComplete: () => {
            this.knightX = newX;
            this.knightY = newY;
            console.log("El caballo llegó a la casilla");

            // Verificar si algún peón puede capturar
            let peonCapturador = null;
            this.pawns.children.each(pawn => {
                const pawnCol = Math.floor((pawn.x - this.offsetX) / this.tileSize);
                const pawnRow = Math.floor((pawn.y - this.offsetY) / this.tileSize);
                if ((newX === pawnCol - 1 || newX === pawnCol + 1) && newY === pawnRow + 1) {
                    peonCapturador = pawn;
                }
            });

            if (peonCapturador) {
                console.log("¡El peón se mueve para capturar al caballo!");
                const captureX = this.offsetX + this.knightX * this.tileSize + this.tileSize / 2;
                const captureY = this.offsetY + this.knightY * this.tileSize + this.tileSize / 2;

                this.time.delayedCall(300, () => {
                    this.tweens.add({
                        targets: peonCapturador,
                        x: captureX,
                        y: captureY,
                        duration: moveDuration,
                        ease: 'Power1',
                        onComplete: () => {
                            console.log("¡El caballo ha sido capturado! GAME OVER.");
                            this.knight.setVisible(false);
                            this.endGame();
                        }
                    });
                });
                return;
            }

            // Cooldown para volver a moverse
            this.time.delayedCall(cooldown, () => {
                this.canMove = true;
            });

            // Verificar si el caballo captura a un peón
            this.pawns.children.each(pawn => {
                const dist = Phaser.Math.Distance.Between(pawn.x, pawn.y, newPosX, newPosY);
                if (dist < captureDist) {
                    console.log("¡Peón capturado!");
                    pawn.destroy();
                    this.spawnPawn();
                    this.score++;
                    this.scoreText.setText('Peones: ' + this.score);
                }
            });
        }
    });
}

/*********************************************************
 * SPAWNPAWN: Generar un Peón nuevo
 *********************************************************/
function spawnPawn() {
    if (this.pawns.countActive(true) >= this.maxPawns || this.gameOver) {
        console.log("Límite de peones o juego terminado. No se genera peón.");
        return;
    }

    const pawnScale = 1.8;
    const spawnRow = -1;
    const finalRow = 8;

    // Revisar columnas ocupadas
    let occupiedColumns = new Set();
    this.pawns.children.each(p => {
        let pCol = Math.floor((p.x - this.offsetX) / this.tileSize);
        occupiedColumns.add(pCol);
    });

    // Filtrar columnas libres
    let availableColumns = [];
    for (let i = 0; i < this.boardSize; i++) {
        if (!occupiedColumns.has(i)) {
            availableColumns.push(i);
        }
    }

    if (availableColumns.length === 0) {
        console.log("No hay columnas libres, no se genera peón.");
        return;
    }

    // Elegir columna libre
    let col = Phaser.Math.RND.pick(availableColumns);
    let x = this.offsetX + col * this.tileSize + this.tileSize / 2;
    let y = this.offsetY + spawnRow * this.tileSize + this.tileSize / 2;

    let pawn = this.add.image(x, y, 'pawn').setScale(pawnScale);
    this.pawns.add(pawn);

    console.log(`Peón en columna ${col}, fila ${spawnRow}. Activos: ${this.pawns.countActive(true)}/${this.maxPawns}`);

    // Iniciar su movimiento
    startPawnMovement.call(this, pawn, col, spawnRow, finalRow);
}

/*********************************************************
 * STARTPAWNMOVEMENT: Lógica de Movimiento del Peón
 *********************************************************/
function startPawnMovement(pawn, col, row, finalRow) {
    const pawnMoveDuration = 700;
    const reactionTime = 0;

    this.time.delayedCall(this.pawnMoveDelay, moveStep, [], this);

    function moveStep() {
        if (row < finalRow && !this.gameOver && this.pawns.contains(pawn)) {
            const nextRow = row + 1;
            const nextY = this.offsetY + nextRow * this.tileSize + this.tileSize / 2;

            let isBlocked = false;
            this.pawns.children.each(otherPawn => {
                const oCol = Math.floor((otherPawn.x - this.offsetX) / this.tileSize);
                const oRow = Math.floor((otherPawn.y - this.offsetY) / this.tileSize);
                if (oCol === col && oRow === nextRow) {
                    isBlocked = true;
                }
            });
            if (this.knightX === col && this.knightY === nextRow) {
                isBlocked = true;
            }

            if (isBlocked) {
                console.log(`Peón en (${col}, ${row}) bloqueado. Reintenta en ${this.pawnMoveDelay} ms...`);
                this.time.delayedCall(this.pawnMoveDelay, moveStep, [], this);
                return;
            }

            // Ver si al avanzar puede capturar al caballo
            const canCaptureKnight = (
                (this.knightX === col - 1 || this.knightX === col + 1) &&
                this.knightY === nextRow
            );

            if (canCaptureKnight) {
                console.log(`Peón en (${col}, ${row}) ve al caballo. reactionTime = ${reactionTime}ms`);
                const oldKnightX = this.knightX;
                const oldKnightY = this.knightY;

                if (reactionTime <= 0) {
                    if (!this.gameOver && this.knightX === oldKnightX && this.knightY === oldKnightY) {
                        capturaInmediata.call(this, pawn);
                    } else {
                        console.log("El caballo escapó instantáneamente.");
                        advancePawn.call(this);
                    }
                    return;
                } else {
                    this.time.delayedCall(reactionTime, () => {
                        if (!this.gameOver && this.knightX === oldKnightX && this.knightY === oldKnightY) {
                            capturaInmediata.call(this, pawn);
                        } else {
                            console.log("El caballo escapó a tiempo.");
                            advancePawn.call(this);
                        }
                    }, [], this);
                    return;
                }
            }

            // Si no hay captura, avanzar normal
            advancePawn.call(this);
        }
    }

    function advancePawn() {
        row++;
        this.tweens.add({
            targets: pawn,
            y: this.offsetY + row * this.tileSize + this.tileSize / 2,
            duration: pawnMoveDuration,
            ease: 'Power1',
            onComplete: () => {
                console.log(`Peón en (${col}, ${row}) avanzó.`);
                if (row === finalRow && this.pawns.contains(pawn)) {
                    console.log("¡Peón salió del tablero! GAME OVER.");
                    this.endGame();
                } else {
                    this.time.delayedCall(this.pawnMoveDelay, moveStep, [], this);
                }
            }
        });
    }
}

/*********************************************************
 * CAPTURA INMEDIATA: El Peón captura al Caballo al Instante
 *********************************************************/
function capturaInmediata(pawn) {
    console.log("Captura Inmediata: El caballo no se movió.");
    this.canMove = false;
    this.input.off('pointerdown');

    this.tweens.add({
        targets: pawn,
        x: this.offsetX + this.knightX * this.tileSize + this.tileSize / 2,
        y: this.offsetY + this.knightY * this.tileSize + this.tileSize / 2,
        duration: 500,
        ease: 'Power1',
        onComplete: () => {
            this.knight.setVisible(false);
            this.endGame();
        }
    });
}
