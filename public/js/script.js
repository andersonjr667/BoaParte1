async function register() {
    const username = document.getElementById("registerUser").value;
    const password = document.getElementById("registerPass").value;

    if (!username || !password) {
        alert("Nome de usuário e senha são obrigatórios.");
        return;
    }

    if (username.length < 3 || password.length < 6) {
        alert("Nome de usuário deve ter pelo menos 3 caracteres e a senha 6 caracteres.");
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
    } catch (error) {
        alert("Erro ao registrar. Tente novamente.");
    } finally {
        button.disabled = false;
        button.textContent = "Criar Conta";
    }
}

async function login() {
    const username = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPass").value;

    if (!username || !password) {
        alert("Nome de usuário e senha são obrigatórios.");
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
        alert("Erro ao fazer login. Tente novamente.");
    } finally {
        button.disabled = false;
        button.textContent = "Entrar";
    }
}
