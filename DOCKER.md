# Guía Docker — Bolsa de Empleo ZFLL (Windows)

Esta guía explica **paso a paso** cómo levantar el proyecto con Docker en Windows.

---

## ¿Qué es Docker y por qué lo usamos?

Docker permite ejecutar la aplicación (backend, frontend, base de datos) dentro de **contenedores**, sin instalar Python, Node, PostgreSQL ni Redis en tu PC. Todo queda aislado y con las versiones correctas. Así cualquier persona del equipo puede tener el mismo entorno con los mismos comandos.

---

## Parte 1: Instalar Docker en Windows

### Paso 1.1 — Requisitos del sistema

- Windows 10 (versión 19041 o superior) o Windows 11, en modo 64 bits.
- Habilitar **WSL 2** (Windows Subsystem for Linux). Docker Desktop lo usa para ejecutar los contenedores.

### Paso 1.2 — Habilitar WSL 2 (si aún no lo tienes)

1. Abre **PowerShell** o **Símbolo del sistema** como **Administrador** (clic derecho → "Ejecutar como administrador").
2. Pega y ejecuta este comando:

   ```powershell
   wsl --install
   ```

3. Si te pide reiniciar, reinicia el equipo.
4. Tras reiniciar, se abrirá una ventana de Ubuntu (o otra distribución). Sigue las instrucciones para crear un usuario y contraseña la primera vez. Luego puedes cerrar esa ventana.

### Paso 1.3 — Descargar e instalar Docker Desktop

1. Entra a: **https://www.docker.com/products/docker-desktop/**
2. Pulsa **"Download for Windows"** y guarda el instalador.
3. Ejecuta el instalador (`Docker Desktop Installer.exe`).
4. Si pregunta por **WSL 2**, déjalo marcado y continúa.
5. Cuando termine, el instalador puede pedir **cerrar sesión** o **reiniciar**. Hazlo si lo indica.
6. Después de reiniciar, abre **Docker Desktop** desde el menú Inicio.
7. Acepta los términos si aparecen. La primera vez puede tardar un poco en iniciar y mostrar "Docker Desktop is running" (o el ícono de Docker estable en la bandeja del sistema).

### Paso 1.4 — Comprobar que Docker funciona

1. Pulsa **Windows + R**, escribe `cmd` y Enter (o abre "Símbolo del sistema" o "Terminal").
2. Escribe:

   ```bash
   docker --version
   docker compose version
   ```

3. Deberías ver algo como `Docker version 24.x.x` y `Docker Compose version v2.x.x`. Si ves eso, la instalación está correcta.

---

## Parte 2: Preparar el proyecto

### Paso 2.1 — Tener el código del proyecto

- Si usas **Git**: clona el repositorio o haz `git pull` en la carpeta del proyecto.
- Asegúrate de estar en la **carpeta raíz del proyecto**, es decir, donde están los archivos `docker-compose.yml`, la carpeta `back_end_zfll` y la carpeta `front_end_zfll`.

### Paso 2.2 — Abrir terminal en la carpeta del proyecto

**Opción A — Desde el Explorador de archivos**

1. Abre el Explorador y ve a la carpeta del proyecto (donde está `docker-compose.yml`).
2. En la barra de direcciones, escribe `cmd` y pulsa Enter. Se abrirá una ventana de terminal ya situada en esa carpeta.

**Opción B — Desde la terminal**

1. Abre **Símbolo del sistema** o **PowerShell** o **Terminal**.
2. Navega hasta la carpeta del proyecto, por ejemplo:

   ```powershell
   cd C:\Users\TuUsuario\Documents\Bolsa-de-empleo-ZFLL
   ```

   (Cambia la ruta por la que corresponda a tu proyecto.)

### Paso 2.3 — (Opcional) Archivo de variables de entorno

El proyecto puede funcionar sin crear `.env` porque el `docker-compose` ya define las variables necesarias. Si quieres personalizar algo (por ejemplo, contraseña de la base de datos), puedes:

1. Copiar el archivo de ejemplo:

   ```bash
   copy .env.example .env
   ```

2. Editar `.env` con el Bloc de notas o tu editor. Para esta guía no es obligatorio.

---

## Parte 3: Levantar el proyecto con Docker

### Paso 3.1 — Construir y arrancar todos los servicios

En la terminal (en la carpeta del proyecto), ejecuta:

```bash
docker compose up --build -d
```

**Qué hace este comando:**

- `docker compose` — Usa el archivo `docker-compose.yml` del proyecto.
- `up` — Crea y arranca los contenedores (base de datos, backend, frontend, Redis).
- `--build` — Construye las imágenes del backend y frontend la primera vez (o si hubo cambios).
- `-d` — Ejecuta en segundo plano ("detached"), para que puedas seguir usando la terminal.

La **primera vez** puede tardar varios minutos (descarga de imágenes y construcción). Verás muchas líneas de texto; es normal.

### Paso 3.2 — Comprobar que todo está en marcha

Ejecuta:

```bash
docker compose ps
```

Deberías ver algo como:

- `bolsa-de-empleo-zfll-db-1` — Estado **Up** (healthy)
- `bolsa-de-empleo-zfll-redis-1` — Estado **Up** (healthy)
- `bolsa-de-empleo-zfll-backend-1` — Estado **Up**
- `bolsa-de-empleo-zfll-frontend-1` — Estado **Up**

Si los cuatro están "Up", el proyecto está levantado.

### Paso 3.3 — Dónde acceder a la aplicación

Abre el **navegador** y usa estas direcciones:

| Qué              | URL                    |
|------------------|------------------------|
| Aplicación web   | http://localhost:5173  |
| API del backend  | http://localhost:8000   |

- **Frontend (página principal):** http://localhost:5173  
- **Backend (API):** http://localhost:8000 (por ejemplo http://localhost:8000/api/ para endpoints)

---

## Parte 4: Crear un usuario administrador (primera vez)

Para entrar al panel de administración o probar con un usuario "superusuario" en Django:

1. En la terminal (en la carpeta del proyecto), ejecuta:

   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

2. Te pedirá:
   - **Email:** el que usarás para iniciar sesión (por ejemplo `admin@ejemplo.com`).
   - **Password:** contraseña (no se verá al escribir).
   - **Password (again):** repite la contraseña.

3. Cuando termine, ya puedes usar ese email y contraseña para acceder al sistema según los flujos de login del proyecto.

---

## Parte 4.5: Importar el dump de respaldo (respaldobasededatos.dump)

Si tienes un archivo de respaldo de la base de datos (por ejemplo `respaldobasededatos.dump`) y quieres cargar esos datos:

1. Asegúrate de que el proyecto está levantado: `docker compose up -d`.
2. Copia el dump al contenedor de la base de datos y restaura (reemplaza la base actual):

   ```bash
   docker compose cp respaldobasededatos.dump db:/tmp/dump.dump
   docker compose exec db psql -U postgres -c "DROP DATABASE IF EXISTS bolsa_empleo;" -c "CREATE DATABASE bolsa_empleo;"
   docker compose exec db pg_restore -U postgres -d bolsa_empleo --no-owner --no-acl /tmp/dump.dump
   ```

3. Aplica las migraciones de Django por si el dump no incluye tablas nuevas (por ejemplo `usuarios_institucionales`):

   ```bash
   docker compose exec backend python manage.py migrate --noinput
   ```

**Nota:** El dump debe ser de PostgreSQL (formato custom de `pg_dump`). El proyecto usa PostgreSQL 17 para poder importar dumps recientes.

---

## Parte 5: Ver logs (por si algo falla)

Para ver qué está haciendo el backend en tiempo real:

```bash
docker compose logs -f backend
```

- `-f` sigue mostrando nuevas líneas (como "seguir la cola"). Para salir: **Ctrl + C**.

Para ver los logs del frontend:

```bash
docker compose logs -f frontend
```

Para ver los de todos los servicios:

```bash
docker compose logs -f
```

---

## Parte 6: Detener el proyecto

Cuando quieras apagar todo:

```bash
docker compose down
```

Eso detiene y elimina los contenedores. Los datos de la base de datos se conservan en un "volumen" de Docker, así que la próxima vez que hagas `docker compose up -d` seguirán ahí.

Si además quieres **borrar los datos de la base de datos** (empezar de cero):

```bash
docker compose down -v
```

El `-v` elimina los volúmenes, incluido el de PostgreSQL.

---

## Parte 7: Resumen de comandos útiles

| Acción                         | Comando |
|--------------------------------|---------|
| Levantar todo (primera vez)    | `docker compose up --build -d` |
| Levantar todo (ya construido)  | `docker compose up -d`         |
| Ver estado de los servicios   | `docker compose ps`            |
| Ver logs del backend           | `docker compose logs -f backend` |
| Crear superusuario              | `docker compose exec backend python manage.py createsuperuser` |
| Detener todo                   | `docker compose down`          |
| Detener y borrar datos de DB   | `docker compose down -v`       |

---

## Parte 8: Problemas frecuentes en Windows

### "Cannot connect to the Docker daemon"

- Asegúrate de que **Docker Desktop** está abierto y que en la bandeja del sistema aparece como en ejecución.
- Prueba a cerrar Docker Desktop y abrirlo de nuevo, o reiniciar el PC.

### "port is already allocated" o "port 5432 already in use"

- Otro programa (por ejemplo otra base de datos o otra instancia del proyecto) está usando ese puerto.
- Cierra otras aplicaciones que usen PostgreSQL (puerto 5432), Redis (6379), o las que usen 8000 o 5173.
- O bien detén otros contenedores: `docker compose down` en otras carpetas de proyecto, o desde Docker Desktop detén contenedores que usen esos puertos.

### La página http://localhost:5173 no carga

- Espera 1–2 minutos tras `docker compose up -d`; el frontend a veces tarda en estar listo.
- Comprueba con `docker compose ps` que el contenedor `frontend` está **Up**.
- Revisa los logs: `docker compose logs frontend`.

### El backend no arranca o da error de base de datos

- Comprueba que el contenedor `db` está **Up** y **healthy**: `docker compose ps`.
- Si no está healthy, intenta: `docker compose down` y luego `docker compose up -d` de nuevo.
- Revisa los logs del backend: `docker compose logs backend`.

### Quiero empezar de cero (borrar todo y reconstruir)

```bash
docker compose down -v
docker compose up --build -d
```

Luego puedes volver a crear el superusuario con el comando de la Parte 4.

---

## Servicios que incluye este proyecto

| Servicio  | Descripción                         | Puerto (en tu PC) |
|-----------|-------------------------------------|-------------------|
| `db`      | Base de datos PostgreSQL 16         | 5432              |
| `redis`   | Redis (cola de tareas, opcional en dev) | 6379           |
| `backend` | API Django (migraciones + servidor) | 8000              |
| `frontend`| Aplicación React (Vite)            | 5173              |

Credenciales por defecto de la base de datos (para uso local): usuario `postgres`, contraseña `postgres`, base de datos `bolsa_empleo`.
