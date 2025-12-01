// server.js
const express = require('express');
const session = require('express-session');
const db = require('./db'); // Наше подключение к БД
db.query("SET search_path TO 'portal';")
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// --- Настройка Middleware ---

// 1. Настройка EJS (шаблонизатор)
app.set('view engine', 'ejs');

// 2. Middleware для парсинга данных форм (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// 3. Middleware для статических файлов (CSS, JS, картинки)
app.use(express.static('public'));

// 4. Настройка сессий
app.use(session({
    secret: 'your_very_secret_key_korochki', // Секретный ключ для подписи сессии
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 час
}));

// --- Middleware для аутентификации ---

// Проверяет, вошел ли пользователь в систему
const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Проверяет, является ли пользователь админом
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/dashboard'); // Обычных пользователей отправляем в их кабинет
    }
};


// --- Подключение Роутов ---
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/app');
const adminRoutes = require('./routes/admin');

app.use(authRoutes); // /register, /login, /logout
app.use(appRoutes);  // /dashboard, /new-application, /review
app.use(adminRoutes); // /admin

// --- Базовый роут ---
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard'); // Если в сессии, кидаем в кабинет
    } else {
        res.redirect('/login'); // Иначе на логин
    }
});

// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Сервер "Корочки.есть" запущен на http://localhost:${PORT}`);
});

const createAdmin = async () => {
    try {
        const adminExists = await db.query("SELECT * FROM users WHERE username = 'Admin'");
        if (adminExists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('KorokNET', 10); // Хэшируем пароль
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