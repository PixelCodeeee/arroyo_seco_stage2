# Arroyo Seco Backend - Arquitectura de Microservicios (Fase 2)

Este repositorio contiene la implementación de la **Fase 2** del proyecto Arroyo Seco, marcando la transición de una arquitectura monolítica a una arquitectura de **microservicios**. Este nuevo backend sirve como la fundación robusta y escalable para el funcionamiento interno de la aplicación y la integración con el frontend (PWA).

## 🏗️ Arquitectura

El sistema se ha descompuesto en servicios independientes, comunicándose a través de APIs REST y gestionados por un API Gateway central:

- **API Gateway**: Punto de entrada único, enrutamiento, y validación básica.
- **Auth Service**: Gestión de usuarios, autenticación (JWT) y autorización (Roles).
- **Catalog Service**: Gestión de productos, categorías, servicios y oferentes.
- **Order Service**: Gestión de pedidos y carrito de compras.
- **Reservation Service**: Gestión de reservas de servicios turísticos.
- **Payment Service**: Integración con pasarelas de pago (PayPal).

## 🚀 Pipeline de CI/CD y Modelo de Ramificación

### 3.1 Modelo de Ramas (GitFlow Adaptado)

La estrategia adoptada es **GitFlow adaptado**. Se eligió sobre GitHub Flow y Trunk-Based porque el proyecto tiene entregas por fases definidas (Fase 1 y Fase 2), roles diferenciados en el equipo y versiones etiquetadas para entrega al cliente (Municipio de Arroyo Seco).

#### Estructura de ramas

| Rama | Nomenclatura | Propósito |
| :--- | :--- | :--- |
| **main** | `main` | Producción. Solo versiones estables y aprobadas. |
| **develop** | `develop` | Integración continua. Base del pipeline. |
| **feature** | `feature/HU-<id>-<descripcion>` | Nueva funcionalidad. Vida máxima: 1 sprint. |
| **hotfix** | `hotfix/BUG-<id>-<descripcion>` | Corrección urgente directa desde main. |
| **release** | `release/v<X.Y>` | Preparación de entrega por fase. |

#### Ejemplos reales del proyecto

- `feature/HU-12-gestion-reservas`
- `feature/HU-07-carrito-artesanias`
- `hotfix/BUG-03-pago-paypal-null`
- `release/v1.0`

#### Reglas de protección

- **main**: 2 revisores obligatorios + pipeline verde.
- **develop**: 1 revisor + pipeline verde.
- **Push directo bloqueado** en ambas ramas.

### 3.2 Trigger — ¿Qué Dispara el Pipeline?

El pipeline se activa automáticamente por eventos en GitHub. Herramienta: **GitHub Actions** (nativo en el repo `PixelCodeeee` ya existente).

| Evento | Rama | Pipeline activado |
| :--- | :--- | :--- |
| `git push` | `feature/*` | Lint + unit tests rápidos (< 5 min) |
| Apertura de PR | `develop` | Pipeline CI completo |
| Merge aprobado | `develop` | CI completo + deploy a staging |
| Merge aprobado | `main` | CD completo + deploy Canary (10%) |
| `git push` | `hotfix/*` | Tests críticos fast-track (< 3 min) |

### 3.3 Pasos del Pipeline

Si cualquier step falla, el pipeline se detiene, notifica al desarrollador y activa rollback en stages de despliegue.

| # | Stage | Herramienta | Criterio de éxito |
| :--- | :--- | :--- | :--- |
| 1 | **Checkout** | GitHub Actions / Git | Repo disponible y limpio |
| 2 | **Code Quality** | ESLint + SonarCloud | 0 errores, Quality Gate A |
| 3 | **Build** | npm + Docker + Vite | Imagen Docker generada |
| 4 | **Test Unitario** | Jest + Supertest | Cobertura ≥ 70% |
| 5 | **Test Integración** | Jest + BD de prueba | Flujos críticos al 100% |
| 6 | **Security Scan** | npm audit + OWASP Dependency-Check | 0 vulnerabilidades críticas |
| 7 | **Deploy Staging** | Render | Staging accesible y respondiendo |
| 8 | **Canary 10%** | Render + instancia temporal | Métricas estables 10 min |
| 9 | **Deploy 100%** | Render — instancia canary eliminada | Producción estable, canary removido |

---

## 🛠️ Configuración Local

1. Asegúrate de tener un servidor MySQL/MariaDB corriendo.
2. Configura las variables de entorno (`.env`) en cada microservicio basándote en los archivos de ejemplo.
3. Ejecuta el script de inicio:

    ```bash
    ./start-all.sh
    ```
