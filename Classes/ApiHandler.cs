using Newtonsoft.Json;
using XCF_Web_Control_Asistencia.Models.Genericos;

namespace XCF_Web_Control_Asistencia.Classes
{
    public class ApiHandler
    {
        private readonly HttpClient _client;
        private readonly IConfiguration _configuration;

        public ApiHandler(HttpClient client, IConfiguration configuration)
        {
            _client = client ?? throw new ArgumentNullException(nameof(client));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }


        /// <summary>
        /// URL del Servicio de Control De Asistencia
        /// </summary>
        public string UrlControlAsistencia => _configuration.GetSection($"Servicios:{_configuration["Ambiente"]}")["ControlAsistencia"];

        /// <summary>
        /// Realiza una solicitud POST asincrónica a la API.
        /// </summary>
        /// <typeparam name="TRequest">Tipo del objeto de solicitud.</typeparam>
        /// <typeparam name="TResponse">Tipo del objeto de respuesta.</typeparam>
        /// <param name="apiUrl">URL de la API.</param>
        /// <param name="requestData">Datos de la solicitud.</param>
        /// <returns>Respuesta de la API deserializada.</returns>
        public async Task<TResponse> PostAsync<TRequest, TResponse>(string apiUrl, TRequest requestData)
        {
            // Convertir el modelo de solicitud a JSON
            string jsonModel = System.Text.Json.JsonSerializer.Serialize(requestData);

            // Encriptar el modelo JSON con información de usuario y contraseña
            byte[] byteArray = cAES.Encriptar(jsonModel);

            // Convertir el arreglo de bytes a Base64
            string base64String = Convert.ToBase64String(byteArray);

            // Crear un objeto anónimo con el campo "arregloBytes" para enviar en el cuerpo
            var requestBody = new { arregloBytes = base64String };

            // Serializar el objeto anónimo a JSON
            string jsonBody = System.Text.Json.JsonSerializer.Serialize(requestBody);

            // Crear el contenido de la solicitud con el JSON en el cuerpo
            var content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");

            // Realizar la solicitud POST
            HttpResponseMessage response = await _client.PostAsync(apiUrl, content);

            // Verificar si la solicitud fue exitosa
            if (response.IsSuccessStatusCode)
            {
                // Leer la respuesta como cadena
                string apiResponseString = await response.Content.ReadAsStringAsync();

                // Deserializar los bytes de respuesta
                mArregloBytes responseBytes = JsonConvert.DeserializeObject<mArregloBytes>(apiResponseString);

                // Desencriptar el texto de la respuesta
                mTexto mT = new mTexto { Texto = cAES.Desencriptar(responseBytes.ArregloBytes) };

                // Deserializar y devolver la respuesta de la API
                return System.Text.Json.JsonSerializer.Deserialize<TResponse>(mT.Texto);
            }
            else
            {
                // Manejar el caso cuando la llamada a la API no es exitosa
                return default;
            }
        }
    }
}
