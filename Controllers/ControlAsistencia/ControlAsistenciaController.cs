using Microsoft.AspNetCore.Mvc;
using XCF_Web_Control_Asistencia.Classes;
using XCF_Web_Control_Asistencia.Classes.Attributes;
using XCF_Web_Control_Asistencia.Models.Genericos;

namespace XCF_Web_Control_Asistencia.Controllers.ControlAsistencia
{
    [ValidateModel]
    public class ControlAsistenciaController(ApiHandler apiHandler) : Controller
    {
        private readonly ApiHandler _apiHandler = apiHandler ?? throw new ArgumentNullException(nameof(apiHandler));

        #region Control Asistencia

        /// <summary>
        /// Pantalla de Control de Asistencia
        /// </summary>
        /// <returns>View</returns>
        //[ValidarSesion]
        //[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public IActionResult ControlAsistencia()
        {
            return View();
        }


        /// <summary>
        /// Buscar Empleado mediante su Clave, Nombre, Centro de Servicio y Mostrarlo en cierto formato
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult Control_Asistencia_SeleccionarDatos([FromBody] mIdUsuario model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mIdUsuario, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/Control_Asistencia_SeleccionarDatos", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }

        /// <summary>
        /// Validar si la Ubicación del Usuario esta Dentro de la Geocerca del Centro de Servicio
        /// </summary>
        /// <returns>Json</returns>
        [HttpPost]
        public IActionResult Control_Asistencia_ValidarGeocerca([FromBody] mIdUsuario model)
        {
            try
            {
                mSelect r = _apiHandler.PostAsync<mIdUsuario, mSelect>(_apiHandler.UrlControlAsistencia + "controlasistencia/Control_Asistencia_ValidarGeocerca", model).Result;

                return Json(r);
            }
            catch (Exception)
            {
                return BadRequest("Ocurrió un error, vuelve a intentarlo.");
            }
        }

        #endregion Control Asistencia



    }
}
