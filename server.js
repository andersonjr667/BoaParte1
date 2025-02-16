require("dotenv").config(); // Carrega variáveis de ambiente do arquivo .env
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

const app = express();

// Middlewares
app.use(express.json()); // Permite o uso de JSON no corpo das requisições
app.use(cors()); // Habilita o CORS para permitir requisições de diferentes origens
app.use(express.static("public")); // Serve arquivos estáticos da pasta "public"

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB conectado com sucesso!"))
    .catch(err => console.log("Erro ao conectar ao MongoDB:", err));

// Modelo de Usuário
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("User", UserSchema);

// Modelo de Contato
const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    createdAt: { type: Date, default: Date.now } // Data e hora de criação
});
const Contact = mongoose.model("Contact", ContactSchema);

// Middleware para verificar o token JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Extrai o token do cabeçalho
    if (!token) return res.status(401).json({ message: "Token de autenticação não fornecido." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token inválido ou expirado." });
        req.user = user; // Adiciona o usuário autenticado à requisição
        next();
    });
};

// Rota de registro
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validação dos campos
        if (!username || !password) {
            return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios." });
        }

        // Verifica se o usuário já existe
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Nome de usuário já existe." });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o novo usuário
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Usuário registrado com sucesso!" });
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: "Erro ao registrar usuário." });
    }
});

// Rota de login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validação dos campos
        if (!username || !password) {
            return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios." });
        }

        // Verifica se o usuário existe
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        // Gera o token JWT
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro ao fazer login." });
    }
});

// Rota para adicionar um contato
app.post("/addContact", authenticateToken, async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Validação dos campos
        if (!name || !phone) {
            return res.status(400).json({ message: "Nome e telefone são obrigatórios." });
        }

        // Cria o novo contato
        const newContact = new Contact({ name, phone }); // createdAt será adicionado automaticamente
        await newContact.save();

        res.status(201).json({ message: "Contato adicionado com sucesso!" });
    } catch (error) {
        console.error("Erro ao adicionar contato:", error);
        res.status(500).json({ message: "Erro ao adicionar contato." });
    }
});

// Rota para recuperar a lista de contatos
app.get("/getContacts", authenticateToken, async (req, res) => {
    try {
        // Recupera todos os contatos, ordenados por data de criação (do mais recente para o mais antigo)
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        console.error("Erro ao recuperar contatos:", error);
        res.status(500).json({ message: "Erro ao recuperar contatos." });
    }
});

// Rota para servir o dashboard após login
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
