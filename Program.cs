using Newtonsoft.Json;
using XCF_Web_Control_Asistencia.Classes;
using Microsoft.Extensions.Caching.Distributed;

var builder = WebApplication.CreateBuilder(args);

// Cargar configuraciones desde appsettings.json y variables de entorno
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                      .AddEnvironmentVariables();

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();


// Obtener el valor del ambiente desde la configuración
var ambiente = builder.Configuration["Ambiente"];

// Agregar servicios al contenedor
builder.Services.AddControllersWithViews();

// Configurar la caché distribuida y la sesión
builder.Services.AddDistributedMemoryCache();
//builder.Services.AddSession(options =>
//{
//    options.IdleTimeout = TimeSpan.FromMinutes(30);
//    options.Cookie.HttpOnly = true;
//    options.Cookie.IsEssential = true;
//});

// Agregar servicio HTTP y ApiHandler como singleton
builder.Services.AddHttpClient();
builder.Services.AddSingleton<ApiHandler>();

var app = builder.Build();

// Configurar el middleware
app.UseWebSockets();
app.UseDefaultFiles();
app.UseHttpsRedirection();
//app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
//app.UseSession();
app.UseStaticFiles(new StaticFileOptions
{
    ServeUnknownFileTypes = true
});

// Middleware para la verificación de navegador
app.Use(async (context, next) =>
{
    var cacheKey = $"browser-check-{context.Connection.Id}";
    var cache = context.RequestServices.GetRequiredService<IDistributedCache>();

    var cachedResponse = await cache.GetStringAsync(cacheKey);
    if (cachedResponse != null)
    {
        context.Response.StatusCode = 403;
        context.Response.ContentType = "text/html";
        await context.Response.WriteAsync(cachedResponse);
        return;
    }

    var userAgent = context.Request.Headers["User-Agent"].ToString();
    bool esChrome = userAgent.Contains("Chrome") || userAgent.Contains("CriOS");
    bool esSafariPuro = userAgent.Contains("Safari") && !userAgent.Contains("Chrome");

    if (!(esChrome || esSafariPuro))
    {
        var partialViewContent = await ViewRenderHelper.RenderPartialViewToString(context, "_UnsupportedBrowser");
        await cache.SetStringAsync(cacheKey, partialViewContent, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
        });

        context.Response.StatusCode = 403;
        context.Response.ContentType = "text/html";
        await context.Response.WriteAsync(partialViewContent);
        return;
    }

    await next();
});

// Verifica si el navegador es Chrome
//app.UseSession();


app.UseResponseCompression();


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