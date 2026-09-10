const SUPABASE_URL =
    "https://emnidqqwgagdjxxwuhbq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable__496rOz02MQ6FDtz2zoH1Q_y3Yz0e0j";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let leads = [];
let activities = [];


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await checkSession();
    }
);


/* =========================================
   SESJA
========================================= */

async function checkSession() {

    const { data, error } =
        await db.auth.getSession();

    if (error) {

        console.error(
            "Błąd sesji:",
            error
        );

        showLoggedOutState();

        return;
    }

    if (data.session) {

        showLoggedInState(
            data.session.user
        );

        await loadLeads();

    } else {

        showLoggedOutState();

    }
}


/* =========================================
   LOGOWANIE
========================================= */

async function login() {

    const email =
        document
            .getElementById("adminEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("adminPassword")
            .value;

    const message =
        document.getElementById(
            "loginMessage"
        );

    const button =
        document.getElementById(
            "loginButton"
        );


    if (!email || !password) {

        message.style.color =
            "#ff8585";

        message.innerText =
            "Wpisz e-mail i hasło.";

        return;
    }


    button.disabled = true;

    button.innerText =
        "Logowanie...";


    const { data, error } =
        await db.auth.signInWithPassword({
            email,
            password
        });


    button.disabled = false;

    button.innerText =
        "Zaloguj się";


    if (error) {

        console.error(
            "Błąd logowania:",
            error
        );

        message.style.color =
            "#ff8585";

        message.innerText =
            "Nieprawidłowy e-mail lub hasło.";

        return;
    }


    message.innerText = "";

    showLoggedInState(
        data.user
    );

    await loadLeads();


    const dashboard =
        document.getElementById(
            "dashboard"
        );

    if (dashboard) {

        dashboard.scrollIntoView({
            behavior: "smooth"
        });

    }
}


/* =========================================
   WYLOGOWANIE
========================================= */

async function logout() {

    await db.auth.signOut();

    leads = [];
    activities = [];

    showLoggedOutState();
}


/* =========================================
   WIDOK ADMINA
========================================= */

function showLoggedInState(user) {

    document
        .getElementById("adminPanel")
        .classList.remove("hidden");

    document
        .getElementById("loginSection")
        .classList.add("hidden");

    document
        .getElementById("loginNavButton")
        .classList.add("hidden");

    document
        .getElementById("logoutNavButton")
        .classList.remove("hidden");

    document
        .getElementById("loggedUser")
        .innerText =
            user?.email || "Admin";
}


function showLoggedOutState() {

    document
        .getElementById("adminPanel")
        .classList.add("hidden");

    document
        .getElementById("loginSection")
        .classList.remove("hidden");

    document
        .getElementById("loginNavButton")
        .classList.remove("hidden");

    document
        .getElementById("logoutNavButton")
        .classList.add("hidden");
}


function showLogin() {

    document
        .getElementById("loginSection")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================================
   POBIERANIE DANYCH
========================================= */

async function loadLeads() {

    const container =
        document.getElementById(
            "leads"
        );

    const connectionText =
        document.getElementById(
            "connectionText"
        );

    const connectionDot =
        document.getElementById(
            "connectionDot"
        );


    if (connectionText) {

        connectionText.innerText =
            "Pobieranie danych...";

    }


    const {
        data: leadsData,
        error: leadsError
    } =
        await db
            .from("leads")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (leadsError) {

        console.error(
            "Błąd pobierania klientów:",
            leadsError
        );

        if (connectionDot) {

            connectionDot.className =
                "connection-dot error";

        }

        if (connectionText) {

            connectionText.innerText =
                "Błąd połączenia z bazą";

        }

        if (container) {

            container.innerHTML = `
                <div class="empty">
                    Nie udało się pobrać klientów.
                </div>
            `;

        }

        return;
    }


    leads =
        leadsData || [];


    const {
        data: activitiesData,
        error: activitiesError
    } =
        await db
            .from("lead_activities")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (activitiesError) {

        console.error(
            "Błąd pobierania historii:",
            activitiesError
        );

        activities = [];

    } else {

        activities =
            activitiesData || [];

    }


    if (connectionDot) {

        connectionDot.className =
            "connection-dot ok";

    }

    if (connectionText) {

        connectionText.innerText =
            "Połączono z bazą";

    }


    updateStats();
    updateMonthlyStats();
    updateSourceStats();
    updateSalesDashboard();
    renderTodayReminders();
    renderLeads();
}


/* =========================================
   DODAWANIE LEADA
========================================= */

async function sendLead() {

    const name =
        document
            .getElementById("name")
            .value
            .trim();

    const contact =
        document
            .getElementById("contact")
            .value
            .trim();

    const problem =
        document
            .getElementById("problem")
            .value;

    const budget =
        Number(
            document
                .getElementById("budget")
                .value || 0
        );

    const source =
        document
            .getElementById("source")
            .value || "inne";

    const description =
        document
            .getElementById("description")
            .value
            .trim();

    const message =
        document.getElementById(
            "message"
        );

    const button =
        document.getElementById(
            "sendButton"
        );


    if (!name || !contact || !problem) {

        message.style.color =
            "#ff8585";

        message.innerText =
            "Uzupełnij nazwę, kontakt i problem.";

        return;
    }


    button.disabled = true;

    button.innerText =
        "Zapisywanie...";


    const { error } =
        await db
            .from("leads")
            .insert([
                {
                    name,
                    contact,
                    problem,
                    budget,
                    source,
                    description,
                    status: "nowy"
                }
            ]);


    button.disabled = false;

    button.innerText =
        "Zapisz zgłoszenie";


    if (error) {

        console.error(
            "Błąd zapisu:",
            error
        );

        message.style.color =
            "#ff8585";

        message.innerText =
            "Nie udało się wysłać zgłoszenia.";

        return;
    }


    message.style.color =
        "#57e389";

    message.innerText =
        "Zgłoszenie zostało zapisane.";


    document.getElementById(
        "name"
    ).value = "";

    document.getElementById(
        "contact"
    ).value = "";

    document.getElementById(
        "problem"
    ).value = "";

    document.getElementById(
        "budget"
    ).value = "500";

    document.getElementById(
        "source"
    ).value = "strona";

    document.getElementById(
        "description"
    ).value = "";


    const { data } =
        await db.auth.getSession();


    if (data.session) {

        await loadLeads();

    }
}


/* =========================================
   STATYSTYKI MIESIĘCZNE
========================================= */

function updateMonthlyStats() {

    const now =
        new Date();


    const startOfMonth =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0
        );


    const endOfMonth =
        new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );


    const monthContacts =
        activities.filter(
            activity => {

                if (
                    activity.activity_type !==
                    "kontakt"
                ) {
                    return false;
                }

                if (!activity.created_at) {
                    return false;
                }


                const date =
                    new Date(
                        activity.created_at
                    );


                return (
                    date >= startOfMonth &&
                    date <= endOfMonth
                );

            }
        ).length;


    const wonActivitiesThisMonth =
        activities.filter(
            activity => {

                if (
                    activity.activity_type !==
                    "status"
                ) {
                    return false;
                }

                if (!activity.created_at) {
                    return false;
                }


                const date =
                    new Date(
                        activity.created_at
                    );


                if (
                    date < startOfMonth ||
                    date > endOfMonth
                ) {
                    return false;
                }


                const note =
                    String(
                        activity.note || ""
                    );


                return note.includes(
                    "→ Wygrany"
                );

            }
        );


    const wonLeadIds =
        [
            ...new Set(
                wonActivitiesThisMonth.map(
                    activity =>
                        Number(
                            activity.lead_id
                        )
                )
            )
        ];


    const monthWonLeads =
        leads.filter(
            lead =>
                wonLeadIds.includes(
                    Number(
                        lead.id
                    )
                )
        );


    const monthWonCount =
        monthWonLeads.length;


    const monthWonValue =
        monthWonLeads.reduce(
            (sum, lead) =>
                sum +
                Number(
                    lead.budget || 0
                ),
            0
        );


    const monthAverageWon =
        monthWonCount > 0
            ? monthWonValue /
              monthWonCount
            : 0;


    setText(
        "monthContacts",
        monthContacts
    );

    setText(
        "monthWonCount",
        monthWonCount
    );

    setText(
        "monthWonValue",
        formatPLN(
            monthWonValue
        )
    );

    setText(
        "monthAverageWon",
        formatPLN(
            monthAverageWon
        )
    );
}


/* =========================================
   ŹRÓDŁA KLIENTÓW
========================================= */

function updateSourceStats() {

    const container =
        document.getElementById(
            "sourceStats"
        );


    if (!container) {
        return;
    }


    if (!leads.length) {

        container.innerHTML = `
            <div class="empty">
                Brak danych o źródłach.
            </div>
        `;

        return;
    }


    const stats = {};


    leads.forEach(
        lead => {

            const source =
                lead.source ||
                "inne";


            if (!stats[source]) {

                stats[source] = {
                    source,
                    leads: 0,
                    won: 0,
                    wonValue: 0
                };

            }


            stats[source].leads += 1;


            if (
                lead.status ===
                "wygrany"
            ) {

                stats[source].won += 1;

                stats[source].wonValue +=
                    Number(
                        lead.budget || 0
                    );

            }

        }
    );


    const rows =
        Object.values(stats)
            .map(
                item => {

                    const conversion =
                        item.leads > 0
                            ? (
                                item.won /
                                item.leads
                              ) * 100
                            : 0;


                    return {
                        ...item,
                        conversion
                    };

                }
            )
            .sort(
                (a, b) => {

                    if (
                        b.wonValue !==
                        a.wonValue
                    ) {

                        return (
                            b.wonValue -
                            a.wonValue
                        );

                    }


                    return (
                        b.leads -
                        a.leads
                    );

                }
            );


    container.innerHTML = `
        <div class="sales-stats-grid">

            ${rows
                .map(
                    item => `
                        <div class="sales-stat-card">

                            <div class="sales-stat-label">
                                ${escapeHTML(
                                    sourceLabel(
                                        item.source
                                    )
                                )}
                            </div>


                            <div class="sales-stat-value">
                                ${formatPLN(
                                    item.wonValue
                                )}
                            </div>


                            <div class="sales-stat-description">
                                Sprzedaż
                            </div>


                            <div
                                style="
                                    margin-top: 18px;
                                    display: grid;
                                    grid-template-columns: repeat(3, 1fr);
                                    gap: 10px;
                                "
                            >

                                <div>
                                    <div
                                        style="
                                            color: #89929e;
                                            font-size: 11px;
                                            font-weight: 700;
                                            text-transform: uppercase;
                                            margin-bottom: 4px;
                                        "
                                    >
                                        Leady
                                    </div>

                                    <strong>
                                        ${item.leads}
                                    </strong>
                                </div>


                                <div>
                                    <div
                                        style="
                                            color: #89929e;
                                            font-size: 11px;
                                            font-weight: 700;
                                            text-transform: uppercase;
                                            margin-bottom: 4px;
                                        "
                                    >
                                        Wygrane
                                    </div>

                                    <strong>
                                        ${item.won}
                                    </strong>
                                </div>


                                <div>
                                    <div
                                        style="
                                            color: #89929e;
                                            font-size: 11px;
                                            font-weight: 700;
                                            text-transform: uppercase;
                                            margin-bottom: 4px;
                                        "
                                    >
                                        Konwersja
                                    </div>

                                    <strong>
                                        ${item.conversion
                                            .toFixed(1)
                                            .replace(".", ",")}%
                                    </strong>
                                </div>

                            </div>

                        </div>
                    `
                )
                .join("")}

        </div>
    `;
}


/* =========================================
   AKTYWNOŚĆ SPRZEDAŻOWA
========================================= */

function updateSalesDashboard() {

    const now =
        new Date();


    const startOfToday =
        new Date(now);

    startOfToday.setHours(
        0,
        0,
        0,
        0
    );


    const endOfToday =
        new Date(now);

    endOfToday.setHours(
        23,
        59,
        59,
        999
    );


    const todayContacts =
        activities.filter(
            activity => {

                if (
                    activity.activity_type !==
                    "kontakt"
                ) {
                    return false;
                }

                if (!activity.created_at) {
                    return false;
                }


                const date =
                    new Date(
                        activity.created_at
                    );


                return (
                    date >= startOfToday &&
                    date <= endOfToday
                );

            }
        ).length;


    const startOfWeek =
        new Date(now);


    const day =
        startOfWeek.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    startOfWeek.setDate(
        startOfWeek.getDate() +
        difference
    );


    startOfWeek.setHours(
        0,
        0,
        0,
        0
    );


    const weekContacts =
        activities.filter(
            activity => {

                if (
                    activity.activity_type !==
                    "kontakt"
                ) {
                    return false;
                }

                if (!activity.created_at) {
                    return false;
                }


                const date =
                    new Date(
                        activity.created_at
                    );


                return (
                    date >= startOfWeek &&
                    date <= now
                );

            }
        ).length;


    const offerStats =
        leads.filter(
            lead =>
                lead.status ===
                "oferta"
        ).length;


    const wonLeads =
        leads.filter(
            lead =>
                lead.status ===
                "wygrany"
        ).length;


    let conversionRate = 0;


    if (leads.length > 0) {

        conversionRate =
            (
                wonLeads /
                leads.length
            ) * 100;

    }


    const formattedConversion =
        conversionRate
            .toFixed(1)
            .replace(
                ".",
                ","
            );


    setText(
        "todayContacts",
        todayContacts
    );

    setText(
        "weekContacts",
        weekContacts
    );

    setText(
        "offerStats",
        offerStats
    );

    setText(
        "conversionRate",
        `${formattedConversion}%`
    );
}


/* =========================================
   PRZYPOMNIENIA
========================================= */

function renderTodayReminders() {

    const list =
        document.getElementById(
            "todayRemindersList"
        );

    const count =
        document.getElementById(
            "todayRemindersCount"
        );


    if (!list || !count) {
        return;
    }


    const now =
        new Date();


    const endOfToday =
        new Date();

    endOfToday.setHours(
        23,
        59,
        59,
        999
    );


    const reminderLeads =
        leads
            .filter(
                lead => {

                    if (
                        !lead.follow_up_at
                    ) {
                        return false;
                    }

                    if (
                        lead.status ===
                            "wygrany" ||
                        lead.status ===
                            "przegrany"
                    ) {
                        return false;
                    }


                    const followDate =
                        new Date(
                            lead.follow_up_at
                        );


                    return (
                        followDate <=
                        endOfToday
                    );

                }
            )
            .sort(
                (a, b) =>
                    new Date(
                        a.follow_up_at
                    ) -
                    new Date(
                        b.follow_up_at
                    )
            );


    count.innerText =
        reminderLeads.length;


    if (!reminderLeads.length) {

        list.innerHTML = `
            <div class="empty">
                Brak przypomnień na dziś.
            </div>
        `;

        return;
    }


    list.innerHTML =
        reminderLeads
            .map(
                lead => {

                    const id =
                        Number(
                            lead.id
                        );

                    const followDate =
                        new Date(
                            lead.follow_up_at
                        );

                    const overdue =
                        followDate < now;


                    return `
                        <div class="reminder-item">

                            <div class="reminder-main">

                                <strong>
                                    ${escapeHTML(
                                        lead.name
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        lead.contact
                                    )}
                                </span>

                            </div>


                            <div class="reminder-date">

                                ${
                                    overdue
                                        ? "ZALEGŁY"
                                        : "DZISIAJ"
                                }

                                ·

                                ${followDate.toLocaleString(
                                    "pl-PL",
                                    {
                                        day:
                                            "2-digit",
                                        month:
                                            "2-digit",
                                        year:
                                            "numeric",
                                        hour:
                                            "2-digit",
                                        minute:
                                            "2-digit"
                                    }
                                )}

                            </div>


                            ${
                                lead.note
                                    ? `
                                        <div class="reminder-note">
                                            ${escapeHTML(
                                                lead.note
                                            )}
                                        </div>
                                    `
                                    : ""
                            }


                            <button
                                class="open-lead-button"
                                type="button"
                                onclick="openLead(${id})"
                            >
                                Otwórz klienta
                            </button>


                            <button
                                class="done-contact-button"
                                type="button"
                                onclick="markContactDone(${id})"
                            >
                                Kontakt wykonany
                            </button>

                        </div>
                    `;

                }
            )
            .join("");
}


/* =========================================
   KONTAKT WYKONANY
========================================= */

async function markContactDone(id) {

    const lead =
        leads.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!lead) {
        return;
    }


    const confirmed =
        confirm(
            `Oznaczyć kontakt z klientem "${lead.name}" jako wykonany?`
        );


    if (!confirmed) {
        return;
    }


    const nowISO =
        new Date()
            .toISOString();


    const activityNote =
        lead.note
            ? lead.note
            : "Kontakt wykonany";


    const {
        error: activityError
    } =
        await db
            .from(
                "lead_activities"
            )
            .insert([
                {
                    lead_id:
                        id,

                    activity_type:
                        "kontakt",

                    note:
                        activityNote,

                    created_at:
                        nowISO
                }
            ]);


    if (activityError) {

        console.error(
            "Błąd historii kontaktu:",
            activityError
        );

        alert(
            "Nie udało się zapisać historii kontaktu."
        );

        return;
    }


    const {
        error: leadError
    } =
        await db
            .from(
                "leads"
            )
            .update({
                last_contact_at:
                    nowISO,

                follow_up_at:
                    null
            })
            .eq(
                "id",
                id
            );


    if (leadError) {

        console.error(
            "Błąd zapisu kontaktu:",
            leadError
        );

        alert(
            "Historia została zapisana, ale nie udało się zaktualizować klienta."
        );

        await loadLeads();

        return;
    }


    await loadLeads();
}


/* =========================================
   OTWÓRZ KLIENTA
========================================= */

function openLead(id) {

    const search =
        document.getElementById(
            "search"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (search) {
        search.value = "";
    }

    if (statusFilter) {
        statusFilter.value =
            "all";
    }


    renderLeads();


    setTimeout(
        () => {

            const card =
                document.getElementById(
                    `lead-card-${id}`
                );

            if (!card) {
                return;
            }


            card.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });


            card.classList.add(
                "lead-highlight"
            );


            setTimeout(
                () => {

                    card.classList.remove(
                        "lead-highlight"
                    );

                },
                2500
            );

        },
        100
    );
}


/* =========================================
   HISTORIA
========================================= */

function getLeadActivities(leadId) {

    return activities.filter(
        activity =>
            Number(
                activity.lead_id
            ) ===
            Number(
                leadId
            )
    );
}


function renderLeadHistory(leadId) {

    const leadActivities =
        getLeadActivities(
            leadId
        );


    if (!leadActivities.length) {

        return `
            <div class="lead-history-empty">
                Brak zapisanej historii kontaktów.
            </div>
        `;

    }


    return leadActivities
        .map(
            activity => {

                const date =
                    activity.created_at
                        ? new Date(
                            activity.created_at
                        ).toLocaleString(
                            "pl-PL"
                        )
                        : "—";


                return `
                    <div class="history-item">

                        <div
                            class="history-marker"
                        ></div>

                        <div
                            class="history-content"
                        >

                            <div
                                class="history-top"
                            >

                                <strong>
                                    ${escapeHTML(
                                        activityTypeLabel(
                                            activity.activity_type
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        date
                                    )}
                                </span>

                            </div>


                            ${
                                activity.note
                                    ? `
                                        <div class="history-note">
                                            ${escapeHTML(
                                                activity.note
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    </div>
                `;

            }
        )
        .join("");
}


/* =========================================
   WYŚWIETLANIE LEADÓW
========================================= */

function renderLeads() {

    const container =
        document.getElementById(
            "leads"
        );


    if (!container) {
        return;
    }


    const searchElement =
        document.getElementById(
            "search"
        );

    const statusElement =
        document.getElementById(
            "statusFilter"
        );


    const search =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";


    const statusFilter =
        statusElement
            ? statusElement.value
            : "all";


    const filtered =
        leads.filter(
            lead => {

                const searchableText =
                    `
                    ${lead.name || ""}
                    ${lead.contact || ""}
                    ${lead.problem || ""}
                    ${lead.description || ""}
                    ${lead.note || ""}
                    ${lead.source || ""}
                    `
                        .toLowerCase();


                const matchesSearch =
                    searchableText.includes(
                        search
                    );


                const matchesStatus =
                    statusFilter ===
                        "all" ||
                    lead.status ===
                        statusFilter;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty">
                Brak klientów pasujących do filtra.
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered
            .map(
                lead => {

                    const id =
                        Number(
                            lead.id
                        );

                    const status =
                        lead.status ||
                        "nowy";

                    const source =
                        lead.source ||
                        "inne";

                    const followUpValue =
                        toDateTimeLocal(
                            lead.follow_up_at
                        );

                    const lastContactText =
                        lead.last_contact_at
                            ? new Date(
                                lead.last_contact_at
                            ).toLocaleString(
                                "pl-PL"
                            )
                            : "Brak";


                    return `
                        <article
                            class="lead"
                            id="lead-card-${id}"
                        >

                            <div class="lead-header">

                                <div>

                                    <div class="lead-name">
                                        ${escapeHTML(
                                            lead.name
                                        )}
                                    </div>

                                    <div class="lead-contact">
                                        ${escapeHTML(
                                            lead.contact
                                        )}
                                    </div>

                                </div>


                                <div class="lead-value">
                                    ${formatPLN(
                                        lead.budget
                                    )}
                                </div>

                            </div>


                            <div
                                class="status-badge status-${escapeHTML(status)}"
                            >
                                ${statusLabel(
                                    status
                                )}
                            </div>


                            <div class="lead-source">

                                Źródło:

                                <strong>
                                    ${escapeHTML(
                                        sourceLabel(
                                            source
                                        )
                                    )}
                                </strong>

                            </div>


                            <div class="lead-problem">
                                ${escapeHTML(
                                    lead.problem
                                )}
                            </div>


                            ${
                                lead.description
                                    ? `
                                        <div class="lead-description">
                                            ${escapeHTML(
                                                lead.description
                                            )}
                                        </div>
                                    `
                                    : ""
                            }


                            <div class="last-contact-info">

                                Ostatni kontakt:

                                <strong>
                                    ${escapeHTML(
                                        lastContactText
                                    )}
                                </strong>

                            </div>


                            <div class="lead-crm-details">

                                <div class="crm-field">

                                    <label
                                        for="note-${id}"
                                    >
                                        Notatka do klienta
                                    </label>

                                    <textarea
                                        id="note-${id}"
                                        class="lead-note"
                                        placeholder="Np. klient zainteresowany, zadzwonić po weekendzie..."
                                    >${escapeHTML(
                                        lead.note || ""
                                    )}</textarea>

                                </div>


                                <div class="crm-field">

                                    <label
                                        for="followup-${id}"
                                    >
                                        Następny kontakt
                                    </label>

                                    <input
                                        id="followup-${id}"
                                        class="follow-up-input"
                                        type="datetime-local"
                                        value="${followUpValue}"
                                    >

                                </div>


                                <button
                                    class="save-lead-button"
                                    type="button"
                                    onclick="saveLeadDetails(${id})"
                                >
                                    Zapisz notatkę i termin
                                </button>

                            </div>


                            <div class="lead-history">

                                <div
                                    class="lead-history-header"
                                >

                                    <span>
                                        HISTORIA
                                    </span>

                                    <strong>
                                        Aktywność klienta
                                    </strong>

                                </div>


                                <div
                                    class="lead-history-list"
                                >

                                    ${renderLeadHistory(
                                        id
                                    )}

                                </div>

                            </div>


                            <div class="lead-actions">

                                <div class="left-actions">

                                    <select
                                        class="status-select"
                                        onchange="changeStatus(${id}, this.value)"
                                    >

                                        <option
                                            value="nowy"
                                            ${status === "nowy" ? "selected" : ""}
                                        >
                                            Nowy
                                        </option>

                                        <option
                                            value="kontakt"
                                            ${status === "kontakt" ? "selected" : ""}
                                        >
                                            Kontakt
                                        </option>

                                        <option
                                            value="oferta"
                                            ${status === "oferta" ? "selected" : ""}
                                        >
                                            Oferta
                                        </option>

                                        <option
                                            value="wygrany"
                                            ${status === "wygrany" ? "selected" : ""}
                                        >
                                            Wygrany
                                        </option>

                                        <option
                                            value="przegrany"
                                            ${status === "przegrany" ? "selected" : ""}
                                        >
                                            Przegrany
                                        </option>

                                    </select>


                                    <button
                                        class="delete-btn"
                                        type="button"
                                        onclick="deleteLead(${id})"
                                    >
                                        Usuń
                                    </button>

                                </div>


                                <div class="lead-date">

                                    Dodano:

                                    ${
                                        lead.created_at
                                            ? new Date(
                                                lead.created_at
                                            ).toLocaleString(
                                                "pl-PL"
                                            )
                                            : "—"
                                    }

                                </div>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");
}


/* =========================================
   ZAPIS NOTATKI + FOLLOW-UP
========================================= */

async function saveLeadDetails(id) {

    const noteElement =
        document.getElementById(
            `note-${id}`
        );

    const followUpElement =
        document.getElementById(
            `followup-${id}`
        );


    if (
        !noteElement ||
        !followUpElement
    ) {

        alert(
            "Nie znaleziono pól klienta."
        );

        return;
    }


    const note =
        noteElement
            .value
            .trim();

    const followUp =
        followUpElement
            .value;


    let followUpISO =
        null;


    if (followUp !== "") {

        const localDate =
            new Date(
                followUp
            );


        if (
            Number.isNaN(
                localDate.getTime()
            )
        ) {

            alert(
                "Wybierz prawidłową datę i godzinę."
            );

            return;
        }


        followUpISO =
            localDate
                .toISOString();
    }


    const saveButton =
        followUpElement
            .closest(
                ".lead-crm-details"
            )
            ?.querySelector(
                ".save-lead-button"
            );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.innerText =
            "Zapisywanie...";

    }


    const {
        data,
        error
    } =
        await db
            .from("leads")
            .update({
                note,
                follow_up_at:
                    followUpISO
            })
            .eq(
                "id",
                id
            )
            .select();


    if (error) {

        console.error(
            "Błąd zapisu:",
            error
        );

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerText =
                "Zapisz notatkę i termin";

        }

        alert(
            "Nie udało się zapisać."
        );

        return;
    }


    if (
        !data ||
        !data.length
    ) {

        alert(
            "Baza nie zwróciła zapisanego rekordu."
        );

        return;
    }


    const updatedLead =
        data[0];


    const index =
        leads.findIndex(
            lead =>
                Number(
                    lead.id
                ) ===
                Number(id)
        );


    if (index !== -1) {

        leads[index] =
            updatedLead;

    }


    renderTodayReminders();


    if (saveButton) {

        saveButton.disabled =
            false;

        saveButton.innerText =
            "Zapisano ✓";


        setTimeout(
            () => {

                saveButton.innerText =
                    "Zapisz notatkę i termin";

            },
            1500
        );

    }
}


/* =========================================
   ZMIANA STATUSU
========================================= */

async function changeStatus(
    id,
    newStatus
) {

    const lead =
        leads.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(id)
        );


    if (!lead) {
        return;
    }


    const oldStatus =
        lead.status ||
        "nowy";


    if (
        oldStatus ===
        newStatus
    ) {
        return;
    }


    const {
        error: statusError
    } =
        await db
            .from("leads")
            .update({
                status:
                    newStatus
            })
            .eq(
                "id",
                id
            );


    if (statusError) {

        console.error(
            "Błąd zmiany statusu:",
            statusError
        );

        alert(
            "Nie udało się zmienić statusu."
        );

        await loadLeads();

        return;
    }


    const historyText =
        `Status zmieniony: ${statusLabel(oldStatus)} → ${statusLabel(newStatus)}`;


    const {
        error: historyError
    } =
        await db
            .from(
                "lead_activities"
            )
            .insert([
                {
                    lead_id:
                        id,

                    activity_type:
                        "status",

                    note:
                        historyText
                }
            ]);


    if (historyError) {

        console.error(
            "Nie udało się zapisać historii statusu:",
            historyError
        );

    }


    await loadLeads();
}


/* =========================================
   USUWANIE
========================================= */

async function deleteLead(id) {

    const lead =
        leads.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(id)
        );


    const name =
        lead?.name ||
        "to zgłoszenie";


    const confirmed =
        confirm(
            `Usunąć klienta: ${name}?`
        );


    if (!confirmed) {
        return;
    }


    const { error } =
        await db
            .from("leads")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Błąd usuwania:",
            error
        );

        alert(
            "Nie udało się usunąć klienta."
        );

        return;
    }


    await loadLeads();
}


/* =========================================
   GŁÓWNE STATYSTYKI
========================================= */

function updateStats() {

    const total =
        leads.length;


    const totalValue =
        leads.reduce(
            (sum, lead) =>
                sum +
                Number(
                    lead.budget || 0
                ),
            0
        );


    const newCount =
        countStatus(
            "nowy"
        );

    const contactCount =
        countStatus(
            "kontakt"
        );

    const offerCount =
        countStatus(
            "oferta"
        );

    const wonCount =
        countStatus(
            "wygrany"
        );

    const lostCount =
        countStatus(
            "przegrany"
        );


    const wonValue =
        leads
            .filter(
                lead =>
                    lead.status ===
                    "wygrany"
            )
            .reduce(
                (sum, lead) =>
                    sum +
                    Number(
                        lead.budget || 0
                    ),
                0
            );


    setText(
        "leadCount",
        total
    );

    setText(
        "leadValue",
        formatPLN(
            totalValue
        )
    );

    setText(
        "newCount",
        newCount
    );

    setText(
        "offerCount",
        offerCount
    );

    setText(
        "wonCount",
        wonCount
    );

    setText(
        "wonValue",
        formatPLN(
            wonValue
        )
    );


    setText(
        "pipelineNew",
        newCount
    );

    setText(
        "pipelineContact",
        contactCount
    );

    setText(
        "pipelineOffer",
        offerCount
    );

    setText(
        "pipelineWon",
        wonCount
    );

    setText(
        "pipelineLost",
        lostCount
    );
}


function countStatus(status) {

    return leads.filter(
        lead =>
            lead.status ===
            status
    ).length;
}


/* =========================================
   ETYKIETY
========================================= */

function sourceLabel(source) {

    const labels = {

        strona:
            "Strona WWW",

        tiktok:
            "TikTok",

        instagram:
            "Instagram",

        facebook:
            "Facebook",

        google:
            "Google",

        polecenie:
            "Polecenie",

        inne:
            "Inne"

    };


    return (
        labels[source] ||
        source ||
        "Inne"
    );
}


function activityTypeLabel(type) {

    const labels = {

        kontakt:
            "Kontakt wykonany",

        telefon:
            "Telefon",

        email:
            "E-mail",

        oferta:
            "Oferta",

        notatka:
            "Notatka",

        status:
            "Zmiana statusu"

    };


    return (
        labels[type] ||
        type
    );
}


function statusLabel(status) {

    const labels = {

        nowy:
            "Nowy",

        kontakt:
            "Kontakt",

        oferta:
            "Oferta",

        wygrany:
            "Wygrany",

        przegrany:
            "Przegrany"

    };


    return (
        labels[status] ||
        status
    );
}


/* =========================================
   POMOCNICZE
========================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.innerText =
            value;

    }
}


function formatPLN(value) {

    return new Intl.NumberFormat(
        "pl-PL",
        {
            style:
                "currency",

            currency:
                "PLN",

            maximumFractionDigits:
                0
        }
    ).format(
        Number(
            value || 0
        )
    );
}


function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const hours =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );
}


function escapeHTML(value) {

    return String(
        value || ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}