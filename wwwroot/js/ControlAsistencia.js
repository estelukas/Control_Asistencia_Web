//#region Variables Mobiles
let android = window.Android;

const isMobile = () => Boolean(android);

//#endregion Variables Mobiles

//#region Variables Globales

let isFlipped = false;
const tempCanvas = document.createElement("canvas");
const tempContext = tempCanvas.getContext("2d");
let SonIguales = false;
let fotoRH = false;
let base64WithPrefix;
//#endregion Variables Globales

//#region Carga Inicial
let jsonResponse = [];
let EstaEnGeocerca = 0;
let IdCentroServicio = 0;
let CentroServicio = '';
let htmlContent;
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Tiempo total de carga:", performance.now(), "ms");

    const isBrave = (navigator.brave !== undefined);

    if (isBrave) {
        let userAgent = navigator.userAgent;
        // 1. Detección por User Agent
        let isChrome = /Chrome/.test(userAgent) &&
            !/Edg|Opera|OPR/.test(userAgent); // Excluye Edge, Opera

        // Si NO es Chrome o SI es Brave
        if (!isChrome || isBrave) {
            $('#loadingScreen').hide().css({ 'display': 'none', 'visibility': 'hidden', });
            cargarContenedorWebNoSoportado();
            $("head").empty(); // Elimina todos los estilos/scripts
            $("#divContenedores").remove();
        }

    } else {
        $('#loadingScreen').show();
        if (!isMobile()) {
            verificarPermisos();
        }
        $('#divContenedorCamara').hide();
        $('#divControlAsistencia').hide();

        // Inicia el flujo solicitando permisos de ubicación
        solicitarPermisoUbicacion().finally(() => {
            if (isMobile())
                loadingScreen();
        });
        /* if (!isMobile()) {
             loadingScreen();
         }*/
    }
});


//#endregion

//#region Cargar Contenedor Web no Soportado


const cargarContenedorWebNoSoportado = async () => {
    try {
        const response = await fetch($("#urlDetectarBrave").data("action-url"), {
            method: "GET",
            headers: {
                "Content-Type": "text/html",
            },
        });

        if (response.ok) {
            const htmlContent = await response.text();
            // Cargar el contenido dinámico en el contenedor
            $("#divContenedorWebNoSoportado").html(htmlContent);

        } else {
            console.error("Error al cargar el partial view del contenedor de Web No Soportado:", response.statusText);
        }
    } catch (error) {
        console.error("Error al cargar el contenedor de Web No Soportado:", error);
    }
};



//#endregion Cargar Contenedor Web no Soportado

//#region Funciones de Permisos

// Solicitar permisos de ubicación
const solicitarPermisoUbicacion = async () => {
    if (!navigator.geolocation) {
        AlertStackingWithIcon_Mostrar("danger", "Tu navegador no soporta la geolocalización.", "fa-times-circle");
        $('#divContenedorGps').show();
        return;
    }

    try {
        // Verificar si el usuario ya concedió permisos
        const permiso = await navigator.permissions.query({ name: "geolocation" });

        if (permiso.state === "denied") {
            throw new Error("Permiso de ubicación denegado.");
        }

        // Primera solicitud: Más rápida, sin GPS preciso
        const opcionesRapidas = {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0
        };

        try {
            const position = await obtenerUbicacion(opcionesRapidas);
            await manejarUbicacion(position);
        } catch (error) {
            console.warn("Ubicación rápida falló, intentando con alta precisión...", error);

            // Segunda solicitud: Activa GPS si la primera falló
            const opcionesPrecisas = {
                enableHighAccuracy: true,
                timeout: 15000,  // Espera hasta 15 segundos
                maximumAge: 0
            };

            const position = await obtenerUbicacion(opcionesPrecisas);
            await manejarUbicacion(position);
        }
    } catch (error) {
        console.error("Error al obtener la ubicación:", error);
        $('#divContenedorGps').show();
    }
};

const obtenerUbicacion = (opciones) => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opciones);
    });
};

const manejarUbicacion = async (position) => {
    await ConsultarGeocerca(position.coords.latitude, position.coords.longitude);

    if (EstaEnGeocerca === 1) {
        $('#divContenedorGps').hide();
        $('#divContenedorCamara').show();
        await solicitarPermisoCamara();
    } else {
        mostrarMensajeFueraDeGeocerca();
    }
};

// Función para mostrar el mensaje de geocerca inválida
const mostrarMensajeFueraDeGeocerca = () => {
    $('#divContenedorGps').hide().css({ 'display': 'none', 'visibility': 'hidden' });
    document.getElementById("divContenedorErrorGeocercaContainer").innerHTML = `
        <div class="container py-4">
            <div class="card shadow-lg p-3 mb-4 bg-body rounded border border-warning mx-auto" style="max-width: 600px; width: 100%;">
                <div class="card-body text-center py-3">
                    <p>
                        <i class="fas fa-7x fa-map-marked-alt text-danger"></i>
                    </p>
                    <h2 class="mb-3 text-danger">No estás en una geocerca válida</h2>
                    <p style="font-size: 18px;">
                        Para continuar, <strong>debes estar dentro de una geocerca válida.</strong>
                    </p>
                </div>
                <div class="container d-flex align-items-center justify-content-center py-3">
                    <button id="recargarButtonGeocerca" class="btn btn-warning">Intentar de nuevo</button>
                </div>
            </div>
        </div>
    `;
};


const solicitarPermisoCamara = async () => {
    await cargarContenedorCamara();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            // Solicitar acceso a la cámara
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Detener el stream inmediatamente para evitar inicializar la cámara
            stream.getTracks().forEach((track) => track.stop());

            // Ocultar el div de permisos de cámara
            $('#divContenedorCamara').hide();
            // Asegúrate de que se oculte completamente
            $("#divContenedorCamaraContainer").hide().css({
                display: "none",
                visibility: "hidden",
                opacity: "0",
            });

            $('#divContenedorGps').hide();

            // Cargar control de asistencia
            await cargarControlAsistencia(true);

            // Inicializar la cámara una vez que el contenido parcial está cargado
            await inicializarCamara();
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);

            // Mostrar el div de permisos de cámara si los permisos fueron denegados
            $('#divContenedorCamara').show();
        }
    } else {
        AlertStackingWithIcon_Mostrar("danger", 'Tu navegador no soporta el acceso a la cámara.', "fa-times-circle");
        $('#divContenedorCamara').show();
    }
};
let detectionActivated = false;
// Función para inicializar la cámara
const inicializarCamara = async () => {
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        // Obtener los elementos del DOM
        const videoElement = document.getElementById('video');
        const canvas = document.getElementById("canvas");

        // Verifica que los elementos existan en el DOM
        if (!videoElement || !canvas) {
            console.error("No se encontraron los elementos de video o canvas en el DOM.");
            return;
        }

        // Solicitar acceso a la cámara nuevamente
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;

        videoElement.addEventListener("loadeddata", () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

        });

        // Detectar si es necesario aplicar un flip horizontal
        const settings = stream.getVideoTracks()[0].getSettings();
        isFlipped = settings.facingMode === "user";
        if (isFlipped) {
            videoElement.style.transform = "scaleX(-1)";
        } else {
            videoElement.style.transform = "none";
        }

        video.addEventListener('play', async () => {
            if (detectionActivated) {
                return;
            }
            detectionActivated = true;
            const displaySize = { width: canvas.width, height: canvas.height };
            faceapi.matchDimensions(canvas, displaySize);

            const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 256, scoreThreshold: 0.5 }); // Ajusta el tamaño y el umbral
            let lastDetectionTime = 0;

            function detect() {
                const currentTime = Date.now();

                // Evitar ejecutar la detección demasiado rápido
                if (currentTime - lastDetectionTime < 100) return; // Ejecutar solo una vez cada 100ms
                lastDetectionTime = currentTime;

                faceapi.detectAllFaces(video, tinyFaceDetectorOptions).then(detections => {
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); // Solo limpiar cuando sea necesario
                    const ctx = canvas.getContext('2d');
                    resizedDetections.forEach(det => {
                        const { x, y, width, height } = det.box;
                        ctx.beginPath();
                        ctx.rect(x, y, width, height);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "red";
                        ctx.stroke();
                    });
                });
            }

            setInterval(detect, 100); // Ajustar el intervalo para balancear rendimiento y precisión
        });




        // Evento para capturar imagen al hacer clic en el botón
        const botonCaptura = document.getElementById("Registrar");
        botonCaptura.addEventListener("click", capturarImagen);

        // Inicializar el selector con las opciones configuradas en los atributos data-*
        const selectElement = document.getElementById('Select_SearchEmpleado');
        mdb.Select.getInstance(selectElement) || new mdb.Select(selectElement);

        seleccionarEntradaSalidaPorDefecto();
    } catch (error) {
        console.error("Error al inicializar la cámara:", error);
    }
};

//#endregion Funciones de Permisos

//#region ValidarGeocerca

const ConsultarGeocerca = async (latitud, longuitud) => {
    try {
        const response = await fetch($("#urlValidarGeocerca").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                Longuitud: longuitud.toString(), // Cambia esto por el Id del usuario
                Latitud: latitud.toString() // Pasar el término de búsqueda
            })
        });

        if (response.ok) {
            // Obtener el JSON de la respuesta
            let jsonObject = await response.json();
            if (jsonObject.id == 1) {
                let json = JSON.parse(jsonObject.contenido);
                jsonResponse = json.ValidarCobertura;
                if (jsonResponse.length > 0) {
                    EstaEnGeocerca = 1;
                    IdCentroServicio = jsonResponse[0].Id;
                    CentroServicio = jsonResponse[0].Nombre;
                } else {
                    EstaEnGeocerca = 0;
                    IdCentroServicio = null;
                }
            }
        } else {
            const errorMessage = await response.text();
            throw new Error("Error en la solicitud: " + errorMessage);
        }
    } catch (error) {
        console.error("Error: ", error);
    }
};
//#endregion

//#region Recargar Permisos

// Función para recargar los permisos de GPS cuando el usuario hace clic en "Recargar Permisos"
$('#recargarButtonGps').on('click', () => {
    location.reload();
});

$(document).on('click', '#recargarButtonCamara', () => {
    location.reload();
});

$(document).on('click', '#recargarButtonGeocerca', async () => {
    location.reload();
});

//#endregion

//#region Pantalla de Carga
const loadingScreen = () => {
    setTimeout(() => {
        $('#loadingScreen').fadeOut(); // Oculta la pantalla de carga al terminar
    }, 2000);
}

//#endregion Pantalla de Carga

//#region Verificación de permisos dinámicos

// Verifica los permisos de ubicación y cámara y ajusta la interfaz dinámicamente
const verificarPermisos = () => {

    navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
        if (permissionStatus.state !== "granted") {
            // Si los permisos de ubicación no están otorgados, mostrar el div de permiso de GPS
            $('#divControlAsistencia').hide();
            $('#divContenedorGps').show();
        }
        permissionStatus.onchange = function () {
            if (permissionStatus.state !== "granted") {
                // Si los permisos de ubicación no están otorgados, mostrar el div de permiso de GPS
                $('#divControlAsistencia').hide();
                $('#divContenedorGps').show();
            }
        };
    });
    navigator.permissions.query({ name: 'camera' }).then(function (permissionStatus) {
        if (permissionStatus.state !== "granted") {
            // Si los permisos de cámara no están otorgados, mostrar el div de restablecer permisos
            $("#divContenedorCamaraContainer").show().css({
                display: "block",
                visibility: "visible",
                opacity: "1",
            });
            $('#divControlAsistencia').hide();
            $('#divContenedorCamara').show();
        }
        permissionStatus.onchange = function () {
            if (permissionStatus.state !== "granted") {
                // Si los permisos de cámara no están otorgados, mostrar el div de restablecer permisos
                $("#divContenedorCamaraContainer").show().css({
                    display: "block",
                    visibility: "visible",
                    opacity: "1",
                });
                $('#divControlAsistencia').hide();
                $('#divContenedorCamara').show();

            }
        };
    });

}
//#endregion

//#region Cargar Control Asistencia

// Cargar dinámicamente el Partial View
const cargarControlAsistencia = async (estaEnGeocerca) => {
    const url = `${$("#urlCargarControlAsistencia").data("action-url")}?estaEnGeocerca=${estaEnGeocerca}`;
    const content = await fetchData(url);
    if (content) {
        $("#controlAsistenciaContainer").html(content).show();
        $("#centroServicio").text(jsonResponse[0]?.Nombre || '');
    }
};

//#endregion Cargar Control Asistencia

//#region Cargar Contenedor Camara


const cargarContenedorCamara = async () => {
    const content = await fetchData($("#urlCargarContenedorCamara").data("action-url"));
    if (content) {
        $("#divContenedorCamaraContainer").html(content).show();
        $("#recargarButtonCamara").on("click", solicitarPermisoCamara);
    }
};


//#endregion Cargar Contenedor Camara

//#region ConsultarDatos

const EmpleadoConsultarDatosSelectData = async (searchTerm = "") => {
    try {
        if (!searchTerm.trim()) {
            $('#Select_SearchEmpleado').empty();
            $('#Select_SearchEmpleado').prop('disabled', false);
            $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide();
            return;
        }

        const response = await fetch($("#urlSeleccionarDatos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ParametroBusqueda: searchTerm,
                CentroServicio: jsonResponse[0].Nombre
            })
        });

        if (response.ok) {
            let jsonObject = await response.json();

            if (jsonObject.id === 1 && jsonObject.contenido) {
                const empleados = JSON.parse(jsonObject.contenido).EmpleadoConsulta;

                const optionsArray = empleados.map(empleado => {
                    let [mainText, secondaryText] = empleado.Nombre_Empleado.split('Centro de Servicio:');
                    mainText = mainText.trim();
                    secondaryText = secondaryText ? 'Centro de Servicio: ' + secondaryText.trim() : '';
                    return [empleado.RFC, empleado.Nombre_Empleado, mainText, secondaryText, empleado.Hora_Entrada, empleado.Hora_Salida];
                });

                fillMDBSelect('#Select_SearchEmpleado', optionsArray);

                $('#Select_SearchEmpleado').prop('disabled', false);
                //$('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide();

                // Evento para detectar cambios en el select y actualizar las horas de entrada/salida
                // Evento para detectar cambios en el select y actualizar las horas de entrada/salida y bloquear radios
                $('#Select_SearchEmpleado').off('change').on('change', function () {
                    const selectedRFC = $(this).val();
                    const empleadoSeleccionado = empleados.find(emp => emp.RFC === selectedRFC);

                    if (empleadoSeleccionado) {
                        // Formatear y mostrar las horas de entrada y salida
                        $("#horaEntrada").text(`Entrada: ${empleadoSeleccionado.Hora_Entrada !== "No registra" ? formatHora(empleadoSeleccionado.Hora_Entrada) : ""}`);
                        $("#horaSalida").text(`Salida: ${empleadoSeleccionado.Hora_Salida !== "No registra" ? formatHora(empleadoSeleccionado.Hora_Salida) : ""}`);

                        // Deshabilitar/Habilitar radios según si el empleado ya tiene una hora registrada
                        if (empleadoSeleccionado.Hora_Entrada !== "No registra") {
                            $('#entradaOption').prop('disabled', true);
                        } else {
                            $('#entradaOption').prop('disabled', false);
                        }

                        if (empleadoSeleccionado.Hora_Salida !== "No registra") {
                            $('#salidaOption').prop('disabled', true);
                            $('#Registrar').prop('disabled', true);
                        } else {
                            $('#salidaOption').prop('disabled', false);
                            $('#Registrar').prop('disabled', false);
                        }

                        // Seleccionar automáticamente la opción que sí está habilitada
                        if (!$('#entradaOption').prop('disabled')) {
                            $('#entradaOption').prop('checked', true);
                        } else if (!$('#salidaOption').prop('disabled')) {
                            $('#salidaOption').prop('checked', true);
                        }
                    } else {
                        resetearFormulario();
                    }
                });

            } else {
                $('#Select_SearchEmpleado').empty();
                //  $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').show();
                $('#Select_SearchEmpleado').prop('disabled', false);
            }
        } else {
            const errorMessage = await response.text();
            throw new Error("Error en la solicitud: " + errorMessage);
        }
    } catch (error) {
        console.error("Error: ", error);
    }
};

// Función para formatear la hora en formato AM/PM
const formatHora = (hora) => {
    if (!hora) return "No registra";
    const date = new Date(hora);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
};

//$(document).on('closed.mdb.select', '#Select_SearchEmpleado', function () {
//    if ($('#Select_SearchEmpleado').val() === '') {
//        setSelectValue("#Select_SearchEmpleado", 0);
//        $('#Select_SearchEmpleado').empty(); // Limpiar el select completamente
//        $('#Select_SearchEmpleado').prop('disabled', false); // Asegurarse de que el select esté habilitado
//        $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Ocultar "Sin resultados"
//    }
//});


//#endregion

//#region Eventos del Select_SearchEmpleado

// Event listener para el cambio en el input de búsqueda
$(document).on('input', '.form-control.select-filter-input', function () {
    const searchTerm = $(this).val().trim(); // Captura el texto del buscador
    // Si hay texto, ocultar el mensaje de "Sin resultados"
    //if (searchTerm.length > 0) {
    //    $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide();
    //}

    // Si el texto tiene al menos 4 caracteres, realiza la búsqueda
    if (searchTerm.length >= 4) {
        EmpleadoConsultarDatosSelectData(searchTerm); // Llama a la función de búsqueda
    } else if (searchTerm.length === 0) {
        // Si no hay texto, limpiar el select, eliminar "Sin datos" y ocultar "Sin resultados"
        //   $('#Select_SearchEmpleado').empty(); // Limpiar el select completamente
        //   $('#Select_SearchEmpleado').prop('disabled', false); // Asegurarse de que el select esté habilitado
        //   $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Ocultar "Sin resultados"
    }
});

//#endregion

//#region On click SearhEmpleado

// Delegar el evento de clic en el contenedor de las opciones
$(document).on('click', '.select-option', function () {
    const selectedOption = $(this); // La opción que fue clickeada

    // Asegurarnos de que solo la opción seleccionada tenga el atributo aria-selected="true"
    $('.select-option').attr('aria-selected', 'false');  // Restablecer todas las opciones
    selectedOption.attr('aria-selected', 'true');  // Marcar como seleccionada la opción clickeada

    // Simular un segundo clic en la MISMA opción seleccionada
    setTimeout(function () {
        selectedOption.trigger("click"); // Vuelve a disparar el clic en la misma opción
    }, 50); // Esperamos medio segundo antes de hacer el segundo clic
});

//#endregion On click SearhEmpleado

//#region fillMDBSelect

// Función para llenar el select con MDBootstrap
function fillMDBSelect(id, optionsArray) {

    var selectElement = $(id); // Seleccionar el elemento
    selectElement.empty(); // Vaciar el contenido del select

    if (optionsArray.length === 0) {
        // Si no hay datos, agregar opción predeterminada
        let defaultOption = $("<option>", {
            value: 0,
            text: "Sin datos",
            hidden: true,
            class: "hidden selected text-secondary"
        });
        selectElement.append(defaultOption);
        selectElement.prop("disabled", true);
    } else {
        // Agregar la opción predeterminada
        let defaultOption = $("<option>", {
            value: "",
            text: "Seleccionar",
            hidden: true,
            class: "hidden selected text-secondary"
        });
        selectElement.append(defaultOption);

        // Agregar las opciones dinámicamente
        optionsArray.forEach(([value, mainText, secondaryText]) => {

            const option = $("<option>", {
                value: value,
                text: secondaryText,
                'data-mdb-secondary-text': 'Centro de Servicio ' + mainText.split('Centro de Servicio')[1]
            });

            selectElement.append(option);
        });

        selectElement.prop("disabled", false);

    }
}


//#endregion fillMDBSelect

//#region setSelectValue

function setSelectValue(id, value) {
    // Verificar si el valor es null o undefined
    if (value === null || value === undefined) {
        return;
    }

    var selectElement = $(id); // Seleccionamos el elemento

    // Verificar si el elemento existe
    if (!selectElement.length) {
        console.warn(`El elemento con id ${id} no existe.`);
        return;
    }

    var selectInstance = mdb.Select.getInstance(selectElement);

    // Destruir la instancia existente del componente Select si existe
    if (selectInstance) {
        selectInstance.dispose();
    }

    // Establecer el nuevo valor
    var select = new mdb.Select(selectElement[0]);
    select.setValue(value.toString());
}


//#endregion setSelectValue

//#region tomar foto y guardar en ftp
async function cargarImagenFTP() {
    try {
        let rfc = $('#Select_SearchEmpleado').val();
        const response = await fetch($("#urlObtenerFotoFtp").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                Rfc: rfc
            })
        });
        if (response.ok) {
            const result = await response.json();
            if (result.id) {
                // 🟢 Convertir la respuesta JSON en un objeto
                const contenidoObj = JSON.parse(result.contenido);
                // 🟢 Obtener la imagen en Base64 desde `FileName`
                const base64String = contenidoObj;

                if (contenidoObj != null) {
                    fotoRH = true;
                    if (!base64String.startsWith("data:image/")) {
                        // Si no tiene el prefijo "data:image/", agregarlo
                        base64WithPrefix = `data:image/png;base64,${base64String}`;
                        document.getElementById("fotoFTP").src = base64WithPrefix;
                    } else {
                        // Si ya tiene el prefijo, asignar directamente
                        document.getElementById("fotoFTP").src = base64String;
                    }
                } else {
                    AlertStackingWithIcon_Mostrar("warning", 'Usted no cuenta con foto por parte del departamento de RH, favor de acudir con su gerente.', "fa-times-circle");
                    fotoRH = false;
                }
            }
        } else {
            throw new Error('Error al guardar la imagen.');
        }

        if (!response.ok) {
            throw new Error("No se pudo obtener la imagen");
        }

    } catch (error) {
        console.error("Error:", error);
        return false;
    }
}

const capturarImagen = async () => {
    startLoadingButton("#Registrar")
    const videoElement = document.getElementById('video');
    const fecha = new Date();

    // Obtén el año
    const year = fecha.getFullYear();

    // Obtén el mes (agregar un 0 si es menor a 10)
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    // Obtén la hora con segundos (agregar un 0 si es menor a 10)
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    const seconds = String(fecha.getSeconds()).padStart(2, '0');
    const nombre = `${hours}${minutes}${seconds}.png`;
    // Combina todo en el formato deseado
    const resultado = `/${year}/${month}/${day}/`;

    // Configurar el tamaño del canvas temporal
    tempCanvas.width = videoElement.videoWidth;
    tempCanvas.height = videoElement.videoHeight;

    // Verificar si el video tiene el transform CSS
    const computedStyle = window.getComputedStyle(videoElement);
    const transformMatrix = computedStyle.transform;

    tempContext.save();

    if (transformMatrix.includes("matrix(-1")) {
        // Aplicar un volteo horizontal
        tempContext.scale(-1, 1);
        tempContext.drawImage(videoElement, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);
    } else {
        // Dibujar sin volteo
        tempContext.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    tempContext.restore();
    const img1 = document.getElementById("fotoCamara");
    await cargarImagenFTP();

    // Convertir el contenido del canvas a un archivo PNG
    const imageData = tempCanvas.toDataURL("image/png");
    img1.src = imageData;


    let rfc = $('#Select_SearchEmpleado').val();
    let ClaveEmpleado = $('#Select_SearchEmpleado option:selected').text();
    ClaveEmpleado = ClaveEmpleado.split(" ")[0];
    const ruta = rfc + resultado;
    //rfc = rfc + '.png';

    // Obtener el valor del radio seleccionado
    let seleccionado = $('input[name="entradaSalidaOptions"]:checked').val();

    // Mostrar el resultado
    if (!seleccionado) {
        AlertStackingWithIcon_Mostrar("warning", 'Debes seleccionar el tipo: Entrada o Salida.', "fa-times-circle");
        quitLoadingButton("#Registrar")
        return 0;
    }
    if (rfc == null) {
        AlertStackingWithIcon_Mostrar("warning", 'Debes escribir tu clave de empleado', "fa-times-circle");
        quitLoadingButton("#Registrar")
        return false;
    }

    if (fotoRH) {

        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');


        // Obtener imágenes
        const img11 = document.getElementById("fotoCamara");
        const img22 = document.getElementById("fotoFTP");

        // Detectar y extraer embeddings
        const detection1 = await faceapi.detectSingleFace(img11, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        const detection2 = await faceapi.detectSingleFace(img22, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        // Verificar si se detectaron rostros
        if (detection1 && detection2) {
            // Calcular la distancia euclidiana entre los embeddings
            const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
            // Definir un umbral (ajusta según tu caso)
            const threshold = 0.6;
            if (distance < threshold) {
                // console.log('Los rostros son de la misma persona. Distancia: ' + distance.toFixed(2));
                SonIguales = true;
            } else {
                // console.log('Los rostros son de personas diferentes. Distancia: ' + distance.toFixed(2));
                SonIguales = false;
            }
        } else {
            //console.log('No se detectaron rostros en una o ambas imágenes.');
            SonIguales = false;
        }

    } else {
        SonIguales = false;
    }
    // Enviar la imagen al servidor
    try {
        const response = await fetch($("#urlGuardarFoto").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                Base64: imageData, // Enviamos la imagen en base64
                Nombre: nombre, // Puedes incluir el nombre del archivo
                Ruta: ruta,
                Rfc: rfc,
                ClaveEmpleado: ClaveEmpleado,
                TipoAsistencia: seleccionado,
                IdGeocerca: IdCentroServicio.toString(),
                Boleano: SonIguales
            })
        });
        if (response.ok) {
            const result = await response.json();
            if (result.id) {
                resetearFormulario();
                AlertStackingWithIcon_Mostrar("success", result.contenido, "fa-times-circle");
                quitLoadingButton("#Registrar");
                //SonIguales = false;

            } else {
                resetearFormulario();
                AlertStackingWithIcon_Mostrar("warning", result.contenido, "fa-times-circle");
                quitLoadingButton("#Registrar");
                // SonIguales = false;
            }
        } else {
            throw new Error('Error al guardar la imagen.');
            // SonIguales = false;
        }
    } catch (error) {
        console.error('Error:', error);
        resetearFormulario();
        AlertStackingWithIcon_Mostrar("danger", 'No se pudo guardar la imagen.', "fa-times-circle");
        quitLoadingButton("#Registrar");
        //SonIguales = false;
    }
};
// Función para cargar una imagen desde Base64
function loadImageFromBase64(base64) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
    });
}

//#region Resetear Entrada Salida Empleado

const resetearFormulario = () => {
    seleccionarEntradaSalidaPorDefecto();

    setSelectValue("#Select_SearchEmpleado", 0);
    let selectElement = $('#Select_SearchEmpleado');
    selectElement.empty(); // Limpiar el select completamente
    selectElement.removeClass('disabled'); // Asegurarse de que el select esté habilitado
    $('#select-dropdown-container-Select_SearchEmpleado .select-no-results').hide(); // Ocultar "Sin resultados"
    $('#entradaOption').prop('disabled', false); // Habilitar entradaOption
    $('#salidaOption').prop('disabled', false); // Habilitar salidaOption
    setTimeout(() => {
        // Quitar la clase "active" del label de manera explícita
        $("#select-wrapper-Select_SearchEmpleado .form-label.select-label").removeClass("active");
    }, 100);

    // Eliminar el div de "Seleccionar"
    $("#select-wrapper-Select_SearchEmpleado .select-fake-value").remove();

    // Restablecer el texto de las etiquetas de entrada/salida
    $("#horaEntrada").text('Entrada: ');
    $("#horaSalida").text('Salida: ');
};


//#endregion Resetear Entrada Salida Empleado

//#endregion tomar foto y guardar en ftp//#endregion tomar foto y guardar en ftp


//#region Seleccionar Entrada Salida Por Defecto

const seleccionarEntradaSalidaPorDefecto = () => {
    const horaActual = new Date().getHours(); // Obtiene la hora actual

    // Si es antes del mediodía, selecciona "Entrada"
    if (horaActual < 12) {
        document.getElementById('entradaOption').checked = true;
        document.getElementById('salidaOption').checked = false;
    } else {
        // Si es después del mediodía, selecciona "Salida"
        document.getElementById('entradaOption').checked = false;
        document.getElementById('salidaOption').checked = true;
    }
};


//#endregion Seleccionar Entrada Salida Por Defecto

//#region AlertStackingWithIcon_Mostrar

function AlertStackingWithIcon_Mostrar(Color, Texto, Icono) {
    const alert = document.createElement('div');
    alert.innerHTML = `
<div class="alert-content">
<button type="button" class="btn-close" data-mdb-dismiss="alert" aria-label="Close"></button>
<div class="alert-body text-center">
<i class="fas ${Icono} fa-6x text-${Color} mb-3 mb-md-4"></i>
<h2 class="alert-text text-${Color}">${Texto}</h2>
</div>
</div>
    `;

    alert.classList.add('alert', 'fade', 'alert-dismissible', 'shadow-lg', 'mt-5', 'col-10', 'col-md-4', 'mx-auto');
    alert.setAttribute('role', 'alert');
    alert.setAttribute('data-mdb-position', 'top-center');
    alert.setAttribute('data-mdb-color', Color);
    alert.setAttribute('data-mdb-alert-init', '');

    document.body.appendChild(alert);

    const alertInstance = new mdb.Alert(alert, {
        color: Color,
        stacking: true,
        hidden: true,
        offset: 10
    });

    alertInstance.show();

    reproducirAlerta(Texto, () => {
        setTimeout(() => {
            alertInstance.close();
        }, 1000)
    });


}

//#endregion AlertStackingWithIcon_Mostrar

//#region startLoadingButton

function startLoadingButton(id) {
    // Verificar si el botón ya está en estado de carga
    $('.custom-tooltip').remove();
    $(id).trigger('mouseleave');

    if ($(id).data('loading')) {
        return; // Si ya está en estado de carga, no hacer nada
    }

    // Guardar el estado original del botón en un atributo de datos
    $(id).data('original-text', $(id).html());

    // Deshabilitar todos los botones y guardar su estado
    $('button').each(function () {
        var button = $(this);
        if (!button.prop('disabled')) {
            button.data('previously-enabled', true);
        }
        button.prop('disabled', true);
    });

    // Cambiar el contenido del botón que inició la carga
    $(id).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

    // Marcar el botón como en estado de carga
    $(id).data('loading', true);
}

function quitLoadingButton(id) {
    // Restaurar el estado original del botón
    $('.custom-tooltip').remove();
    var originalText = $(id).data('original-text');
    $(id).html(originalText);
    $(id).prop("disabled", false);

    // Limpiar el atributo de datos que contenía el estado original
    $(id).removeData('original-text');
    $(id).removeData('loading');

    // Restaurar el estado de los botones que fueron deshabilitados previamente
    $('button').each(function () {
        var button = $(this);
        if (button.data('previously-enabled')) {
            button.prop('disabled', false);
            button.removeData('previously-enabled');
        }
    });
}

//#endregion startLoadingButton

//#region Stop Camara

window.addEventListener("beforeunload", () => {
    const videoElement = document.getElementById('video');
    if (videoElement?.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
});


let videoStream = null;

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop()); // Detiene todas las pistas activas
        videoStream = null; // Limpiamos la referencia para evitar acumulación
    }
}

function startCamera() {
    if (videoStream) {
        console.log("La cámara ya está activa.");
        return; // Evita crear múltiples instancias
    }

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            let videoElement = document.querySelector("video");
            if (videoElement) {
                videoElement.srcObject = stream;
                videoStream = stream; // Guardamos la referencia del stream
            }
        })
        .catch(error => console.error("Error al acceder a la cámara:", error));
}



//#endregion Stop Camara

const fetchData = async (url, method = "GET", body = null) => {
    try {
        const options = {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null
        };
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        return response.text();
    } catch (error) {
        console.error("Error en fetch:", error);
        return null;
    }
};

function reproducirAlerta(mensaje, callback) {
    if (isMobile()) {
        android.speakText(mensaje);
        return;
    }
    let speech = new SpeechSynthesisUtterance(mensaje);
    let voces = speechSynthesis.getVoices();
    console.log(voces)
    let vozEspañol = voces.find(voz => voz.name.includes("Microsoft Laura - Spanish (Spain)"));

    if (vozEspañol) {
        console.log('entre')
        speech.voice = vozEspañol;
    }

    speech.rate = 1.2;
    speech.pitch = 1;

    speech.onend = () => {
        if (callback) callback();
    };

    speechSynthesis.speak(speech);
}