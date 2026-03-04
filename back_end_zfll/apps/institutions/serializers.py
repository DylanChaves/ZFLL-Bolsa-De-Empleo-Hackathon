from django.contrib.auth import get_user_model
from django.db import transaction
from apps.accounts.models import PerfilPracticante
from rest_framework import serializers

from .models import Institucion, ProgramaFormacion, UsuarioInstitucional

class ProgramaFormacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramaFormacion
        fields = ["id", "nombre", "descripcion", "activo"]


class InstitucionSerializer(serializers.ModelSerializer):
    programas       = ProgramaFormacionSerializer(many=True, read_only=True)
    tipo_nombre     = serializers.CharField(source="tipo_institucion.nombre", read_only=True, default=None)
    # Datos del usuario dueño
    usuario_email   = serializers.EmailField(source="usuario.email", read_only=True)
    usuario_phone   = serializers.CharField(source="usuario.phone", read_only=True, default=None)

    class Meta:
        model = Institucion
        fields = [
            "id", "nombre", "descripcion",
            "tipo_institucion", "tipo_nombre",
            "ubicacion", "activa",
            "programas", "fecha_creacion",
            "usuario_email", "usuario_phone",
        ]
        read_only_fields = ["id", "fecha_creacion", "usuario_email", "usuario_phone"]


User = get_user_model()

def _make_username_from_email(email: str) -> str:
    base = (email.split("@")[0] or "user").replace(".", "_").replace("-", "_")
    username = base[:25]
    # garantizar único
    if not User.objects.filter(username=username).exists():
        return username
    i = 2
    while User.objects.filter(username=f"{username}_{i}").exists():
        i += 1
    return f"{username}_{i}"


class UsuarioInstitucionalSerializer(serializers.ModelSerializer):
    correo = serializers.EmailField(source="usuario.email", read_only=True)

    class Meta:
        model = UsuarioInstitucional
        fields = ["id", "nombre_completo", "correo", "rol", "activo", "fecha_creacion"]
        read_only_fields = ["id", "correo", "fecha_creacion"]


class UsuarioInstitucionalCreateSerializer(serializers.Serializer):
    # lo que manda el frontend
    correo = serializers.EmailField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, min_length=6)
    nombre_completo = serializers.CharField(required=False, allow_blank=True, default="")
    rol = serializers.ChoiceField(choices=["ADMINISTRADOR", "PROFESOR", "STAFF"], default="PROFESOR")

    @transaction.atomic
    def create(self, validated_data):
        institucion = self.context["institucion"]

        email = (validated_data.get("correo") or validated_data.get("email") or "").strip().lower()
        password = validated_data["password"]
        nombre = validated_data.get("nombre_completo", "")
        rol = validated_data.get("rol", "PROFESOR")

        if not email:
            raise serializers.ValidationError("Debe enviar 'correo' o 'email'.")

        # crear user
        username = _make_username_from_email(email)
        user = User.objects.create_user(username=username, email=email, password=password)

        # rol base para entrar al módulo institución
        if hasattr(user, "add_role"):
            user.add_role("institucion")

        # crear perfil institucional
        perfil = UsuarioInstitucional.objects.create(
            institucion=institucion,
            usuario=user,
            nombre_completo=nombre,
            rol=rol,
            activo=True,
        )
        return perfil


class ProgramaFormacionCRUDSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramaFormacion
        fields = ["id", "institucion", "nombre", "descripcion", "activo"]
        read_only_fields = ["id", "institucion"]


class EgresadoListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    correo = serializers.EmailField()
    carrera = serializers.CharField(allow_blank=True)
    estado = serializers.CharField(allow_blank=True)

    # opcionales si luego quieres pintarlas
    programa_id = serializers.IntegerField(required=False, allow_null=True)
    programa_nombre = serializers.CharField(required=False, allow_blank=True)

def build_egresado_from_perfil(perfil: PerfilPracticante):
    u = perfil.usuario
    nombre = (f"{u.first_name or ''} {u.last_name or ''}".strip()) or (u.username or u.email or "Egresado")

    carrera = ""
    programa_id = None
    programa_nombre = ""

    if getattr(perfil, "programa_id", None):
        programa_id = perfil.programa_id
        try:
            programa_nombre = perfil.programa.nombre
        except Exception:
            programa_nombre = ""
        carrera = programa_nombre or ""

    # Estado: si tu PerfilPracticante tiene un campo estado úsalo, si no dejamos "DISPONIBLE"
    estado = getattr(perfil, "estado", None) or "DISPONIBLE"

    return {
        "id": u.id,
        "nombre": nombre,
        "correo": u.email,
        "carrera": carrera,
        "estado": estado,
        "programa_id": programa_id,
        "programa_nombre": programa_nombre,
    }