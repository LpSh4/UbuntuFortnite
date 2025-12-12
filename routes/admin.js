// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware: Check Admin (Unchanged)
const checkAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};
router.use(checkAdmin);


// --- ADMIN PANEL (Page 5) ---
router.get('/admin', async (req, res) => {
    try {
        // 1. Extract filter values from Query String (URL)
        const { course_filter, status_filter } = req.query;

        // 2. Build the Main Query dynamically
        let queryText = `
            SELECT a.*, u.first_name, u.last_name, u.email, u.phone
            FROM applications a
            JOIN users u ON a.user_id = u.user_id
        `;


        const queryParams = [];
        const conditions = [];

        // If Course filter is present
        if (course_filter) {
            queryParams.push(course_filter);
            conditions.push(`a.course_name = $${queryParams.length}`);
        }

        // If Status filter is present
        if (status_filter) {
            queryParams.push(status_filter);
            conditions.push(`a.status = $${queryParams.length}`);
        }

        // Apply WHERE if conditions exist
        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        queryText += ' ORDER BY a.created_at DESC';

        // Execute Main Query
        const result = await db.query(queryText, queryParams);

        // 3. Get list of distinct courses for the Dropdown
        const coursesResult = await db.query('SELECT DISTINCT course_name FROM applications ORDER BY course_name');

        // 4. Render with data and current filter state
        res.render('admin', {
            applications: result.rows,
            adminuser: true,
            // Pass distinct courses for the dropdown
            availableCourses: coursesResult.rows,
            // Pass current selections so we can keep them selected in UI
            // filters: {
            //     course: 'Все курсы',
            //     status: 'Все статусы'
            // }
            filters: {
                course: course_filter || 'Все курсы',
                status: status_filter || 'Все статусы'
            }
        });

    } catch (err) {
        console.error(err);
        res.send('Ошибка сервера.');
    }
});

// --- Status Update (Unchanged) ---
router.post('/admin/update-status', async (req, res) => {
    const { application_id, new_status } = req.body;
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
    // Redirect back to admin, but strictly speaking, we might lose filters here.
    // Usually acceptable to reset on update, or you can grab referrer header.
    res.redirect('/admin');
});

module.exports = router;