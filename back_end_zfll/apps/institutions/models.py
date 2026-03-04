"""Institutions app — Institucion, ProgramaFormacion."""
from django.db import models

class Institucion(models.Model):
    usuario = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="institucion")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    tipo_institucion = models.ForeignKey(
        "catalogs.TipoInstitucion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instituciones",
        verbose_name="Tipo de institución",
    )
    ubicacion = models.CharField("Ubicación", max_length=255, blank=True)
    activa = models.BooleanField(default=False)
    extra_data = models.JSONField(default=dict, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "instituciones"
        verbose_name = "Institución"
        verbose_name_plural = "Instituciones"

    def __str__(self):
        return self.nombre

class ProgramaFormacion(models.Model):
    institucion = models.ForeignKey(Institucion, on_delete=models.CASCADE, related_name="programas")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "programas_formacion"
        verbose_name = "Programa de formación"

    def __str__(self):
        return f"{self.nombre} ({self.institucion.nombre})"


class UsuarioInstitucional(models.Model):
    """User profile for institution staff (admin, professor, etc.)."""
    institucion = models.ForeignKey(
        Institucion,
        on_delete=models.CASCADE,
        related_name="usuarios_institucionales",
    )
    usuario = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="perfil_usuario_institucional",
    )
    nombre_completo = models.CharField(max_length=255, blank=True)
    rol = models.CharField(
        max_length=20,
        choices=[
            ("ADMINISTRADOR", "Administrador"),
            ("PROFESOR", "Profesor"),
            ("STAFF", "Staff"),
        ],
        default="PROFESOR",
    )
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "usuarios_institucionales"
        verbose_name = "Usuario institucional"
        verbose_name_plural = "Usuarios institucionales"

    def __str__(self):
        return f"{self.nombre_completo or self.usuario.email} ({self.institucion.nombre})"