const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const FIREBASE_HOSTING_URL = "https://bookmarkhub-5ea6c.web.app";

let creatingOffscreenDocument;

async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some((client) =>
    client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
  } else {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
      justification: "Firebase Authentication",
    });
    await creatingOffscreenDocument;
    creatingOffscreenDocument = null;
  }
}

async function getAuthFromOffscreen() {
  await setupOffscreenDocument();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getAuth", target: "offscreen" },
      (response) => {
        console.log("Background received response:", response);

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.error) {
          console.error("Auth error:", response.error);
          reject(new Error(response.error));
        } else if (response && response.user) {
          console.log("Auth success:", response.user);
          resolve(response.user);
        } else {
          console.error("Invalid response:", response);
          reject(new Error("인증 응답이 올바르지 않습니다."));
        }
      }
    );
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "signIn") {
    console.log("Background received signIn request");
    getAuthFromOffscreen()
      .then((user) => {
        console.log("Storing user data:", user);
        chrome.storage.local.set({ user: user }, () => {
          sendResponse({ user: user });
        });
      })
      .catch((error) => {
        console.error("Authentication error:", error);
        // 오류 객체를 올바르게 처리
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : error?.message || "알 수 없는 인증 오류가 발생했습니다.";
        sendResponse({ error: errorMessage });
      });
    return true; // Indicates we will send a response asynchronously
  } else if (message.action === "signOut") {
    console.log("Background received signOut request");
    chrome.storage.local.remove("user", () => {
      sendResponse();
    });
    return true;
  }
});
