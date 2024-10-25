const time = document.querySelector(".time span b");
const mistakes = document.querySelector(".mistake span");
const wpm = document.querySelector(".wpm span");
const cpm = document.querySelector(".cpm span");
const btn = document.querySelector("button");
const typingText = document.querySelector(".typing-text p");
const modal = document.getElementById("resultModal");
const closeBtn = document.querySelector(".close");
const generateReportBtn = document.getElementById("generateReportBtn");
const userNameInput = document.getElementById("userNameInput");
const inputField = document.querySelector(".input-field"); // Hidden input field
const { jsPDF } = window.jspdf;

let timer;
let maxTime = 60;
let timeleft = maxTime;
let charIndex = 0;
let mistake = 0;
let isTyping = false;
let paragraph = "";

// Load paragraph from API
async function loadParagraph() {
  try {
    const response = await fetch(
      "https://baconipsum.com/api/?type=meat-and-filler&paras=1&format=text"
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let paragraph = await response.text();
    // Limit paragraph to 150 characters or to the last complete word
    if (paragraph.length > 150) {
      paragraph = paragraph.substring(0, 500);
      const lastSpace = paragraph.lastIndexOf(" "); // Ensure not to cut off in the middle of a word
      paragraph = paragraph.substring(0, lastSpace);
    }
    return paragraph;
  } catch (error) {
    console.error("Error fetching paragraph:", error);
    return "Error loading paragraph"; // Fallback message
  }
}

// Update the displayed paragraph
function updateParagraph(paragraph) {
  typingText.innerHTML = "";
  paragraph.split("").forEach((char) => {
    const span = document.createElement("span");
    span.textContent = char;
    typingText.appendChild(span);
  });
  typingText.querySelectorAll("span")[0].classList.add("active");
  charIndex = 0;
}

// Function to handle typing logic
function initTyping(inputValue) {
  const char = typingText.querySelectorAll("span");
  const typedChar = inputValue.charAt(inputValue.length - 1);

  if (charIndex < char.length && timeleft > 0) {
    if (!isTyping) {
      timer = setInterval(initTimer, 1000);
      isTyping = true;
    }
    if (char[charIndex]) {
      char[charIndex].classList.remove("active");
      if (char[charIndex].innerText === typedChar) {
        char[charIndex].classList.add("correct");
      } else {
        char[charIndex].classList.add("incorrect");
        mistake++;
        mistakes.textContent = mistake;
      }
      charIndex++;
      if (charIndex < char.length) {
        char[charIndex].classList.add("active");
      }
      cpm.innerText = charIndex - mistake;
    }
  } else if (timeleft <= 0) {
    clearInterval(timer);
    showResultModal();
  }
}

// Timer function
function initTimer() {
  if (timeleft > 0) {
    timeleft--;
    time.innerText = timeleft;
    const wpmVal = Math.round(
      ((charIndex - mistake) / 5) * (60 / (maxTime - timeleft))
    );
    wpm.innerText = wpmVal;
  } else {
    clearInterval(timer);
    showResultModal();
  }
}

// Show result modal to ask user's name
function showResultModal() {
  modal.style.display = "block";
}

// Close modal on clicking close button
closeBtn.onclick = function () {
  modal.style.display = "none";
};

// Close modal if clicked outside of modal
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

generateReportBtn.addEventListener("click", function () {
  const userName = userNameInput.value.trim();
  if (userName) {
    generatePDF(userName);
    modal.style.display = "none";
  } else {
    alert("Please enter your name!");
  }
});

// Reset game function
function reset() {
  loadParagraph()
    .then((paragraph) => {
      updateParagraph(paragraph);
    })
    .catch((err) => {
      console.error("Error:", err);
    });

  clearInterval(timer);
  timeleft = maxTime;
  charIndex = 0;
  mistake = 0;
  isTyping = false;
  wpm.innerText = 0;
  cpm.innerText = 0;
  mistakes.innerText = 0;
  time.innerText = timeleft;
}

// Generate a PDF report
function generatePDF(userName) {
  const pdfContent = `
    Typing Test Report\n\n
    Name: ${userName}\n
    Mistakes: ${mistake}\n
    Words Per Minute (WPM): ${wpm.innerText}\n
    Characters Per Minute (CPM): ${cpm.innerText}
  `;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(pdfContent, 10, 10);
  doc.save(`${userName}-typing-test-report.pdf`);
}

// Load and display the paragraph when the page loads
loadParagraph()
  .then((paragraph) => {
    updateParagraph(paragraph);
  })
  .catch((err) => {
    console.error("Error:", err);
  });

// Set focus on the input field when the page loads and on clicking the main area
window.onload = () => inputField.focus();
document.querySelector(".wrapper").onclick = () => inputField.focus();

// Handle input to support typing on mobile devices
inputField.addEventListener("input", (e) => {
  initTyping(e.target.value);
  inputField.value = ""; // Clear input after processing
});

// Reset game when clicking "Try Again"
btn.addEventListener("click", reset);
