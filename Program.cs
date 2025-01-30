using Newtonsoft.Json;
using XCF_Web_Control_Asistencia.Classes;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.IO;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Cargar configuraciones desde appsettings.json y variables de entorno
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                      .AddEnvironmentVariables();

// Obtener el valor del ambiente desde la configuración
var ambiente = builder.Configuration["Ambiente"];

// Agregar servicios al contenedor
builder.Services.AddControllersWithViews();

// Configurar la caché distribuida y la sesión
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Agregar servicio HTTP y ApiHandler como singleton
builder.Services.AddHttpClient();
builder.Services.AddSingleton<ApiHandler>();

var app = builder.Build();

// Configurar el middleware
app.UseWebSockets();
app.UseDefaultFiles();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.UseSession();

// Middleware para la verificación de navegador
app.Use(async (context, next) =>
{
    var userAgent = context.Request.Headers["User-Agent"].ToString();

    bool esChrome = userAgent.Contains("Chrome") || userAgent.Contains("CriOS");
    bool esEdge = userAgent.Contains("Edg");
    bool esBrave = userAgent.Contains("Brave");


    // Verificar si no es Chrome o si es Edge (que también contiene 'Chrome' en el User-Agent)
    if (!esChrome || esEdge || esBrave)
    {
        // Renderizar el Partial View si no es Chrome
        context.Response.StatusCode = 200;
        context.Response.ContentType = "text/html";
        var partialViewContent = await ViewRenderHelper.RenderPartialViewToString(context, "_UnsupportedBrowser");
        await context.Response.WriteAsync(partialViewContent);
    }
    else
    {
        // Continuar con el pipeline normal si es Chrome
        await next();
    }
});
// Verifica si el navegador es Chrome
app.UseSession();

// Configurar rutas
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=ControlAsistencia}/{action=ControlAsistencia}");

if (!app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        await next();

        // Manejo de errores 404 en ambientes no desarrollo
        if (context.Response.StatusCode == 404 && !context.Response.HasStarted)
        {
            // Obtener el segmento de ruta desde la configuración basada en el ambiente
            var pathSegment = builder.Configuration[$"ApplicationNames:{ambiente}"];

            // Evitar un bucle de redirección infinito y redirigir a la página de error personalizada
            if (!context.Request.Path.StartsWithSegments($"/{pathSegment}/Error"))
            {
                context.Response.Redirect($"/{pathSegment}/Error/404");
            }
        }
    });
}
else
{
    app.Use(async (context, next) =>
    {
        await next();

        // Manejo de errores 404 en ambiente de desarrollo
        if (context.Response.StatusCode == 404 && !context.Response.HasStarted)
        {
            if (!context.Request.Path.StartsWithSegments("/Error"))
            {
                context.Response.Redirect("/Error/404");
            }
        }
    });
}

app.Run();

// Métodos de extensión para gestionar objetos JSON en la sesión
public static class SessionExtensions
{
    public static void SetObjectAsJson(this ISession session, string key, object value)
    {
        session.SetString(key, JsonConvert.SerializeObject(value));
    }

    public static T GetObjectFromJson<T>(this ISession session, string key)
    {
        var value = session.GetString(key);
        return value == null ? default(T) : JsonConvert.DeserializeObject<T>(value);
    }
}
