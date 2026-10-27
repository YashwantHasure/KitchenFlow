// KitchenFlow: fictional sample data and client-side scheduling demo.
"use strict";

const $ = (id) => document.getElementById(id);
const PACKING_MINUTES = 5;
let selectedOrderId = null;
let orderCounter = 5108;
let toastTimer;

function minsAgo(minutes) {
  return new Date(Date.now() - minutes * 60000);
}
function timeLabel(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

// All customers, references and orders below are fictional.
const initialOrders = [
  { id:"KF-5101", source:"Swiggy", priority:"High", status:"Preparing", created:minsAgo(11), dishes:[{name:"Paneer Tikka Wrap",minutes:10},{name:"Masala Fries",minutes:7}] },
  { id:"KF-5102", source:"Zomato", priority:"Standard", status:"Queued", created:minsAgo(8), dishes:[{name:"Veg Biryani",minutes:18},{name:"Raita",minutes:3}] },
  { id:"KF-5103", source:"Direct Website", priority:"Standard", status:"Queued", created:minsAgo(6), dishes:[{name:"Margherita Pizza",minutes:16},{name:"Lemon Soda",minutes:4}] },
  { id:"KF-5104", source:"Swiggy", priority:"High", status:"Queued", created:minsAgo(4), dishes:[{name:"Hakka Noodles",minutes:12},{name:"Spring Rolls",minutes:9}] },
  { id:"KF-5105", source:"Zomato", priority:"Standard", status:"Ready", created:minsAgo(24), dishes:[{name:"Dal Khichdi",minutes:14}] },
  { id:"KF-5106", source:"Phone", priority:"Standard", status:"Queued", created:minsAgo(2), dishes:[{name:"Chole Rice Bowl",minutes:13},{name:"Buttermilk",minutes:2}] }
].map(order => ({...order, duration:Math.max(...order.dishes.map(d => d.minutes)) + PACKING_MINUTES}));

let orders = structuredClone(initialOrders);
let activity = [
  "Sample queue loaded with six fictional orders.",
  "Ticket formatting and sequential estimates enabled.",
  "Demo is not connected to live delivery services."
];

function addActivity(message) {
  activity.unshift(`${timeLabel(new Date())} — ${message}`);
  activity = activity.slice(0, 5);
  renderActivity();
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// Scheduling policy: active orders are sequenced by priority first, then creation
// time. This is a simplified one-station model, not a real kitchen optimiser.
function scheduleQueue() {
  const active = orders.filter(order => order.status !== "Ready")
    .sort((a,b) => {
      const priorityDifference = (a.priority === "High" ? 0 : 1) - (b.priority === "High" ? 0 : 1);
      return priorityDifference || a.created - b.created;
    });

  let cursor = new Date();
  active.forEach(order => {
    const startAt = new Date(Math.max(cursor.getTime(), order.created.getTime()));
    order.startAt = startAt;
    order.pickupAt = new Date(startAt.getTime() + order.duration * 60000);
    cursor = order.pickupAt;
  });

  orders.filter(order => order.status === "Ready").forEach(order => {
    order.startAt = order.created;
    order.pickupAt = new Date();
  });
  return active;
}

function getVisibleOrders() {
  const filter = $("statusFilter").value;
  const active = scheduleQueue();
  const ready = orders.filter(order => order.status === "Ready")
    .sort((a,b) => b.created - a.created);
  const combined = [...active, ...ready];
  return filter === "All" ? combined : combined.filter(order => order.status === filter);
}

function renderStats() {
  const active = orders.filter(order => order.status !== "Ready");
  $("activeCount").textContent = active.length;
  $("readyCount").textContent = orders.filter(order => order.status === "Ready").length;
  const scheduled = scheduleQueue();
  $("nextPickup").textContent = scheduled.length ? timeLabel(scheduled[0].pickupAt) : "—";
  $("queueLoad").textContent = active.reduce((sum,order) => sum + order.duration, 0) + " min";
}

function renderOrders() {
  const list = $("orderList");
  const visible = getVisibleOrders();
  if (!visible.length) {
    list.innerHTML = '<div class="empty-state">No orders match this filter.</div>';
    return;
  }

  list.innerHTML = visible.map(order => {
    const selected = order.id === selectedOrderId;
    const dishes = order.dishes.map(d => `${escapeText(d.name)} (${d.minutes}m)`).join(" · ");
    const pickup = order.status === "Ready" ? "Ready now" : timeLabel(order.pickupAt);
    const actions = order.status === "Queued"
      ? `<button class="mini-btn" data-action="prepare" data-id="${escapeText(order.id)}">Start prep</button>`
      : order.status === "Preparing"
        ? `<button class="mini-btn" data-action="ready" data-id="${escapeText(order.id)}">Mark ready</button>`
        : `<button class="mini-btn" data-action="ticket" data-id="${escapeText(order.id)}">View ticket</button>`;

    return `<article class="order-row" style="${selected ? "background:#fffdfd" : ""}">
      <div class="priority-bar ${order.priority === "High" ? "high" : ""}"></div>
      <div class="order-main">
        <div class="order-title"><b>${escapeText(order.id)}</b><span class="source">${escapeText(order.source)}</span></div>
        <div class="order-meta">${order.priority === "High" ? "High priority" : "Standard priority"} · Received ${timeLabel(order.created)}</div>
        <div class="dish-summary">${dishes}</div>
        <div class="row-actions">
          <button class="mini-btn" data-action="ticket" data-id="${escapeText(order.id)}">Ticket</button>
          ${actions}
        </div>
      </div>
      <div class="order-right">
        <div class="pickup-time">${pickup}</div>
        <div class="pickup-label">${order.status === "Ready" ? "PICKUP STATUS" : "EST. PICKUP"}</div>
        <span class="status status-${order.status}">${order.status}</span>
      </div>
    </article>`;
  }).join("");
}

function renderTicket(order) {
  selectedOrderId = order.id;
  const start = order.status === "Ready" ? "Completed" : timeLabel(order.startAt);
  const pickup = order.status === "Ready" ? "READY FOR PICKUP" : timeLabel(order.pickupAt);
  $("ticket").innerHTML = `
    <div class="ticket-head"><b>KITCHENFLOW</b><small>KITCHEN ORDER TICKET · ${escapeText(order.source.toUpperCase())}</small></div>
    <div class="ticket-meta">
      <div><b>Order:</b> ${escapeText(order.id)}</div>
      <div><b>Received:</b> ${timeLabel(order.created)}</div>
      <div><b>Priority:</b> ${escapeText(order.priority)}</div>
      <div><b>Status:</b> ${escapeText(order.status)}</div>
    </div>
    <div class="ticket-items"><b>ITEMS</b><br>
      ${order.dishes.map((dish,i) => `${i+1}. ${escapeText(dish.name)} — ${dish.minutes} min`).join("<br>")}
    </div>
    <div class="ticket-bottom">
      <div>Scheduled start: ${start}</div>
      <div>Packing buffer: ${PACKING_MINUTES} min</div>
      <div><strong>${pickup === "READY FOR PICKUP" ? pickup : "PICKUP: " + pickup}</strong></div>
    </div>`;
  renderOrders();
}

function renderActivity() {
  $("activity").innerHTML = activity.map(item =>
    `<div class="activity-item">${escapeText(item)}</div>`).join("");
}
function renderAll() {
  renderStats();
  renderOrders();
  renderActivity();
}

function findOrder(id) {
  return orders.find(order => order.id === id);
}

$("orderList").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const order = findOrder(button.dataset.id);
  if (!order) return;

  if (button.dataset.action === "ticket") {
    renderTicket(order);
    addActivity(`Kitchen ticket viewed for ${order.id}.`);
  } else if (button.dataset.action === "prepare") {
    order.status = "Preparing";
    renderAll();
    renderTicket(order);
    addActivity(`${order.id} moved to Preparing.`);
    showToast(`${order.id} marked as preparing.`);
  } else if (button.dataset.action === "ready") {
    order.status = "Ready";
    renderAll();
    renderTicket(order);
    addActivity(`${order.id} marked Ready for pickup.`);
    showToast(`${order.id} is ready for pickup.`);
  }
});

$("statusFilter").addEventListener("change", renderOrders);
document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(nav => nav.classList.remove("active"));
    button.classList.add("active");
    const view = button.dataset.view;
    $("breadcrumb").textContent = view.toUpperCase();
    $("pageTitle").textContent = ({
      dashboard:"Kitchen dashboard",
      orders:"All kitchen orders",
      tickets:"Kitchen ticket workspace"
    })[view];
    if (view === "tickets" && selectedOrderId) {
      const order = findOrder(selectedOrderId);
      if (order) renderTicket(order);
    }
    if (view === "orders") $("statusFilter").value = "All";
    renderOrders();
  });
});

function addDishInput(name = "", minutes = 10) {
  const row = document.createElement("div");
  row.className = "dish-input-row";
  row.innerHTML = '<input class="new-dish-name" maxlength="50" required placeholder="Dish name"><input class="new-dish-time" type="number" min="1" max="180" step="1" required aria-label="Preparation minutes"><button type="button" aria-label="Remove dish">×</button>';
  row.querySelector(".new-dish-name").value = name;
  row.querySelector(".new-dish-time").value = minutes;
  row.querySelector("button").addEventListener("click", () => {
    if ($("dishInputs").children.length > 1) row.remove();
  });
  $("dishInputs").appendChild(row);
}
function openOrderDialog() {
  $("formError").textContent = "";
  $("orderForm").reset();
  $("dishInputs").replaceChildren();
  addDishInput("Veg Pulao", 12);
  addDishInput("Raita", 3);
  $("orderDialog").showModal();
}
$("newOrderBtn").addEventListener("click", openOrderDialog);
$("closeDialog").addEventListener("click", () => $("orderDialog").close());
$("cancelDialog").addEventListener("click", () => $("orderDialog").close());
$("addDish").addEventListener("click", () => addDishInput());

$("orderForm").addEventListener("submit", event => {
  event.preventDefault();
  const dishRows = [...$("dishInputs").querySelectorAll(".dish-input-row")];
  const dishes = dishRows.map(row => ({
    name:row.querySelector(".new-dish-name").value.trim(),
    minutes:Number(row.querySelector(".new-dish-time").value)
  }));
  const invalid = dishes.some(d => !d.name || !Number.isInteger(d.minutes) || d.minutes < 1 || d.minutes > 180);
  if (!dishes.length || invalid) {
    $("formError").textContent = "Enter a dish name and a whole-number time from 1 to 180 minutes for every dish.";
    return;
  }
  const suppliedRef = $("orderRef").value.trim();
  const id = suppliedRef || `KF-${orderCounter++}`;
  if (orders.some(order => order.id.toLowerCase() === id.toLowerCase())) {
    $("formError").textContent = "That order reference already exists. Please use a unique reference.";
    return;
  }
  const created = new Date();
  const order = {
    id, source:$("orderSource").value, priority:$("priority").value,
    status:"Queued", created, dishes,
    duration:Math.max(...dishes.map(d => d.minutes)) + PACKING_MINUTES
  };
  orders.push(order);
  $("orderDialog").close();
  renderAll();
  scheduleQueue();
  renderTicket(order);
  addActivity(`New ${order.source} order ${order.id} added to the queue.`);
  showToast(`Order ${order.id} created successfully.`);
});

$("copyTicket").addEventListener("click", async () => {
  const order = findOrder(selectedOrderId);
  if (!order) { showToast("Select an order to create a ticket first."); return; }
  const lines = [
    "KITCHENFLOW — KITCHEN ORDER TICKET",
    `Order: ${order.id}`,
    `Source: ${order.source}`,
    `Status: ${order.status}`,
    `Priority: ${order.priority}`,
    ...order.dishes.map((d,i) => `${i+1}. ${d.name} — ${d.minutes} min`),
    `Estimated pickup: ${order.status === "Ready" ? "Ready for pickup" : timeLabel(order.pickupAt)}`,
    `Packing buffer: ${PACKING_MINUTES} minutes`
  ];
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("Kitchen ticket copied.");
  } catch {
    showToast("Clipboard unavailable here. Use Print or copy the ticket manually.");
  }
});
$("printTicket").addEventListener("click", () => {
  if (!selectedOrderId) { showToast("Select an order ticket first."); return; }
  window.print();
});
$("resetDemo").addEventListener("click", () => {
  orders = structuredClone(initialOrders);
  selectedOrderId = null;
  $("ticket").innerHTML = '<div class="ticket-empty">Select an order to preview its ticket.</div>';
  activity = ["Demo data reset to six fictional orders."];
  renderAll();
  showToast("Demo orders restored.");
});

// Load an example ticket at startup so the demo is immediately understandable.
renderAll();
renderTicket(findOrder("KF-5101"));
addActivity("KitchenFlow started with fictional sample data.");
