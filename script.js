/* =====================================================
   SCRIPT.JS  (shared by every page)
   1. Smooth scrolling
   2. Appear on scroll
   3. Header, progress bar and back to top
   4. Current page highlighted in the nav
   5. Mobile menu closing
   6. Contact form (opens the visitor's email app)
   7. Footer year
===================================================== */

(() => {
    "use strict";

    const root = document.documentElement;
    const header = document.querySelector(".header");
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelectorAll(".right-links nav a");
    const progressBar = document.querySelector(".scroll-progress");
    const backToTop = document.querySelector(".back-to-top");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollMode = reduceMotion ? "auto" : "smooth";

    const headerHeight = () => (header ? header.offsetHeight : 0);

    const closeMenu = () => {
        if (navToggle) navToggle.checked = false;
    };


    /* =========================
       1. SMOOTH SCROLLING
    ========================= */
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const id = link.getAttribute("href");
            if (id.length < 2) return;

            // "#top" and "#home" always go to the very top
            if (id === "#top" || id === "#home") {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: scrollMode });
                closeMenu();
                return;
            }

            const target = document.querySelector(id);
            if (!target) return;

            event.preventDefault();

            const top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 10;
            window.scrollTo({ top, behavior: scrollMode });

            history.pushState(null, "", id);
            closeMenu();
        });
    });


    /* =========================
       2. APPEAR ON SCROLL
       data-reveal="up | left | right | fade"
       data-delay="150" staggers an item (milliseconds)
    ========================= */
    const revealItems = document.querySelectorAll("[data-reveal]");

    revealItems.forEach((item) => {
        if (item.dataset.delay) {
            item.style.setProperty("--reveal-delay", `${item.dataset.delay}ms`);
        }
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -50px 0px"
        });

        revealItems.forEach((item) => observer.observe(item));
    }


    /* =========================
       3. SCROLL EFFECTS
    ========================= */
    let ticking = false;

    const onScroll = () => {
        const scrolled = window.scrollY;
        const maxScroll = root.scrollHeight - window.innerHeight;

        if (header) header.classList.toggle("is-scrolled", scrolled > 10);

        if (progressBar) {
            const amount = maxScroll > 0 ? scrolled / maxScroll : 0;
            progressBar.style.transform = `scaleX(${amount})`;
        }

        if (backToTop) {
            backToTop.classList.toggle("is-visible", scrolled > window.innerHeight * 0.8);
        }

        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener("resize", onScroll);
    onScroll();


    /* =========================
       4. CURRENT PAGE IN THE NAV
    ========================= */
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const isHomeLink = href === "#home" && currentPage === "index.html";

        if (href === currentPage || isHomeLink) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    });


    /* =========================
       5. MOBILE MENU
    ========================= */
    navLinks.forEach((link) => link.addEventListener("click", closeMenu));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
        if (navToggle && navToggle.checked && !event.target.closest(".right-links")) {
            closeMenu();
        }
    });


    /* =========================
       6. CONTACT FORM
       There is no server, so the form opens the visitor's
       email app with the message already filled in.
    ========================= */
    const form = document.querySelector(".contact-form");

    if (form) {
        const status = form.querySelector(".form-status");

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const data = new FormData(form);
            const name = data.get("name").trim();
            const email = data.get("email").trim();
            const subject = data.get("subject").trim() || `Portfolio message from ${name}`;
            const message = data.get("message").trim();

            const body = `${message}\n\nFrom: ${name}\nEmail: ${email}`;

            window.location.href =
                `mailto:${form.dataset.email}` +
                `?subject=${encodeURIComponent(subject)}` +
                `&body=${encodeURIComponent(body)}`;

            if (status) {
                status.textContent = "Your email app should now open with your message ready to send.";
            }
        });
    }


    /* =========================
       7. FOOTER YEAR
    ========================= */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
})();