const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
    const { username, password, first_name, last_name, middle_name, phone, email } = req.body;

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
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.render('register', { error: 'Неверный формат email.' });
    }
    if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) {
        return res.render('register', { error: 'Неверный формат телефона. Ожидается 8(XXX)XXX-XX-XX' });
    }

    try {
        const existingUser = await db.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
        if (existingUser.rows.length > 0) {
            return res.render('register', { error: 'Пользователь с таким логином или email уже существует.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users (username, password_hash, first_name, last_name, middle_name, phone, email, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'user')`,
            [username, hashedPassword, first_name, last_name, middle_name || null, phone, email]
        );

        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Ошибка сервера при регистрации.' });
    }
});

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];
        if (!user) {
            return res.render('login', { error: 'Неверный логин или пароль.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.render('login', { error: 'Неверный логин или пароль.' });
        }
        req.session.userId = user.user_id;
        req.session.role = user.role;
        req.session.username = user.username;

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

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;