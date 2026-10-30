
/* ==========================================
   GURDEV SINGH OFFICIAL WEBSITE
   ========================================== */

const CONFIG = {
  emailjs: {
    serviceId: "service_u3nzatk",
    templateId: "template_a8nim6i",
    publicKey: "icpgvXA2eYDhbOkgI",
    recipient: "socialteam932@gmail.com"
  },

  youtube: {
    handle: "@TheGurdevSingh",

    // Yahan apni NEW restricted YouTube API key paste karna.
    apiKey: "PASTE_YOUR_NEW_RESTRICTED_API_KEY_HERE"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentYear").textContent =
    new Date().getFullYear();

  setupMobileMenu();
  setupRevealAnimations();
  setupFeedbackForm();
  loadYouTubeChannel();
});


/* ==========================================
   MOBILE MENU
   ========================================== */

function setupMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const navigation = document.getElementById("navigation");

  if (!toggle || !navigation) return;

  toggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    });
  });
}


/* ==========================================
   SCROLL ANIMATIONS
   ========================================== */

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach(element => {
      element.classList.add("visible");
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12
  });

  elements.forEach(element => observer.observe(element));
}


/* ==========================================
   EMAILJS FEEDBACK FORM
   ========================================== */

function setupFeedbackForm() {
  const form = document.getElementById("feedbackForm");
  const status = document.getElementById("formStatus");
  const button = document.getElementById("submitButton");

  if (!form || !status || !button) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    status.textContent = "";
    status.classList.remove("error");

    if (!form.reportValidity()) return;

    if (!window.emailjs) {
      showError(
        status,
        "Email service load nahi hui. Internet connection check karke page refresh karein."
      );
      return;
    }

    const {
      serviceId,
      templateId,
      publicKey
    } = CONFIG.emailjs;

    if (!serviceId || !templateId || !publicKey) {
      showError(status, "EmailJS configuration incomplete hai.");
      return;
    }

    const name = form.elements.from_name.value.trim();
    const email = form.elements.from_email.value.trim();
    const topic = form.elements.topic.value;
    const message = form.elements.message.value.trim();

    if (!name || !email || !topic || !message) {
      showError(status, "Please saari fields fill karein.");
      return;
    }

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "Sending your message...";

    try {
      emailjs.init({
        publicKey: publicKey
      });

      const templateParams = {
        from_name: name,
        from_email: email,
        reply_to: email,
        topic: topic,
        message: message,
        to_email: CONFIG.emailjs.recipient
      };

      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams
      );

      console.log("EmailJS response:", response);

      status.classList.remove("error");
      status.textContent =
        "✓ Message sent successfully! Thank you for contacting me.";

      form.reset();

    } catch (error) {
      console.error("EmailJS Error:", error);

      const errorMessage =
        error?.text ||
        error?.message ||
        "Unknown EmailJS error";

      showError(
        status,
        "Message send nahi hua: " + errorMessage
      );

    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}


function showError(element, message) {
  element.classList.add("error");
  element.textContent = message;
}


/* ==========================================
   YOUTUBE CHANNEL DATA
   ========================================== */

async function loadYouTubeChannel() {
  const status = document.getElementById("youtubeStatus");
  const grid = document.getElementById("videoGrid");

  const apiKey = CONFIG.youtube.apiKey;

  if (!apiKey || apiKey.includes("PASTE_YOUR")) {
    status.textContent = "YouTube API key required.";

    grid.innerHTML = `
      <div class="video-placeholder">
        YouTube API key add karne ke baad latest videos yahan show honge.
        Abhi channel ka Visit Channel button working hai.
      </div>
    `;

    return;
  }

  try {
    /* Get channel details */

    const channelURL = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );

    channelURL.search = new URLSearchParams({
      part: "snippet,statistics,contentDetails",
      forHandle: CONFIG.youtube.handle,
      key: apiKey
    });

    const channelResponse = await fetch(channelURL);
    const channelData = await channelResponse.json();

    if (!channelResponse.ok) {
      throw new Error(
        channelData.error?.message || "YouTube channel request failed."
      );
    }

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("YouTube channel nahi mila. Handle check karein.");
    }

    const channel = channelData.items[0];
    const statistics = channel.statistics;

    document.getElementById("subscriberCount").textContent =
      statistics.hiddenSubscriberCount
        ? "Hidden"
        : formatNumber(statistics.subscriberCount);

    document.getElementById("viewCount").textContent =
      formatNumber(statistics.viewCount);

    document.getElementById("videoCount").textContent =
      formatNumber(statistics.videoCount);


    /* Get latest uploads playlist */

    const uploadsPlaylist =
      channel.contentDetails.relatedPlaylists.uploads;

    const playlistURL = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );

    playlistURL.search = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylist,
      maxResults: "6",
      key: apiKey
    });

    const playlistResponse = await fetch(playlistURL);
    const playlistData = await playlistResponse.json();

    if (!playlistResponse.ok) {
      throw new Error(
        playlistData.error?.message || "Latest videos load nahi hue."
      );
    }

    displayVideos(playlistData.items || []);

    status.textContent = "Latest uploads from YouTube";

  } catch (error) {
    console.error("YouTube Error:", error);

    status.textContent = "YouTube data load nahi hua.";

    grid.innerHTML = `
      <div class="video-placeholder">
        ${escapeHTML(error.message)}
        <br><br>
        API key, YouTube Data API v3 aur website restrictions check karein.
      </div>
    `;
  }
}


/* ==========================================
   DISPLAY YOUTUBE VIDEOS
   ========================================== */

function displayVideos(videos) {
  const grid = document.getElementById("videoGrid");

  if (!videos.length) {
    grid.innerHTML = `
      <div class="video-placeholder">
        Abhi koi public video available nahi mila.
      </div>
    `;
    return;
  }

  grid.innerHTML = videos.map(video => {
    const snippet = video.snippet || {};

    const videoId =
      video.contentDetails?.videoId ||
      snippet.resourceId?.videoId;

    if (!videoId) return "";

    const title = escapeHTML(
      snippet.title || "YouTube Video"
    );

    const thumbnails = snippet.thumbnails || {};

    const thumbnail =
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;

    const publishedDate = snippet.publishedAt
      ? new Date(snippet.publishedAt).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric"
          }
        )
      : "";

    return `
      <a
        class="video-card"
        href="https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}"
        target="_blank"
        rel="noopener"
      >
        <img
          src="${escapeHTML(thumbnail)}"
          alt="${title}"
          loading="lazy"
        >

        <div class="video-card-content">
          <h4>${title}</h4>
          <p>${escapeHTML(publishedDate)} · Watch on YouTube ↗</p>
        </div>
      </a>
    `;
  }).join("");
}


/* ==========================================
   HELPER FUNCTIONS
   ========================================== */

function formatNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}


function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
