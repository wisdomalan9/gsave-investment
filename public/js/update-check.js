(function () {
  const CHECK_INTERVAL = 30000;
  const VERSION_URL = "/version.json";

  async function getVersion() {
    try {
      const response = await fetch(
        VERSION_URL + "?t=" + Date.now(),
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache"
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.version || null;
    } catch {
      return null;
    }
  }

  async function checkForUpdate() {
    const serverVersion = await getVersion();

    if (!serverVersion) return;

    const currentVersion = sessionStorage.getItem("gsave_build_version");

    if (!currentVersion) {
      sessionStorage.setItem("gsave_build_version", serverVersion);
      return;
    }

    if (serverVersion !== currentVersion) {
      sessionStorage.setItem("gsave_build_version", serverVersion);

      console.log(
        "🔄 New GSAVE version detected:",
        serverVersion
      );

      window.location.reload();
    }
  }

  checkForUpdate();

  setInterval(checkForUpdate, CHECK_INTERVAL);
})();
