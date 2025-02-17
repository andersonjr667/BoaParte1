require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

const app = express();

// Configurações básicas
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Lista de tokens inválidos (para logout)
const invalidTokens = new Set();

// ================== CONEXÃO COM MONGODB ==================
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB conectado com sucesso"))
.catch(err => {
    console.error("❌ Falha na conexão com MongoDB:", err);
    process.exit(1);
});

// ================== MODELOS DE DADOS ==================
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("User", UserSchema);

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    username: { type: String, required: true }, // Vinculado ao usuário
    createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model("Contact", ContactSchema);

// ================== MIDDLEWARE DE AUTENTICAÇÃO ==================
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Acesso não autorizado" });
    if (invalidTokens.has(token)) return res.status(401).json({ error: "Sessão expirada" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// ================== TRATAMENTO DE ERROS GLOBAIS ==================
process.on("unhandledRejection", (err) => {
    console.error("⚠️ Erro não tratado:", err);
    process.exit(1);
});

process.on("uncaughtException", (err) => {
    console.error("⚠️ Exceção não capturada:", err);
    process.exit(1);
});

// ================== ROTAS ==================

// ---------- Autenticação ----------
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validações
        if (!username || !password) {
            return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
        }

        if (username.length < 3 || password.length < 6) {
            return res.status(400).json({ 
                error: "Usuário (mín. 3 caracteres) e senha (mín. 6 caracteres) inválidos" 
            });
        }

        // Verifica se usuário já existe
        if (await User.findOne({ username })) {
            return res.status(409).json({ error: "Usuário já cadastrado" });
        }

        // Cria novo usuário
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: "Usuário criado com sucesso!" });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // Gera token JWT válido por 1 hora
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, username });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

app.post("/logout", authenticateToken, (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    invalidTokens.add(token);
    res.json({ message: "Logout realizado com sucesso" });
});

// ---------- Contatos ----------
app.post("/addContact", authenticateToken, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const username = req.user.username;

        // Verifica duplicatas para o mesmo usuário
        if (await Contact.findOne({ name, phone, username })) {
            return res.status(409).json({ error: "Contato já existe" });
        }

        // Adiciona novo contato
        const newContact = await Contact.create({ name, phone, username });
        res.status(201).json(newContact);

    } catch (error) {
        console.error("Erro ao adicionar contato:", error);
        res.status(500).json({ error: "Erro ao salvar contato" });
    }
});

app.get("/getContacts", authenticateToken, async (req, res) => {
    try {
        const contacts = await Contact.find({ username: req.user.username })
            .sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error("Erro ao buscar contatos:", error);
        res.status(500).json({ error: "Erro ao carregar contatos" });
    }
});

// ---------- Páginas ----------
app.get("/dashboard.html", authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/users", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "users.html"));
});

// Rota para listar todos os contatos (agora com autenticação)
app.get("/contatos", authenticateToken, async (req, res) => {
    try {
        const contatos = await Contact.find().sort({ createdAt: -1 });
        res.json(contatos);
    } catch (error) {
        console.error("Erro ao buscar contatos:", error);
        res.status(500).json({ error: "Erro ao carregar contatos" });
    }
});

// ================== INICIAR SERVIDOR ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
