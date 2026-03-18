// const axios    = require('axios');
// const { MP_CONFIG, mpClient } = require('../config/paypal');
// const Pedido   = require('../models/Pedido');
// const Oferente = require('../models/Oferente');

// // ─────────────────────────────────────────────────────────────────────
// // 1. CREAR PREFERENCIA DE PAGO (carrito del comprador)
// //    Reemplaza: createOrder de PayPal
// //    Ruta: POST /api/paypal/create-order
// // ─────────────────────────────────────────────────────────────────────
// exports.createOrder = async (req, res) => {
//   try {
//     const { items, total, id_oferente } = req.body;

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: 'No hay items en el carrito' });
//     }

//     // Validar total
//     const calculatedTotal = items.reduce((sum, item) => {
//       return sum + parseFloat(item.precio) * parseInt(item.cantidad);
//     }, 0);

//     if (Math.abs(calculatedTotal - parseFloat(total)) > 0.01) {
//       return res.status(400).json({
//         error: 'El total no coincide',
//         calculated: calculatedTotal.toFixed(2),
//         received:   parseFloat(total).toFixed(2)
//       });
//     }

//     const preferenceData = {
//       items: items.map(item => ({
//         id:          item.id_producto?.toString() || '1',
//         title:       item.nombre?.substring(0, 256) || 'Producto',
//         description: (item.descripcion || '').substring(0, 256),
//         quantity:    parseInt(item.cantidad),
//         unit_price:  parseFloat(item.precio),
//         currency_id: 'MXN'
//       })),
//       back_urls: {
//         success: `${MP_CONFIG.appUrl}/?status=success`,
//         failure: `${MP_CONFIG.appUrl}/?status=failure`,
//         pending: `${MP_CONFIG.appUrl}/?status=pending`
//       },
//       auto_return:          'approved',
//       statement_descriptor: 'Arroyo Seco',
//       external_reference:   id_oferente ? `oferente_${id_oferente}` : 'compra_directa'
//     };

//     const response = await mpClient.post('/checkout/preferences', preferenceData);

//     console.log('✅ Preferencia MP creada:', response.data.id);

//     return res.json({
//       success:       true,
//       orderID:       response.data.id,          // mismo campo que PayPal para compatibilidad
//       preference_id: response.data.id,
//       init_point:    response.data.init_point,
//       sandbox_url:   response.data.sandbox_init_point
//     });

//   } catch (error) {
//     console.error('❌ Error createOrder (MP):', error.response?.data || error.message);
//     return res.status(500).json({
//       error:   'Error al crear preferencia de pago',
//       details: error.response?.data || error.message
//     });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 2. CAPTURAR / CONFIRMAR PAGO  (webhook o confirmación manual)
// //    Reemplaza: captureOrder de PayPal
// //    Ruta: POST /api/paypal/capture-order
// // ─────────────────────────────────────────────────────────────────────
// exports.captureOrder = async (req, res) => {
//   try {
//     const { payment_id, cartData, id } = req.body;

//     if (!payment_id) {
//       return res.status(400).json({ error: 'payment_id es requerido' });
//     }
//     if (!cartData?.items?.length) {
//       return res.status(400).json({ error: 'Datos del carrito inválidos' });
//     }
//     if (!id) {
//       return res.status(400).json({ error: 'Usuario no autenticado' });
//     }

//     // Verificar el pago con MP
//     const pagoResp = await mpClient.get(`/v1/payments/${payment_id}`);
//     const pago     = pagoResp.data;

//     if (pago.status !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         error:   'El pago no fue aprobado',
//         status:  pago.status
//       });
//     }

//     const amountPaid = parseFloat(pago.transaction_amount);
//     const cartTotal  = parseFloat(cartData.total);

//     if (Math.abs(amountPaid - cartTotal) > 0.01) {
//       return res.status(400).json({
//         success: false,
//         error:   'El monto pagado no coincide con el total del carrito'
//       });
//     }

//     // Guardar pedido en BD
//     const items = cartData.items.map(item => ({
//       id_producto:   item.id_producto,
//       cantidad:      parseInt(item.cantidad),
//       precio_compra: parseFloat(item.precio)
//     }));

//     const pedido = await Pedido.create({
//       id_usuario,
//       monto_total:  amountPaid,
//       estado:       'pagado',
//       metodo_pago:  'mercadopago',
//       payment_id:   payment_id.toString(),
//       id_oferente:  pago.external_reference?.startsWith('oferente_')
//                       ? parseInt(pago.external_reference.split('_')[1])
//                       : null,
//       items
//     });

//     console.log('✅ Pedido creado:', pedido.id_pedido);

//     return res.json({
//       success: true,
//       message: 'Pago completado exitosamente',
//       pedido,
//       transaction: {
//         id:       payment_id,
//         status:   pago.status,
//         amount:   amountPaid,
//         currency: pago.currency_id
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error captureOrder (MP):', error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       error:   'Error al procesar el pago',
//       details: error.response?.data || error.message
//     });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 3. DETALLE DE ORDEN/PAGO
// //    Reemplaza: getOrderDetails de PayPal
// //    Ruta: GET /api/paypal/orders/:orderID
// // ─────────────────────────────────────────────────────────────────────
// exports.getOrderDetails = async (req, res) => {
//   try {
//     const { orderID } = req.params;

//     if (!orderID) {
//       return res.status(400).json({ error: 'orderID es requerido' });
//     }

//     const response = await mpClient.get(`/v1/payments/${orderID}`);

//     return res.json({
//       success: true,
//       order:   response.data
//     });

//   } catch (error) {
//     console.error('❌ Error getOrderDetails (MP):', error.response?.data || error.message);
//     return res.status(500).json({
//       error:   'Error al obtener detalles del pago',
//       details: error.response?.data || error.message
//     });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 4. WEBHOOK — MercadoPago notifica pagos aquí
// //    Ruta: POST /api/paypal/webhook
// // ─────────────────────────────────────────────────────────────────────
// exports.webhook = async (req, res) => {
//   try {
//     const { type, data } = req.body;
//     console.log('📩 Webhook MP:', type, data);

//     if (type === 'payment' && data?.id) {
//       const pagoResp = await mpClient.get(`/v1/payments/${data.id}`);
//       const pago     = pagoResp.data;

//       console.log('💳 Pago webhook:', {
//         id:         pago.id,
//         estado:     pago.status,
//         monto:      pago.transaction_amount,
//         referencia: pago.external_reference
//       });
//     }

//     return res.sendStatus(200);
//   } catch (error) {
//     console.error('❌ Error webhook:', error.message);
//     return res.sendStatus(500);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 5. OAUTH OFERENTE — obtener URL de autorización
// //    Ruta: GET /api/paypal/mp/oauth-url
// // ─────────────────────────────────────────────────────────────────────
// exports.getOAuthUrl = async (req, res) => {
//   try {
//     const id_usuario = req.user?.id;

//     if (!id_usuario) {
//       return res.status(401).json({ error: 'No autenticado' });
//     }

//     const oferente = await Oferente.findByUsuarioId(id_usuario);

//     if (!oferente) {
//       return res.status(400).json({ error: 'id_oferente no encontrado' });
//     }

//     const state = Buffer.from(JSON.stringify({ id_oferente: oferente.id_oferente })).toString('base64');

//     const authUrl =
//       `https://auth.mercadopago.com/authorization` +
//       `?client_id=${MP_CONFIG.clientId}` +
//       `&response_type=code` +
//       `&platform_id=mp` +
//       `&state=${state}` +
//       `&redirect_uri=${encodeURIComponent(MP_CONFIG.redirectUri)}`;

//     return res.json({ ok: true, auth_url: authUrl });

//   } catch (error) {
//     console.error('❌ Error getOAuthUrl:', error.message);
//     return res.status(500).json({ error: 'Error al generar URL de autorización' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 6. CALLBACK OAuth — MP redirige aquí con el código
// //    Ruta: GET /api/paypal/mp/callback
// // ─────────────────────────────────────────────────────────────────────
// exports.mpCallback = async (req, res) => {
//   try {
//     const { code, state } = req.query;

//     if (!code || !state) {
//       return res.redirect(`${MP_CONFIG.appUrl}/?mp_error=sin_codigo`);
//     }

//     let id_oferente;
//     try {
//       const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
//       id_oferente   = decoded.id_oferente;
//     } catch {
//       return res.redirect(`${MP_CONFIG.appUrl}/?mp_error=state_invalido`);
//     }

//     // Intercambiar código por tokens
//     const tokenResp = await axios.post(
//       `${MP_CONFIG.apiUrl}/oauth/token`,
//       {
//         client_id:     MP_CONFIG.clientId,
//         client_secret: MP_CONFIG.clientSecret,
//         grant_type:    'authorization_code',
//         code,
//         redirect_uri:  MP_CONFIG.redirectUri
//       },
//       { headers: { 'Content-Type': 'application/json' } }
//     );

//     const { access_token, refresh_token, user_id } = tokenResp.data;

//     console.log('✅ OAuth exitoso para oferente', id_oferente, '| MP user_id:', user_id);

//     // Guardar en BD
//     await Oferente.updateMpData(id_oferente, {
//       mp_user_id:      user_id?.toString(),
//       mp_access_token: access_token,
//       mp_refresh_token: refresh_token || null,
//       mp_estado:       'activo'
//     });

//     return res.redirect(`${MP_CONFIG.appUrl}/?mp_status=conectado&id_oferente=${id_oferente}`);

//   } catch (error) {
//     console.error('❌ Error mpCallback:', error.response?.data || error.message);
//     return res.redirect(`${MP_CONFIG.appUrl}/?mp_error=token_fallido`);
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 7. ESTADO DE CONEXIÓN del oferente con MP
// //    Ruta: GET /api/paypal/mp/estado
// // ─────────────────────────────────────────────────────────────────────
// exports.getMpEstado = async (req, res) => {
//   try {
//     // Obtener id_oferente desde el token JWT (el usuario logueado)
//     const id_usuario = req.user?.id_usuario;

//     if (!id_usuario) {
//       return res.status(401).json({ error: 'No autenticado' });
//     }

//     const oferente = await Oferente.findByUsuarioId(id_usuario);

//     if (!oferente) {
//       return res.status(404).json({ error: 'Oferente no encontrado para este usuario' });
//     }

//     return res.json({
//       ok:           true,
//       id_oferente:  oferente.id_oferente,
//       nombre:       oferente.nombre_negocio,
//       mp_estado:    oferente.mp_estado,
//       mp_user_id:   oferente.mp_user_id,
//       conectado:    oferente.mp_estado === 'activo'
//     });

//   } catch (error) {
//     console.error('❌ Error getMpEstado:', error.message);
//     return res.status(500).json({ error: 'Error al consultar estado' });
//   }
// };

// // ─────────────────────────────────────────────────────────────────────
// // 8. CONFIG PÚBLICA (Public Key para el frontend)
// //    Ruta: GET /api/paypal/config
// // ─────────────────────────────────────────────────────────────────────
// exports.getPublicConfig = (req, res) => {
//   return res.json({ public_key: MP_CONFIG.publicKey });
// };




const axios    = require('axios');
const { MP_CONFIG, mpClient } = require('../config/paypal');
const Pedido   = require('../models/Pedido');
const Oferente = require('../models/Oferente');

// ─────────────────────────────────────────────────────────────────────
// 1. CREAR PREFERENCIA DE PAGO (carrito del comprador)
//    Ruta: POST /api/paypal/create-order
// ─────────────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
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
        error:      'El total no coincide',
        calculated: calculatedTotal.toFixed(2),
        received:   parseFloat(total).toFixed(2)
      });
    }

    const preferenceData = {
      items: items.map(item => ({
        id:          item.id_producto?.toString() || '1',
        title:       item.nombre?.substring(0, 256) || 'Producto',
        description: (item.descripcion || '').substring(0, 256),
        quantity:    parseInt(item.cantidad),
        unit_price:  parseFloat(item.precio),
        currency_id: 'MXN'
      })),
      // ✅ back_urls apuntan al frontend en localhost
      back_urls: {
        success: `http://localhost:5173/carrito?status=success`,
        failure: `http://localhost:5173/carrito?status=failure`,
        pending: `http://localhost:5173/carrito?status=pending`
      },
      // ✅ Sin auto_return para que MP muestre la pantalla de confirmación
      statement_descriptor: 'Arroyo Seco',
      external_reference:   id_oferente ? `oferente_${id_oferente}` : 'compra_directa'
    };

    const response = await mpClient.post('/checkout/preferences', preferenceData);

    console.log('✅ Preferencia MP creada:', response.data.id);

    return res.json({
      success:       true,
      orderID:       response.data.id,
      preference_id: response.data.id,
      init_point:    response.data.init_point,
      sandbox_url:   response.data.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Error createOrder (MP):', error.response?.data || error.message);
    return res.status(500).json({
      error:   'Error al crear preferencia de pago',
      details: error.response?.data || error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────
// 2. CAPTURAR / CONFIRMAR PAGO
//    Ruta: POST /api/paypal/capture-order
// ─────────────────────────────────────────────────────────────────────
exports.captureOrder = async (req, res) => {
  try {
    // ✅ Corregido: id_usuario (no id)
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

    // Verificar el pago con MP
    const pagoResp = await mpClient.get(`/v1/payments/${payment_id}`);
    const pago     = pagoResp.data;

    if (pago.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error:   'El pago no fue aprobado',
        status:  pago.status
      });
    }

    const amountPaid = parseFloat(pago.transaction_amount);

    // Preparar items
    const items = cartData.items.map(item => ({
      id_producto:   item.id_producto,
      cantidad:      parseInt(item.cantidad),
      precio_compra: parseFloat(item.precio)
    }));

    // Guardar pedido en BD
    const pedido = await Pedido.create({
      id_usuario,
      monto_total:  amountPaid,
      estado:       'pagado',
      metodo_pago:  'mercadopago',
      payment_id:   payment_id.toString(),
      id_oferente:  pago.external_reference?.startsWith('oferente_')
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
        id:       payment_id,
        status:   pago.status,
        amount:   amountPaid,
        currency: pago.currency_id
      }
    });

  } catch (error) {
    console.error('❌ Error captureOrder (MP):', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error:   'Error al procesar el pago',
      details: error.response?.data || error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────
// 3. DETALLE DE ORDEN/PAGO
//    Ruta: GET /api/paypal/orders/:orderID
// ─────────────────────────────────────────────────────────────────────
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderID } = req.params;

    if (!orderID) {
      return res.status(400).json({ error: 'orderID es requerido' });
    }

    const response = await mpClient.get(`/v1/payments/${orderID}`);

    return res.json({
      success: true,
      order:   response.data
    });

  } catch (error) {
    console.error('❌ Error getOrderDetails (MP):', error.response?.data || error.message);
    return res.status(500).json({
      error:   'Error al obtener detalles del pago',
      details: error.response?.data || error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────
// 4. WEBHOOK — MercadoPago notifica pagos aquí
//    Ruta: POST /api/paypal/webhook
// ─────────────────────────────────────────────────────────────────────
exports.webhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('📩 Webhook MP:', type, data);

    if (type === 'payment' && data?.id) {
      const pagoResp = await mpClient.get(`/v1/payments/${data.id}`);
      const pago     = pagoResp.data;

      console.log('💳 Pago webhook:', {
        id:         pago.id,
        estado:     pago.status,
        monto:      pago.transaction_amount,
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
exports.getOAuthUrl = async (req, res) => {
  try {
    const id_usuario = req.user?.id;

    if (!id_usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const oferente = await Oferente.findByUsuarioId(id_usuario);

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
    console.error('❌ Error getOAuthUrl:', error.message);
    return res.status(500).json({ error: 'Error al generar URL de autorización' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// 6. CALLBACK OAuth — MP redirige aquí con el código
//    Ruta: GET /api/paypal/mp/callback
// ─────────────────────────────────────────────────────────────────────
exports.mpCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`http://localhost:5173/oferentes?mp_error=sin_codigo`);
    }

    let id_oferente;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      id_oferente   = decoded.id_oferente;
    } catch {
      return res.redirect(`http://localhost:5173/oferentes?mp_error=state_invalido`);
    }

    // Intercambiar código por tokens
    const tokenResp = await axios.post(
      `${MP_CONFIG.apiUrl}/oauth/token`,
      {
        client_id:     MP_CONFIG.clientId,
        client_secret: MP_CONFIG.clientSecret,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  MP_CONFIG.redirectUri
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token, refresh_token, user_id } = tokenResp.data;

    console.log('✅ OAuth exitoso para oferente', id_oferente, '| MP user_id:', user_id);

    await Oferente.updateMpData(id_oferente, {
      mp_user_id:       user_id?.toString(),
      mp_access_token:  access_token,
      mp_refresh_token: refresh_token || null,
      mp_estado:        'activo'
    });

    // ✅ Redirect al frontend en localhost
    return res.redirect(`http://localhost:5173/oferentes?mp_status=conectado&id_oferente=${id_oferente}`);

  } catch (error) {
    console.error('❌ Error mpCallback:', error.response?.data || error.message);
    return res.redirect(`http://localhost:5173/oferentes?mp_error=token_fallido`);
  }
};

// ─────────────────────────────────────────────────────────────────────
// 7. ESTADO DE CONEXIÓN del oferente con MP
//    Ruta: GET /api/paypal/mp/estado
// ─────────────────────────────────────────────────────────────────────
exports.getMpEstado = async (req, res) => {
  try {
    // ✅ Corregido: req.user?.id (no req.user?.id_usuario)
    const id_usuario = req.user?.id;

    if (!id_usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const oferente = await Oferente.findByUsuarioId(id_usuario);

    if (!oferente) {
      return res.status(404).json({ error: 'Oferente no encontrado para este usuario' });
    }

    return res.json({
      ok:          true,
      id_oferente: oferente.id_oferente,
      nombre:      oferente.nombre_negocio,
      mp_estado:   oferente.mp_estado,
      mp_user_id:  oferente.mp_user_id,
      conectado:   oferente.mp_estado === 'activo'
    });

  } catch (error) {
    console.error('❌ Error getMpEstado:', error.message);
    return res.status(500).json({ error: 'Error al consultar estado' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// 8. CONFIG PÚBLICA (Public Key para el frontend)
//    Ruta: GET /api/paypal/config
// ─────────────────────────────────────────────────────────────────────
exports.getPublicConfig = (req, res) => {
  return res.json({ public_key: MP_CONFIG.publicKey });
};