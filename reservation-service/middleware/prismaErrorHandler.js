const { Prisma } = require('@prisma/client');

/**
 * Global Error Handler for Prisma
 * Catches database-level exceptions and transforms them into clean HTTP responses.
 */
const prismaErrorHandler = (err, req, res, next) => {
    console.error(`[Prisma Error]: ${err.message}`);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                // Unique constraint failed
                return res.status(409).json({
                    error: 'Conflicto de integridad de datos',
                    message: `Ya existe un registro con esos datos. Intente con un valor diferente.`,
                    target: err.meta?.target
                });
            case 'P2003':
                // Foreign key constraint failed
                return res.status(400).json({
                    error: 'Restricción de relación fallida',
                    message: `El registro de referencia no existe o no se puede asociar.`,
                    target: err.meta?.field_name
                });
            case 'P2025':
                // Record not found
                return res.status(404).json({
                    error: 'No Encontrado',
                    message: `No se encontró el registro solicitado en la base de datos.`
                });
            default:
                // Other known errors
                return res.status(400).json({
                    error: 'Error de Base de Datos',
                    message: 'Ocurrió un error al procesar los datos.'
                });
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            error: 'Error de Validación',
            message: 'Los datos proporcionados no coinciden con el esquema esperado.'
        });
    }

    // Pass down if not Prisma
    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        error: 'Error Interno del Servidor',
        message: err.message || 'Ocurrió un error inesperado.'
    });
};

module.exports = prismaErrorHandler;
