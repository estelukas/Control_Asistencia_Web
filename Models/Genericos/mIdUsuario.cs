using System.ComponentModel.DataAnnotations;

namespace XCF_Web_Control_Asistencia.Models.Genericos
{
    public class mIdUsuario
    {
        /// <summary>
        /// Id del Usuario
        /// </summary>
        [Required(ErrorMessage = "El dato es requerido.")]
        [RegularExpression("[1-9][0-9]*")]
        public int IdUsuario { get; set; }

        /// <summary>
        /// Cadena de texto para la busqueda del Empleado
        /// </summary>
        public string ParametroBusqueda { get; set; }
    }
}
