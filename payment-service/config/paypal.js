const paypal = require('@paypal/checkout-server-sdk');

/**
 * PRODUCTION Environment
 * Sandbox: https://api.sandbox.paypal.com
 * Production: https://api.paypal.com
 */

function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID || 'ATeS2f9S9X9o_d8l8p3j0k4m5n6q7r8s9t0v1w2x3y4z5';
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'EBo_...';

    // In production, use LiveEnvironment
    if (process.env.NODE_ENV === 'production') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }

    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
