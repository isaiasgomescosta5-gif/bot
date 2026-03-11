// =======================================================
// BOT WHATSAPP
// =======================================================

const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});

client.on('qr', qr => {
    console.log("QR RECEBIDO");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("✅ BOT CONECTADO");
});

client.initialize();

// ======================= DADOS =======================

const pizzas = [
    "Calabresa",
    "Frango Catupiry",
    "Quatro Queijos",
    "Portuguesa",
    "Mussarela",
    "Pepperoni"
];

const indisponiveis = ["Portuguesa", "Pepperoni"];

const precos = {
    "Calabresa": { P: 25, M: 35, G: 45, F: 55 },
    "Frango Catupiry": { P: 28, M: 38, G: 48, F: 58 },
    "Quatro Queijos": { P: 30, M: 40, G: 50, F: 60 },
    "Mussarela": { P: 22, M: 32, G: 42, F: 50 },
    "Portuguesa": { P: 27, M: 37, G: 47, F: 57 },
    "Pepperoni": { P: 29, M: 39, G: 49, F: 59 }
};

// ======================= BEBIDAS =======================

const bebidas = {
    "coca lata": 6,
    "coca-cola lata": 6,
    "coca cola lata": 6,
    "coca 1l": 9,
    "coca-cola 1l": 9,
    "coca cola 1l": 9,
    "coca 2l": 12,
    "coca-cola 2l": 12,
    "coca cola 2l": 12,
    "guarana lata": 5,
    "guaraná lata": 5,
    "agua": 3,
    "água": 3
};

const aliasBebidas = {
    "coca lata": "Coca-Cola Lata",
    "coca-cola lata": "Coca-Cola Lata",
    "coca cola lata": "Coca-Cola Lata",
    "coca 1l": "Coca-Cola 1L",
    "coca-cola 1l": "Coca-Cola 1L",
    "coca cola 1l": "Coca-Cola 1L",
    "coca 2l": "Coca-Cola 2L",
    "coca-cola 2l": "Coca-Cola 2L",
    "coca cola 2l": "Coca-Cola 2L",
    "guarana lata": "Guaraná Lata",
    "guaraná lata": "Guaraná Lata",
    "agua": "Água",
    "água": "Água"
};

const tamanhos = { p: "P", m: "M", g: "G", f: "F" };
const numeros = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4 };

const SIM = ["sim", "s", "confirmar", "ok", "1"];
const NAO = ["nao", "não", "n", "cancelar", "2"];

// ======================= ESTADOS =======================

let estados = {};
let carrinhoPizza = {};
let carrinhoBebida = {};
let pendentePizza = {};
let pendenteBebida = {};
let enderecoTemp = {};
// ======================= UTIL =======================

const normalize = t =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function responder(msg, texto) {
    await msg.reply("⏳ PROCESSANDO...");
    setTimeout(() => msg.reply(texto), 500);
}

function resetUser(user) {
    estados[user] = "menu";
    carrinhoPizza[user] = [];
    carrinhoBebida[user] = [];
    pendentePizza[user] = [];
    pendenteBebida[user] = [];
}

// ======================= PARSER PIZZAS =======================

function corrigirSabor(txt) {
    for (let p of pizzas) {
        if (normalize(p) === txt) return p;
    }
    return null;
}

function extrairPizzas(texto) {
    texto = normalize(texto).replace(/,/g, " e ");
    const partes = texto.split(" e ");
    let itens = [];
    let erros = [];

    partes.forEach((parte, i) => {
        let palavras = parte.trim().split(" ");
        let qtd = null;
        let tamanho = null;

        if (!isNaN(palavras[0])) qtd = parseInt(palavras.shift());
        else if (numeros[palavras[0]]) qtd = numeros[palavras.shift()];

        palavras = palavras.filter(p => {
            if (tamanhos[p]) {
                tamanho = tamanhos[p];
                return false;
            }
            return true;
        });

        const sabor = corrigirSabor(palavras.join(" "));

        if (!qtd) erros.push(`Item ${i + 1}: FALTOU QUANTIDADE`);
        if (!tamanho) erros.push(`Item ${i + 1}: FALTOU TAMANHO`);
        if (!sabor) erros.push(`Item ${i + 1}: SABOR NÃO RECONHECIDO`);
        if (indisponiveis.includes(sabor))
            erros.push(`Item ${i + 1}: ${sabor.toUpperCase()} INDISPONÍVEL`);

        if (qtd && tamanho && sabor && !indisponiveis.includes(sabor)) {
            itens.push({ sabor, qtd, tamanho });
        }
    });

    if (erros.length) return { erro: true, erros };
    return itens;
}

// ======================= CARDÁPIOS =======================

function cardapioPizzas(msg) {
    responder(
        msg,
        "✍️ COMO PEDIR\n👉 1 calabresa m\n👉 2 mussarela g\n👉 1 quatro queijos p e 1 frango catupiry m"
    );

    setTimeout(() => {
        let texto = "📖 CARDÁPIO DE PIZZAS\n\n";
        pizzas.forEach(p => {
            const preco = precos[p];
            const ind = indisponiveis.includes(p) ? " ❌ INDISPONÍVEL" : "";
            texto += "--------------------------\n";
            texto += `🍕 ${p}${ind}\n`;
            texto += `P: R$ ${preco.P},00 | M: R$ ${preco.M},00 | G: R$ ${preco.G},00 | F: R$ ${preco.F},00\n`;
        });
        texto += "--------------------------\n";
        msg.reply(texto);
    }, 800);
}

function cardapioBebidas(msg) {
    responder(
        msg,
        "✍️ COMO PEDIR BEBIDAS\n👉 1 coca cola lata\n👉 2 guaraná lata\n👉 1 coca cola 1l\n👉 1 coca cola 2l e 2 águas\n❌ Para não adicionar bebidas, digite: NÃO"
    );

    setTimeout(() => {
        let texto = "🥤 CARDÁPIO DE BEBIDAS\n\n";
        for (let b in bebidas) {
            texto += "--------------------------\n";
            texto += `🥤 ${aliasBebidas[b]} — R$ ${bebidas[b]},00\n`;
        }
        texto += "--------------------------\n";
        msg.reply(texto);
    }, 800);
}

// ======================= PARSER BEBIDAS =======================

function extrairBebidas(texto) {
    texto = normalize(texto).replace(/,/g, " e ");
    const partes = texto.split(" e ");
    let itens = [];

    for (let parte of partes) {
        let qtd = 1;
        const num = parte.match(/\d+/);
        if (num) qtd = parseInt(num[0]);

        for (let b in bebidas) {
            if (parte.includes(b)) {
                itens.push({
                    nome: aliasBebidas[b],
                    qtd,
                    preco: bebidas[b]
                });
                break;
            }
        }
    }

    return itens.length ? itens : null;
}

// ======================= ENDEREÇO =======================

function parseEndereco(texto) {
    const original = texto;

    const tel = original.match(/(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/);
    const telefone = tel ? tel[1] : "não informado";

    const num = original.match(/\b\d{1,5}\b/);
    const numero = num ? num[0] : "não informado";

    const ruaMatch = original.match(/(rua|avenida|av|travessa|alameda)\s+[^\d,\n]+/i);
    const rua = ruaMatch ? ruaMatch[0] : "não informado";

    let bairro = "não informado";
    if (original.toLowerCase().includes("centro")) bairro = "Centro";

    let referencia = original.toLowerCase().includes("perto") ? original : "não informado";

    return {
        rua,
        numero,
        bairro,
        referencia,
        complemento: "não informado",
        telefone
    };
}

function enderecoValido(e) {
    return (
        e.rua !== "não informado" &&
        e.numero !== "não informado" &&
        e.bairro !== "não informado" &&
        e.telefone !== "não informado"
    );
}
// ======================= EVENTO =======================

client.on("message", async msg => {
    if (msg.from.includes("@g.us")) return;

    const user = msg.from;
    const texto = normalize(msg.body);

    estados[user] ??= "menu";
    carrinhoPizza[user] ??= [];
    carrinhoBebida[user] ??= [];

    // ===== MENU INICIAL =====
    if (["oi", "ola", "menu"].includes(texto)) {
        resetUser(user);
        return responder(
            msg,
            "🍕 Bem-vindo à nossa pizzaria!\n\n1️⃣ Ver cardápio de pizzas"
        );
    }

    if (texto === "1" && estados[user] === "menu") {
        estados[user] = "pizzas";
        return cardapioPizzas(msg);
    }

    // ===== PIZZAS =====
    if (estados[user] === "pizzas") {
        const res = extrairPizzas(texto);

        if (res.erro)
            return responder(msg, "❌ Erro no pedido:\n" + res.erros.join("\n"));

        pendentePizza[user] = res;

        let r = "❓ CONFIRME SEU PEDIDO\n\n";
        let total = 0;

        res.forEach(i => {
            const v = i.qtd * precos[i.sabor][i.tamanho];
            total += v;
            r += `🍕 ${i.qtd}x ${i.sabor} (${i.tamanho}) — R$ ${v},00\n`;
        });

        r += `\n💰 TOTAL: R$ ${total},00\n\n1️⃣ CONFIRMAR\n2️⃣ CANCELAR`;
        estados[user] = "confirma_pizza";
        return responder(msg, r);
    }

    if (estados[user] === "confirma_pizza") {
        if (SIM.includes(texto)) {
            carrinhoPizza[user].push(...pendentePizza[user]);
            estados[user] = "bebidas";
            return cardapioBebidas(msg);
        }

        estados[user] = "pizzas";
        return responder(msg, "❗ Pedido não confirmado. Envie novamente.");
    }

    // ===== BEBIDAS =====
    if (estados[user] === "bebidas") {
        if (NAO.includes(texto)) {
            estados[user] = "resumo";
        } else {
            const res = extrairBebidas(texto);

            if (!res)
                return responder(
                    msg,
                    "❌ Não consegui identificar a bebida.\n👉 Ex: 1 coca cola lata"
                );

            pendenteBebida[user] = res;

            let r = "❓ CONFIRME AS BEBIDAS\n\n";
            let total = 0;

            res.forEach(b => {
                const v = b.qtd * b.preco;
                total += v;
                r += `🥤 ${b.qtd}x ${b.nome} — R$ ${v},00\n`;
            });

            r += `\n💰 TOTAL: R$ ${total},00\n\n1️⃣ CONFIRMAR\n2️⃣ CANCELAR`;
            estados[user] = "confirma_bebida";
            return responder(msg, r);
        }
    }

    if (estados[user] === "confirma_bebida") {
        if (SIM.includes(texto)) {
            carrinhoBebida[user].push(...pendenteBebida[user]);
            estados[user] = "resumo";
        } else {
            estados[user] = "bebidas";
            return responder(msg, "❗ Bebidas não confirmadas. Envie novamente.");
        }
    }

    // ===== RESUMO =====
    if (estados[user] === "resumo") {
        let r = "🧾 RESUMO FINAL\n\n";
        let total = 0;

        carrinhoPizza[user].forEach(i => {
            const v = i.qtd * precos[i.sabor][i.tamanho];
            total += v;
            r += `🍕 ${i.qtd}x ${i.sabor} (${i.tamanho}) — R$ ${v},00\n`;
        });

        carrinhoBebida[user].forEach(b => {
            const v = b.qtd * b.preco;
            total += v;
            r += `🥤 ${b.qtd}x ${b.nome} — R$ ${v},00\n`;
        });

        r += `\n💰 TOTAL: R$ ${total},00\n\n1️⃣ CONFIRMAR PEDIDO\n2️⃣ CANCELAR`;
        estados[user] = "confirmacao";
        return responder(msg, r);
    }

    // ===== CONFIRMAÇÃO FINAL =====
    if (estados[user] === "confirmacao") {
        if (SIM.includes(texto)) {
            estados[user] = "endereco";
            return responder(
                msg,
                "📍 Por favor, informe o ENDEREÇO COMPLETO para entrega."
            );
        }

        resetUser(user);
        return responder(
            msg,
            "❌ Pedido cancelado.\nDigite MENU para iniciar um novo pedido."
        );
    }

    // ===== ENDEREÇO INTELIGENTE =====
    if (estados[user] === "endereco") {
        const end = parseEndereco(msg.body);
        enderecoTemp[user] = end;

        if (!enderecoValido(end)) {
            return responder(
                msg,
                "⚠️ Faltam algumas informações obrigatórias.\n\nPor favor, informe o ENDEREÇO COMPLETO novamente contendo:\n• Rua ou Avenida\n• Número\n• Bairro\n• Telefone"
            );
        }

        let r = "📍 ENDEREÇO INFORMADO:\n\n";
        r += `• Rua ou Avenida: ${end.rua}\n`;
        r += `• Número: ${end.numero}\n`;
        r += `• Bairro: ${end.bairro}\n`;
        r += `• Ponto de referência: ${end.referencia}\n`;
        r += `• Complemento: ${end.complemento}\n`;
        r += `• Telefone: ${end.telefone}\n\n`;
        r += "Esse endereço está correto?\n\n1️⃣ SIM\n2️⃣ NÃO";

        estados[user] = "confirma_endereco";
        return responder(msg, r);
    }

    if (estados[user] === "confirma_endereco") {
        if (SIM.includes(texto)) {
            resetUser(user);
            return responder(
                msg,
                "✅ Pedido confirmado com sucesso!\n📍 Endereço salvo\n⏱️ Tempo estimado: 40 minutos.\nObrigado pela preferência 🍕"
            );
        } else {
            estados[user] = "endereco";
            return responder(
                msg,
                "❌ Ok, envie o ENDEREÇO COMPLETO novamente.\n\nInclua:\n• Rua ou Avenida\n• Número\n• Bairro\n• Telefone"
            );
        }
    }

});





