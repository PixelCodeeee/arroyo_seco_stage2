const axios = require('axios');

const MP_CONFIG = {
  accessToken:  process.env.MP_ACCESS_TOKEN,
  publicKey:    process.env.MP_PUBLIC_KEY,
  clientId:     process.env.MP_CLIENT_ID,
  clientSecret: process.env.MP_CLIENT_SECRET,
  redirectUri:  process.env.MP_REDIRECT_URI,
  apiUrl:       process.env.MP_API_URL || 'https://api.mercadopago.com',
  appUrl:       process.env.APP_URL || 'http://localhost:5005'
};

// Cliente axios preconfigurado para MercadoPago
const mpClient = axios.create({
  baseURL: MP_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MP_CONFIG.accessToken}`
  }
});

module.exports = { MP_CONFIG, mpClient };