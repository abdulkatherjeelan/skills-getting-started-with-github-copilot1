document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const showMessage = (text, type) => {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  };

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsWrapper = document.createElement("div");
        participantsWrapper.className = "participants";

        const participantsTitle = document.createElement("strong");
        participantsTitle.textContent = "Participants:";
        participantsWrapper.appendChild(participantsTitle);

        if (details.participants.length) {
          const participantList = document.createElement("ul");

          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-participant";
            deleteButton.textContent = "×";
            deleteButton.setAttribute("aria-label", `Remove ${participant}`);
            deleteButton.dataset.activity = name;
            deleteButton.dataset.email = participant;

            deleteButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                const result = await response.json();
                if (response.ok) {
                  showMessage(result.message, "success");
                  fetchActivities();
                } else {
                  showMessage(result.detail || "Failed to remove participant", "error");
                }
              } catch (error) {
                showMessage("Failed to remove participant. Please try again.", "error");
                console.error("Error deleting participant:", error);
              }
            });

            listItem.append(nameSpan, deleteButton);
            participantList.appendChild(listItem);
          });

          participantsWrapper.appendChild(participantList);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "No one signed up yet.";
          participantsWrapper.appendChild(noParticipants);
        }

        activityCard.appendChild(participantsWrapper);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
