const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(express.json());

// coloque seu access token
const client = new MercadoPagoConfig({
  accessToken: 'TEST-28342705-2aee-4238-bc6e-81d478713934'
});

app.post('/webhook', async (req, res) => {

  console.log('Webhook recebido:', req.body);

  try {

    if(req.body.data){

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

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});