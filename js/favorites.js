
$(document).ready(function () {
    let places = [];

    function renderFavorites() {
        let favorites = getFavorites();

        let savedPlaces = favorites.map(function (id) {
            return places.find(place => String(place.id) === id);
        }).filter(Boolean);

        updateStatistics(savedPlaces);

        let search = $("#favoriteSearch").val().toLowerCase().trim();
        let sort = $("#favoriteSort").val();

        let filtered = savedPlaces.filter(function (place) {
            return localized(place.name).toLowerCase().includes(search) ||
                localized(place.region).toLowerCase().includes(search);
        });

        if (sort === "price-low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sort === "price-high") {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sort === "name") {
            filtered.sort((a, b) =>
                localized(a.name).localeCompare(localized(b.name))
            );
        } else if (sort === "popular") {
            filtered.sort((a, b) => b.rating - a.rating);
        } else {
            filtered.reverse();
        }

        $("#favoritesList").html(
            filtered.map(renderDestinationCard).join("")
        );

        $("#favoriteResultCount").text(filtered.length);

        $("#emptyFavorites").prop(
            "hidden", savedPlaces.length > 0
        );

        $("#noFavoriteResults").prop(
            "hidden", savedPlaces.length === 0 || filtered.length > 0
        );

        $("#clearFavorites, #planFavorites").prop(
            "disabled", savedPlaces.length === 0
        );

        renderRecommended();
        updateFavoriteButtons();
    }

    function updateStatistics(savedPlaces) {
        let regions = new Set(
            savedPlaces.map(place => place.region.en)
        );

        let budget = savedPlaces.reduce(function (sum, place) {
            return sum + place.price;
        }, 0);

        $("#totalFavorites").text(savedPlaces.length);
        $("#favoriteRegions").text(regions.size);
        $("#favoriteBudget").text(formatPrice(budget));
    }

    function renderRecommended() {
        let favorites = getFavorites();

        let recommended = places.filter(function (place) {
            return !favorites.includes(String(place.id));
        });

        recommended.sort((a, b) => b.rating - a.rating);

        $("#recommendedDestinations").html(
            recommended.slice(0, 3).map(renderDestinationCard).join("")
        );

        if (recommended.length === 0) {
            $("#recommendedDestinations").text(
                t("allPlacesSaved", "You have saved all destinations!")
            );
        }
    }

    $("#favoriteSearch").on("input", renderFavorites);

    $("#favoriteSort").on("change", renderFavorites);

    $("#clearFavoriteSearch").click(function () {
        $("#favoriteSearch").val("");

        renderFavorites();
    });

    $("#confirmClearFavorites").click(function () {
        setFavorites([]);

        showToast(
            t("favoritesCleared", "All favorites have been cleared.")
        );
    });

    $("#planFavorites").click(function () {
        if (getFavorites().length > 0) {
            window.location.href = "planner.html?favorites=1";
        }
    });

    $(document).on("favoritesChanged", renderFavorites);

    $(document).on("languageChanged", renderFavorites);

    $("#loading").prop("hidden", false);

    getDestinations().done(function (data) {
        places = data;

        renderFavorites();
    }).fail(function () {
        $("#favoritesList").text(
            t("loadError", "Unable to load destinations.")
        );
    }).always(function () {
        $("#loading").prop("hidden", true);
    });
});
