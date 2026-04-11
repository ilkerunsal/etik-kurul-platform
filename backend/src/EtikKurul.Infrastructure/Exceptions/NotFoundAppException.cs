using Microsoft.AspNetCore.Http;

namespace EtikKurul.Infrastructure.Exceptions;

public sealed class NotFoundAppException(string message) : AppException(message, StatusCodes.Status404NotFound, "Resource not found");
