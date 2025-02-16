// Função para registrar um novo usuário
async function register() {
    const username = document.getElementById("registerUser").value;
    const password = document.getElementById("registerPass").value;

    if (!username || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            // Limpa os campos após o registro
            document.getElementById("registerUser").value = "";
            document.getElementById("registerPass").value = "";
        } else {
            alert(`Erro: ${data.message}`);
        }
    } catch (error) {
        console.error("Erro ao registrar:", error);
        alert("Erro ao registrar. Verifique o console para mais detalhes.");
    }
}

// Função para fazer login
async function login() {
    const username = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPass").value;

    if (!username || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            // Armazena o token no localStorage
            localStorage.setItem("token", data.token);
            // Redireciona para o dashboard
            window.location.href = "dashboard.html";
        } else {
            alert(`Erro: ${data.message}`);
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao fazer login. Verifique o console para mais detalhes.");
    }
}

// Função para fazer logout
function logout() {
    // Remove o token do localStorage
    localStorage.removeItem("token");
    // Redireciona para a página de login
    window.location.href = "index.html";
}

// Função para carregar a lista de contatos no dashboard
async function loadContacts() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Token de autenticação não encontrado. Faça login novamente.");
            window.location.href = "index.html";
            return;
        }

        const response = await fetch("/getContacts", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const contacts = await response.json();
            const contactsList = document.getElementById("contactsList");
            contactsList.innerHTML = ""; // Limpa a lista

            contacts.forEach(contact => {
                const li = document.createElement("li");

                // Formata a data e hora
                const createdAt = new Date(contact.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });

                li.textContent = `${contact.name}: ${contact.phone} (Adicionado em: ${createdAt})`;
                contactsList.appendChild(li);
            });
        } else {
            alert("Erro ao carregar contatos.");
        }
    } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        alert("Erro ao carregar contatos. Verifique o console para mais detalhes.");
    }
}

// Função para adicionar um contato
async function addContact() {
    const name = document.getElementById("contactName").value;
    const phone = document.getElementById("contactPhone").value;

    if (!name || !phone) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Token de autenticação não encontrado. Faça login novamente.");
            window.location.href = "index.html";
            return;
        }

        const response = await fetch("/addContact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, phone })
        });

        if (response.ok) {
            alert("Contato adicionado com sucesso!");
            // Limpa os campos após adicionar o contato
            document.getElementById("contactName").value = "";
            document.getElementById("contactPhone").value = "";
            // Recarrega a lista de contatos
            loadContacts();
        } else {
            const errorData = await response.json();
            alert(`Erro: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Erro ao adicionar contato:", error);
        alert("Erro ao adicionar contato. Verifique o console para mais detalhes.");
    }
}

// Carrega a lista de contatos ao abrir o dashboard
if (window.location.pathname.endsWith("dashboard.html")) {
    window.onload = loadContacts;
                    }
