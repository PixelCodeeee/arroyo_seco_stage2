const axios = require('axios');
const { MP_CONFIG, mpClient } = require('../config/mercadopago');
const Pedido = require('../models/Pedido');
const Oferente = require('../models/Oferente');

const APP_URL = process.env.APP_URL || 'https://arroyoseco.online';

// ─────────────────────────────────────────────────────────────────────
// HELPER — crea un cliente axios usando el token del oferente
// Esto es lo que hace que sea un pago de marketplace real:
// la preferencia se crea en nombre del oferente, no de la plataforma
// ─────────────────────────────────────────────────────────────────────
const createOferenteClient = (accessToken) =>
  axios.create({
    baseURL: MP_CONFIG.apiUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  });

// ─────────────────────────────────────────────────────────────────────
// 1. CREAR PREFERENCIA DE PAGO (carrito del comprador)
//    Ruta: POST /api/paypal/create-order
// ─────────────────────────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { items, total, id_oferente } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No hay items en el carrito' });
    }

    const calculatedTotal = items.reduce((sum, item) => {
      return sum + parseFloat(item.precio) * parseInt(item.cantidad);
    }, 0);

    if (Math.abs(calculatedTotal - parseFloat(total)) > 0.01) {
      return res.status(400).json({
        error: 'El total no coincide',
        calculated: calculatedTotal.toFixed(2),
        received: parseFloat(total).toFixed(2)
      });
    }

    const preferenceData = {
      items: items.map(item => ({
        id: item.id_producto?.toString() || '1',
        title: item.nombre?.substring(0, 256) || 'Producto',
        description: (item.descripcion || '').substring(0, 256),
        quantity: parseInt(item.cantidad),
        unit_price: parseFloat(item.precio),
        currency_id: 'MXN'
      })),
      back_urls: {
        success: `${APP_URL}/carrito?status=success`,
        failure: `${APP_URL}/carrito?status=failure`,
        pending: `${APP_URL}/carrito?status=pending`
      },
      statement_descriptor: 'Arroyo Seco',
      external_reference: id_oferente ? `oferente_${id_oferente}` : 'compra_directa',
      marketplace_fee: 0 // plataforma no cobra comisión por ahora, se puede cambiar después
    };

    let client = mpClient; // fallback: plataforma (si no hay oferente conectado)
    let usandoOferente = false;
    let oferente = null; // declare outside so it's accessible in the debug log

    // Si hay un oferente, usar su access_token para crear la preferencia
    // Esto es el marketplace flow real — el dinero va a la cuenta del oferente
    if (id_oferente) {
      oferente = await Oferente.findById(id_oferente);

      if (oferente?.mp_access_token && oferente?.mp_estado === 'activo') {
        client = createOferenteClient(oferente.mp_access_token);
        usandoOferente = true;
        console.log(`🏪 Usando token del oferente ${id_oferente} para crear preferencia`);
      } else {
        console.warn(`⚠️ Oferente ${id_oferente} no tiene MP conectado, usando token de plataforma`);
      }
    }

    console.log('🔍 PREFERENCE REQUEST:', JSON.stringify({
      usando_oferente: usandoOferente,
      id_oferente,
      oferente_estado: oferente?.mp_estado,
      token_prefix: oferente?.mp_access_token?.substring(0, 15),
      preferenceData
    }, null, 2));

    const response = await client.post('/checkout/preferences', preferenceData);

    console.log('🔍 PREFERENCE RESPONSE:', JSON.stringify(response.data, null, 2));

    return res.json({
      success: true,
      orderID: response.data.id,
      preference_id: response.data.id,
      init_point: response.data.init_point,
      sandbox_url: response.data.sandbox_init_point
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 2. CAPTURAR / CONFIRMAR PAGO
//    Ruta: POST /api/paypal/capture-order
// ─────────────────────────────────────────────────────────────────────
exports.captureOrder = async (req, res, next) => {
  try {
    const { payment_id, cartData, id_usuario } = req.body;

    if (!payment_id) {
      return res.status(400).json({ error: 'payment_id es requerido' });
    }
    if (!cartData?.items?.length) {
      return res.status(400).json({ error: 'Datos del carrito inválidos' });
    }
    if (!id_usuario) {
      return res.status(400).json({ error: 'Usuario no autenticado' });
    }

    const pagoResp = await mpClient.get(`/v1/payments/${payment_id}`);
    const pago = pagoResp.data;

    console.log('💳 Pago recibido [PRODUCTION]:', pago.status, pago.transaction_amount);

    if (pago.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'El pago no fue aprobado',
        status: pago.status
      });
    }

    const amountPaid = parseFloat(pago.transaction_amount);

    const items = cartData.items.map(item => ({
      id_producto: item.id_producto,
      cantidad: parseInt(item.cantidad),
      precio_compra: parseFloat(item.precio)
    }));

    const pedido = await Pedido.create({
      id_usuario,
      monto_total: amountPaid,
      estado: 'pagado',
      metodo_pago: 'mercadopago',
      payment_id: payment_id.toString(),
      id_oferente: pago.external_reference?.startsWith('oferente_')
        ? parseInt(pago.external_reference.split('_')[1])
        : null,
      items
    });

    console.log('✅ Pedido creado:', pedido.id_pedido);

    return res.json({
      success: true,
      message: 'Pago completado exitosamente',
      pedido,
      transaction: {
        id: payment_id,
        status: pago.status,
        amount: amountPaid,
        currency: pago.currency_id
      }
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 3. DETALLE DE ORDEN/PAGO
//    Ruta: GET /api/paypal/orders/:orderID
// ─────────────────────────────────────────────────────────────────────
exports.getOrderDetails = async (req, res, next) => {
  try {
    const { orderID } = req.params;

    if (!orderID) {
      return res.status(400).json({ error: 'orderID es requerido' });
    }

    const response = await mpClient.get(`/v1/payments/${orderID}`);

    return res.json({
      success: true,
      order: response.data
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 4. WEBHOOK — MercadoPago notifica pagos aquí
//    Ruta: POST /api/paypal/webhook
// ─────────────────────────────────────────────────────────────────────
exports.webhook = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    console.log('📩 Webhook MP:', type, data);

    if (type === 'payment' && data?.id) {
      const pagoResp = await mpClient.get(`/v1/payments/${data.id}`);
      const pago = pagoResp.data;

      console.log('💳 Pago webhook:', {
        id: pago.id,
        estado: pago.status,
        monto: pago.transaction_amount,
        referencia: pago.external_reference
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error webhook:', error.message);
    return res.sendStatus(500);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 5. OAUTH OFERENTE — obtener URL de autorización
//    Ruta: GET /api/paypal/mp/oauth-url
// ─────────────────────────────────────────────────────────────────────
exports.getOAuthUrl = async (req, res, next) => {
  try {
    const id_usuario = req.user?.id;

    if (!id_usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const oferente = await Oferente.findByUserId(id_usuario);

    if (!oferente) {
      return res.status(400).json({ error: 'id_oferente no encontrado' });
    }

    const state = Buffer.from(JSON.stringify({ id_oferente: oferente.id_oferente })).toString('base64');

    const authUrl =
      `https://auth.mercadopago.com/authorization` +
      `?client_id=${MP_CONFIG.clientId}` +
      `&response_type=code` +
      `&platform_id=mp` +
      `&state=${state}` +
      `&redirect_uri=${encodeURIComponent(MP_CONFIG.redirectUri)}`;

    return res.json({ ok: true, auth_url: authUrl });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 6. CALLBACK OAuth — MP redirige aquí con el código
//    Ruta: GET /api/paypal/mp/callback
// ─────────────────────────────────────────────────────────────────────
exports.mpCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${APP_URL}/oferentes?mp_error=sin_codigo`);
    }

    let id_oferente;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      id_oferente = decoded.id_oferente;
    } catch {
      return res.redirect(`${APP_URL}/oferentes?mp_error=state_invalido`);
    }

    const tokenResp = await axios.post(
      `${MP_CONFIG.apiUrl}/oauth/token`,
      {
        client_id: MP_CONFIG.clientId,
        client_secret: MP_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: MP_CONFIG.redirectUri
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token, refresh_token, user_id } = tokenResp.data;

    console.log('✅ OAuth exitoso para oferente', id_oferente, '| MP user_id:', user_id);

    await Oferente.updateMpData(id_oferente, {
      mp_user_id: user_id?.toString(),
      mp_access_token: access_token,
      mp_refresh_token: refresh_token || null,
      mp_estado: 'activo'
    });

    return res.redirect(`${APP_URL}/oferentes?mp_status=conectado&id_oferente=${id_oferente}`);

  } catch (error) {
    console.error('❌ Error mpCallback:', error.response?.data || error.message);
    return res.redirect(`${APP_URL}/oferentes?mp_error=token_fallido`);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 7. ESTADO DE CONEXIÓN del oferente con MP
//    Ruta: GET /api/paypal/mp/estado
// ─────────────────────────────────────────────────────────────────────
exports.getMpEstado = async (req, res, next) => {
  try {
    const id_usuario = req.user?.id;

    if (!id_usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const oferente = await Oferente.findByUserId(id_usuario);

    if (!oferente) {
      return res.status(404).json({ error: 'Oferente no encontrado para este usuario' });
    }

    return res.json({
      ok: true,
      id_oferente: oferente.id_oferente,
      nombre: oferente.nombre_negocio,
      mp_estado: oferente.mp_estado,
      mp_user_id: oferente.mp_user_id,
      conectado: oferente.mp_estado === 'activo'
    });

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 8. CONFIG PÚBLICA (Public Key para el frontend)
//    Ruta: GET /api/paypal/config
// ─────────────────────────────────────────────────────────────────────
exports.getPublicConfig = (req, res) => {
  return res.json({ public_key: MP_CONFIG.publicKey });
};

// ─────────────────────────────────────────────────────────────────────
// 9. DEBUG — verificar variables de entorno (REMOVER EN PRODUCCIÓN FINAL)
//    Ruta: GET /api/mercadopago/debug
// ─────────────────────────────────────────────────────────────────────
exports.debugEnv = (req, res) => {
  res.json({
    token_prefix: process.env.MP_ACCESS_TOKEN?.substring(0, 15),
    public_key_prefix: process.env.MP_PUBLIC_KEY?.substring(0, 15),
    app_url: APP_URL,
    redirect_uri: process.env.MP_REDIRECT_URI,
    node_env: process.env.NODE_ENV
  });
};