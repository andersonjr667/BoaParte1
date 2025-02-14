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
