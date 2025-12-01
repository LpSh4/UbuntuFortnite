// routes/app.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware: все роуты в этом файле требуют входа
const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};
router.use(isAuth); // Применяем ко всем роутам ниже

// --- CТРАНИЦА ПРОСМОТРА ЗАЯВОК (Страница 3) ---
router.get('/dashboard', async (req, res) => {
    try {
        // Получаем заявки ТЕКУЩЕГО пользователя
        const applications = await db.query(
            "SELECT course_name, start_date, payment_method, status FROM applications WHERE user_id = $1 ORDER BY created_at DESC",
            [req.session.userId]
        );

        // Получаем отзывы ТЕКУЩЕГО пользователя
        const reviews = await db.query(
            "SELECT review_text, created_at FROM reviews WHERE user_id = $1 ORDER BY created_at DESC",
            [req.session.userId]
        );

        res.render('dashboard', {
            username: req.session.username,
            applications: applications.rows,
            reviews: reviews.rows
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login'); // В случае ошибки
    }
});

// --- Обработка нового отзыва (с dashboard) ---
router.post('/review', async (req, res) => {
    const { review_text } = req.body;
    if (review_text) {
        try {
            await db.query(
                "INSERT INTO reviews (user_id, review_text) VALUES ($1, $2)",
                [req.session.userId, review_text]
            );
        } catch (err) {
            console.error(err);
        }
    }
    res.redirect('/dashboard');
});


// --- СТРАНИЦА ФОРМИРОВАНИЯ ЗАЯВКИ (Страница 4) ---

// Показать форму
router.get('/new-application', (req, res) => {
    res.render('new_application', { error: null, success: null });
});

// Обработать форму
router.post('/new-application', async (req, res) => {
    const { course_name, start_date, payment_method } = req.body;

    if (!course_name || !start_date || !payment_method) {
        return res.render('new_application', { error: 'Все поля обязательны.', success: null });
    }

    try {
        await db.query(
            `INSERT INTO applications (user_id, course_name, start_date, payment_method, status)
             VALUES ($1, $2, $3, $4, 'Новая')`,
            [req.session.userId, course_name, start_date, payment_method]
        );

        // Показываем ту же страницу, но с сообщением об успехе
        res.render('new_application', { error: null, success: 'Ваша заявка успешно отправлена!' });

    } catch (err) {
        console.error(err);
        res.render('new_application', { error: 'Ошибка сервера при создании заявки.', success: null });
    }
});


module.exports = router;