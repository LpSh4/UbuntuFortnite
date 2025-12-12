
const express = require('express');
const router = express.Router();
const db = require('../db');

const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};
router.use(isAuth);

router.get('/dashboard', async (req, res) => {
    try {
        const applications = await db.query(
            "SELECT course_name, start_date, payment_method, status FROM applications WHERE user_id = $1 ORDER BY created_at DESC",
            [req.session.userId]
        );

        let visibility = ''
        for(let i = 0; i < applications.rows.length; i++) {
            if(applications.rows[i].status == 'Обучение завершено') {
                visibility = '--active';
                break;
            }
        }
        const reviews = await db.query(
            "SELECT review_text, created_at FROM reviews WHERE user_id = $1 ORDER BY created_at DESC",
            [req.session.userId]
        );

        res.render('dashboard', {
            username: req.session.username,
            applications: applications.rows,
            reviews: reviews.rows,
            visibility: visibility
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

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

router.get('/new-application', (req, res) => {
    res.render('new_application', { error: null, success: null });
});

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

        res.render('new_application', { error: null, success: 'Ваша заявка успешно отправлена!' });

    } catch (err) {
        console.error(err);
        res.render('new_application', { error: 'Ошибка сервера при создании заявки.', success: null });
    }
});


module.exports = router;