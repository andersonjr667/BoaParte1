from flask import Flask, request, jsonify, render_template, redirect, url_for, session, g
import sqlite3
import bcrypt
import os
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'chave_secreta_super_segura')  # Melhor prática para produção
login_manager = LoginManager(app)
login_manager.login_view = 'index'

# Configuração do banco de dados
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db():
    """Obtém a conexão com o banco de dados."""
    db = getattr(g, '_database', None)
    if db is None:
        print("Conectando ao banco de dados...")
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    """Inicializa o banco de dados e cria as tabelas necessárias."""
    with app.app_context():
        db = get_db()
        print("Inicializando banco de dados...")
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        db.commit()
        print("Banco de dados inicializado com sucesso.")

class User(UserMixin):
    """Classe de usuário para autenticação."""
    def __init__(self, user_id, username):
        self.id = str(user_id)
        self.username = username

@login_manager.user_loader
def load_user(user_id):
    """Carrega o usuário pelo ID."""
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if user:
        return User(user['id'], user['username'])
    return None

@app.teardown_appcontext
def close_db(exception=None):
    """Fecha a conexão com o banco de dados ao encerrar a requisição."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def index():
    """Página inicial."""
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    """Endpoint para registrar um novo usuário."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Usuário e senha são obrigatórios'}), 400

    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    db = get_db()
    try:
        db.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
        db.commit()
        return jsonify({'message': 'Usuário registrado com sucesso!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Usuário já existe'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint para login do usuário."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user and bcrypt.checkpw(password.encode(), user['password'].encode()):
        user_obj = User(user['id'], user['username'])
        login_user(user_obj)
        return jsonify({'message': 'Login bem-sucedido!'}), 200
    return jsonify({'error': 'Usuário ou senha incorretos'}), 401

@app.route('/dashboard')
@login_required
def dashboard():
    """Página do dashboard, visível apenas para usuários autenticados."""
    return render_template('dashboard.html')

@app.route('/logout')
@login_required
def logout():
    """Logout do usuário."""
    logout_user()
    return redirect(url_for('index'))

@app.route('/api/contacts', methods=['GET'])
@login_required
def get_contacts():
    """Endpoint para obter a lista de contatos."""
    db = get_db()
    contacts = db.execute('SELECT id, name, phone, created_at FROM contacts').fetchall()
    return jsonify([dict(contact) for contact in contacts])

@app.route('/api/contact', methods=['POST'])
@login_required
def add_contact():
    """Endpoint para adicionar um novo contato."""
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    
    if not name or not phone:
        return jsonify({'error': 'Dados incompletos'}), 400

    db = get_db()
    try:
        print(f"Adicionando contato: {name}, {phone}")
        db.execute('INSERT INTO contacts (name, phone) VALUES (?, ?)', (name, phone))
        db.commit()
        return jsonify({'message': 'Contato adicionado!'}), 200
    except Exception as e:
        print(f"Erro ao adicionar contato: {e}")
        return jsonify({'error': 'Erro ao adicionar contato'}), 500

@app.route('/api/contact/<int:contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    """Endpoint para deletar um contato."""
    db = get_db()
    try:
        db.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
        db.commit()
        return jsonify({'message': 'Contato removido!'}), 200
    except Exception as e:
        print(f"Erro ao deletar contato: {e}")
        return jsonify({'error': 'Erro ao deletar contato'}), 500

@app.route('/api/contact/<int:contact_id>', methods=['PUT'])
@login_required
def update_contact(contact_id):
    """Endpoint para atualizar um contato."""
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    
    if not name or not phone:
        return jsonify({'error': 'Dados incompletos'}), 400
    
    db = get_db()
    try:
        db.execute('UPDATE contacts SET name = ?, phone = ? WHERE id = ?', (name, phone, contact_id))
        db.commit()
        return jsonify({'message': 'Contato atualizado!'}), 200
    except Exception as e:
        print(f"Erro ao atualizar contato: {e}")
        return jsonify({'error': 'Erro ao atualizar contato'}), 500

@app.route('/contacts')
@login_required
def contacts():
    """Página para exibir os contatos registrados."""
    db = get_db()
    contacts = db.execute('SELECT id, name, phone, created_at FROM contacts').fetchall()
    return render_template('contacts.html', contacts=contacts)

@app.route('/users')
@login_required
def users():
    """Página para exibir os usuários registrados."""
    db = get_db()
    users = db.execute('SELECT id, username FROM users').fetchall()
    return render_template('users.html', users=users)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
    