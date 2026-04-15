const { prisma } = require('../config/db');

// Builds a full Date object from a date string (YYYY-MM-DD) and a time string (HH:MM).
// Used everywhere a `hora` column must be stored as a datetime.
function buildFechaHora(fecha, hora) {
    const fechaHora = new Date(`${fecha}T${hora}:00`);
    if (isNaN(fechaHora.getTime())) {
        throw new Error('Fecha u hora inválida');
    }
    return fechaHora;
}

// Convenience so callers never forget the radix.
const toInt = (value) => parseInt(value, 10);

class Reserva {
    static async create(data) {
        const {
            id_usuario,
            id_servicio,
            fecha,
            hora,
            numero_personas,
            estado = 'pendiente',
            notas = null
        } = data;

        const fechaObj = new Date(fecha);
        const fechaHora = buildFechaHora(fecha, hora); // ✅ use helper consistently

        const existeUsuarioFecha = await prisma.reserva.findFirst({
            where: {
                id_usuario: toInt(id_usuario),
                fecha: fechaObj
            }
        });
        if (existeUsuarioFecha) {
            throw new Error('Ya existe una reserva para este usuario en esta fecha');
        }

        const existeServicioFechaHora = await prisma.reserva.findFirst({
            where: {
                id_servicio: toInt(id_servicio),
                fecha: fechaObj,
                hora: fechaHora
            }
        });
        if (existeServicioFechaHora) {
            throw new Error('Ya existe una reserva para este servicio en esta fecha y hora');
        }

        const result = await prisma.reserva.create({
            data: {
                id_usuario: toInt(id_usuario),
                id_servicio: toInt(id_servicio),
                fecha: fechaObj,
                hora: fechaHora, // ✅ was: new Date(hora) — invalid for bare "HH:MM" strings
                numero_personas: toInt(numero_personas),
                estado,
                notas
            }
        });

        return this.findById(result.id_reserva);
    }

    static async findAll() {
        return prisma.reserva.findMany({
            include: {
                usuario: { select: { nombre: true, correo: true } },
                servicio: {
                    select: {
                        nombre: true,
                        oferente: { select: { nombre_negocio: true } }
                    }
                }
            },
            orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
        });
    }

    static async findById(id) {
        return prisma.reserva.findUnique({
            where: { id_reserva: toInt(id) },
            include: {
                usuario: { select: { nombre: true, correo: true } },
                servicio: { select: { nombre: true } }
            }
        });
    }

    static async findByUsuarioId(usuarioId) {
        return prisma.reserva.findMany({
            where: { id_usuario: toInt(usuarioId) },
            include: { servicio: { select: { nombre: true, rango_precio: true } } },
            orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
        });
    }

    static async findByServicioId(servicioId) {
        return prisma.reserva.findMany({
            where: { id_servicio: toInt(servicioId) },
            include: { usuario: { select: { nombre: true, correo: true } } },
            orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
        });
    }

    // ✅ Was throwing unconditionally — Prisma supports nested where through relations.
    static async findByOferenteId(oferenteId) {
        return prisma.reserva.findMany({
            where: {
                servicio: { id_oferente: toInt(oferenteId) }
            },
            include: {
                usuario: { select: { nombre: true, correo: true } },
                servicio: { select: { nombre: true } }
            },
            orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
        });
    }

    static async findByEstado(estado) {
        return prisma.reserva.findMany({
            where: { estado },
            include: {
                usuario: { select: { nombre: true } },
                servicio: { select: { nombre: true } }
            },
            orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
        });
    }

    static async update(id, data) {
        const reservaActual = await this.findById(id);
        if (!reservaActual) return null;

        const idReserva = toInt(id);
        const nuevaFecha = data.fecha !== undefined ? new Date(data.fecha) : reservaActual.fecha;
        const nuevaHora = data.hora !== undefined
            ? buildFechaHora(data.fecha ?? reservaActual.fecha.toISOString().slice(0, 10), data.hora) // ✅ use helper
            : reservaActual.hora;
        const nuevoServicio = data.id_servicio !== undefined ? toInt(data.id_servicio) : reservaActual.id_servicio;

        // Check user-date uniqueness only when the date actually changes.
        if (data.fecha !== undefined && nuevaFecha.getTime() !== new Date(reservaActual.fecha).getTime()) {
            const existeUsuarioFecha = await prisma.reserva.findFirst({
                where: {
                    id_usuario: reservaActual.id_usuario,
                    fecha: nuevaFecha,
                    id_reserva: { not: idReserva }
                }
            });
            if (existeUsuarioFecha) throw new Error('Ya existe una reserva para este usuario en esta fecha');
        }

        // Check service-date-time uniqueness when any of the three fields change.
        if (data.fecha !== undefined || data.hora !== undefined || data.id_servicio !== undefined) {
            const existeServicioFechaHora = await prisma.reserva.findFirst({
                where: {
                    id_servicio: nuevoServicio,
                    fecha: nuevaFecha,
                    hora: nuevaHora,
                    id_reserva: { not: idReserva }
                }
            });
            if (existeServicioFechaHora) throw new Error('Ya existe una reserva para este servicio en esta fecha y hora');
        }

        const updateData = {};
        if (data.id_servicio !== undefined) updateData.id_servicio = nuevoServicio;
        if (data.fecha !== undefined) updateData.fecha = nuevaFecha;
        if (data.hora !== undefined) updateData.hora = nuevaHora;
        if (data.numero_personas !== undefined) updateData.numero_personas = toInt(data.numero_personas);
        if (data.estado !== undefined) updateData.estado = data.estado;
        if (data.notas !== undefined) updateData.notas = data.notas;

        await prisma.reserva.update({
            where: { id_reserva: idReserva },
            data: updateData
        });

        return this.findById(id);
    }

    static async updateEstado(id, estado) {
        await prisma.reserva.update({
            where: { id_reserva: toInt(id) },
            data: { estado }
        });
        return this.findById(id);
    }

    static async delete(id) {
        const result = await prisma.reserva.delete({
            where: { id_reserva: toInt(id) }
        });
        return !!result;
    }

    static async getStats() {
        // ✅ Run all counts in parallel instead of sequentially.
        const [total, pendientes, confirmadas, canceladas] = await Promise.all([
            prisma.reserva.count(),
            prisma.reserva.count({ where: { estado: 'pendiente' } }),
            prisma.reserva.count({ where: { estado: 'confirmada' } }),
            prisma.reserva.count({ where: { estado: 'cancelada' } })
        ]);

        return { total, pendientes, confirmadas, canceladas };
    }

    static async checkDisponibilidad(id_servicio, fecha, hora) {
        const fechaHora = buildFechaHora(fecha, hora); // ✅ use helper

        const existe = await prisma.reserva.findFirst({
            where: {
                id_servicio: toInt(id_servicio),
                fecha: new Date(fecha),
                hora: fechaHora,
                estado: { not: 'cancelada' }
            }
        });

        return !existe;
    }

    // ✅ Use groupBy instead of fetching every row into memory.
    static async getTopServicios(limit = 10) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const grouped = await prisma.reserva.groupBy({
            by: ['id_servicio'],
            where: {
                estado: { in: ['confirmada', 'pendiente'] },
                fecha_creacion: { gte: thirtyDaysAgo }
            },
            _count: { id_reserva: true },
            orderBy: { _count: { id_reserva: 'desc' } },
            take: toInt(limit)
        });

        if (!grouped.length) return [];

        const servicioIds = grouped.map((g) => g.id_servicio);

        const servicios = await prisma.servicioRestaurante.findMany({
            where: { id_servicio: { in: servicioIds } },
            include: { oferente: true }
        });

        const servicioMap = new Map(servicios.map((s) => [s.id_servicio, s]));

        // Count distinct visitors per service (still needs a subquery — kept simple here).
        const visitantesPorServicio = await Promise.all(
            servicioIds.map(async (sid) => {
                const count = await prisma.reserva.findMany({
                    where: {
                        id_servicio: sid,
                        estado: { in: ['confirmada', 'pendiente'] },
                        fecha_creacion: { gte: thirtyDaysAgo }
                    },
                    select: { id_usuario: true },
                    distinct: ['id_usuario']
                });
                return { sid, total_visitantes: count.length };
            })
        );
        const visitantesMap = new Map(visitantesPorServicio.map(({ sid, total_visitantes }) => [sid, total_visitantes]));

        return grouped.map((g) => {
            const s = servicioMap.get(g.id_servicio) ?? {};
            return {
                id_servicio: g.id_servicio,
                nombre_servicio: s.nombre ?? null,
                descripcion: s.descripcion ?? null,
                rango_precio: s.rango_precio ?? null,
                capacidad: s.capacidad ?? null,
                imagenes: s.imagenes ?? null,
                id_oferente: s.oferente?.id_oferente ?? null,
                nombre_negocio: s.oferente?.nombre_negocio ?? null,
                tipo_oferente: s.oferente?.tipo ?? null,
                total_reservas: g._count.id_reserva,
                total_visitantes: visitantesMap.get(g.id_servicio) ?? 0
            };
        });
    }

    // ✅ Aggregate estado counts in JS from a single lean query; month histogram unchanged.
    static async getStatsAnaliticas(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const recientes = await prisma.reserva.findMany({
            where: { fecha_creacion: { gte: startDate } },
            select: { estado: true, numero_personas: true }
        });

        const stats = recientes.reduce(
            (acc, r) => {
                if (r.estado === 'pendiente') acc.pendientes++;
                if (r.estado === 'confirmada') acc.confirmadas++;
                if (r.estado === 'cancelada') acc.canceladas++;
                acc.total_personas += Number(r.numero_personas);
                return acc;
            },
            { pendientes: 0, confirmadas: 0, canceladas: 0, total_personas: 0 }
        );

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const reservasHistoricas = await prisma.reserva.findMany({
            where: { fecha_creacion: { gte: sixMonthsAgo } },
            select: { fecha_creacion: true }
        });

        const countsMap = new Map();
        for (const r of reservasHistoricas) {
            if (!r.fecha_creacion) continue;

            const d = new Date(r.fecha_creacion);
            const year = d.getFullYear();
            const monthStr = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;

            if (!countsMap.has(key)) {
                const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
                countsMap.set(key, { mes: key, mes_label: `${monthLabel} ${year}`, total_reservas: 0 });
            }
            countsMap.get(key).total_reservas++;
        }

        const reservasPorMes = Array.from(countsMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

        return {
            total_reservas: recientes.length,
            ...stats,
            reservasPorMes
        };
    }
}

module.exports = Reserva;