let objectDetector; // Para coco-ssd
let handposeModel;  // Para Handpose
let modelIsLoaded = false; // Verifica si los modelos están cargados

const video = document.getElementById("video");
const c1 = document.getElementById("c1");
const ctx1 = c1.getContext("2d");

let cameraAvailable = false;
let aiEnabled = false;
let fps = 16;

/* Configuración de la cámara */
const constraints = {
    audio: false,
    video: {
        facingMode: "environment"
    }
};

/* Iniciar la cámara */
function camera() {
    if (!cameraAvailable) {
        console.log("Iniciando cámara...");
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            cameraAvailable = true;
            video.srcObject = stream;
        }).catch(function (err) {
            cameraAvailable = false;
            if (modelIsLoaded) {
                if (err.name === "NotAllowedError") {
                    document.getElementById("loadingText").innerText = "Esperando permiso de cámara...";
                }
            }
            setTimeout(camera, 1000);
        });
    }
}
camera();

/* Cargar los modelos al iniciar la página */
window.onload = async function () {
    console.log("Cargando modelos...");
    
    // Cargar el modelo coco-ssd
    objectDetector = ml5.objectDetector("cocossd", {}, () => {
        console.log("Modelo coco-ssd cargado");
        checkModelsLoaded();
    });

    // Cargar el modelo Handpose
    handposeModel = ml5.handpose(video, () => {
        console.log("Modelo Handpose cargado");
        checkModelsLoaded();
    });

    // Registrar evento para Handpose
    handposeModel.on("predict", (results) => {
        drawHands(results);
    });

    timerCallback();
};

// Verifica si todos los modelos están listos
function checkModelsLoaded() {
    if (objectDetector && handposeModel) {
        modelIsLoaded = true;
        console.log("Todos los modelos están listos.");
    }
}

// Configuración del canvas
function setResolution() {
    if (window.screen.width < video.videoWidth) {
        c1.width = window.screen.width * 0.9;
        let factor = c1.width / video.videoWidth;
        c1.height = video.videoHeight * factor;
    } else if (window.screen.height < video.videoHeight) {
        c1.height = window.screen.height * 0.50;
        let factor = c1.height / video.videoHeight;
        c1.width = video.videoWidth * factor;
    } else {
        c1.width = video.videoWidth;
        c1.height = video.videoHeight;
    }
}

// Control del ciclo de detección
function timerCallback() {
    if (isReady()) {
        setResolution();
        ctx1.drawImage(video, 0, 0, c1.width, c1.height);
        if (aiEnabled) {
            ai();
        }
    }
    setTimeout(timerCallback, fps);
}

// Verificar si los modelos y la cámara están listos
function isReady() {
    if (modelIsLoaded && cameraAvailable) {
        document.getElementById("loadingText").style.display = "none";
        document.getElementById("ai").disabled = false;
        return true;
    } else {
        return false;
    }
}

// Alternar la detección AI
document.getElementById("ai").addEventListener("change", function () {
    aiEnabled = this.checked;
});

// Cambiar FPS
document.getElementById("fps").addEventListener("input", function () {
    fps = 1000 / this.value;
});

// Función principal AI
function ai() {
    // Detección de objetos con coco-ssd
    objectDetector.detect(c1, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }

        results.forEach(element => {
            // Dibujar los resultados de coco-ssd
            ctx1.font = "15px Arial";
            ctx1.fillStyle = "red";
            ctx1.fillText(
                element.label + " - " + (element.confidence * 100).toFixed(2) + "%",
                element.x + 10, element.y + 15
            );
            ctx1.beginPath();
            ctx1.strokeStyle = "red";
            ctx1.rect(element.x, element.y, element.width, element.height);
            ctx1.stroke();
        });
    });
}

// Dibuja las manos detectadas por Handpose
function drawHands(results) {
    results.forEach(hand => {
        hand.landmarks.forEach((point) => {
            // Dibujar puntos clave de las manos
            ctx1.fillStyle = "blue";
            ctx1.beginPath();
            ctx1.arc(point[0], point[1], 5, 0, 2 * Math.PI);
            ctx1.fill();
        });

        // Conectar los puntos clave 
        const fingers = [
            [0, 1, 2, 3, 4], // Pulgar
            [0, 5, 6, 7, 8], // Índice
            [0, 9, 10, 11, 12], // Medio
            [0, 13, 14, 15, 16], // Anular
            [0, 17, 18, 19, 20] // Meñique
        ];

        ctx1.strokeStyle = "cyan";
        ctx1.lineWidth = 2;

        fingers.forEach(finger => {
            ctx1.beginPath();
            finger.forEach((pointIdx, i) => {
                const [x, y] = hand.landmarks[pointIdx];
                if (i === 0) {
                    ctx1.moveTo(x, y);
                } else {
                    ctx1.lineTo(x, y);
                }
            });
            ctx1.stroke();
        });
    });
}
