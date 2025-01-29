using System.ComponentModel.DataAnnotations;

namespace XCF_Web_Control_Asistencia.Models.Genericos
{
    public class mIdUsuario
    {
        /// <summary>
        /// Cadena de texto para la busqueda del Empleado
        /// </summary>
        public string ParametroBusqueda { get; set; }

        /// <summary>
        /// Nombre del Centro de Servicio
        /// </summary>
        public string CentroServicio { get; set; }
    }
}
