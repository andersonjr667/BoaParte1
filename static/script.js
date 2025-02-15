// Alternar entre login e registro
document.getElementById('showRegister').addEventListener('click', function() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', function() {
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
});

// Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                window.location.href = '/dashboard';
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            alert('Erro ao fazer login.');
        }
    });
}

// Cadastro
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                alert('Cadastro realizado com sucesso!');
                document.getElementById('showLogin').click();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            alert('Erro ao cadastrar.');
        }
    });
}

// Logout
if (document.getElementById('logoutButton')) {
    document.getElementById('logoutButton').addEventListener('click', async function() {
        await fetch('/logout');
        window.location.href = '/';
    });
}

// Adicionar contato
if (document.getElementById('contactForm')) {
    document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;

        try {
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });

            if (response.ok) {
                alert('Contato adicionado com sucesso!');
                document.getElementById('contactForm').reset(); // Limpa o formulário
                carregarContatos(); // Atualiza a lista de contatos
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            alert('Erro ao adicionar contato.');
        }
    });
}

// Função para carregar contatos e exibir na tela
async function carregarContatos() {
    try {
        const response = await fetch('/api/contacts');
        if (response.ok) {
            const contatos = await response.json();
            const contactList = document.getElementById('contactList');
            contactList.innerHTML = ''; // Limpa a lista

            contatos.forEach(contato => {
                const li = document.createElement('li');
                li.textContent = `${contato.name} - ${contato.phone}`;
                contactList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
    }
}

// Carregar contatos ao abrir a página
document.addEventListener('DOMContentLoaded', carregarContatos);