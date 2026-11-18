let currentLanguage = localStorage.getItem("language") || "en";
let destinationsRequest;

function t(key, fallback = key) {
    if (typeof translations !== "undefined") {
        return translations[currentLanguage]?.[key] ||
            translations.en?.[key] || fallback;
    }

    return fallback;
}

function localized(value) {
    if (typeof value === "object" && value !== null) {
        return value[currentLanguage] || value.en || "";
    }

    return value;
}

function applyTranslations() {
    $("[data-i18n]").each(function () {
        if ($(this).data("original") === undefined) {
            $(this).data("original", $(this).text().trim());
        }

        $(this).text(t($(this).data("i18n"), $(this).data("original")));
    });

    $("[data-i18n-placeholder]").each(function () {
        if ($(this).data("originalPlaceholder") === undefined) {
            $(this).data("originalPlaceholder", $(this).attr("placeholder"));
        }

        $(this).attr("placeholder",
            t($(this).data("i18n-placeholder"), $(this).data("originalPlaceholder")));
    });

    $("html").attr("lang", currentLanguage);
}

function getDestinations() {
    if (!destinationsRequest) {
        destinationsRequest = $.getJSON("data/destinations.json");
    }

    return destinationsRequest;
}

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function setFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavoriteButtons();
    $(document).trigger("favoritesChanged");
}

function toggleFavorite(id) {
    id = String(id);

    let favorites = getFavorites();

    if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
        showToast(t("favoriteRemoved", "Removed from favorites"));
    } else {
        favorites.push(id);
        showToast(t("favoriteAdded", "Added to favorites"));
    }

    setFavorites(favorites);
}

function updateFavoriteButtons() {
    let favorites = getFavorites();

    $(".favorite-btn").each(function () {
        let active = favorites.includes(String($(this).attr("data-id")));

        $(this).toggleClass("active", active);
        $(this).attr("aria-pressed", active);
        $(this).attr("aria-label", active
            ? t("removeFavorite", "Remove from favorites")
            : t("addToFavorites", "Add to Favorites"));

        $(this).find("i").attr("class", active
            ? "bi bi-heart-fill"
            : "bi bi-heart");
    });

    $("#favoritesCount").text(favorites.length);
}

function formatPrice(price) {
    return Number(price).toLocaleString("ru-RU") + " ₸";
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function renderDestinationCard(place) {
    let id = escapeHTML(place.id);
    let name = escapeHTML(localized(place.name));
    let region = escapeHTML(localized(place.region));
    let description = escapeHTML(localized(place.description));
    let image = escapeHTML(place.image);
    let category = escapeHTML(t(place.category, place.category));
    let active = getFavorites().includes(String(place.id));

    return `
        <div class="col-md-6 col-lg-4 fade-in">
            <div class="destination-card">

                <div class="card-image-wrapper">
                    <img src="${image}" alt="${name}" loading="lazy">

                    <span class="category-badge">
                        ${category}
                    </span>

                    <button type="button"
                        class="favorite-btn ${active ? "active" : ""}"
                        data-id="${id}"
                        aria-pressed="${active}"
                        aria-label="${t("addToFavorites", "Add to Favorites")}">

                        <i class="bi ${active ? "bi-heart-fill" : "bi-heart"}"></i>
                    </button>
                </div>

                <div class="destination-content">

                    <h3>${name}</h3>

                    <div class="d-flex justify-content-between">
                        <span class="destination-region">
                            <i class="bi bi-geo-alt"></i> ${region}
                        </span>

                        <span class="destination-rating">
                            <i class="bi bi-star-fill text-warning"></i>
                            ${place.rating}
                        </span>
                    </div>

                    <p class="destination-description">
                        ${description}
                    </p>

                    <div class="card-bottom">

                        <div class="destination-price">
                            ${formatPrice(place.price)}
                            <small>/ ${t("day", "day")}</small>
                        </div>

                        <a href="destinations.html?id=${encodeURIComponent(place.id)}"
                            class="btn btn-primary-custom view-details"
                            data-id="${id}">
                            ${t("viewDetails", "View Details")}
                        </a>

                    </div>
                </div>

            </div>
        </div>
    `;
}

function showToast(message) {
    let toast = $(`
        <div class="toast" role="status">
            <div class="toast-header">
                <i class="bi bi-compass me-2"></i>
                <strong class="me-auto">Qazaq Trails</strong>
                <button type="button" class="btn-close"
                    data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body"></div>
        </div>
    `);

    toast.find(".toast-body").text(message);
    $("#toastContainer").append(toast);

    let notification = new bootstrap.Toast(toast[0], {
        delay: 3000
    });

    toast.on("hidden.bs.toast", function () {
        notification.dispose();
        $(this).remove();
    });

    notification.show();
}

function setTheme(theme) {
    $("html").attr("data-theme", theme);
    $("html").attr("data-bs-theme", theme);

    localStorage.setItem("theme", theme);

    $("#themeToggle").attr("aria-pressed", theme === "dark");

    $("#themeToggle i").attr("class", theme === "dark"
        ? "bi bi-sun"
        : "bi bi-moon-stars");
}

function loadFeaturedDestinations() {
    if (!$("#featuredDestinations").length) {
        return;
    }

    getDestinations().done(function (places) {
        let featured = places.filter(place => place.featured).slice(0, 3);

        $("#featuredDestinations").html(
            featured.map(renderDestinationCard).join("")
        );

        updateFavoriteButtons();
    }).fail(function () {
        $("#featuredDestinations").text(
            t("loadError", "Unable to load destinations.")
        );
    });
}

function isVisible(element) {
    return element.getBoundingClientRect().top < window.innerHeight;
}

function updateScroll() {
    let scroll = $(window).scrollTop();

    $(".navbar").toggleClass("scrolled", scroll > 50);
    $("#backToTop").prop("hidden", scroll < 300);

    $(".reveal").each(function () {
        if (isVisible(this)) {
            $(this).addClass("visible");
        }
    });

    $(".counter").each(function () {
        if (isVisible(this) && !$(this).data("started")) {
            let counter = $(this);
            let target = Number(counter.data("target"));

            counter.data("started", true);

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                counter.text(target);
                return;
            }

            $({ number: 0 }).animate({ number: target }, {
                duration: 1200,
                step: function () {
                    counter.text(Math.floor(this.number));
                },
                complete: function () {
                    counter.text(target);
                }
            });
        }
    });
}

function updateFeedbackStats() {
    let feedback = JSON.parse(localStorage.getItem("feedback") || "[]");

    let ratings = feedback.filter(item => item.rating > 0);

    let totalRating = ratings.reduce(function (sum, item) {
        return sum + item.rating;
    }, 0);

    let average = ratings.length > 0
        ? (totalRating / ratings.length).toFixed(1)
        : "0.0";

    let suggestions = feedback.filter(item =>
        item.subject === "destination"
    );

    $("#totalMessages").text(feedback.length);
    $("#averageRating").text(average);
    $("#totalSuggestions").text(suggestions.length);
}

function updateStars(rating) {
    $(".star-btn").each(function () {
        let value = Number($(this).data("rating"));
        let active = value <= rating;

        $(this).toggleClass("active", active);
        $(this).attr("aria-pressed", value === rating);

        $(this).find("i").attr("class", active
            ? "bi bi-star-fill"
            : "bi bi-star");
    });
}

$(document).ready(function () {
    setTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");

    $("#themeToggle").click(function () {
        let theme = $("html").attr("data-theme");

        setTheme(theme === "dark" ? "light" : "dark");
    });

    $("#languageSelect").val(currentLanguage);
    applyTranslations();

    $("#languageSelect").change(function () {
        currentLanguage = $(this).val();

        localStorage.setItem("language", currentLanguage);

        applyTranslations();
        loadFeaturedDestinations();
        updateFavoriteButtons();

        $(document).trigger("languageChanged");
    });

    $(document).on("click", ".favorite-btn", function () {
        toggleFavorite($(this).attr("data-id"));
    });

    loadFeaturedDestinations();
    updateFavoriteButtons();

    $(".feature-card, .team-card, .technology-card").addClass("reveal");

    $(window).on("scroll resize", updateScroll);

    updateScroll();

    $("#backToTop").click(function () {
        let reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        $("html, body").animate({
            scrollTop: 0
        }, reducedMotion ? 0 : 500);
    });

    $("#message").on("input", function () {
        $("#messageCounter").text($(this).val().length + " / 500");
    });

    $(".star-btn").click(function () {
        let rating = Number($(this).data("rating"));

        $("#ratingValue").val(rating);

        updateStars(rating);
    });

    $("#contactForm").on("submit", function (event) {
        event.preventDefault();

        let form = this;

        $("#firstName, #lastName, #message").each(function () {
            this.value = this.value.trim();

            let valid = this.value.length >= this.minLength;

            this.setCustomValidity(valid ? "" : "Invalid input");
        });

        $(form).addClass("was-validated");

        if (!form.checkValidity()) {
            $(form).find(":invalid").first().trigger("focus");

            showToast(t("formError", "Please complete all required fields."));
            return;
        }

        let feedback = JSON.parse(localStorage.getItem("feedback") || "[]");

        let message = {
            firstName: $("#firstName").val(),
            lastName: $("#lastName").val(),
            email: $("#email").val(),
            subject: $("#subject").val(),
            message: $("#message").val(),
            rating: Number($("#ratingValue").val()),
            date: new Date().toISOString()
        };

        feedback.push(message);

        localStorage.setItem("feedback", JSON.stringify(feedback));

        $(form).prop("hidden", true);
        $("#formSuccess").prop("hidden", false);

        updateFeedbackStats();

        showToast(t("feedbackSaved", "Your feedback has been saved."));
    });

    $("#contactForm").on("input", "input, textarea", function () {
        this.setCustomValidity("");
    });

    $("#sendAnother").click(function () {
        $("#contactForm")[0].reset();

        $("#contactForm").removeClass("was-validated");
        $("#contactForm").prop("hidden", false);
        $("#formSuccess").prop("hidden", true);

        $("#ratingValue").val(0);
        $("#messageCounter").text("0 / 500");

        updateStars(0);
    });

    updateFeedbackStats();
});
