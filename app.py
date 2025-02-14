from flask import Flask, request, jsonify, render_template, redirect, url_for, session, g
import sqlite3
import bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__)
app.secret_key = 'chave_secreta_super_segura'
login_manager = LoginManager(app)
login_manager.login_view = 'index'

# Configuração do banco de dados
DATABASE = 'database.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
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

class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

@login_manager.user_loader
def load_user(user_id):
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if user:
        return User(user['id'], user['username'], user['password'])
    return None

@app.teardown_appcontext
def close_db(error):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
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
    data = request.json
    username = data.get('username')
    password = data.get('password')
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user and bcrypt.checkpw(password.encode(), user['password'].encode()):
        user_obj = User(user['id'], user['username'], user['password'])
        login_user(user_obj)
        return jsonify({'message': 'Login bem-sucedido!'}), 200
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/api/contacts', methods=['GET'])
@login_required
def get_contacts():
    db = get_db()
    contacts = db.execute('SELECT id, name, phone, created_at FROM contacts').fetchall()
    return jsonify([dict(contact) for contact in contacts])

@app.route('/api/contact', methods=['POST'])
@login_required
def add_contact():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    
    if not name or not phone:
        return jsonify({'error': 'Dados incompletos'}), 400

    db = get_db()
    db.execute('INSERT INTO contacts (name, phone) VALUES (?, ?)', (name, phone))
    db.commit()
    return jsonify({'message': 'Contato adicionado!'}), 200

@app.route('/api/contact/<int:contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    db = get_db()
    db.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
    db.commit()
    return jsonify({'message': 'Contato removido!'}), 200

@app.route('/api/contact/<int:contact_id>', methods=['PUT'])
@login_required
def update_contact(contact_id):
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    
    if not name or not phone:
        return jsonify({'error': 'Dados incompletos'}), 400
    
    db = get_db()
    db.execute('UPDATE contacts SET name = ?, phone = ? WHERE id = ?', (name, phone, contact_id))
    db.commit()
    return jsonify({'message': 'Contato atualizado!'}), 200

@app.route('/users')
@login_required
def users():
    db = get_db()
    contacts = db.execute('SELECT id, name, phone, created_at FROM contacts').fetchall()
    return render_template('users.html', contacts=contacts)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
