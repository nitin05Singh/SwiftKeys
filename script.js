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
const { jsPDF } = window.jspdf;

let timer;
let maxTime = 60;
let timeleft = maxTime;
let charIndex = 0;
let mistake = 0;
let isTyping = false;

// Load paragraph from API
async function loadParagraph() {
  try {
    const response = await fetch(
      "https://baconipsum.com/api/?type=cricket-and-filler&paras=1&format=text"
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const paragraph = await response.text();
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
  typingText.querySelectorAll("span")[0].classList.add("active"); // Highlight the first character
  charIndex = 0; // Reset character index
}

// Initialize typing and handle logic
function initTyping(e) {
  const char = typingText.querySelectorAll("span");
  const typedChar = e.key; // Get the key the user pressed

  if (charIndex < char.length && timeleft > 0) {
    if (!isTyping) {
      timer = setInterval(initTimer, 1000);
      isTyping = true;
    }

    if (char[charIndex].innerText === typedChar) {
      char[charIndex].classList.add("correct");
    } else {
      char[charIndex].classList.add("incorrect");
      mistake++;
      mistakes.textContent = mistake; // Update mistakes count
    }
    charIndex++;
    if (charIndex < char.length) {
      char[charIndex].classList.add("active");
    }
    cpm.innerText = charIndex - mistake; // Update CPM (Characters Per Minute)
  } else if (timeleft <= 0) {
    clearInterval(timer);
    showResultModal(); // Show result modal when time is up
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
    wpm.innerText = wpmVal; // Update WPM (Words Per Minute)
  } else {
    clearInterval(timer);
    showResultModal(); // Show result modal when time is up
  }
}

// Show result modal to ask user's name
function showResultModal() {
  modal.style.display = "block"; // Show the modal
}

// Close modal on clicking close button
closeBtn.onclick = function () {
  modal.style.display = "none"; // Hide the modal
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
    generatePDF(userName); // Generate PDF report after getting the user's name
    modal.style.display = "none"; // Hide the modal after PDF is generated
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
  // Define PDF content
  const pdfContent = `
    Typing Test Report\n\n
    Name: ${userName}\n
    Mistakes: ${mistake}\n
    Words Per Minute (WPM): ${wpm.innerText}\n
    Characters Per Minute (CPM): ${cpm.innerText}
  `;

  // Create a new jsPDF document
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(pdfContent, 10, 10); // Add the text to the PDF at position (10, 10)

  // Save the PDF with the user's name
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

document.addEventListener("keydown", initTyping); // Handle typing events
btn.addEventListener("click", reset); // Reset game when clicking "Try Again"
