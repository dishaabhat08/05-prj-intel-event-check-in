// these names match the team values in the form
const teamNames = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

const attendanceGoal = 50;
const storageKey = "intel-sustainability-check-in-v1";
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");

let attendees = [];
let goalWinners = null;

function showStorageNotice() {
  const notice = document.getElementById("storageNotice");
  notice.textContent =
    "Browser storage is unavailable. Check-ins still work, but progress may not be saved.";
  notice.hidden = false;
}

// load saved attendees and ignore entries that do not match the form
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));

  if (saved && Array.isArray(saved.attendees)) {
    attendees = saved.attendees.filter(
      (attendee) =>
        attendee &&
        typeof attendee.name === "string" &&
        attendee.name.trim() &&
        Object.hasOwn(teamNames, attendee.team),
    );
  }
} catch (error) {
  showStorageNotice();
}

// count how many attendees belong to each team
function countTeams(entries) {
  const counts = { water: 0, zero: 0, power: 0 };

  entries.forEach((attendee) => {
    counts[attendee.team]++;
  });

  return counts;
}

// use the first 50 check-ins so the winning result stays the same afterward
function findGoalWinners() {
  const counts = countTeams(attendees.slice(0, attendanceGoal));
  const highest = Math.max(...Object.values(counts));

  return Object.keys(counts).filter((team) => counts[team] === highest);
}

function updateDisplay() {
  const counts = countTeams(attendees);

  document.getElementById("attendeeCount").textContent = attendees.length;

  Object.keys(counts).forEach((team) => {
    document.getElementById(team + "Count").textContent = counts[team];
  });

  // cap the bar at 100% even if more people check in
  const progress = Math.min(attendees.length, attendanceGoal);

  document.getElementById("progressBar").style.width =
    (progress / attendanceGoal) * 100 + "%";

  const progressContainer = document.querySelector(".progress-container");

  progressContainer.setAttribute("aria-valuenow", progress);
  progressContainer.setAttribute(
    "aria-valuetext",
    attendees.length + " of " + attendanceGoal + " attendees",
  );

  // textContent keeps attendee names from being treated as html
  const list = document.getElementById("attendeeList");
  list.replaceChildren();

  attendees.forEach((attendee) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const team = document.createElement("span");

    name.textContent = attendee.name;
    team.textContent = teamNames[attendee.team];

    item.append(name, team);
    list.append(item);
  });

  document.getElementById("emptyList").hidden = attendees.length > 0;

  // celebrate reaching the goal and show the winner or tied teams
  if (attendees.length >= attendanceGoal) {
    goalWinners = findGoalWinners();

    const celebration = document.getElementById("celebration");
    const names = goalWinners.map((team) => teamNames[team]).join(" and ");

    celebration.textContent =
      "🎉 We reached our goal of 50 attendees! " +
      (goalWinners.length === 1
        ? names + " wins!"
        : "It's a tie! " + names + " share the win!");

    celebration.hidden = false;
  }
}

// save totals along with names so the whole page can be restored
function saveProgress() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        attendees: attendees,
        totalCount: attendees.length,
        teamCounts: countTeams(attendees),
        goalWinners: goalWinners,
      }),
    );
  } catch (error) {
    showStorageNotice();
  }
}

// clear the validation message when the user edits their name
nameInput.addEventListener("input", () => {
  nameInput.setCustomValidity("");
});

// add the attendee when the form is submitted
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const team = teamSelect.value;

  if (!name) {
    nameInput.setCustomValidity("Please enter your name.");
    nameInput.reportValidity();
    return;
  }

  if (!Object.hasOwn(teamNames, team)) {
    return;
  }

  attendees.push({ name: name, team: team });

  document.getElementById("greeting").textContent =
    "Welcome, " + name + "! You're checked in with " + teamNames[team] + ".";

  updateDisplay();
  saveProgress();

  form.reset();
  nameInput.focus();
});

// show any saved progress when the page loads
updateDisplay();
