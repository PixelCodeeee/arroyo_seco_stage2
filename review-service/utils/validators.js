// utils/validators.js
const validateReview = (data) => {
    const errors = [];
    
    if (!data.rating || data.rating < 1 || data.rating > 5) {
        errors.push('El rating debe ser entre 1 y 5');
    }
    
    if (data.comentario && data.comentario.length > 1000) {
        errors.push('El comentario no puede exceder los 1000 caracteres');
    }
    
    if (data.titulo && data.titulo.length > 200) {
        errors.push('El título no puede exceder los 200 caracteres');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateReport = (data) => {
    const errors = [];
    const motivosValidos = ['spam', 'ofensivo', 'falso', 'fraude', 'otro'];
    
    if (!data.motivo || !motivosValidos.includes(data.motivo)) {
        errors.push('Motivo de reporte no válido');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateReview,
    validateReport
};