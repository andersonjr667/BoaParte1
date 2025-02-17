require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB conectado"))
    .catch(err => {
        console.error("Erro ao conectar ao MongoDB:", err);
        process.exit(1); // Encerra o processo se não conseguir conectar ao banco de dados
    });

// Tratamento de erros globais
process.on("unhandledRejection", (err) => {
    console.error("Erro não tratado:", err);
    process.exit(1);
});

process.on("uncaughtException", (err) => {
    console.error("Exceção não capturada:", err);
    process.exit(1);
});

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
    createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model("Contact", ContactSchema);

// Middleware para verificar o token JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token de autenticação não fornecido." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token inválido ou expirado." });
        req.user = user;
        next();
    });
};

// Rota de registro
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios." });
        }

        if (username.length < 3 || password.length < 6) {
            return res.status(400).json({ message: "Nome de usuário deve ter pelo menos 3 caracteres e a senha 6 caracteres." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Nome de usuário já existe." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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

        if (!username || !password) {
            return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios." });
        }

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro ao fazer login." });
    }
});

// Rota de logout (opcional)
app.post("/logout", (req, res) => {
    res.status(200).json({ message: "Logout realizado com sucesso." });
});

// Rota para adicionar um novo contato (evitando duplicatas)
app.post("/contacts", authenticateToken, async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Verifica se o contato já existe para o mesmo usuário
        const existingContact = await Contact.findOne({ name, phone });
        if (existingContact) {
            return res.status(400).json({ message: "Contato já existe." });
        }

        const newContact = new Contact({ name, phone });
        await newContact.save();
        res.status(201).json(newContact);
    } catch (error) {
        console.error("Erro ao adicionar contato:", error);
        res.status(500).json({ message: "Erro no servidor." });
    }
});

// Rota para recuperar a lista de contatos
app.get("/getContacts", authenticateToken, async (req, res) => {
    try {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// Rota protegida para o dashboard
app.get("/dashboard", authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, "/public/dashboard.html"));
});
