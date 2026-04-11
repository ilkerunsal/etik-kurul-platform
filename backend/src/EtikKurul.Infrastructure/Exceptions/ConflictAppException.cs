using Microsoft.AspNetCore.Http;

namespace EtikKurul.Infrastructure.Exceptions;

public sealed class ConflictAppException(string message) : AppException(message, StatusCodes.Status409Conflict, "Conflict");
