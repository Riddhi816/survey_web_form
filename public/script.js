/* ──────────────────────────────────────────────────────────────
   1.  Firebase initialisation  (ES-module)
──────────────────────────────────────────────────────────────── */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6-rNE6u7HjPA8Ih6veX3x1bsvRozPubI",
  authDomain: "code-skills-survey.firebaseapp.com",
  projectId: "code-skills-survey",
  storageBucket: "code-skills-survey.firebasestorage.app",
  messagingSenderId: "274612510598",
  appId: "1:274612510598:web:84ad604a04e17ab2ffd607",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ──────────────────────────────────────────────────────────────
   2.  Dynamic-skill logic  (runs after DOM ready)
──────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  /* ▸▸  cache nodes  ◂◂ */
  const roleOtherInput = document.getElementById("role-other");
  const skillsContainer = document.getElementById("skills-container");
  const newSkillInput = document.getElementById("new-skill");
  const addSkillButton = document.getElementById("add-skill");
  const descriptionHolder = document.getElementById("description-container");
  const methodsList = document.getElementById("methods-list");

  try {
    const skillDocRef = doc(db, "surveySkillList", "customSkills");
    const skillSnapshot = await getDoc(skillDocRef);
    const allSkills = [];

    if (skillSnapshot.exists()) {
      const skillArray = skillSnapshot.data().names || [];
      skillArray.forEach((skill) => {
        const label = document.createElement("label");
        label.classList.add("skill-item");
        label.innerHTML = `<input type="checkbox" class="skill" value="${skill}"> ${skill}`;
        skillsContainer.appendChild(label);
        allSkills.push(label); // store for collapse feature
      });
    }

    // Collapse logic – show only first 10
    const maxVisible = 6;
    if (allSkills.length > maxVisible) {
      allSkills.forEach((item, i) => {
        if (i >= maxVisible) item.style.display = "none";
      });

      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "Show All Skills";
      toggleBtn.classList.add("toggle-skills");
      let expanded = false;

      toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        allSkills.forEach((item, i) => {
          if (i >= maxVisible) item.style.display = expanded ? "block" : "none";
        });
        toggleBtn.textContent = expanded
          ? "Show Less Skills"
          : "Show All Skills";
      });

      skillsContainer.appendChild(toggleBtn);
    }
  } catch (err) {
    console.error("Error loading skills:", err);
  }

  /* ▸▸  global state  ◂◂ */
  window.methodsData = {}; // expose for Firebase payload
  const selectedSkills = new Set();

  /* ---- helper: create a verification box ---- */
  const createBox = (skill) => {
    if (document.querySelector(`[data-skill="${skill}"]`)) return;

    const box = document.createElement("div");
    const title = document.createElement("h3");
    const textarea = document.createElement("textarea");
    const saveBtn = document.createElement("button");

    box.className = "verification-box";
    box.dataset.skill = skill;

    title.textContent = `How would you verify this skill? Can you provide a method or a test for this: ${skill}`;
    textarea.value = window.methodsData[skill] || "";
    saveBtn.textContent = "Save";
    saveBtn.type = "button";

    saveBtn.addEventListener("click", () => {
      window.methodsData[skill] = textarea.value.trim();
      updateMethodsList();

      /* auto-deselect and hide box */
      document.querySelector(`.skill[value="${skill}"]`).checked = false;
      selectedSkills.delete(skill);
      box.remove();
    });

    box.append(title, textarea, saveBtn);
    descriptionHolder.appendChild(box);
  };

  /* ---- listener for existing + new checkboxes ---- */
  const wireSkillCheckboxes = () => {
    document.querySelectorAll(".skill").forEach((cb) =>
      cb.addEventListener("change", () => {
        if (cb.checked) {
          selectedSkills.add(cb.value);
          createBox(cb.value);
        } else {
          selectedSkills.delete(cb.value);
          document.querySelector(`[data-skill="${cb.value}"]`)?.remove();
        }
      })
    );
  };
  wireSkillCheckboxes(); // initial load

  /* ---- add new skill button ---- */
  addSkillButton.addEventListener("click", () => {
    const newSkill = newSkillInput.value.trim();
    if (!newSkill) return;

    // Prevent duplicate entries
    if (document.querySelector(`.skill[value="${newSkill}"]`)) {
      alert("Skill already exists.");
      return;
    }

    const label = document.createElement("label");
    label.classList.add("skill-item", "custom-skill");
    label.innerHTML = `
    <input type="checkbox" class="skill" value="${newSkill}">
    ${newSkill}
    <button type="button" class="remove-skill" title="Remove">✕</button>
  `;
    skillsContainer.appendChild(label);
    wireSkillCheckboxes(); // reattach event listeners

    // Handle removal before submission
    label.querySelector(".remove-skill").addEventListener("click", () => {
      label.remove();
      selectedSkills.delete(newSkill);
      delete window.methodsData[newSkill];
      document.querySelector(`[data-skill="${newSkill}"]`)?.remove(); // remove verify box
      updateMethodsList();
    });

    newSkillInput.value = "";
  });

  /* ---- update saved-methods list ---- */
  const updateMethodsList = () => {
    methodsList.innerHTML = "";
    Object.entries(window.methodsData).forEach(([skill, txt]) => {
      const li = document.createElement("li");
      li.textContent = `${skill}: ${txt}`;
      methodsList.appendChild(li);
    });
  };

  /* ---- show free-text when role == Other ---- */
  document
    .querySelectorAll("input[name='role']")
    .forEach((radio) =>
      radio.addEventListener(
        "change",
        () =>
          (roleOtherInput.style.display =
            radio.value === "Other" ? "block" : "none")
      )
    );
});

/* ──────────────────────────────────────────────────────────────
   3.  Submit handler  → Firestore
──────────────────────────────────────────────────────────────── */
const checked = (name) =>
  (document.querySelector(`input[name="${name}"]:checked`) || {}).value || null;

document.getElementById("survey-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const selectedRole = checked("role");
  const roleOtherInput = document.getElementById("role-other");
  const otherRoleText = roleOtherInput?.value.trim();

  const role = selectedRole === "Other" ? otherRoleText : selectedRole || null;

  const experience = checked("experience");
  const aiImpact = checked("aiImpact") || checked("YesNo");
  const aiImpactText =
    document.getElementById("ai-impact-detail")?.value.trim() || null;
  const importance = checked("importance") || checked("YesNo");
  const followUpEmail =
    document.getElementById("follow-up-email")?.value.trim() || null;
  const extraThoughts =
    document.getElementById("extra-thoughts")?.value.trim() || null;
  const skills = Object.keys(window.methodsData);
  const verMethods = window.methodsData;

  if (
    !role ||
    (checked("role") === "Other" && !otherRoleText) ||
    !experience ||
    skills.length === 0 ||
    !aiImpact ||
    !importance
  ) {
    alert("Please fill in all required questions before submitting.");
    return;
  }

  const payload = {
    timestamp: serverTimestamp(),
    role,
    experience,
    skills,
    verMethods,
    aiImpact,
    aiImpactText,
    importance,
    followUpEmail,
    extraThoughts,
  };

  try {
    await addDoc(collection(db, "surveyResponses"), payload);
    console.log("Response saved:", payload);

    // Save any new custom skills to Firestore before saving response
    try {
      const customSkills = [
        ...document.querySelectorAll(".custom-skill .skill"),
      ].map((cb) => cb.value);
      const skillDocRef = doc(db, "surveySkillList", "customSkills");
      const skillSnapshot = await getDoc(skillDocRef);

      if (customSkills.length > 0) {
        if (skillSnapshot.exists()) {
          await updateDoc(skillDocRef, {
            names: arrayUnion(...customSkills),
          });
        } else {
          await setDoc(skillDocRef, {
            names: customSkills,
          });
        }
      }
    } catch (err) {
      console.error("Failed to save custom skills:", err);
    }
    alert("Thanks! Your response has been saved.");
    e.target.reset();
  } catch (err) {
    console.error(err);
    alert("Sorry – could not save your response.");
  }
});
