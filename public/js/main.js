document.addEventListener('DOMContentLoaded', () => {

    const phoneInput = document.getElementById('phone-mask');

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let input = e.target.value.replace(/\D/g, '');

            if (input.length > 0 && input[0] !== '8') {
                if (input[0] === '7') {
                    input = '8' + input.substring(1);
                } else if (input.length <= 10) {
                    input = '8' + input;
                }
            } else if (input.length === 0) {
                input = '8';
            }

            input = input.substring(0, 11);

            let formattedInput = '8';

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

        phoneInput.addEventListener('keydown', (e) => {
            if (e.target.value.length <= 2 && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
                e.target.value = '8';
            }
        });
    }
    const slides = document.querySelectorAll('.slide');
    const prev = document.querySelector('.slider-prev');
    const next = document.querySelector('.slider-next');
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;
    const totalSlides = slides.length;
    // Создаём точки
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    const dots = document.querySelectorAll('.dot');
    function updateSlide() {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    function goToSlide(n) {
        currentSlide = (n + totalSlides) % totalSlides;
        updateSlide();
    }
    prev.addEventListener('click', () => goToSlide(currentSlide - 1));
    next.addEventListener('click', () => goToSlide(currentSlide + 1));
    // Автопрокрутка каждые 3 секунды
    setInterval(() => {
        goToSlide(currentSlide + 1);}, 3000);
    // Инициализация
    updateSlide();
});

