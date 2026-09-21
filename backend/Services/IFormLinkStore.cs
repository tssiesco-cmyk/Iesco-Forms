using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>Enlaces para responder un formulario sin sesion, con vencimiento.</summary>
public interface IFormLinkStore
{
    /// <summary>Los enlaces de un formulario, del que vence mas tarde al que antes.</summary>
    IReadOnlyList<FormLink> List(string formId);

    FormLink Create(string formId, DateTimeOffset expiresAt, string createdBy);

    /// <summary>Null si el enlace no existe o no es de ese formulario.</summary>
    FormLink? UpdateExpiry(string formId, string linkId, DateTimeOffset expiresAt);

    bool Delete(string formId, string linkId);

    /// <summary>El enlace y su formulario, vencido o no. Null si el token no existe.</summary>
    (FormLink Link, string FormId)? FindByToken(string token);
}
