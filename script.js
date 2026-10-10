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

       If data-endpoint on the form holds a form-service URL
       (Formspree, Web3Forms, FormSubmit), the message is sent in
       the background and the visitor stays on the page.

       If it is empty, the form falls back to opening the visitor's
       own email app with the message already written out.
    ========================= */
    const form = document.querySelector(".contact-form");

    if (form) {
        const status = form.querySelector(".form-status");
        const button = form.querySelector("button[type='submit']");
        const buttonText = button ? button.innerHTML : "";

        const say = (text, ok) => {
            if (!status) return;
            status.textContent = text;
            status.classList.toggle("is-error", ok === false);
        };

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const endpoint = form.dataset.endpoint;
            const data = new FormData(form);

            // No endpoint set yet, so hand the message to their email app.
            if (!endpoint) {
                const name = data.get("name").trim();
                const subject = data.get("subject").trim() || `Portfolio message from ${name}`;
                const body = `${data.get("message").trim()}\n\nFrom: ${name}\nEmail: ${data.get("email").trim()}`;

                window.location.href =
                    `mailto:${form.dataset.email}` +
                    `?subject=${encodeURIComponent(subject)}` +
                    `&body=${encodeURIComponent(body)}`;

                say("Your email app should now open with your message ready to send.");
                return;
            }

            if (button) {
                button.disabled = true;
                button.innerHTML = "Sending...";
            }
            say("");

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    body: data,
                    headers: { Accept: "application/json" }
                });

                // contact.php explains itself; other services may not
                let result = {};
                try {
                    result = await response.json();
                } catch {
                    result = {};
                }

                if (response.ok) {
                    form.reset();
                    say(result.message || "Thanks. Your message has been sent, I'll get back to you soon.");
                } else {
                    say(
                        result.message ||
                        "Something went wrong. Please email me directly at " + form.dataset.email,
                        false
                    );
                }
            } catch {
                say("Couldn't send that. Check your connection, or email me at " + form.dataset.email, false);
            }

            if (button) {
                button.disabled = false;
                button.innerHTML = buttonText;
            }
        });
    }


    /* =========================
       7. FOOTER YEAR
    ========================= */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();


    /* =========================
       9. SCREENSHOT GALLERIES
       Clicking a thumbnail swaps the big image above it.
    ========================= */
    document.querySelectorAll(".shots").forEach((gallery) => {
        const main    = gallery.querySelector(".shot-main img");
        const caption = gallery.querySelector(".shot-caption");
        const thumbs  = gallery.querySelectorAll(".shot-thumb");

        if (!main || !thumbs.length) return;

        thumbs.forEach((thumb) => {
            thumb.addEventListener("click", () => {
                const picture = thumb.querySelector("img");
                if (!picture) return;

                main.src = picture.src;
                main.alt = picture.alt;

                if (caption) caption.textContent = thumb.dataset.caption || "";

                thumbs.forEach((other) => {
                    const chosen = other === thumb;
                    other.classList.toggle("is-active", chosen);
                    other.setAttribute("aria-selected", String(chosen));
                });
            });
        });
    });


    /* =========================
       8. PRIVATE PROJECTS

       A project marked data-locked keeps its images and
       description on show, but holds its links back until
       the right password is typed in.

       The password itself is never in the page. Only a
       SHA-256 hash of it is, in data-hash.
    ========================= */
    const lockedProjects = document.querySelectorAll("[data-locked]");

    if (lockedProjects.length) {

        const hash = async (text) => {
            const bytes = new TextEncoder().encode(text);
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            return Array.from(new Uint8Array(digest))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        };

        const unlock = (project) => {
            project.classList.add("is-unlocked");

            // Put the real addresses onto the links
            project.querySelectorAll("[data-href]").forEach((link) => {
                try {
                    link.href = atob(link.dataset.href);
                } catch {
                    /* leave it alone if the value is malformed */
                }
            });

            // Stay unlocked while they look around, forget on tab close
            try {
                sessionStorage.setItem("unlocked:" + project.dataset.locked, "1");
            } catch {
                /* private browsing blocks this, which is fine */
            }
        };

        lockedProjects.forEach((project) => {
            const key    = project.dataset.locked;
            const form   = project.querySelector(".lock-form");
            const input  = project.querySelector(".lock-input");
            const note   = project.querySelector(".lock-note");

            // Already unlocked earlier in this visit
            try {
                if (sessionStorage.getItem("unlocked:" + key) === "1") {
                    unlock(project);
                    return;
                }
            } catch {
                /* carry on and ask for the password */
            }

            if (!form || !input) return;

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const typed = input.value.trim();
                if (!typed) return;

                // crypto.subtle only exists on https and localhost
                if (!window.crypto || !crypto.subtle) {
                    if (note) {
                        note.textContent = "This only works on the live site, not from a local file.";
                        note.classList.add("is-error");
                    }
                    return;
                }

                if (await hash(typed) === project.dataset.hash) {
                    unlock(project);
                } else {
                    input.value = "";
                    project.classList.add("shake");
                    setTimeout(() => project.classList.remove("shake"), 400);

                    if (note) {
                        note.textContent = "That password isn't right. Ask me and I'll send it over.";
                        note.classList.add("is-error");
                    }
                }
            });
        });
    }
})();