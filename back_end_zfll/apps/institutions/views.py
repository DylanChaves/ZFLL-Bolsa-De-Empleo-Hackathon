from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.db.models.functions import TruncMonth
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions import IsInstitucion
from apps.jobs.models import Vacante
from apps.pasantias.models import SolicitudPasantia

from .models import Institucion, ProgramaFormacion, UsuarioInstitucional
from .serializers import (
    InstitucionSerializer,
    UsuarioInstitucionalSerializer,
    UsuarioInstitucionalCreateSerializer,
    ProgramaFormacionSerializer,
    ProgramaFormacionCRUDSerializer,
)


def _get_my_institucion(request):
    return get_object_or_404(Institucion, usuario=request.user)


class InstitucionListView(generics.ListAPIView):
    serializer_class = InstitucionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Institucion.objects.select_related("usuario", "tipo_institucion").all()
        if not (user.is_staff or user.is_superuser or (hasattr(user, "has_role") and user.has_role("admin"))):
            qs = qs.filter(activa=True)
        activa_param = self.request.query_params.get("activa")
        if activa_param is not None:
            qs = qs.filter(activa=activa_param.lower() == "true")
        return qs


class InstitucionDetailView(generics.RetrieveUpdateAPIView):
    queryset = Institucion.objects.select_related("usuario", "tipo_institucion").all()
    serializer_class = InstitucionSerializer
    permission_classes = [IsAuthenticated]


class InstitucionUsersListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsInstitucion]

    def get_queryset(self):
        inst = _get_my_institucion(self.request)
        return UsuarioInstitucional.objects.select_related("usuario").filter(institucion=inst)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UsuarioInstitucionalCreateSerializer
        return UsuarioInstitucionalSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["institucion"] = _get_my_institucion(self.request)
        return ctx

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        perfil = ser.save()
        out = UsuarioInstitucionalSerializer(perfil, context=self.get_serializer_context()).data
        return Response(out, status=201)


class InstitucionUsersDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsInstitucion]
    serializer_class = UsuarioInstitucionalSerializer

    def get_queryset(self):
        inst = _get_my_institucion(self.request)
        return UsuarioInstitucional.objects.select_related("usuario").filter(institucion=inst)


class ProgramasListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsInstitucion]
    serializer_class = ProgramaFormacionCRUDSerializer

    def get_queryset(self):
        inst = _get_my_institucion(self.request)
        return ProgramaFormacion.objects.filter(institucion=inst)

    def perform_create(self, serializer):
        inst = _get_my_institucion(self.request)
        serializer.save(institucion=inst)


class ProgramasDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsInstitucion]
    serializer_class = ProgramaFormacionCRUDSerializer

    def get_queryset(self):
        inst = _get_my_institucion(self.request)
        return ProgramaFormacion.objects.filter(institucion=inst)


class DemandaLaboralView(APIView):
    permission_classes = [IsAuthenticated, IsInstitucion]

    def get(self, request):
        inst = _get_my_institucion(request)
        top_areas = (
            Vacante.objects.values("area_trabajo__nombre")
            .annotate(total=Count("id"))
            .order_by("-total")[:5]
        )
        carreras = [{"nombre": x["area_trabajo__nombre"] or "Sin área", "total": x["total"]} for x in top_areas]
        top_tipos = (
            Vacante.objects.values("tipo_puesto__nombre")
            .annotate(total=Count("id"))
            .order_by("-total")[:4]
        )
        habilidades = [{"nombre": x["tipo_puesto__nombre"] or "General", "total": x["total"]} for x in top_tipos]
        qs = SolicitudPasantia.objects.filter(institucion=inst)
        mensual = qs.annotate(mes=TruncMonth("fecha_creacion")).values("mes").annotate(total=Count("id")).order_by("mes")
        interaccion = [
            {"mes": x["mes"].strftime("%b"), "empresas": x["total"], "instituciones": max(0, int(x["total"] * 0.6))}
            for x in mensual
        ]
        return Response({
            "carreras_mayor_demanda": carreras,
            "habilidades_mas_solicitadas": habilidades,
            "interaccion": interaccion,
            "perfil_buscado": {"habilidades_blandas": 95, "idiomas": 88, "excelencia_academica": 75, "certificaciones": 60},
        })