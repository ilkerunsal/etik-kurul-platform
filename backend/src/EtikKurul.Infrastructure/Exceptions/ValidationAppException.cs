using Microsoft.AspNetCore.Http;

namespace EtikKurul.Infrastructure.Exceptions;

public sealed class ValidationAppException(string message) : AppException(message, StatusCodes.Status400BadRequest, "Validation failed");
