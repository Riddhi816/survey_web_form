document.addEventListener("DOMContentLoaded", function () {
  const otherRoleRadio = document.getElementById("other-role-radio");
  const otherRoleInput = document.getElementById("other-role");
  const skillsContainer = document.getElementById("skills-container");
  const newSkillInput = document.getElementById("new-skill");
  const addSkillButton = document.getElementById("add-skill");
  const descriptionBox = document.getElementById("description-box");
  const skillTitle = document.getElementById("skill-title");
  const methodInput = document.getElementById("method-input");
  const saveMethodButton = document.getElementById("save-method");
  const methodsList = document.getElementById("methods-list");

  let selectedSkills = [];
  let methodsData = {};

  // Show text input if 'Other' role is selected
  document.querySelectorAll("input[name='role']").forEach((radio) => {
    radio.addEventListener("change", function () {
      otherRoleInput.style.display = this.value === "Other" ? "block" : "none";
    });
  });

  // Apply CSS grid layout to skills container
  skillsContainer.style.display = "grid";
  skillsContainer.style.gridTemplateColumns =
    "repeat(auto-fit, minmax(150px, 1fr))";
  skillsContainer.style.gap = "10px";
  skillsContainer.style.alignItems = "center";

  // Add event listener to checkboxes for showing and hiding the input box
  function addSkillListeners() {
    document.querySelectorAll(".skill").forEach((skill) => {
      skill.addEventListener("change", function () {
        if (this.checked) {
          selectedSkills.push(this.value);
        } else {
          selectedSkills = selectedSkills.filter((s) => s !== this.value);
        }

        if (selectedSkills.length > 0) {
          skillTitle.textContent = `Enter a verification method for: ${selectedSkills.join(", ")}`;
          methodInput.value = selectedSkills
            .map((skill) => methodsData[skill] || "")
            .join("\n");
          descriptionBox.style.display = "block";
        } else {
          descriptionBox.style.display = "none";
        }
      });
    });
  }

  addSkillListeners(); // Attach listeners to initial skills

  // Function to add new skill dynamically
  addSkillButton.addEventListener("click", function () {
    const newSkill = newSkillInput.value.trim();
    if (newSkill !== "") {
      // Add new skill to the list
      const label = document.createElement("label");
      label.classList.add("skill-label");
      label.innerHTML = `<input type="checkbox" class="skill" value="${newSkill}"> ${newSkill}`;
      skillsContainer.appendChild(label);

      addSkillListeners(); // Reattach listeners to include new skills
      newSkillInput.value = ""; // Clear input field
    }
  });

  // Save the entered method for the selected skills
  saveMethodButton.addEventListener("click", function () {
    if (selectedSkills.length > 0) {
      selectedSkills.forEach((skill) => {
        methodsData[skill] = methodInput.value;
      });
      updateMethodsList();
    }
  });

  // Function to update the displayed list of saved methods
  function updateMethodsList() {
    methodsList.innerHTML = "";
    for (let skill in methodsData) {
      const listItem = document.createElement("li");
      listItem.textContent = `${skill}: ${methodsData[skill]}`;
      methodsList.appendChild(listItem);
    }
  }
});
