// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// --- РЕГИСТРАЦИЯ (Страница 1) ---

// Показать форму регистрации
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Обработать форму регистрации
router.post('/register', async (req, res) => {
    const { username, password, first_name, last_name, middle_name, phone, email } = req.body;

    // --- Валидация ---
    if (!username || !password || !first_name || !last_name || !phone || !email) {
        return res.render('register', { error: 'Все поля (кроме отчества) обязательны.' });
    }
    if (username.length < 6 || !/^[a-zA-Z0-9]+$/.test(username)) {
        return res.render('register', { error: 'Логин: минимум 6 символов, только латиница и цифры.' });
    }
    if (password.length < 8) {
        return res.render('register', { error: 'Пароль: минимум 8 символов.' });
    }
    if (!/^[А-Яа-яЁё\s]+$/.test(first_name) || !/^[А-Яа-яЁё\s]+$/.test(last_name)) {
        return res.render('register', { error: 'ФИО: только кириллица и пробелы.' });
    }
    // Простая проверка email (можно использовать более сложный regex)
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.render('register', { error: 'Неверный формат email.' });
    }
    // Валидация телефона (формат 8(XXX)XXX-XX-XX)
    if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) {
        return res.render('register', { error: 'Неверный формат телефона. Ожидается 8(XXX)XXX-XX-XX' });
    }
    // --- Конец Валидации ---

    try {
        // Проверка, что логин и email уникальны
        const existingUser = await db.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
        if (existingUser.rows.length > 0) {
            return res.render('register', { error: 'Пользователь с таким логином или email уже существует.' });
        }

        // Хэшируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Сохраняем в БД
        await db.query(
            `INSERT INTO users (username, password_hash, first_name, last_name, middle_name, phone, email, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'user')`,
            [username, hashedPassword, first_name, last_name, middle_name || null, phone, email]
        );

        // Успех -> отправляем на логин
        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Ошибка сервера при регистрации.' });
    }
});


// --- АВТОРИЗАЦИЯ (Страница 2) ---

// Показать форму логина
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Обработать форму логина
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Ищем пользователя
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];

        // 1. Пользователь не найден
        if (!user) {
            return res.render('login', { error: 'Неверный логин или пароль.' });
        }

        // 2. Проверяем пароль
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.render('login', { error: 'Неверный логин или пароль.' });
        }

        // 3. Успех! Сохраняем ID и роль в сессию
        req.session.userId = user.user_id;
        req.session.role = user.role;
        req.session.username = user.username; // Сохраним имя для приветствия

        // 4. Перенаправляем
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/dashboard');
        }

    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Ошибка сервера.' });
    }
});

// --- Выход ---
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/'); // Если ошибка, просто редирект
        }
        res.clearCookie('connect.sid'); // Чистим cookie
        res.redirect('/login');
    });
});

module.exports = router;