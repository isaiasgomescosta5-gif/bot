const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');

require('./robo'); // inicia o bot whatsapp

const app = express();
app.use(express.json());

// access token
const client = new MercadoPagoConfig({
  accessToken: 'SEU_ACCESS_TOKEN'
});

app.post('/webhook', async (req, res) => {

  console.log("Webhook recebido:", req.body);

  try {

    if(req.body.type === "payment"){

      const payment = new Payment(client);

      const result = await payment.get({
        id: req.body.data.id
      });

      console.log("Status do pagamento:", result.status);

      if(result.status === "approved"){
        console.log("✅ Pagamento aprovado");
      }

    }

  } catch(error){
    console.log("Erro:", error);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando");
});
