document.getElementById('analyze-button').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || tabs.length === 0) {
      console.error("No active tab found");
      return;
    }
    
    const activeTab = tabs[0];
    
    if (!activeTab.url || !activeTab.url.includes('petroleum.land')) {
      alert('Please navigate to the PetroleumLand game first!');
      return;
    }
    
    try {
      chrome.tabs.sendMessage(activeTab.id, {action: "analyze"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          alert("Couldn't connect to the game page. Please refresh the page and try again.");
        } else {
          console.log("Analysis started");
          window.close();
        }
      });
    } catch (e) {
      console.error("Error:", e);
      alert("An error occurred. Please refresh the game page and try again.");
    }
  });
});