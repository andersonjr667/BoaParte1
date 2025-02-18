// Redireciona se já estiver logado
function redirectIfLoggedIn() {
    const token = localStorage.getItem("token");
    if (token) window.location.href = "dashboard.html";
}

// Registro
async function register() {
    const username = document.getElementById("registerUser").value;
    const password = document.getElementById("registerPass").value;

    if (!username || !password) {
        alert("Preencha todos os campos.");
        return;
    }

    if (username.length < 3 || password.length < 6) {
        alert("Usuário (3+ caracteres) e senha (6+ caracteres) inválidos.");
        return;
    }

    const button = document.querySelector(".register-container button");
    button.disabled = true;
    button.textContent = "Registrando...";

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        alert(data.message);
        if (response.ok) window.location.href = "index.html";
    } catch (error) {
        alert("Erro no registro.");
    } finally {
        button.disabled = false;
        button.textContent = "Criar Conta";
    }
}

// Login
async function login() {
    const username = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPass").value;

    if (!username || !password) {
        alert("Preencha todos os campos.");
        return;
    }

    const button = document.querySelector(".login-container button");
    button.disabled = true;
    button.textContent = "Entrando...";

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("Erro no login.");
    } finally {
        button.disabled = false;
        button.textContent = "Entrar";
    }
}

// Aplica redirecionamento automático
window.onload = redirectIfLoggedIn;
