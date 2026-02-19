# SIHSALUS - Distribución OpenMRS para el Perú

## Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Configuración SSL/HTTPS](#configuración-sslhttps)
- [Credenciales de GitHub Packages](#credenciales-de-github-packages)
- [Políticas de Seguridad](#políticas-de-seguridad-cifrado-de-backups-y-retención-de-logs)

---

## Inicio Rápido

### Sin SSL (Recomendado para desarrollo)

```bash
# Construir las imágenes
docker compose build

# Iniciar los servicios
docker compose up -d

# Acceder vía HTTP
# http://localhost/openmrs/spa
```

### Con SSL

```bash
# Construir las imágenes (incluye certbot)
docker compose -f docker-compose.yml -f docker-compose.ssl.yml build

# Iniciar los servicios con SSL
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d

# Acceder vía HTTPS
# https://localhost/openmrs/spa
```

## Configuración SSL/HTTPS

peruHCE incluye soporte completo para SSL/HTTPS con certificados auto-firmados optimizados para redes hospitalarias internas.

Las variables de SSL se configuran en el archivo `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `SSL_MODE` | `dev` (generación única) o `prod` (renovación automática) | `dev` |
| `CERT_WEB_DOMAINS` | Dominios del certificado (separados por coma) | `localhost,127.0.0.1` |
| `CERT_WEB_DOMAIN_COMMON_NAME` | Common Name del certificado | `sihsalus.hsc` |

## Credenciales de GitHub Packages

El backend necesita credenciales de GitHub para descargar módulos privados desde GitHub Packages durante el build.

Las credenciales se configuran en el archivo `.env`:

```env
GHP_USERNAME=<tu_usuario_github>
GHP_PASSWORD=<tu_token_github_con_read:packages>
```

Estas se pasan como **build args** al Dockerfile, que las exporta como variables de entorno para que Maven las use en `credentials/settings.xml.template` (`${env.GHP_USERNAME}`, `${env.GHP_PASSWORD}`).

> **Nota:** Este proyecto NO usa Docker secrets. Las credenciales se manejan mediante variables de entorno en el archivo `.env`.

## Políticas de Seguridad: Cifrado de Backups y Retención de Logs

Este proyecto implementa:
- **Cifrado automático de backups**: Los archivos de respaldo se cifran con AES-256 usando openssl. La clave se provee vía la variable de entorno `BACKUP_ENCRYPTION_PASSWORD`. El backup sin cifrar se elimina tras el cifrado exitoso.
- **Rotación y retención de logs**: Los scripts de backup mantienen solo los últimos 5 archivos de log, eliminando los más antiguos automáticamente.

# OpenMRS 3.0 Reference Application

This project holds the build configuration for the OpenMRS 3.0 reference application, found on
https://dev3.openmrs.org and https://o3.openmrs.org.

## Quick start

### Package the distribution and prepare the run

```
docker compose build
```

### Run the app

```
docker compose up
```

The new OpenMRS UI is accessible at http://localhost/openmrs/spa

OpenMRS Legacy UI is accessible at http://localhost/openmrs

## Overview

This distribution consists of four images:

* db - This is just the standard MariaDB image supplied to use as a database
* backend - This image is the OpenMRS backend. It is built from the main Dockerfile included in the root of the project and
  based on the core OpenMRS Docker file. Additional contents for this image are drawn from the `distro` sub-directory which
  includes a full Initializer configuration for the reference application intended as a starting point.
* frontend - This image is a simple nginx container that embeds the 3.x frontend, including the modules described in  the
  `frontend/spa-build-config.json` file.
* proxy - This image is an even simpler nginx reverse proxy that sits in front of the `backend` and `frontend` containers
  and provides a common interface to both. This helps mitigate CORS issues.

## Contributing to the configuration

This project uses the [Initializer](https://github.com/mekomsolutions/openmrs-module-initializer) module
to configure metadata for this project. The Initializer configuration can be found in the configuration
subfolder of the distro folder. Any files added to this will be automatically included as part of the
metadata for the RefApp.

Eventually, we would like to split this metadata into two packages:

* `openmrs-core`, which will contain all the metadata necessary to run OpenMRS
* `openmrs-demo`, which will include all of the sample data we use to run the RefApp

The `openmrs-core` package will eventually be a standard part of the distribution, with the `openmrs-demo`
provided as an optional add-on. Most data in this configuration _should_ be regarded as demo data. We
anticipate that implementation-specific metadata will replace data in the `openmrs-demo` package,
though they may use that metadata as a starting point for that customization.

To help us keep track of things, we ask that you suffix any files you add with either
`-core_demo` for files that should be part of the demo package and `-core_data` for
those that should be part of the core package. For example, a form named `test_form.json` would become
`test_core-core_demo.json`.

Frontend configuration can be found in `frontend/config-core.json`.

Thanks!
