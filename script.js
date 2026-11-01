
const DAILY_GOAL = 2000;
const MACRO_GOALS = {
  protein: 150,
  carbs: 200,
  fat: 65
};

const STORAGE_KEY = "calorieTrackFoods";

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function saveFoods() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
    return true;
  } catch (error) {
    console.error("Could not save food records:", error);
    alert("Storage error. Your changes could not be saved.");
    return false;
  }
}

function todayFoods() {
  return foods.filter(food => food.date === localDate());
}

function total(items, key) {
  return items.reduce((sum, item) => sum + item[key], 0);
}

function format(value) {
  return Math.round(value * 10) / 10;
}

function renderMacros(items) {
  const container = document.getElementById("macros");
  container.replaceChildren();

  const colors = {
    protein: "#a3e635",
    carbs: "#38bdf8",
    fat: "#fbbf24"
  };

  Object.keys(MACRO_GOALS).forEach(key => {
    const amount = total(items, key);
    const percentage = Math.min(
      (amount / MACRO_GOALS[key]) * 100, 100
    );

    const wrapper = document.createElement("div");
    wrapper.className = "macro";

    const heading = document.createElement("div");
    heading.className = "macro-heading";

    const label = document.createElement("span");
    label.textContent = key.charAt(0).toUpperCase() + key.slice(1);

    const value = document.createElement("span");
    value.textContent = `${format(amount)} / ${MACRO_GOALS[key]} g`;

    heading.append(label, value);

    const progress = document.createElement("div");
    progress.className = "progress";

    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = `${percentage}%`;
    fill.style.background = colors[key];

    progress.append(fill);
    wrapper.append(heading, progress);
    container.append(wrapper);
  });
}

function renderFoodList(items) {
  const list = document.getElementById("foodList");
  list.replaceChildren();

  document.getElementById("foodCount").textContent =
    `${items.length} foods`;

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No food added today.";
    list.append(empty);
    return;
  }

  items.forEach(food => {
    const row = document.createElement("div");
    row.className = "food-item";

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = food.name;

    const info = document.createElement("p");
    info.textContent =
      `${food.meal} · P: ${food.protein}g · C: ${food.carbs}g · F: ${food.fat}g`;

    details.append(name, info);

    const actions = document.createElement("div");
    actions.className = "food-actions";

    const calories = document.createElement("strong");
    calories.textContent = `${format(food.calories)} kcal`;

    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${food.name}`);
    remove.addEventListener("click", () => deleteFood(food.id));

    actions.append(calories, remove);
    row.append(details, actions);
    list.append(row);
  });
}

function render() {
  const items = todayFoods();
  const consumed = total(items, "calories");
  const remaining = DAILY_GOAL - consumed;
  const percentage = Math.min(
    (consumed / DAILY_GOAL) * 100, 100
  );

  document.getElementById("goal").textContent = DAILY_GOAL;
  document.getElementById("consumed").textContent = format(consumed);
  document.getElementById("remaining").textContent = format(remaining);

  document.querySelector(".calorie-ring").style.background =
    `conic-gradient(#a3e635 ${percentage}%, #202a39 ${percentage}%)`;

  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

  renderMacros(items);
  renderFoodList(items);
}

function deleteFood(id) {
  const previous = foods;
  foods = foods.filter(food => food.id !== id);

  if (!saveFoods()) {
    foods = previous;
    return;
  }

  render();
}

document.getElementById("foodForm").addEventListener("submit", event => {
  event.preventDefault();

  const form = event.currentTarget;

  const food = {
    id: crypto.randomUUID(),
    date: localDate(),
    name: document.getElementById("foodName").value.trim(),
    calories: Number(document.getElementById("calories").value),
    protein: Number(document.getElementById("protein").value),
    carbs: Number(document.getElementById("carbs").value),
    fat: Number(document.getElementById("fat").value),
    meal: document.getElementById("meal").value
  };

  if (!food.name || !["calories", "protein", "carbs", "fat"]
    .every(key => Number.isFinite(food[key]) && food[key] >= 0)) {
    alert("Please enter valid food information.");
    return;
  }

  foods.push(food);

  if (!saveFoods()) {
    foods.pop();
    return;
  }

  form.reset();
  render();
});

render();
