

document.addEventListener("DOMContentLoaded", () => {
    const claimCardDiv = document.getElementById("claimCardDiv");
    const claimedDiv = document.getElementById("claimed");
    const claimBtn = document.getElementById("claimBtn");
    const toBeClaimed = document.getElementById("toBeClaimed");

    // Rewards for each day
    const rewards = [4, 4, 4, 30, 4, 4, 100];

    // Today’s day index (0 = Sunday … 6 = Saturday)
    const todayIndex = new Date().getDay();

    // Get today's date string (e.g., "2025-08-21")
    const todayDate = new Date().toDateString();

    // Load saved data
    let claimedDays = JSON.parse(localStorage.getItem("claimedDays")) || [];
    let balance = parseInt(localStorage.getItem("balance")) || 0;
    let lastClaimDate = localStorage.getItem("lastClaimDate") || null;

    // If the stored date is not today, allow claim again for today's day
    if (lastClaimDate !== todayDate) {
        // Remove today's index if it was marked from a previous day
        claimedDays = claimedDays.filter(day => day !== todayIndex);
    }

    claimedDiv.textContent = `₦${balance}`;

    // Create cards
    const cards = [];
    rewards.forEach((amount, index) => {
        const card = document.createElement("div");
        card.classList.add("cards");
        card.textContent = `₦${amount}`;

        if (index === todayIndex) {
            card.textContent += " (Today)";
        }

        if (claimedDays.includes(index)) {
            card.classList.add("claimed");
        }

        cards.push(card);
        claimCardDiv.appendChild(card);
    });

    // Show "to be claimed" status
    if (claimedDays.includes(todayIndex)) {
        toBeClaimed.textContent = 0;
        claimBtn.disabled = true;
        claimBtn.textContent = "Already Claimed";
    } else {
        toBeClaimed.textContent = 1;
    }

    // Claim button logic
    claimBtn.addEventListener("click", () => {
        if (!claimedDays.includes(todayIndex)) {
            // Mark today's card
            cards[todayIndex].classList.add("claimed");

            // Update balance
            balance += rewards[todayIndex];
            claimedDiv.textContent = `₦${balance}`;

            // Save progress
            claimedDays.push(todayIndex);
            localStorage.setItem("claimedDays", JSON.stringify(claimedDays));
            localStorage.setItem("balance", balance);

            // Save today's date
            localStorage.setItem("lastClaimDate", todayDate);

            // Update UI
            claimBtn.disabled = true;
            claimBtn.textContent = "Already Claimed";
            toBeClaimed.textContent = 0;
        }
    });
});
    let timeLeft = 24 * 60 * 60; 

    const countdownEl = document.getElementById("countdown");

    const updateCountdown = () => {
      let hours = Math.floor(timeLeft / 3600);
      let minutes = Math.floor((timeLeft % 3600) / 60);
      let seconds = timeLeft % 60;

      // Format to always show 2 digits
      let formattedTime = 
        String(hours).padStart(2, "0") + ":" + 
        String(minutes).padStart(2, "0") + ":" + 
        String(seconds).padStart(2, "0");

      countdownEl.textContent = formattedTime;

      if (timeLeft > 0) {
        timeLeft--;
      } else {
        clearInterval(timer);
        countdownEl.textContent = "00:00:00";
      }
    };

    // Update every second
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

