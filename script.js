/* ──────────────────────────────────────────────────────────────
   1.  Firebase initialisation  (ES-module)
──────────────────────────────────────────────────────────────── */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
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
document.addEventListener("DOMContentLoaded", () => {
  /* ▸▸  cache nodes  ◂◂ */
  const roleOtherInput = document.getElementById("role-other");
  const skillsContainer = document.getElementById("skills-container");
  const newSkillInput = document.getElementById("new-skill");
  const addSkillButton = document.getElementById("add-skill");
  const descriptionHolder = document.getElementById("description-container");
  const methodsList = document.getElementById("methods-list");

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

    title.textContent = `Verification method for: ${skill}`;
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

    const label = document.createElement("label");
    label.classList.add("skill-item");
    label.innerHTML = `<input type="checkbox" class="skill" value="${newSkill}"> ${newSkill}`;
    skillsContainer.appendChild(label);

    newSkillInput.value = "";
    wireSkillCheckboxes(); // attach listener to the new box
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

  const role =
    checked("role") ||
    document.getElementById("role-other").value.trim() ||
    null;
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
    (role === "Other" && !otherRoleText) ||
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
    alert("Thanks! Your response has been saved.");
    e.target.reset();
  } catch (err) {
    console.error(err);
    alert("Sorry – could not save your response.");
  }
});
