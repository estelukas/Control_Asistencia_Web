namespace XCF_Web_Control_Asistencia.Models.Imagenes
{
    public class mImagenRequest
    {
        public string? Base64 { get; set; } // Imagen en formato Base64
        public string? Nombre { get; set; } // Nombre de la imagen
        public string? Ruta { get; set; } // Ruta donde se guardara
        public string? Rfc { get; set; } // rfc del empleado
        public string? ClaveEmpleado { get; set; } // Clave del empleado
        public string? TipoAsistencia { get; set; } // Tipo de asistencia, entrada o salida
        public string? IdGeocerca { get; set; } // Tipo de asistencia, entrada o salida
        public bool? Boleano { get; set; } // Si son la misma persona
    }
}
