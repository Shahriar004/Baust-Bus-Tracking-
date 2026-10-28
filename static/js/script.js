/**
 * static/js/script.js
 * -------------------
 * Client-side JavaScript interactions for Baust Bus Tracking System.
 * Handles:
 * 1. Mobile responsive navigation toggle.
 * 2. Schedule filter dropdown auto-submission.
 * 3. Real-time search input filtering on the Routes (/routes) and Schedule (/schedule) pages.
 * Note: Route data is never duplicated in JavaScript; all data comes from data/routes.py.
 */

document.addEventListener("DOMContentLoaded", function () {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mainNav = document.getElementById("mainNav");
    const mobileNavBackdrop = document.getElementById("mobileNavBackdrop");

    function setMobileMenuState(isOpen) {
        if (!mobileMenuBtn || !mainNav) return;
        mainNav.classList.toggle("open", isOpen);
        mobileMenuBtn.classList.toggle("open", isOpen);
        if (mobileNavBackdrop) {
            mobileNavBackdrop.classList.toggle("open", isOpen);
        }
        mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        mobileMenuBtn.setAttribute("aria-label", isOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন");
        document.body.style.overflow = isOpen ? "hidden" : "";
    }

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener("click", function () {
            const isOpen = !mainNav.classList.contains("open");
            setMobileMenuState(isOpen);
        });

        if (mobileNavBackdrop) {
            mobileNavBackdrop.addEventListener("click", function () {
                setMobileMenuState(false);
            });
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && mainNav.classList.contains("open")) {
                setMobileMenuState(false);
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 768 && mainNav.classList.contains("open")) {
                setMobileMenuState(false);
            }
        });
    }

    // Automatically submit schedule filter when both dropdowns are chosen
    const scheduleForm = document.getElementById("scheduleFilterForm");
    const routeSelect = document.getElementById("routeSelect");
    const directionSelect = document.getElementById("directionSelect");

    if (scheduleForm && routeSelect && directionSelect) {
        const autoSubmitIfReady = function () {
            if (routeSelect.value && directionSelect.value) {
                scheduleForm.submit();
            }
        };
        routeSelect.addEventListener("change", autoSubmitIfReady);
        directionSelect.addEventListener("change", autoSubmitIfReady);
    }

    // Real-time filtering helper for schedule tables and route cards
    function attachRealtimeFilter(inputId, clearBtnId, statusId, includeRouteCards) {
        const searchInput = document.getElementById(inputId);
        const clearBtn = document.getElementById(clearBtnId);
        const statusEl = document.getElementById(statusId);

        if (!searchInput) return;

        const defaultStatusText = statusEl ? statusEl.textContent : "";

        function applyFilter() {
            const query = searchInput.value.trim().toLowerCase();
            if (clearBtn) {
                clearBtn.style.display = query ? "inline-flex" : "none";
            }

            let visibleRows = 0;
            let totalRows = 0;
            const tableRows = document.querySelectorAll(".schedule-table tbody tr");

            tableRows.forEach(function (row) {
                totalRows += 1;
                const rowText = (row.textContent || "").toLowerCase();
                const isMatch = !query || rowText.indexOf(query) !== -1;
                row.style.display = isMatch ? "" : "none";
                if (isMatch) visibleRows += 1;
            });

            let visibleCards = 0;
            if (includeRouteCards) {
                const cards = document.querySelectorAll(".route-selector-card");
                cards.forEach(function (card) {
                    const cardText = (card.textContent || "").toLowerCase();
                    const isCardMatch = !query || cardText.indexOf(query) !== -1;
                    card.style.display = isCardMatch ? "" : "none";
                    if (isCardMatch) visibleCards += 1;
                });
            }

            if (statusEl) {
                if (!query) {
                    statusEl.textContent = defaultStatusText;
                } else if (totalRows > 0) {
                    statusEl.textContent =
                        visibleRows > 0
                            ? 'অনুসন্ধান ফলাফল: "' +
                              searchInput.value.trim() +
                              '"-এর জন্য ' +
                              visibleRows +
                              "টি স্টপেজ পাওয়া গেছে।"
                            : 'দুঃখিত, "' +
                              searchInput.value.trim() +
                              '"-এর সাথে মিল রেখে কোনো স্টপেজ পাওয়া যায়নি।';
                } else if (includeRouteCards) {
                    statusEl.textContent =
                        visibleCards > 0
                            ? 'অনুসন্ধান ফলাফল: ' + visibleCards + "টি রুট কার্ড মিলেছে।"
                            : "কোনো রুট বা স্টপেজ পাওয়া যায়নি।";
                }
            }
        }

        searchInput.addEventListener("input", applyFilter);
        if (clearBtn) {
            clearBtn.addEventListener("click", function () {
                searchInput.value = "";
                applyFilter();
                searchInput.focus();
            });
        }
    }

    attachRealtimeFilter("routesSearchInput", "routesSearchClear", "routesSearchStatus", true);
    attachRealtimeFilter("scheduleSearchInput", "scheduleSearchClear", "scheduleSearchStatus", false);
});
