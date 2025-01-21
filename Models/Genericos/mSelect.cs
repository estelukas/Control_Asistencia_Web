

namespace XCF_Web_Control_Asistencia.Models.Genericos
{
    using System.ComponentModel.DataAnnotations;
    public class mSelect
    {
        /// <summary>
        /// Id. (Ej. "1")
        /// </summary>
        [Required(ErrorMessage = "El dato es requerido.")]
        [RegularExpression("[1-9][0-9]*")]
        public int Id { get; set; }


        /// <summary>
        /// Json o cadena de texto para
        /// </summary>
        public string Contenido { get; set; } = string.Empty;
    }
}
