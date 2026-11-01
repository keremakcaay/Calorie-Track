
const DAILY_GOAL = 2000;
const MACRO_GOALS = {
  protein: 150,
  carbs: 200,
  fat: 65
};

const STORAGE_KEY = "calorieTrackFoods";
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function loadFoods() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let foods = loadFoods();
let selectedDate = localDate();
let editingId = null;

function saveFoods() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
    return true;
  } catch (error) {
    console.error("Storage error:", error);
    alert("Could not save food records.");
    return false;
  }
}

function getFoods(date) {
  return foods.filter(food => food.date === date);
}

function total(items, key) {
  return items.reduce((sum, food) => sum + Number(food[key] || 0), 0);
}

function format(value) {
  return Math.round(value * 10) / 10;
}

function makeElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function renderMacros(items) {
  const container = document.getElementById("macros");
  container.replaceChildren();

  const colors = {
    protein: "#a3e635",
    carbs: "#38bdf8",
    fat: "#fbbf24"
  };

  for (const key of Object.keys(MACRO_GOALS)) {
    const amount = total(items, key);
    const percent = Math.min(amount / MACRO_GOALS[key] * 100, 100);

    const wrapper = makeElement("div", "macro");
    const heading = makeElement("div", "macro-heading");

    heading.append(
      makeElement("span", "", key[0].toUpperCase() + key.slice(1)),
      makeElement("span", "", `${format(amount)} / ${MACRO_GOALS[key]} g`)
    );

    const progress = makeElement("div", "progress");
    const fill = makeElement("div", "progress-fill");
    fill.style.width = `${percent}%`;
    fill.style.background = colors[key];
    progress.append(fill);

    wrapper.append(heading, progress);
    container.append(wrapper);
  }
}

function createFoodRow(food, editable = true) {
  const row = makeElement("div", "food-item");
  const details = makeElement("div");

  details.append(
    makeElement("strong", "", food.name),
    makeElement("p", "",
      `${food.meal} · P: ${food.protein}g · C: ${food.carbs}g · F: ${food.fat}g`)
  );

  const actions = makeElement("div", "food-actions");
  actions.append(
    makeElement("span", "food-calories", `${format(food.calories)} kcal`)
  );

  if (editable) {
    const edit = makeElement("button", "", "Edit");
    edit.type = "button";
    edit.addEventListener("click", () => openFoodDialog(food.meal, food));

    const remove = makeElement("button", "delete-btn", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete ${food.name}`);
    remove.addEventListener("click", () => deleteFood(food.id));

    actions.append(edit, remove);
  }

  row.append(details, actions);
  return row;
}

function renderHome() {
  const items = getFoods(localDate());
  const consumed = total(items, "calories");
  const remaining = DAILY_GOAL - consumed;
  const percentage = Math.min(consumed / DAILY_GOAL * 100, 100);

  document.getElementById("goal").textContent = DAILY_GOAL;
  document.getElementById("consumed").textContent = format(consumed);
  document.getElementById("remaining").textContent = format(remaining);

  document.querySelector(".calorie-ring").style.background =
    `conic-gradient(#a3e635 ${percentage}%, #202a39 ${percentage}%)`;

  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric"
    });

  renderMacros(items);

  const list = document.getElementById("homeFoodList");
  list.replaceChildren();

  if (items.length === 0) {
    list.append(makeElement("p", "empty", "No food added today."));
  } else {
    items.forEach(food => list.append(createFoodRow(food, false)));
  }
}

function renderDiary() {
  const date = parseDate(selectedDate);
  const items = getFoods(selectedDate);

  document.getElementById("selectedDateLabel").textContent =
    selectedDate === localDate() ? "Today" :
    date.toLocaleDateString("en-US", { weekday: "long" });

  document.getElementById("selectedDateFull").textContent =
    date.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric"
    });

  document.getElementById("diaryCalories").textContent =
    `${format(total(items, "calories"))} kcal`;

  const container = document.getElementById("mealSections");
  container.replaceChildren();

  const icons = {
    Breakfast: "☀️",
    Lunch: "🥗",
    Dinner: "🌙",
    Snack: "🍎"
  };

  for (const meal of MEALS) {
    const mealFoods = items.filter(food => food.meal === meal);
    const card = makeElement("section", "card");
    const header = makeElement("div", "meal-header");
    const heading = makeElement("h2", "", `${icons[meal]} ${meal}`);
    const calories = makeElement("p", "",
      `${format(total(mealFoods, "calories"))} kcal`);

    header.append(heading, calories);
    card.append(header);

    if (mealFoods.length === 0) {
      card.append(makeElement("p", "empty", "No food added."));
    } else {
      mealFoods.forEach(food => card.append(createFoodRow(food)));
    }

    const add = makeElement("button", "add-btn", "+ Add Food");
    add.type = "button";
    add.addEventListener("click", () => openFoodDialog(meal));

    card.append(add);
    container.append(card);
  }
}

function render() {
  renderHome();
  renderDiary();
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.getElementById("openDiary").addEventListener("click", () => {
  selectedDate = localDate();
  renderDiary();
  showPage("diaryPage");
});

function changeDay(amount) {
  const date = parseDate(selectedDate);
  date.setDate(date.getDate() + amount);
  selectedDate = localDate(date);
  renderDiary();
}

document.getElementById("previousDay").addEventListener("click", () => changeDay(-1));
document.getElementById("nextDay").addEventListener("click", () => changeDay(1));

const dialog = document.getElementById("foodDialog");
const form = document.getElementById("foodForm");

function openFoodDialog(meal = "Breakfast", food = null) {
  form.reset();
  editingId = food ? food.id : null;

  document.getElementById("dialogTitle").textContent =
    food ? "Edit Food" : "Add Food";

  document.getElementById("meal").value = food ? food.meal : meal;

  if (food) {
    document.getElementById("foodName").value = food.name;
    document.getElementById("calories").value = food.calories;
    document.getElementById("protein").value = food.protein;
    document.getElementById("carbs").value = food.carbs;
    document.getElementById("fat").value = food.fat;
  }

  dialog.showModal();
}

document.getElementById("closeDialog").addEventListener("click", () => {
  dialog.close();
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const values = {
    name: document.getElementById("foodName").value.trim(),
    calories: Number(document.getElementById("calories").value),
    protein: Number(document.getElementById("protein").value),
    carbs: Number(document.getElementById("carbs").value),
    fat: Number(document.getElementById("fat").value),
    meal: document.getElementById("meal").value
  };

  const numericFields = ["calories", "protein", "carbs", "fat"];

  if (!values.name || !numericFields.every(key =>
    Number.isFinite(values[key]) && values[key] >= 0
  )) {
    alert("Please enter valid food information.");
    return;
  }

  const previous = [...foods];

  if (editingId !== null) {
    foods = foods.map(food =>
      food.id === editingId ? { ...food, ...values } : food
    );
  } else {
    foods.push({
      id: crypto.randomUUID(),
      date: selectedDate,
      ...values
    });
  }

  if (!saveFoods()) {
    foods = previous;
    return;
  }

  dialog.close();
  editingId = null;
  render();
});

function deleteFood(id) {
  if (!confirm("Delete this food record?")) return;

  const previous = foods;
  foods = foods.filter(food => food.id !== id);

  if (!saveFoods()) {
    foods = previous;
    return;
  }

  render();
}

render();
