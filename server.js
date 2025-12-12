const express = require('express');
const session = require('express-session');
const db = require('./db'); // Наше подключение к БД
db.query("SET search_path TO 'portal';")
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// 3. Middleware (CSS, JS, pics)
app.use(express.static('public'));

// 4. Sessions
app.use(session({
    secret: '...',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
}));

// --- Authentication middleware ---

// Checkup session for current user
const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Check if session's user is admin
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/dashboard');
    }
};


// --- Connect routes ---
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/app');
const adminRoutes = require('./routes/admin');

app.use(authRoutes); // /register, /login, /logout
app.use(appRoutes);  // /dashboard, /new-application, /review
app.use(adminRoutes); // /admin

// --- Base route ---
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Сервер "Корочки.есть" запущен на http://localhost:${PORT}`);
});

const createAdmin = async () => {
    try {
        const adminExists = await db.query("SELECT * FROM users WHERE username = 'Admin'");
        if (adminExists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('KorokNET', 10); // Hashing
            await db.query(
                `INSERT INTO users (username, password_hash, first_name, last_name, phone, email, role)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['Admin', hashedPassword, 'Администратор', 'Портала', '8(000)000-00-00', 'admin@korochki.est', 'admin']
            );
            console.log('Администратор "Admin" успешно создан.');
        } else {
            console.log('Администратор "Admin" уже существует.');
        }
    } catch (err) {
        console.error('Ошибка при создании администратора:', err);
    }
};

// Вызываем функцию создания админа при старте сервера
createAdmin();