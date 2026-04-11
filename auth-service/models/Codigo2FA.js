const db = require('../config/db');

class Codigo2FA {
    // Generate random 6-digit code
    static generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Create new 2FA code
    static async create(userId) {
        const codigo = this.generateCode();
        const fecha_expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing unused codes for this user
        await db.codigo_2fa.deleteMany({
            where: {
                id_usuario: parseInt(userId, 10),
                usado: false
            }
        });

        // Insert new code
        await db.codigo_2fa.create({
            data: {
                id_usuario: parseInt(userId, 10),
                codigo: codigo,
                fecha_expiracion: fecha_expiracion,
                usado: false
            }
        });

        return codigo;
    }

    // Verify code
    static async verify(userId, codigo) {
        const result = await db.codigo_2fa.findFirst({
            where: {
                id_usuario: parseInt(userId, 10),
                codigo: codigo,
                usado: false,
                fecha_expiracion: { gt: new Date() }
            }
        });

        if (!result) {
            return false;
        }

        // Mark code as used
        await db.codigo_2fa.update({
            where: { id: result.id },
            data: { usado: true }
        });

        return true;
    }

    // Clean expired codes (run periodically)
    static async cleanExpired() {
        await db.codigo_2fa.deleteMany({
            where: {
                fecha_expiracion: { lt: new Date() }
            }
        });
    }
}

module.exports = Codigo2FA;
