document.addEventListener('DOMContentLoaded', function() {
    const burger = document.getElementById('burger');
    const navMenu = document.getElementById('navMenu');
    const burgerClose = document.getElementById('burgerClose');
    const headerLayer = document.querySelector('.header__layer');
    const modal = document.getElementById('infoModal');
    const openModalTrigger = document.querySelector('[data-open-modal]');
    const closeModalTrigger = modal ? modal.querySelector('[data-close-modal]') : null;
    burger.addEventListener('click', function() {
        navMenu.classList.add('active');
        burger.classList.add('active');
        if (headerLayer) headerLayer.classList.add('active');
    });
    burgerClose.addEventListener('click', function(e) {
        navMenu.classList.remove('active');
        burger.classList.remove('active');
        if (headerLayer) headerLayer.classList.remove('active');
        e.stopPropagation();
    });
    if (headerLayer) {
        headerLayer.addEventListener('click', function() {
            navMenu.classList.remove('active');
            burger.classList.remove('active');
            headerLayer.classList.remove('active');
        });
    }

    const openModal = () => {
        if (!modal) return;
        modal.removeAttribute('hidden');
        requestAnimationFrame(function() {
            modal.classList.add('is-open');
        });
        document.body.classList.add('modal-open');
    };

    const hideModal = () => {
        if (!modal) return;
        modal.setAttribute('hidden', '');
        document.body.classList.remove('modal-open');
    };

    const closeModal = () => {
        if (!modal) return;
        const handleTransitionEnd = function(event) {
            if (event.target === modal) {
                modal.removeEventListener('transitionend', handleTransitionEnd);
                hideModal();
            }
        };
        modal.addEventListener('transitionend', handleTransitionEnd);
        modal.classList.remove('is-open');
        const computed = window.getComputedStyle(modal).transitionDuration;
        if (!computed || computed === '0s') {
            modal.removeEventListener('transitionend', handleTransitionEnd);
            hideModal();
        }
    };

    if (openModalTrigger) openModalTrigger.addEventListener('click', openModal);
    if (closeModalTrigger) closeModalTrigger.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
            closeModal();
        }
    });

    const sliders = document.querySelectorAll('[data-slider]');
    sliders.forEach(function(slider) {
        const track = slider.querySelector('[data-track]');
        const frame = slider.querySelector('.slider__frame');
        const prevButton = slider.querySelector('[data-prev]');
        const nextButton = slider.querySelector('[data-next]');
        if (!track || !frame) return;

        const originalSlides = Array.from(track.children);
        const totalSlides = originalSlides.length;
        if (totalSlides === 0) return;

        const firstClone = originalSlides[0].cloneNode(true);
        const lastClone = originalSlides[totalSlides - 1].cloneNode(true);
        track.appendChild(firstClone);
        track.insertBefore(lastClone, track.firstElementChild);

        let currentIndex = 0;
        let pointerId = null;
        let startX = 0;
        let deltaPercent = 0;
        let isDragging = false;
        let startTranslatePercent = 0;
        const swipeThreshold = 15;

        const computedTransition = window.getComputedStyle(track).transition;
        const baseTransition = computedTransition && computedTransition !== 'all 0s ease 0s'
            ? computedTransition
            : 'transform 0.45s cubic-bezier(.2,.8,.2,1)';
        const applyTransition = function(enable) {
            track.style.transition = enable ? baseTransition : 'transform 0s';
        };
        const syncPosition = function() {
            applyTransition(false);
            track.style.transform = 'translateX(' + (-(currentIndex + 1) * 100) + '%)';
            requestAnimationFrame(function() {
                applyTransition(true);
            });
        };

        const goTo = function(index) {
            currentIndex = (index + totalSlides) % totalSlides;
            applyTransition(true);
            track.style.transform = 'translateX(' + (-(currentIndex + 1) * 100) + '%)';
        };

        applyTransition(false);
        track.style.transform = 'translateX(-100%)';
        requestAnimationFrame(function() {
            applyTransition(true);
        });

        const handleLoopEdges = function() {
            if (currentIndex < 0) {
                currentIndex = totalSlides - 1;
                syncPosition();
            } else if (currentIndex >= totalSlides) {
                currentIndex = 0;
                syncPosition();
            }
        };

        track.addEventListener('transitionend', function(event) {
            if (event.target === track) {
                handleLoopEdges();
            }
        });

        if (totalSlides > 1) {
            if (prevButton) {
                prevButton.addEventListener('click', function() {
                    goTo(currentIndex - 1);
                });
            }
            if (nextButton) {
                nextButton.addEventListener('click', function() {
                    goTo(currentIndex + 1);
                });
            }

            const finishDrag = function() {
                if (!isDragging) return;
                isDragging = false;
                slider.classList.remove('is-dragging');
                if (pointerId !== null) {
                    try {
                        frame.releasePointerCapture(pointerId);
                    } catch (error) {
                        /* ignore */
                    }
                }

                if (Math.abs(deltaPercent) > swipeThreshold) {
                    const direction = deltaPercent < 0 ? 1 : -1;
                    goTo(currentIndex + direction);
                } else {
                    goTo(currentIndex);
                }

                deltaPercent = 0;
                pointerId = null;
            };

            frame.addEventListener('pointerdown', function(event) {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                isDragging = true;
                pointerId = event.pointerId;
                startX = event.clientX;
                deltaPercent = 0;
                startTranslatePercent = -(currentIndex + 1) * 100;
                slider.classList.add('is-dragging');
                applyTransition(false);
                try {
                    frame.setPointerCapture(pointerId);
                } catch (error) {
                    /* ignore */
                }
            });

            frame.addEventListener('pointermove', function(event) {
                if (!isDragging || event.pointerId !== pointerId) return;
                const deltaX = event.clientX - startX;
                const frameWidth = frame.offsetWidth || 1;
                deltaPercent = (deltaX / frameWidth) * 100;
                track.style.transform = 'translateX(' + (startTranslatePercent + deltaPercent) + '%)';
            });

            const endPointer = function(event) {
                if (!isDragging) return;
                if (event.pointerId !== undefined && event.pointerId !== pointerId) return;
                finishDrag();
            };

            frame.addEventListener('pointerup', endPointer);
            frame.addEventListener('pointercancel', endPointer);
            frame.addEventListener('pointerleave', function(event) {
                if (!isDragging) return;
                if (event.pointerId !== undefined && event.pointerId !== pointerId) return;
                finishDrag();
            });
        }
    });
});
