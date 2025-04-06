
chrome.runtime.onInstalled.addListener(() => {
  console.log('PetroleumLand Helper extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  return true;
});