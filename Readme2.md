# Ejecutar todos los microservicios con un solo comando

Para evitar abrir múltiples terminales al ejecutar los microservicios del proyecto, se implementó una solución utilizando **concurrently**, una herramienta que permite ejecutar varios procesos de Node.js en una sola terminal.

## 1. Instalar dependencias del proyecto raíz

Ubicarse en la carpeta principal del proyecto:

```
ARROYO_SECO_STAGE2-MAIN
```

Inicializar el proyecto Node si aún no existe un `package.json` en la raíz:

```bash
npm init -y
```

Instalar la dependencia necesaria:

```bash
npm install concurrently --save-dev
```

---

## 2. Configurar el script de ejecución

Abrir el archivo `package.json` en la raíz del proyecto y agregar el siguiente script dentro de la sección `"scripts"`:

```json
"scripts": {
  "start-all": "concurrently \"cd auth-service && npm start\" \"cd catalog-js && npm start\" \"cd order-service && npm start\" \"cd payment-service && npm start\" \"cd reservation-service && npm start\" \"cd review-service && npm start\" \"cd api-gateway && npm start\""
}
```

Este script iniciará todos los microservicios del sistema.

---

## 3. Instalar dependencias de cada microservicio

Antes de ejecutar el proyecto por primera vez, es necesario instalar las dependencias en cada servicio.

Ejecutar en cada carpeta:

```
api-gateway
auth-service
catalog-js
order-service
payment-service
reservation-service
review-service
```

Comando:

```bash
npm install
```

---

## 4. Ejecutar todo el backend

Una vez instaladas todas las dependencias, desde la **carpeta raíz del proyecto** ejecutar:

```bash
npm run start-all
```

Esto iniciará todos los servicios en una sola terminal.

---

## 5. Servicios que se ejecutarán

El comando anterior iniciará automáticamente:

* API Gateway
* Auth Service
* Catalog Service
* Order Service
* Payment Service
* Reservation Service
* Review Service

El **API Gateway** funcionará como punto de entrada principal para todas las peticiones del sistema.

---

## 6. Notas importantes

Antes de ejecutar el proyecto verificar:

* Tener **Node.js** instalado.
* Tener configuradas las variables de entorno en los archivos `.env`.
* Tener la base de datos creada utilizando el archivo `init_db.sql`.

---

## Resultado

Con esta configuración, cualquier miembro del equipo podrá iniciar todo el backend del proyecto con un solo comando:

```bash
npm run start-all
```

Sin necesidad de abrir múltiples terminales.

Aquí tienes el bloque listo para agregar a tu README, siguiendo el mismo formato claro y estructurado:

---

## 7. Review Service – Funcionalidades de Comunidad

El **Review Service** es el encargado de gestionar la interacción social dentro de la plataforma, permitiendo a los usuarios compartir experiencias, calificar servicios y mantener un sistema de moderación y calidad.

---

### 🧩 7.1 Funcionalidades Generales

Este servicio implementa un sistema completo de reseñas que incluye:

* Publicación de reseñas con **texto, calificación y contenido multimedia**
* Interacción entre **turistas y oferentes**
* Sistema de **reportes y moderación**
* Métricas y analítica para administración

---

### 👤 7.2 Turista (Usuario que consume y opina)

El turista puede:

* Publicar reseñas sobre productos o servicios
* Editar o eliminar sus propias reseñas
* Reportar reseñas por:

  * Contenido ofensivo
  * Información falsa
  * Spam
* Reportar oferentes por:

  * Fraude
  * Mala experiencia grave

#### Endpoints principales

```
POST   /api/reviews              → Crear review
GET    /api/reviews/mis-reviews  → Ver mis reviews
PUT    /api/reviews/:id          → Actualizar review
```

---

### 🏪 7.3 Oferente (Negocio o prestador de servicios)

El oferente puede:

* Ver reseñas de su negocio
* Consultar su calificación promedio
* Responder a reseñas
* Editar o eliminar sus respuestas
* Reportar reseñas injustas o falsas

#### Endpoints principales

```
GET    /api/reviews/oferente/:id     → Ver reviews de mi negocio
GET    /api/reviews/oferente/:id     → Ver calificación promedio
POST   /api/responses/review/:id     → Responder a una review
PUT    /api/responses/:id            → Actualizar respuesta
DELETE /api/responses/:id            → Eliminar respuesta
POST   /api/reports/review/:id       → Reportar review
```

---

### 🛠️ 7.4 Administrador (Control total del sistema)

El administrador tiene acceso completo al sistema de moderación y analítica:

* Ver todos los reportes enviados
* Clasificar reportes (spam, abuso, fraude, etc.)
* Eliminar u ocultar reseñas
* Consultar métricas del sistema

#### Endpoints principales

```
GET    /api/admin/reports                → Ver todos los reportes
GET    /api/admin/reports/pending        → Ver reportes pendientes
PUT    /api/reports/:id/resolver         → Resolver/clasificar reporte
PUT    /api/admin/reviews/:id/moderate   → Ocultar/eliminar review

GET    /api/admin/analytics?tipo=resenas_por_lugar
GET    /api/admin/analytics?tipo=top_oferentes
GET    /api/admin/analytics?tipo=usuarios_activos
```

---

### 📊 7.5 Capacidades Analíticas

El sistema permite obtener información clave como:

* Número de reseñas por lugar
* Lugares mejor calificados
* Usuarios más activos

Estas métricas ayudan a mejorar la toma de decisiones y la calidad del servicio.

---

## ✅ Resultado

El **Review Service** proporciona una solución completa de comunidad que:

* Fomenta la confianza entre usuarios
* Permite retroalimentación directa entre clientes y negocios
* Integra un sistema robusto de moderación
* Ofrece analítica para mejorar la plataforma

---

Si quieres, puedo integrarlo directamente con numeración continua respecto a tu README completo (por ejemplo, ajustarlo si ya tienes otras secciones 7.x u 8.x).
