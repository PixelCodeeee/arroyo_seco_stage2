// errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] - ${req.method} ${req.originalUrl}`);
    console.error(err.stack); // Log internally

    res.status(500).json({
        success: false,
        error: "Error interno del servidor. Por favor, intenta de nuevo más tarde."
    });
};

module.exports = errorHandler;
