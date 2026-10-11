const hand = document.getElementById("hand");
const discardPile = document.getElementById("discardPile");
const discardedCard = document.getElementById("discardedCard");
const discardCount = document.getElementById("discardCount");
const status = document.getElementById("status");
let count = 0;
let draggedCard = null;

// Create our own card images as SVGs. No external images are needed.
function createCard(rank, suit, id) {
    const color = suit.symbol === "♥" || suit.symbol === "♦" ? "#b02020" : "#171717";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="154" viewBox="0 0 110 154">
        <rect x="1" y="1" width="108" height="152" rx="8" fill="white" stroke="#888"/>
        <g fill="${color}" font-family="Arial, sans-serif" text-anchor="middle">
            <text x="22" y="30" font-size="22">${rank}</text>
            <text x="55" y="98" font-size="54">${suit.symbol}</text>
            <text x="88" y="138" font-size="22">${rank}</text>
        </g>
    </svg>`;
    const card = document.createElement("img");
    const names = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };
    card.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    card.alt = `${names[rank] || rank} of ${suit.name}`;
    card.id = id;
    card.className = "card";
    card.draggable = true;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Discard ${card.alt}`);

    card.addEventListener("dragstart", (event) => {
        draggedCard = card;
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";
        card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
        draggedCard = null;
        card.classList.remove("dragging");
        discardPile.classList.remove("over");
    });
    card.addEventListener("click", () => discard(card));
    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            discard(card);
        }
    });
    return card;
}

document.getElementById("deal").addEventListener("click", () => {
    const deck = [];
    const suits = [
        { name: "Spades", symbol: "♠" },
        { name: "Clubs", symbol: "♣" },
        { name: "Hearts", symbol: "♥" },
        { name: "Diamonds", symbol: "♦" }
    ];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    hand.replaceChildren();
    discardedCard.replaceChildren();
    count = 0;
    discardCount.textContent = count;
    for (let i = 0; i < 5; i++) {
        // Remove each selected card from the deck so it cannot be dealt twice.
        const index = Math.floor(Math.random() * deck.length);
        const card = deck.splice(index, 1)[0];
        hand.append(createCard(card.rank, card.suit, `card-${i}`));
    }
    status.textContent = "New hand dealt. Drag a card to the discard pile.";
});

function discard(card) {
    if (!card || card.parentElement !== hand) return;
    const nextCard = card.nextElementSibling || card.previousElementSibling;
    // Keep only the latest discarded image visible in the pile.
    const image = document.createElement("img");
    image.src = card.src;
    image.alt = card.alt;
    image.className = "card";
    image.draggable = false;
    discardedCard.replaceChildren(image);
    card.remove();
    count++;
    discardCount.textContent = count;
    status.textContent = `Discarded ${card.alt}. ${hand.children.length} cards left.`;
    (nextCard || document.getElementById("deal")).focus();
}

discardPile.addEventListener("dragover", (event) => {
    if (!draggedCard) return;
    event.preventDefault(); // Allow a card to be dropped here.
    event.dataTransfer.dropEffect = "move";
    discardPile.classList.add("over");
});

discardPile.addEventListener("dragleave", (event) => {
    if (!discardPile.contains(event.relatedTarget)) {
        discardPile.classList.remove("over");
    }
});

discardPile.addEventListener("drop", (event) => {
    event.preventDefault();
    discardPile.classList.remove("over");
    const id = event.dataTransfer.getData("text/plain");
    if (draggedCard && draggedCard.id === id) discard(draggedCard);
});
