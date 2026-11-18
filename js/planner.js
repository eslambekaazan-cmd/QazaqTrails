
$(document).ready(function () {
    let places = [];
    let route = [];
    let trips = JSON.parse(localStorage.getItem("trips") || "[]");
    let editingId = null;

    let transportPrices = {
        car: 8000,
        bus: 5000,
        train: 7000,
        plane: 25000
    };

    let hotelPrices = {
        budget: 5000,
        standard: 12000,
        luxury: 30000,
        camping: 2000
    };

    function loadDestinations() {
        $("#destinationSelect").empty();

        $("#destinationSelect").append(
            $("<option>").val("").text(
                t("selectDestination", "Select a destination")
            )
        );

        places.forEach(function (place) {
            $("#destinationSelect").append(
                $("<option>").val(place.id).text(localized(place.name))
            );
        });
    }

    function findPlace(id) {
        return places.find(place => String(place.id) === String(id));
    }

    function renderRoute() {
        $("#selectedDestinations").empty();

        route.forEach(function (id, index) {
            let place = findPlace(id);

            if (!place) return;

            $("#selectedDestinations").append(`
                <div class="route-item" data-id="${escapeHTML(id)}">

                    <i class="bi bi-grip-vertical drag-handle"></i>

                    <span class="route-number">${index + 1}</span>

                    <img src="${escapeHTML(place.image)}"
                        alt="${escapeHTML(localized(place.name))}">

                    <div class="flex-grow-1">
                        <h6>${escapeHTML(localized(place.name))}</h6>
                        <p>${escapeHTML(localized(place.region))}</p>
                    </div>

                    <button type="button" class="move-up btn btn-sm"
                        aria-label="Move up" ${index === 0 ? "disabled" : ""}>
                        <i class="bi bi-arrow-up"></i>
                    </button>

                    <button type="button" class="move-down btn btn-sm"
                        aria-label="Move down" ${index === route.length - 1 ? "disabled" : ""}>
                        <i class="bi bi-arrow-down"></i>
                    </button>

                    <button type="button" class="remove-route"
                        aria-label="Remove destination">
                        <i class="bi bi-x-circle"></i>
                    </button>

                </div>
            `);
        });

        $("#emptyRoute").prop("hidden", route.length > 0);

        calculateBudget();
    }

    function getDays() {
        let start = $("#startDate").val();
        let end = $("#endDate").val();

        if (!start || !end || end < start) {
            return 0;
        }

        let difference = new Date(end) - new Date(start);

        return Math.round(difference / 86400000) + 1;
    }

    function calculateBudget() {
        let days = getDays();
        let travelers = Number($("#travelers").val());
        let transport = $("#transport").val();
        let hotel = $("#accommodation").val();

        if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
            travelers = 0;
        }

        let transportCost = 0;
        let accommodationCost = 0;
        let foodCost = 0;
        let activitiesCost = 0;

        if (days > 0 && travelers > 0 && route.length > 0) {
            transportCost = transportPrices[transport] * travelers * route.length;

            accommodationCost = hotelPrices[hotel] * (days - 1) * travelers;

            foodCost = 4000 * days * travelers;

            let placePrices = 0;

            route.forEach(function (id) {
                let place = findPlace(id);

                if (place) {
                    placePrices += place.price;
                }
            });

            let averagePrice = placePrices / route.length;

            activitiesCost = Math.round(averagePrice * 0.25 * days * travelers);
        }

        let total = transportCost + accommodationCost +
            foodCost + activitiesCost;

        $("#totalDays").text(days);
        $("#totalTravelers").text(travelers);
        $("#totalDestinations").text(route.length);

        $("#transportCost").text(formatPrice(transportCost));
        $("#accommodationCost").text(formatPrice(accommodationCost));
        $("#foodCost").text(formatPrice(foodCost));
        $("#activitiesCost").text(formatPrice(activitiesCost));

        $("#totalBudget").text(formatPrice(total));

        $("#costPerPerson").text(
            formatPrice(travelers > 0 ? Math.round(total / travelers) : 0)
        );

        updateBar("#transportBar", transportCost, total);
        updateBar("#accommodationBar", accommodationCost, total);
        updateBar("#foodBar", foodCost, total);
        updateBar("#activitiesBar", activitiesCost, total);

        return total;
    }

    function updateBar(id, cost, total) {
        let percent = total > 0 ? cost / total * 100 : 0;

        $(id).css("width", percent + "%");
    }

    function addDestination(id) {
        id = String(id);

        if (!id || !findPlace(id)) {
            showToast(t("selectDestination", "Select a destination"));
            return;
        }

        if (route.includes(id)) {
            showToast(t("alreadyAdded", "Destination is already added."));
            return;
        }

        route.push(id);

        renderRoute();

        showToast(t("destinationAdded", "Destination added to your trip."));
    }

    function saveTrips() {
        localStorage.setItem("trips", JSON.stringify(trips));
    }

    function renderSavedTrips() {
        $("#savedTripsList").empty();

        $("#noSavedTrips").prop("hidden", trips.length > 0);

        trips.forEach(function (trip) {
            let names = trip.route.map(function (id) {
                let place = findPlace(id);

                return place ? localized(place.name) : "";
            }).filter(Boolean).join(" → ");

            $("#savedTripsList").append(`
                <div class="col-md-6 col-lg-4 fade-in">

                    <div class="trip-card">

                        <h3>${escapeHTML(trip.name)}</h3>

                        <p>
                            <i class="bi bi-calendar-event"></i>
                            ${escapeHTML(trip.startDate)} — ${escapeHTML(trip.endDate)}
                        </p>

                        <p>
                            <i class="bi bi-people"></i>
                            ${trip.travelers} ${t("travelers", "Travelers")}
                        </p>

                        <p>
                            <i class="bi bi-geo-alt"></i>
                            ${escapeHTML(names)}
                        </p>

                        <hr>

                        <h4>${formatPrice(trip.budget)}</h4>

                        <div class="d-flex gap-2 mt-3">

                            <button type="button"
                                class="btn btn-primary-custom load-trip"
                                data-id="${trip.id}">
                                <i class="bi bi-pencil"></i>
                                ${t("editTrip", "Edit")}
                            </button>

                            <button type="button"
                                class="btn btn-outline-danger delete-trip"
                                data-id="${trip.id}">
                                <i class="bi bi-trash"></i>
                                ${t("deleteTrip", "Delete")}
                            </button>

                        </div>
                    </div>
                </div>
            `);
        });
    }

    function resetForm() {
        $("#tripForm")[0].reset();

        $("#tripForm").removeClass("was-validated");

        $("#endDate").removeAttr("min")[0].setCustomValidity("");
        $("#tripName")[0].setCustomValidity("");

        route = [];
        editingId = null;

        renderRoute();
    }

    function validateForm() {
        let form = $("#tripForm")[0];
        let name = $("#tripName")[0];
        let endDate = $("#endDate")[0];

        name.value = name.value.trim();

        name.setCustomValidity(name.value ? "" : "Invalid name");

        endDate.setCustomValidity(
            getDays() > 0 ? "" : "Invalid date"
        );

        $(form).addClass("was-validated");

        if (!form.checkValidity()) {
            $(form).find(":invalid").first().trigger("focus");

            showToast(t("formError", "Please complete all required fields."));

            return false;
        }

        if (route.length === 0) {
            showToast(t("routeError", "Please add at least one destination."));

            return false;
        }

        return true;
    }

    $("#addDestination").click(function () {
        addDestination($("#destinationSelect").val());

        $("#destinationSelect").val("");
    });

    $("#selectedDestinations").on("click", ".remove-route", function () {
        let id = $(this).closest(".route-item").attr("data-id");

        route = route.filter(item => item !== id);

        renderRoute();
    });

    $("#selectedDestinations").on("click", ".move-up, .move-down", function () {
        let id = $(this).closest(".route-item").attr("data-id");

        let index = route.indexOf(id);

        let nextIndex = $(this).hasClass("move-up")
            ? index - 1
            : index + 1;

        if (nextIndex >= 0 && nextIndex < route.length) {
            let temp = route[index];

            route[index] = route[nextIndex];
            route[nextIndex] = temp;

            renderRoute();
        }
    });

    $("#selectedDestinations").sortable({
        handle: ".drag-handle",
        placeholder: "sortable-placeholder",

        update: function () {
            route = $(".route-item").map(function () {
                return $(this).attr("data-id");
            }).get();

            renderRoute();
        }
    });

    $("#startDate").on("change", function () {
        $("#endDate").attr("min", $(this).val());
    });

    $("#tripForm").on("input change", "input, select", function () {
        this.setCustomValidity("");

        $("#endDate")[0].setCustomValidity("");

        calculateBudget();
    });

    $("#tripForm").submit(function (event) {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        let trip = {
            id: editingId || Date.now(),
            name: $("#tripName").val(),
            startDate: $("#startDate").val(),
            endDate: $("#endDate").val(),
            travelers: Number($("#travelers").val()),
            transport: $("#transport").val(),
            accommodation: $("#accommodation").val(),
            route: [...route],
            budget: calculateBudget()
        };

        if (editingId !== null) {
            trips = trips.map(item => item.id === editingId ? trip : item);
        } else {
            trips.push(trip);
        }

        saveTrips();
        renderSavedTrips();
        resetForm();

        showToast(t("tripSaved", "Your trip has been saved!"));
    });

    $("#resetTrip").click(function () {
        resetForm();
    });

    $("#savedTripsList").on("click", ".delete-trip", function () {
        let id = Number($(this).attr("data-id"));

        if (confirm(t("confirmDeleteTrip", "Delete this trip?"))) {
            trips = trips.filter(trip => trip.id !== id);

            if (editingId === id) {
                resetForm();
            }

            saveTrips();
            renderSavedTrips();

            showToast(t("tripDeleted", "Trip deleted."));
        }
    });

    $("#savedTripsList").on("click", ".load-trip", function () {
        let id = Number($(this).attr("data-id"));

        let trip = trips.find(item => item.id === id);

        if (!trip) return;

        resetForm();

        editingId = trip.id;

        $("#tripName").val(trip.name);
        $("#startDate").val(trip.startDate);
        $("#endDate").val(trip.endDate).attr("min", trip.startDate);
        $("#travelers").val(trip.travelers);
        $("#transport").val(trip.transport);
        $("#accommodation").val(trip.accommodation);

        route = trip.route.filter(id => findPlace(id));

        renderRoute();

        $("html, body").animate({
            scrollTop: $("#tripForm").offset().top - 150
        }, 500);
    });

    $("#copyTrip").click(function () {
        if (!validateForm()) {
            return;
        }

        let names = route.map(id => localized(findPlace(id).name));

        let text = `
Qazaq Trails
${t("tripName", "Trip Name")}: ${$("#tripName").val()}
${t("startDate", "Start Date")}: ${$("#startDate").val()}
${t("endDate", "End Date")}: ${$("#endDate").val()}
${t("tripDuration", "Trip Duration")}: ${getDays()}
${t("travelers", "Travelers")}: ${$("#travelers").val()}
${t("destinations", "Destinations")}: ${names.join(" → ")}
${t("transport", "Transportation")}: ${$("#transport option:selected").text()}
${t("accommodation", "Accommodation")}: ${$("#accommodation option:selected").text()}
${t("estimatedTotal", "Estimated Total Budget")}: ${formatPrice(calculateBudget())}
        `.trim();

        if (!navigator.clipboard) {
            showToast(t("copyError", "Unable to copy trip details."));
            return;
        }

        navigator.clipboard.writeText(text).then(function () {
            showToast(t("tripCopied", "Trip details copied!"));
        }).catch(function () {
            showToast(t("copyError", "Unable to copy trip details."));
        });
    });

    $(document).on("languageChanged", function () {
        loadDestinations();
        renderRoute();
        renderSavedTrips();
    });

    getDestinations().done(function (data) {
        places = data;

        loadDestinations();

        let params = new URLSearchParams(window.location.search);

        let id = params.get("id");

        if (id && findPlace(id)) {
            route.push(String(id));
        }

        if (params.get("favorites") === "1") {
            route = getFavorites().filter(id => findPlace(id));
        }

        renderRoute();
        renderSavedTrips();
    }).fail(function () {
        showToast(t("loadError", "Unable to load destinations."));
    });
});
