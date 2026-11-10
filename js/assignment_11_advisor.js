"use strict";

const storageKey = "cop4813-bsit-advisor-v1";
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const category = document.querySelector("#category");
const view = document.querySelector("#view");
const extra = document.querySelector("#extra");
const firstTerm = document.querySelector("#first-term");
const activeTerm = document.querySelector("#active-term");
const courseList = document.querySelector("#course-list");
const termList = document.querySelector("#term-list");

function element(tag, content, className) {
    const node = document.createElement(tag);
    if (content) node.textContent = content;
    if (className) node.className = className;
    return node;
}

// Each outer entry must be satisfied. Any one course in an inner entry is enough.
function missingGroups(groups = [], credits) {
    return groups.filter(options => !options.some(code => credits.has(code)));
}

function describeGroups(groups) {
    return groups.map(options => options.length > 1 ? "(" + options.join(" or ") + ")" : options[0])
        .join(" and ");
}

function fulfilledOptions(group, codes) {
    return group.options.filter(option => option.every(code => codes.has(code)));
}

function creditLabel(credits) {
    return credits + (credits === 1 ? " credit" : " credits");
}

function startAdvisor(data) {
    const courses = new Map(data.courses.map(course => [course.code, course]));
    const groupsByCourse = new Map(data.groups.flatMap(group =>
        [...new Set(group.options.flat())].map(code => [code, group])));
    const saved = readState();
    const completed = new Set(saved.completed);
    const plan = new Map(saved.plan);
    let draggedCode = null;

    document.querySelector("#catalog-link").href = data.catalogUrl;
    data.terms.forEach(term => firstTerm.add(new Option(term, term)));
    firstTerm.value = saved.firstTerm;
    extra.checked = saved.extra;

    function readState() {
        const defaults = { completed: [], plan: [], firstTerm: data.terms[0], extra: false };
        let state;
        try {
            state = JSON.parse(localStorage.getItem(storageKey));
        } catch {
            return defaults;
        }
        if (!state) return defaults;

        const history = Array.isArray(state.completed) ? state.completed.filter(code => courses.has(code)) : [];
        const entries = Array.isArray(state.plan) ? state.plan.filter(entry => {
            if (!Array.isArray(entry)) return false;
            const [code, term] = entry;
            const course = courses.get(code);
            return course && !course.historyOnly && !history.includes(code) &&
                Number.isInteger(term) && term >= 0 && term < data.terms.length;
        }) : [];

        return {
            completed: history,
            plan: entries,
            firstTerm: data.terms.includes(state.firstTerm) ? state.firstTerm : defaults.firstTerm,
            extra: state.extra === true
        };
    }

    function saveState() {
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                completed: [...completed],
                plan: [...plan],
                firstTerm: firstTerm.value,
                extra: extra.checked
            }));
        } catch {
            document.querySelector("#save-note").textContent = "Browser storage is unavailable. This plan lasts until you leave the page.";
        }
    }

    function seasons() {
        const start = data.terms.indexOf(firstTerm.value);
        return [...data.terms.slice(start), ...data.terms.slice(0, start)];
    }

    function planningContext() {
        const prior = new Set(completed);
        return seasons().map((season, index) => {
            const entries = [...plan].filter(([, term]) => term === index).map(([code]) => courses.get(code));
            const beforeTerm = new Set(prior);
            const eligible = new Set(entries.filter(course =>
                course.terms.includes(season) && !missingGroups(course.prerequisites, beforeTerm).length
            ).map(course => course.code));

            // Remove unsupported corequisites until no other course is affected.
            // Start with the whole term so lecture/lab pairs can satisfy each other.
            let changed;
            do {
                changed = false;
                const withTerm = new Set([...beforeTerm, ...eligible]);
                for (const code of eligible) {
                    if (missingGroups(courses.get(code).corequisites, withTerm).length) {
                        eligible.delete(code);
                        changed = true;
                    }
                }
            } while (changed);

            const withTerm = new Set([...beforeTerm, ...eligible]);
            eligible.forEach(code => prior.add(code));
            return { season, entries, beforeTerm, withTerm };
        });
    }

    function choiceConflict(course) {
        const group = groupsByCourse.get(course.code);
        if (!group || extra.checked) return null;
        const paths = fulfilledOptions(group, new Set([...completed, ...plan.keys()]));
        if (!paths.length || paths.some(path => path.includes(course.code))) return null;
        return group.name + " already covered by " + paths[0].join(" + ") + ".";
    }

    function courseIssues(course, term) {
        const issues = [];
        if (!course.terms.includes(term.season)) issues.push("Catalog lists " + course.terms.join(", ") + ".");
        const prerequisites = missingGroups(course.prerequisites, term.beforeTerm);
        if (prerequisites.length) issues.push("Complete before this term: " + describeGroups(prerequisites) + ".");
        const corequisites = missingGroups(course.corequisites, term.withTerm);
        return {
            issues,
            corequisite: corequisites.length ? "Needed by this term: " + describeGroups(corequisites) + "." : ""
        };
    }

    function availability(course, term) {
        if (completed.has(course.code)) return { label: "Completed" };
        if (plan.has(course.code)) return { label: "Planned for " + seasons()[plan.get(course.code)] };
        if (course.historyOnly) return { label: "Prior credit only" };

        const conflict = choiceConflict(course);
        if (conflict) return { label: "Alternative already selected", reason: conflict };
        const { issues, corequisite } = courseIssues(course, term);
        if (issues.length) return { label: "Unavailable for " + term.season, reason: issues.join(" ") };
        if (corequisite) return { label: "Needs a corequisite", reason: corequisite, canAdd: true };
        return { label: "Ready for " + term.season, canAdd: true, ready: true };
    }

    function renderProgress() {
        const coreCredits = data.courses.filter(course =>
            course.category === "BSIT core" && completed.has(course.code)
        ).reduce((sum, course) => sum + course.credits, 0);
        const elective = data.groups.find(group => group.id === "elective");
        const [electivePath] = fulfilledOptions(elective, completed);
        const earned = coreCredits + (electivePath ? courses.get(electivePath[0]).credits : 0);
        document.querySelector("#progress-summary").textContent =
            completed.size + " courses recorded · " + earned + " of " + data.programCredits + " BSIT program credits completed";

        const projected = new Set([...completed, ...plan.keys()]);
        document.querySelector("#degree-choices").replaceChildren(...data.groups.map(group => {
            const done = fulfilledOptions(group, completed);
            const planned = fulfilledOptions(group, projected);
            const label = done.length ? "Completed" : planned.length ? "In plan" : "Open";
            const item = element("li");
            item.append(element("strong", group.name + " · " + label), " — ", group.note,
                " Options: ", group.options.map(path => path.join(" + ")).join(" or "), ".");
            return item;
        }));
    }

    function courseCard(course, state, openDetails, canDrag) {
        const card = element("article", "", "course");
        const code = course.code;
        card.draggable = canDrag;
        card.dataset.code = code;
        const meta = [course.category, course.credits ? creditLabel(course.credits) : "", course.terms?.join(", ")];
        card.append(element("h3", code + " · " + course.title),
            element("p", meta.filter(Boolean).join(" · "), "muted course-meta"),
            element("p", state.label, state.ready ? "badge ready" : "badge"));
        if (state.reason) card.append(element("p", state.reason));

        const actions = element("div", "", "actions");
        const label = element("label", "", "check");
        const checkbox = element("input");
        checkbox.type = "checkbox";
        checkbox.id = "done-" + code;
        checkbox.checked = completed.has(code);
        checkbox.setAttribute("aria-label", "Completed " + code);
        label.append(checkbox, "Completed");
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                completed.add(code);
                plan.delete(code);
            } else {
                completed.delete(code);
            }
            update(code + (checkbox.checked ? " marked completed." : " removed from completed courses."));
        });
        const add = element("button", "Add to plan");
        add.type = "button";
        add.id = "add-" + code;
        add.disabled = !state.canAdd;
        add.setAttribute("aria-label", "Add " + code + " to plan");
        add.addEventListener("click", () => addToPlan(code, Number(activeTerm.value)));
        actions.append(label, add);
        card.append(actions);

        const details = element("details");
        details.open = openDetails.has(code);
        details.append(element("summary", "Course details"));
        if (course.prerequisites) {
            details.append(element("p", "Prerequisites: " + describeGroups(course.prerequisites)));
        }
        if (course.corequisites) {
            details.append(element("p", "Corequisites: " + describeGroups(course.corequisites)));
        }
        const group = groupsByCourse.get(code);
        if (group) details.append(element("p", group.note));
        if (course.note) details.append(element("p", course.note));
        if (course.url) {
            const link = element("a", code + " in the catalog");
            link.href = course.url;
            details.append(link);
        }
        card.append(details);
        return card;
    }

    function renderCourses(terms = planningContext()) {
        const term = terms[Number(activeTerm.value)];
        const query = search.value.trim().toLowerCase().replace(/([a-z]{3})\s+(\d)/g, "$1$2");
        const openDetails = new Set([...courseList.querySelectorAll("details[open]")].map(details =>
            details.closest(".course").dataset.code));
        const cards = [];
        for (const course of courses.values()) {
            const state = availability(course, term);
            if (category.value && course.category !== category.value) continue;
            if (view.value === "ready" && !state.ready) continue;
            if (view.value === "completed" && !completed.has(course.code)) continue;
            if (!((course.code + " " + course.title).toLowerCase().includes(query))) continue;
            const canDrag = terms.some(target => availability(course, target).canAdd);
            cards.push(courseCard(course, state, openDetails, canDrag));
        }
        document.querySelector("#course-count").textContent =
            cards.length + (cards.length === 1 ? " course shown" : " courses shown");
        courseList.replaceChildren(...cards);
        if (!cards.length) courseList.append(element("p", "No courses match these filters."));
    }

    function renderPlan(terms) {
        termList.replaceChildren(...terms.map((term, index) => {
            const { season, entries } = term;
            const section = element("section", "", "term");
            section.dataset.term = index;
            const heading = element("div", "", "term-heading");
            const credits = entries.reduce((sum, course) => sum + course.credits, 0);
            heading.append(element("h3", "Term " + (index + 1) + " · " + season),
                element("span", creditLabel(credits), "muted"));
            section.append(heading);
            if (!entries.length) section.append(element("p", "Drop a course here or use Add to plan.", "muted"));
            const list = element("ul");
            for (const course of entries) {
                const item = element("li");
                item.append(element("strong", course.code + " · " + course.title));
                const { issues, corequisite } = courseIssues(course, term);
                const warning = [...issues, corequisite].filter(Boolean).join(" ");
                if (warning) item.append(element("p", warning, "warning"));
                const remove = element("button", "Remove");
                remove.type = "button";
                remove.id = "remove-" + course.code;
                remove.setAttribute("aria-label", "Remove " + course.code + " from plan");
                remove.addEventListener("click", () => {
                    plan.delete(course.code);
                    update(course.code + " removed from the plan.");
                });
                item.append(remove);
                list.append(item);
            }
            if (entries.length) section.append(list);
            return section;
        }));
    }

    function render() {
        const focusId = document.activeElement.id;
        const terms = planningContext();
        renderProgress();
        renderPlan(terms);
        renderCourses(terms);
        // Re-rendering replaces the generated controls.
        if (/^(done|add|remove)-/.test(focusId)) {
            const current = document.getElementById(focusId);
            const alternative = document.getElementById("done-" + focusId.split("-")[1]);
            (current && !current.disabled ? current : alternative || activeTerm).focus();
        }
    }

    function update(message) {
        saveState();
        render();
        status.textContent = message;
    }

    function addToPlan(code, index) {
        const course = courses.get(code);
        const term = planningContext()[index];
        const state = availability(course, term);
        if (!state.canAdd) {
            status.textContent = code + " · " + (state.reason || state.label);
            return;
        }
        plan.set(code, index);
        update(code + " added to " + term.season + "." + (state.reason ? " " + state.reason : ""));
    }

    function renderTermOptions() {
        const selected = activeTerm.value || "0";
        activeTerm.replaceChildren(...seasons().map((season, index) =>
            new Option("Term " + (index + 1) + " · " + season, index)));
        activeTerm.value = selected;
    }

    search.addEventListener("input", () => renderCourses());
    [category, view, activeTerm].forEach(control =>
        control.addEventListener("change", () => renderCourses()));
    extra.addEventListener("change", () => update(extra.checked ?
        "Additional courses can be planned." : "Degree choice limits apply to new additions."));
    firstTerm.addEventListener("change", () => {
        renderTermOptions();
        update("Term seasons updated. Review any warnings in your plan.");
    });

    courseList.addEventListener("dragstart", event => {
        const card = event.target.closest(".course[draggable=true]");
        if (!card) return;
        draggedCode = card.dataset.code;
        event.dataTransfer.setData("text/plain", draggedCode);
        event.dataTransfer.effectAllowed = "copy";
    });

    function clearDrag() {
        draggedCode = null;
        termList.querySelectorAll(".is-over").forEach(term => term.classList.remove("is-over"));
    }

    courseList.addEventListener("dragend", clearDrag);
    termList.addEventListener("dragover", event => {
        const target = event.target.closest(".term");
        if (!draggedCode || !target) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        target.classList.add("is-over");
    });
    termList.addEventListener("dragleave", event => {
        const target = event.target.closest(".term");
        if (target && !target.contains(event.relatedTarget)) target.classList.remove("is-over");
    });
    termList.addEventListener("drop", event => {
        const target = event.target.closest(".term");
        if (!draggedCode || !target) return;
        event.preventDefault();
        const code = draggedCode;
        clearDrag();
        addToPlan(code, Number(target.dataset.term));
    });

    renderTermOptions();
    render();
    document.querySelector("#advisor").hidden = false;
    status.textContent = "Choose a term and mark your completed courses to see what you can take.";
}

async function loadAdvisor() {
    try {
        const response = await fetch("data/assignment_11_bsit.json");
        if (!response.ok) throw new Error("Course data request failed");
        startAdvisor(await response.json());
    } catch (error) {
        console.error(error);
        status.textContent = "Course data could not be loaded. Reload the page from the website to try again.";
    }
}

loadAdvisor();
