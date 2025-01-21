//#region Carga Inical

$(document).ready(function () {
    ControlAsistenciaSelectData();
});

//#endregion

//#region SeleccionarDatos

const ControlAsistenciaSelectData = async () => {
    try {
        const response = await fetch($("#urlSeleccionarDatos").data("action-url"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                IdUsuario: 36
            })
        }
        );
        //Si la response es buena
        if (response.ok) {
            //Obtener Json de response
            let jsonObject = await response.json();
            console.log(jsonObject)
            //Si la response es mala
        }
        else {
            //Mensaje de error del servidor
            const errorMessage = await response.text();


            //Error
            throw new Error("Error en la solicitud");
        }
    } catch (error) {
        console.error("Error: ", error);
    }
}

//#endregion