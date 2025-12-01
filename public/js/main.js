// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Маска для телефона 8(XXX)XXX-XX-XX ---
    const phoneInput = document.getElementById('phone-mask');

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let input = e.target.value.replace(/\D/g, ''); // Удаляем все, кроме цифр

            // Начинаем с 8, если ее нет
            if (input.length > 0 && input[0] !== '8') {
                if (input[0] === '7') {
                    input = '8' + input.substring(1);
                } else if (input.length <= 10) {
                    input = '8' + input;
                }
            } else if (input.length === 0) {
                input = '8';
            }

            // Обрезаем до 11 цифр (8 + 10)
            input = input.substring(0, 11);

            let formattedInput = '8'; // Начинаем с 8

            if (input.length > 1) {
                formattedInput += '(' + input.substring(1, 4);
            }
            if (input.length >= 5) {
                formattedInput += ')' + input.substring(4, 7);
            }
            if (input.length >= 8) {
                formattedInput += '-' + input.substring(7, 9);
            }
            if (input.length >= 10) {
                formattedInput += '-' + input.substring(9, 11);
            }

            e.target.value = formattedInput;
        });

        // Не даем стереть "8("
        phoneInput.addEventListener('keydown', (e) => {
            if (e.target.value.length <= 2 && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
                e.target.value = '8';
            }
        });
    }

});