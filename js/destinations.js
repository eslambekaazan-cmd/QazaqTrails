$(document).ready(function () {
    let places = [];
    let selectedPlace = null;

    function loadPlaces() {
        $("#loading").prop("hidden", false);

        getDestinations().done(function (data) {
            places = data;

            loadRegions();
            filterDestinations();

            let id = new URLSearchParams(window.location.search).get("id");

            if (id) {
                openDetails(id);
            }
        }).fail(function () {
            $("#destinationList").text(
                t("loadError", "Unable to load destinations.")
            );
        }).always(function () {
            $("#loading").prop("hidden", true);
        });
    }

    function loadRegions() {
        let selected = $("#regionFilter").val() || "all";

        $("#regionFilter").empty();

        $("#regionFilter").append(
            $("<option>").val("all").text(
                t("allRegions", "All regions")
            )
        );

        let regions = new Map();

        places.forEach(function (place) {
            regions.set(place.region.en, localized(place.region));
        });

        regions.forEach(function (name, value) {
            $("#regionFilter").append(
                $("<option>").val(value).text(name)
            );
        });

        $("#regionFilter").val(selected);
    }

    function filterDestinations() {
        let search = $("#searchInput").val().toLowerCase().trim();
        let category = $("#categoryFilter").val();
        let region = $("#regionFilter").val();
        let sort = $("#sortFilter").val();

        let filtered = places.filter(function (place) {
            let name = localized(place.name).toLowerCase();
            let placeRegion = localized(place.region).toLowerCase();
            let description = localized(place.description).toLowerCase();

            let matchesSearch = name.includes(search) ||
                placeRegion.includes(search) ||
                description.includes(search);

            let matchesCategory = category === "all" ||
                place.category === category;

            let matchesRegion = region === "all" ||
                place.region.en === region;

            return matchesSearch && matchesCategory && matchesRegion;
        });

        if (sort === "price-low") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sort === "price-high") {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sort === "name") {
            filtered.sort((a, b) =>
                localized(a.name).localeCompare(
                    localized(b.name), currentLanguage
                )
            );
        } else {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        renderPlaces(filtered);
    }

    function renderPlaces(filtered) {
        $("#destinationList").html(
            filtered.map(renderDestinationCard).join("")
        );

        $("#resultCount").text(filtered.length);

        $("#noResults").prop("hidden", filtered.length > 0);

        updateFavoriteButtons();
    }

    function resetFilters() {
        $("#searchInput").val("");
        $("#categoryFilter").val("all");
        $("#regionFilter").val("all");
        $("#sortFilter").val("popular");

        filterDestinations();
    }

    function openDetails(id) {
        selectedPlace = places.find(function (place) {
            return String(place.id) === String(id);
        });

        if (!selectedPlace) {
            return;
        }

        updateModal();

        let modal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById("destinationModal")
        );

        modal.show();
    }

    function updateModal() {
        if (!selectedPlace) {
            return;
        }

        let place = selectedPlace;

        $("#modalTitle").text(localized(place.name));

        $("#modalImage").attr({
            src: place.image,
            alt: localized(place.name)
        });

        $("#modalRegion").text(localized(place.region));

        $("#modalRating").text(place.rating);

        $("#modalCategory").text(
            t(place.category, place.category)
        );

        $("#modalDescription").text(
            localized(place.description)
        );

        $("#modalSeason").text(
            localized(place.season)
        );

        $("#modalPrice").text(
            formatPrice(place.price)
        );

        $("#modalActivities").empty();

        let activities = localized(place.activities);

        if (Array.isArray(place.activities)) {
            activities = place.activities;
        }

        if (Array.isArray(activities)) {
            activities.forEach(function (activity) {
                $("#modalActivities").append(
                    $("<li>").text(localized(activity))
                );
            });
        }

        $("#modalPlanBtn").attr(
            "href",
            "planner.html?id=" + encodeURIComponent(place.id)
        );

        updateModalFavorite();
    }

    function updateModalFavorite() {
        if (!selectedPlace) {
            return;
        }

        let active = getFavorites().includes(
            String(selectedPlace.id)
        );

        let key = active
            ? "removeFavorite"
            : "addToFavorites";

        $("#modalFavoriteText")
            .attr("data-i18n", key)
            .data("i18n", key)
            .text(active
                ? t(key, "Remove from Favorites")
                : t(key, "Add to Favorites")
            );

        $("#modalFavoriteBtn i").attr(
            "class",
            active ? "bi bi-heart-fill" : "bi bi-heart"
        );

        $("#modalFavoriteBtn").attr("aria-pressed", active);
    }

    $("#searchInput").on("input", filterDestinations);

    $("#categoryFilter, #regionFilter, #sortFilter")
        .on("change", filterDestinations);

    $("#resetFilters, #clearSearch").click(function () {
        resetFilters();
    });

    $("#destinationList").on("click", ".view-details", function (event) {
        event.preventDefault();

        openDetails($(this).attr("data-id"));
    });

    $("#modalFavoriteBtn").click(function () {
        if (selectedPlace) {
            toggleFavorite(selectedPlace.id);
        }
    });

    $(document).on("favoritesChanged", function () {
        updateFavoriteButtons();
        updateModalFavorite();
    });

    $(document).on("languageChanged", function () {
        loadRegions();
        filterDestinations();
        updateModal();
    });

    loadPlaces();
});
