// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware: Проверка на Админа
const checkAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};
router.use(checkAdmin); // Применяем ко всем роутам админки

// --- ПАНЕЛЬ АДМИНИСТРАТОРА (Страница 5) ---
router.get('/admin', async (req, res) => {
    try {
        // Получаем ВСЕ заявки и джойним имена пользователей
        const result = await db.query(
            `SELECT a.*, u.first_name, u.last_name, u.email, u.phone
             FROM applications a
             JOIN users u ON a.user_id = u.user_id
             ORDER BY a.created_at DESC`
        );

        res.render('admin', { applications: result.rows });
    } catch (err) {
        console.error(err);
        res.send('Ошибка сервера.');
    }
});

// --- Обработка смены статуса ---
router.post('/admin/update-status', async (req, res) => {
    const { application_id, new_status } = req.body;

    // Проверка, что статус один из разрешенных
    const allowedStatuses = ['Идет обучение', 'Обучение завершено', 'Новая'];
    if (allowedStatuses.includes(new_status)) {
        try {
            await db.query(
                "UPDATE applications SET status = $1 WHERE application_id = $2",
                [new_status, application_id]
            );
        } catch (err) {
            console.error(err);
        }
    }
    res.redirect('/admin');
});


module.exports = router;