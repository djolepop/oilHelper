function timeStringToHours(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;
  let totalHours = 0;
  const dayMatch = timeString.match(/(\d+)d/);
  if (dayMatch) totalHours += parseInt(dayMatch[1]) * 24;
  const hourMatch = timeString.match(/(\d+)h/);
  if (hourMatch) totalHours += parseInt(hourMatch[1]);
  const minuteMatch = timeString.match(/(\d+)m/);
  if (minuteMatch) totalHours += parseInt(minuteMatch[1]) / 60;
  const secondMatch = timeString.match(/(\d+)s/);
  if (secondMatch) totalHours += parseInt(secondMatch[1]) / 3600;
  return totalHours;
}

function formatTime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid Time";
  }
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

function formatMinutes(minutes) {
  if (typeof minutes !== 'number') return "0h 0m";
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}h ${mins}m`;
}

function waitForElement(selector, timeout = 15000, maxRetries = 10) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    const startTime = Date.now();
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Element ${selector} not found. Retry ${retryCount}/${maxRetries}`);
          setTimeout(() => {
            window.location.reload();
            setTimeout(() => checkElement(), 3000);
          }, 1000);
          return;
        } else {
          reject(new Error(`Timeout waiting for element: ${selector} after ${maxRetries} retries`));
          return;
        }
      }
      setTimeout(checkElement, 500);
    };
    checkElement();
  });
}

function reloadWithRetry(maxRetries = 10) {
  const retryCountStr = localStorage.getItem('petroleumHelperReloadRetry');
  const retryCount = retryCountStr ? parseInt(retryCountStr, 10) : 0;
  if (retryCount < maxRetries) {
    localStorage.setItem('petroleumHelperReloadRetry', (retryCount + 1).toString());
    console.log(`Page seems stuck, reloading (retry ${retryCount + 1}/${maxRetries})`);
    window.location.reload();
  } else {
    localStorage.removeItem('petroleumHelperReloadRetry');
    console.error("Max retries reached, skipping this plot");
    const storedDataString = localStorage.getItem('petroleumHelperData');
    if (storedDataString) {
      try {
        const storedData = JSON.parse(storedDataString);
        if (storedData.analysisInProgress) {
          const currentPlot = storedData.plotsToAnalyze[storedData.currentPlotIndex];
          storedData.plotsWithDetails.push({
            ...currentPlot,
            pumpDetails: [],
            validPumps: 0,
            error: "Page failed to load correctly after multiple retries"
          });
          storedData.currentPlotIndex++;
          storedData.retryCount = 0;
          if (storedData.currentPlotIndex >= storedData.plotsToAnalyze.length) {
            storedData.analysisComplete = true;
            storedData.analysisInProgress = false;
            localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
            window.location.href = storedData.dashboardUrl;
          } else {
            localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
            const nextPlot = storedData.plotsToAnalyze[storedData.currentPlotIndex];
            window.location.href = `https://petroleum.land/dashboard/plot/${nextPlot.id}`;
          }
        }
      } catch (error) {
        console.error("Error handling retry failure:", error);
      }
    }
  }
}

function createHelperUI() {
  const container = document.createElement('div');
  container.id = 'petroleum-helper';
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.zIndex = '9999';
  container.style.backgroundColor = '#222';
  container.style.color = '#fff';
  container.style.borderRadius = '5px';
  container.style.padding = '10px';
  container.style.width = '300px';
  container.style.maxHeight = '90vh';
  container.style.overflowY = 'auto';
  container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  container.style.fontFamily = 'Arial, sans-serif';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '10px';

  const title = document.createElement('h2');
  title.textContent = 'PetroleumLand Helper';
  title.style.margin = '0';
  title.style.fontSize = '16px';

  const buttonContainer = document.createElement('div');

  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = '−';
  minimizeButton.style.marginRight = '5px';
  minimizeButton.style.background = 'none';
  minimizeButton.style.border = '1px solid #555';
  minimizeButton.style.borderRadius = '3px';
  minimizeButton.style.color = '#fff';
  minimizeButton.style.cursor = 'pointer';
  minimizeButton.onclick = function() {
    const content = document.getElementById('petroleum-helper-content');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      minimizeButton.textContent = '−';
    } else {
      content.style.display = 'none';
      minimizeButton.textContent = '+';
    }
  };

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = '1px solid #555';
  closeButton.style.borderRadius = '3px';
  closeButton.style.color = '#fff';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = function() {
    document.body.removeChild(container);
  };

  buttonContainer.appendChild(minimizeButton);
  buttonContainer.appendChild(closeButton);

  header.appendChild(title);
  header.appendChild(buttonContainer);

  const content = document.createElement('div');
  content.id = 'petroleum-helper-content';

  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.gap = '8px';
  buttonRow.style.marginBottom = '10px';

  const analyzeButton = document.createElement('button');
  analyzeButton.textContent = 'Analyze Game Data';
  analyzeButton.style.padding = '8px 16px';
  analyzeButton.style.backgroundColor = '#48cae4';
  analyzeButton.style.color = '#000';
  analyzeButton.style.border = 'none';
  analyzeButton.style.borderRadius = '4px';
  analyzeButton.style.cursor = 'pointer';
  analyzeButton.style.flex = '1';
  analyzeButton.onclick = function() {
    analyzeGameData();
  };

  const updateButton = document.createElement('button');
  updateButton.textContent = 'Update Dashboard';
  updateButton.style.padding = '8px 16px';
  updateButton.style.backgroundColor = '#4CAF50';
  updateButton.style.color = '#000';
  updateButton.style.border = 'none';
  updateButton.style.borderRadius = '4px';
  updateButton.style.cursor = 'pointer';
  updateButton.style.flex = '1';
  updateButton.onclick = function() {
    updateDashboardData();
  };

  const claimButton = document.createElement('button');
  claimButton.textContent = 'Claim All Rewards';
  claimButton.style.padding = '8px 16px';
  claimButton.style.backgroundColor = '#FFC107';
  claimButton.style.color = '#000';
  claimButton.style.border = 'none';
  claimButton.style.borderRadius = '4px';
  claimButton.style.cursor = 'pointer';
  claimButton.style.flex = '1';
  claimButton.onclick = function() {
    claimAllRewards();
  };

  buttonRow.appendChild(analyzeButton);
  buttonRow.appendChild(updateButton);
  buttonRow.appendChild(claimButton);

  const timestampInfo = document.createElement('div');
  timestampInfo.id = 'data-timestamps';
  timestampInfo.style.fontSize = '10px';
  timestampInfo.style.color = '#aaa';
  timestampInfo.style.marginBottom = '10px';
  timestampInfo.innerHTML = 'No data loaded yet';

  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'analysis-results';
  resultsContainer.style.fontSize = '14px';

  content.appendChild(buttonRow);
  content.appendChild(timestampInfo);
  content.appendChild(resultsContainer);

  container.appendChild(header);
  container.appendChild(content);

  return container;
}

async function getDashboardData() {
  const resultsContainer = document.getElementById('analysis-results');
  resultsContainer.innerHTML = '<p>Collecting dashboard data...</p>';

  let currentBalance = 0;
  const balanceItems = document.querySelectorAll('div[class*="balanceItem"]');
  for (const item of balanceItems) {
    const infoText = item.textContent;
    if (infoText.includes('cOIL')) {
      const valueElement = item.querySelector('div[class*="balanceValue"]');
      if (valueElement) {
        currentBalance = parseFloat(valueElement.textContent.replace(/,/g, ''));
        break;
      }
    }
  }

  let unclaimedRewards = 0;
  const rewardElements = [
    ...document.querySelectorAll('div[class*="rewardValue"]'),
    ...document.querySelectorAll('div[class*="summaryInfo"] h3')
  ];
  for (const element of rewardElements) {
    if (element.textContent.includes('cOIL')) {
      const match = element.textContent.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        unclaimedRewards = parseFloat(match[1]);
        break;
      }
    }
  }

  if (unclaimedRewards === 0) {
    const labels = document.querySelectorAll('p');
    for (const label of labels) {
      if (label.textContent.includes('Current Rewards')) {
        const parent = label.closest('div');
        const h3 = parent?.querySelector('h3');
        if (h3) {
          const match = h3.textContent.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            unclaimedRewards = parseFloat(match[1]);
            break;
          }
        }
      }
    }
  }

  const totalAvailable = currentBalance + unclaimedRewards;
  const plotData = [];
  let totalDailyProduction = 0;
  let totalActivePumps = 0;
  let totalDecayedPumps = 0;

  const plotItems = document.querySelectorAll('div[class*="plotItem"]');
  for (const plot of plotItems) {
    const plotLinkElement = plot.closest('a[class*="plotLink"]');
    if (!plotLinkElement) continue;
    const plotUrl = plotLinkElement.getAttribute('href');
    const plotId = plotUrl.split('/').pop();

    const productionElements = plot.querySelectorAll('span[class*="statValue"]');
    let production = 0;
    let pumps = 0;
    let decayedPumps = 0;

    for (const element of productionElements) {
      const parentLabel = element.closest('div').querySelector('span[class*="statLabel"]');
      if (!parentLabel) continue;
      if (parentLabel.textContent.includes('Production')) {
        const match = element.textContent.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          production = parseFloat(match[1]);
        }
      } else if (parentLabel.textContent.includes('Pumps')) {
        const match = element.textContent.match(/(\d+)/);
        if (match) {
          pumps = parseInt(match[1]);
          if (pumps > 500) {
            pumps = parseInt(match[1].toString().slice(0, 2));
          }
          const decayedElement = element.querySelector('span[class*="decayedPumps"]');
          if (decayedElement) {
            const decayedMatch = decayedElement.textContent.match(/(\d+)/);
            if (decayedMatch) {
              decayedPumps = parseInt(decayedMatch[1]);
            }
          }
        }
      }
    }

    if (production > 0 && pumps > 0) {
      totalDailyProduction += production;
      totalActivePumps += pumps - decayedPumps;
      totalDecayedPumps += decayedPumps;
      plotData.push({ id: plotId, url: plotUrl, pumps, decayedPumps, production });
    }
  }

  const hourlyProduction = totalDailyProduction / 24;
  const minutelyProduction = hourlyProduction / 60;

  return {
    currentBalance,
    unclaimedRewards,
    totalAvailable,
    totalDailyProduction,
    hourlyProduction,
    minutelyProduction,
    totalActivePumps,
    totalDecayedPumps,
    plotData
  };
}

async function navigateToPlots(plotData) {
  const resultsContainer = document.getElementById('analysis-results');
  if (!confirm("The extension needs to navigate to each plot page to collect data. This will temporarily change your view but will return to the dashboard when complete.\n\nDo you want to continue?")) {
    resultsContainer.innerHTML += '<p>Analysis cancelled by user.</p>';
    return [];
  }
  const currentUrl = window.location.href;
  const dataToStore = {
    plotsToAnalyze: plotData,
    plotsWithDetails: [],
    currentPlotIndex: 0,
    dashboardUrl: currentUrl,
    analysisInProgress: true
  };
  localStorage.setItem('petroleumHelperData', JSON.stringify(dataToStore));
  if (plotData.length > 0) {
    window.location.href = `https://petroleum.land/dashboard/plot/${plotData[0].id}`;
  }
  return [];
}

async function continueAnalysis() {
  const storedDataString = localStorage.getItem('petroleumHelperData');
  if (!storedDataString) return;
  try {
    const storedData = JSON.parse(storedDataString);
    let container = document.getElementById('petroleum-helper');
    if (!container) {
      container = createHelperUI();
      document.body.appendChild(container);
    }
    const resultsContainer = document.getElementById('analysis-results');
    if (!resultsContainer) return;
    if (window.location.pathname.includes('/dashboard/plot/')) {
      if (!storedData.analysisInProgress) return;
      const currentIndex = storedData.currentPlotIndex;
      if (currentIndex === undefined || !storedData.plotsToAnalyze || !storedData.plotsToAnalyze[currentIndex]) {
        resultsContainer.innerHTML = '<p style="color: red;">Error: Invalid plot data</p>';
        return;
      }
      const currentPlot = storedData.plotsToAnalyze[currentIndex];
      resultsContainer.innerHTML = `<p>Analyzing plot #${currentPlot.id} (${currentIndex + 1}/${storedData.plotsToAnalyze.length})...</p>`;
      const pageLoadTimeout = setTimeout(() => {
        reloadWithRetry(10);
      }, 20000);
      try {
        await waitForElement('button[class*="tabButton"]', 15000, 10);
        clearTimeout(pageLoadTimeout);
        localStorage.removeItem('petroleumHelperReloadRetry');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const tabButtons = document.querySelectorAll('button[class*="tabButton"]');
        let pumpsButton = null;
        for (const button of tabButtons) {
          if (button.textContent.includes('Pumps')) {
            pumpsButton = button;
            break;
          }
        }
        if (pumpsButton) {
          pumpsButton.click();
          await waitForElement('table[class*="pumpTable"]', 15000, 10);
          await new Promise(resolve => setTimeout(resolve, 4000));
          const pumpRows = document.querySelectorAll('tr');
          let validPumps = 0;
          const pumpDetails = [];
          console.log(`Found ${pumpRows.length} rows in the pump table`);
          for (const row of pumpRows) {
            if (row.querySelector('th')) continue;
            const cells = row.querySelectorAll('td');
            if (cells.length < 6) continue;
            const decayTimeCell = cells[5];
            if (!decayTimeCell) continue;
            const decayTimeText = decayTimeCell.textContent.trim();
            console.log(`Found decay time: "${decayTimeText}"`);
            const decayHours = timeStringToHours(decayTimeText);
            const statusCell = cells[2];
            const status = statusCell ? statusCell.textContent.trim() : 'Unknown';
            const durabilityCell = cells[4];
            let durability = 100;
            if (durabilityCell) {
              const durabilityMatch = durabilityCell.textContent.match(/(\d+)%/);
              if (durabilityMatch) {
                durability = parseInt(durabilityMatch[1]);
              }
            }
            const productionCell = cells[7];
            let production = 0;
            if (productionCell) {
              const productionMatch = productionCell.textContent.match(/(\d+(?:\.\d+)?)/);
              if (productionMatch) {
                production = parseFloat(productionMatch[1]);
              }
            }
            pumpDetails.push({
              status,
              durability,
              decayHours,
              decayTimeText,
              production
            });
            validPumps++;
          }
          console.log(`Processed ${validPumps} valid pumps with details`);
          console.log(`Found ${pumpDetails.filter(p => p.decayHours > 0).length} pumps with decay times`);
          const maxRetries = 10;
          let retryCount = storedData.retryCount || 0;
          if (validPumps < currentPlot.pumps - currentPlot.decayedPumps && retryCount < maxRetries) {
            resultsContainer.innerHTML += `<p>Found ${validPumps}/${currentPlot.pumps} pumps. Retrying (${retryCount + 1}/${maxRetries})...</p>`;
            storedData.retryCount = retryCount + 1;
            localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
            window.location.reload();
            return;
          }
          storedData.plotsWithDetails.push({
            ...currentPlot,
            pumpDetails,
            validPumps
          });
        } else {
          if (storedData.retryCount < 10) {
            storedData.retryCount = (storedData.retryCount || 0) + 1;
            localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
            window.location.reload();
            return;
          }
          storedData.plotsWithDetails.push({
            ...currentPlot,
            pumpDetails: [],
            validPumps: 0,
            error: "Couldn't find Pumps tab"
          });
        }
      } catch (error) {
        console.error(`Error processing plot ${currentPlot.id}:`, error);
        if (error.message.includes("Timeout waiting for element") && (!storedData.retryCount || storedData.retryCount < 10)) {
          storedData.retryCount = (storedData.retryCount || 0) + 1;
          localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
          console.log(`Retrying plot ${currentPlot.id} due to timeout (attempt ${storedData.retryCount}/10)`);
          window.location.reload();
          return;
        }
        storedData.plotsWithDetails.push({
          ...currentPlot,
          pumpDetails: [],
          validPumps: 0,
          error: error.toString()
        });
      }
      storedData.currentPlotIndex++;
      storedData.retryCount = 0;
      if (storedData.currentPlotIndex >= storedData.plotsToAnalyze.length) {
        storedData.analysisComplete = true;
        storedData.analysisInProgress = false;
        localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
        window.location.href = storedData.dashboardUrl;
      } else {
        localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
        const nextPlot = storedData.plotsToAnalyze[storedData.currentPlotIndex];
        window.location.href = `https://petroleum.land/dashboard/plot/${nextPlot.id}`;
      }
    } else if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/') {
      if (storedData.analysisComplete) {
        resultsContainer.innerHTML = '<p>Analysis complete! Processing results...</p>';
        setTimeout(async () => {
          try {
            const dashboardData = await getDashboardData();
            let plotsWithDetails;
            try {
              plotsWithDetails = storedData.plotsWithDetails || [];
              if (!Array.isArray(plotsWithDetails)) {
                throw new Error("Invalid plot details format");
              }
              console.log("Processing results with:", { dashboardData, plotsDetails: `${plotsWithDetails.length} plots loaded` });
            } catch (parseError) {
              resultsContainer.innerHTML = `<p style="color: red;">Error parsing data: ${parseError.message}</p>`;
              return;
            }
            try {
              if (!dashboardData.hourlyProduction || !dashboardData.totalAvailable) {
                throw new Error("Missing critical dashboard data");
              }
              const reinvestmentData = calculateReinvestmentPotential(dashboardData, plotsWithDetails);
              try {
                displayResults(dashboardData, plotsWithDetails, reinvestmentData);
                try {
                  const safeData = {
                    dashboardData: {
                      currentBalance: dashboardData.currentBalance || 0,
                      unclaimedRewards: dashboardData.unclaimedRewards || 0,
                      totalAvailable: dashboardData.totalAvailable || 0,
                      totalDailyProduction: dashboardData.totalDailyProduction || 0,
                      hourlyProduction: dashboardData.hourlyProduction || 0,
                      minutelyProduction: dashboardData.minutelyProduction || 0,
                      totalActivePumps: dashboardData.totalActivePumps || 0,
                      totalDecayedPumps: dashboardData.totalDecayedPumps || 0
                    },
                    plotsWithDetails: plotsWithDetails.map(plot => ({
                      id: plot.id,
                      pumps: plot.pumps || 0,
                      decayedPumps: plot.decayedPumps || 0,
                      production: plot.production || 0,
                      validPumps: plot.validPumps || 0,
                      pumpDetails: plot.pumpDetails || []
                    })),
                    reinvestmentData: {
                      immediateRepairCost: reinvestmentData.immediateRepairCost || 0,
                      availableAfterImmediateRepairs: reinvestmentData.availableAfterImmediateRepairs || 0,
                      maxImmediateReinvestPumps: reinvestmentData.maxImmediateReinvestPumps || 0,
                      reservedForUpcomingRepairs: reinvestmentData.reservedForUpcomingRepairs || 0,
                      recommendedPumps: reinvestmentData.recommendedPumps || 0,
                      totalRepairCosts: reinvestmentData.totalRepairCosts || 0,
                      nextCriticalRepair: reinvestmentData.nextCriticalRepair || "None",
                      decayBatches: Array.isArray(reinvestmentData.decayBatches) ?
                        reinvestmentData.decayBatches.map(batch => ({
                          minute: batch.minute || 0,
                          minuteOffset: batch.minuteOffset || 0,
                          count: batch.count || 0,
                          cost: batch.cost || 0,
                          timeStamp: batch.time instanceof Date ? batch.time.getTime() : Date.now()
                        })) : [],
                      pumpPurchaseSchedule: Array.isArray(reinvestmentData.pumpPurchaseSchedule) ?
                        reinvestmentData.pumpPurchaseSchedule.map(pump => ({
                          pumpNumber: pump.pumpNumber || 0,
                          minute: pump.minute || 0,
                          oilNeeded: pump.oilNeeded || 0,
                          timeStamp: pump.time instanceof Date ? pump.time.getTime() : Date.now()
                        })) : []
                    },
                    timestamp: Date.now(),
                    dashboardUpdateTime: Date.now()
                  };
                  localStorage.setItem('petroleumHelperCompleteResults', JSON.stringify(safeData));
                  storedData.analysisComplete = false;
                  localStorage.setItem('petroleumHelperData', JSON.stringify(storedData));
                } catch (storageError) {
                  console.error("Error storing results:", storageError);
                }
                updateTimestampDisplay();
              } catch (displayError) {
                console.error("Error displaying results:", displayError);
                resultsContainer.innerHTML = `<p style="color: red;">Error displaying results: ${displayError.message}</p>`;
              }
            } catch (calcError) {
              console.error("Error calculating investment potential:", calcError);
              resultsContainer.innerHTML = `<p style="color: red;">Error calculating investment: ${calcError.message}</p>`;
            }
          } catch (error) {
            resultsContainer.innerHTML = `<p style="color: red;">Error processing results: ${error.message}</p>`;
            console.error("Error processing analysis results:", error);
          }
        }, 3000);
      } else {
        const completedResultsString = localStorage.getItem('petroleumHelperCompleteResults');
        if (completedResultsString && resultsContainer.innerHTML === '') {
          try {
            const completedResults = JSON.parse(completedResultsString);
            let isRecent = false;
            if (completedResults.timestamp) {
              try {
                const timestamp = Number(completedResults.timestamp);
                isRecent = !isNaN(timestamp) && (Date.now() - timestamp < 24 * 60 * 60 * 1000);
              } catch (e) {
                console.error("Error parsing timestamp:", e);
              }
            }
            if (isRecent && completedResults.dashboardData && completedResults.plotsWithDetails) {
              try {
                if (completedResults.reinvestmentData && completedResults.reinvestmentData.decayBatches) {
                  for (const batch of completedResults.reinvestmentData.decayBatches) {
                    if (batch.timeStamp) {
                      try {
                        batch.time = new Date(batch.timeStamp);
                      } catch (e) {
                        console.error("Error creating date from timestamp:", e);
                        batch.time = new Date();
                      }
                    } else {
                      batch.time = new Date();
                    }
                  }
                }
                if (completedResults.reinvestmentData && completedResults.reinvestmentData.pumpPurchaseSchedule) {
                  for (const pump of completedResults.reinvestmentData.pumpPurchaseSchedule) {
                    if (pump.timeStamp) {
                      try {
                        pump.time = new Date(pump.timeStamp);
                      } catch (e) {
                        console.error("Error creating date from timestamp:", e);
                        pump.time = new Date();
                      }
                    } else {
                      pump.time = new Date();
                    }
                  }
                }
                displayResults(
                  completedResults.dashboardData,
                  completedResults.plotsWithDetails,
                  completedResults.reinvestmentData
                );
              } catch (displayError) {
                console.error("Error displaying saved results:", displayError);
                resultsContainer.innerHTML = `<p style="color: red;">Error displaying saved results: ${displayError.message}</p>`;
              }
            }
          } catch (error) {
            console.error("Error restoring completed results:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error continuing analysis:', error);
    const resultsContainer = document.getElementById('analysis-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  }
}

async function updateDashboardData() {
  const resultsContainer = document.getElementById('analysis-results');
  const timestampInfo = document.getElementById('data-timestamps');
  resultsContainer.innerHTML = '<p>Updating dashboard data...</p>';
  try {
    const dashboardData = await getDashboardData();
    const completedResultsString = localStorage.getItem('petroleumHelperCompleteResults');
    if (!completedResultsString) {
      resultsContainer.innerHTML = '<p>No previous analysis found. Please run a full analysis first.</p>';
      return;
    }
    const completedResults = JSON.parse(completedResultsString);
    const originalDecayBatches = completedResults.reinvestmentData &&
      completedResults.reinvestmentData.decayBatches ?
      JSON.parse(JSON.stringify(completedResults.reinvestmentData.decayBatches)) : [];
    const updatedData = {
      ...completedResults,
      dashboardData: {
        currentBalance: dashboardData.currentBalance,
        unclaimedRewards: dashboardData.unclaimedRewards,
        totalAvailable: dashboardData.totalAvailable,
        totalDailyProduction: dashboardData.totalDailyProduction,
        hourlyProduction: dashboardData.hourlyProduction,
        minutelyProduction: dashboardData.minutelyProduction,
        totalActivePumps: dashboardData.totalActivePumps,
        totalDecayedPumps: dashboardData.totalDecayedPumps
      },
      dashboardUpdateTime: Date.now()
    };
    try {
      const plotsWithDetails = completedResults.plotsWithDetails || [];
      const currentTime = Date.now();
      const updatedDecayBatches = originalDecayBatches
        .filter(batch => {
          if (batch.originalTimeStamp) {
            return batch.originalTimeStamp > currentTime;
          } else if (batch.timeStamp) {
            return batch.timeStamp > currentTime;
          }
          return false;
        })
        .map(batch => {
          const targetTime = batch.originalTimeStamp || batch.timeStamp;
          const minutesRemaining = Math.max(0, Math.floor((targetTime - currentTime) / (60 * 1000)));
          return {
            ...batch,
            minute: minutesRemaining,
            minuteOffset: minutesRemaining,
            timeStamp: targetTime,
            originalTimeStamp: targetTime,
            time: new Date(targetTime)
          };
        })
        .sort((a, b) => a.minute - b.minute);
      const immediateRepairCost = dashboardData.totalDecayedPumps * 50;
      const availableAfterImmediateRepairs = Math.max(0, dashboardData.totalAvailable - immediateRepairCost);
      const repairCostsByMinute = {};
      let totalRepairCosts = 0;
      for (const batch of updatedDecayBatches) {
        repairCostsByMinute[batch.minute] = batch.cost;
        totalRepairCosts += batch.cost;
      }
      const firstRepair = updatedDecayBatches.length > 0 ? updatedDecayBatches[0] : null;
      const nextCriticalRepairTime = firstRepair ? formatMinutes(firstRepair.minute) : "None";
      const next12HoursRepairs = updatedDecayBatches
        .filter(batch => batch.minute <= 12 * 60)
        .reduce((sum, batch) => sum + batch.cost, 0);
      const next12HoursProduction = 12 * dashboardData.hourlyProduction;
      const balanceAfter12Hours = availableAfterImmediateRepairs + next12HoursProduction - next12HoursRepairs;
      let recommendedPumps = 0;
      let reservedForUpcomingRepairs = 0;
      if (balanceAfter12Hours >= 0) {
        let simulatedBalance = availableAfterImmediateRepairs;
        let lowestBalance = simulatedBalance;
        let lowestMinute = 0;
        for (let minute = 1; minute <= 12 * 60; minute++) {
          simulatedBalance += dashboardData.minutelyProduction;
          if (repairCostsByMinute[minute]) {
            simulatedBalance -= repairCostsByMinute[minute];
          }
          if (simulatedBalance < lowestBalance) {
            lowestBalance = simulatedBalance;
            lowestMinute = minute;
          }
        }
        if (lowestBalance >= 0) {
          recommendedPumps = Math.floor(lowestBalance / 50);
          reservedForUpcomingRepairs = availableAfterImmediateRepairs - (recommendedPumps * 50);
        } else {
          reservedForUpcomingRepairs = Math.abs(lowestBalance);
          const safeToSpend = availableAfterImmediateRepairs - reservedForUpcomingRepairs;
          recommendedPumps = Math.max(0, Math.floor(safeToSpend / 50));
        }
      } else {
        reservedForUpcomingRepairs = availableAfterImmediateRepairs;
        recommendedPumps = 0;
      }
      const pumpPurchaseSchedule = [];
      const maxImmediateReinvestPumps = Math.floor(availableAfterImmediateRepairs / 50);
      let runningBalance = availableAfterImmediateRepairs - (recommendedPumps * 50);
      let nextPumpNumber = recommendedPumps + 1;
      for (let minute = 1; minute <= 24 * 60; minute++) {
        runningBalance += dashboardData.minutelyProduction;
        if (repairCostsByMinute[minute]) {
          runningBalance -= repairCostsByMinute[minute];
        }
        if (runningBalance >= 50) {
          let sufficientBuffer = true;
          let tempBalance = runningBalance - 50;
          for (let futureMinute = minute + 1; futureMinute <= minute + 60; futureMinute++) {
            if (repairCostsByMinute[futureMinute]) {
              tempBalance -= repairCostsByMinute[futureMinute];
              if (tempBalance < 0) {
                sufficientBuffer = false;
                break;
              }
            }
            tempBalance += dashboardData.minutelyProduction;
          }
          if (sufficientBuffer) {
            const pumpTime = new Date(currentTime + minute * 60 * 1000);
            const pumpTimeStamp = pumpTime.getTime();
            pumpPurchaseSchedule.push({
              pumpNumber: nextPumpNumber,
              time: pumpTime,
              timeStamp: pumpTimeStamp,
              originalTimeStamp: pumpTimeStamp,
              oilNeeded: nextPumpNumber * 50,
              minute
            });
            runningBalance -= 50;
            nextPumpNumber++;
            if (pumpPurchaseSchedule.length >= 20) break;
          }
        }
      }
      const updatedReinvestmentData = {
        immediateRepairCost,
        availableAfterImmediateRepairs,
        maxImmediateReinvestPumps,
        reservedForUpcomingRepairs,
        recommendedPumps,
        pumpPurchaseSchedule,
        decayBatches: updatedDecayBatches,
        totalRepairCosts,
        nextCriticalRepair: nextCriticalRepairTime,
        next12HoursRepairs
      };
      updatedData.reinvestmentData = updatedReinvestmentData;
      localStorage.setItem('petroleumHelperCompleteResults', JSON.stringify(updatedData));
      displayResults(dashboardData, plotsWithDetails, updatedReinvestmentData);
      updateTimestampDisplay();
    } catch (error) {
      resultsContainer.innerHTML = `<p style="color: red;">Error recalculating recommendations: ${error.message}</p>`;
      console.error("Error during dashboard update:", error);
    }
  } catch (error) {
    resultsContainer.innerHTML = `<p style="color: red;">Error updating dashboard data: ${error.message}</p>`;
    console.error("Error updating dashboard data:", error);
  }
}

function updateTimestampDisplay() {
  const timestampInfo = document.getElementById('data-timestamps');
  if (!timestampInfo) return;
  try {
    const completedResultsString = localStorage.getItem('petroleumHelperCompleteResults');
    if (!completedResultsString) {
      timestampInfo.innerHTML = 'No data loaded yet';
      return;
    }
    const completedResults = JSON.parse(completedResultsString);
    const originalTimestamp = completedResults.timestamp || 0;
    const dashboardUpdateTime = completedResults.dashboardUpdateTime || originalTimestamp;
    const formatTime = (timestamp) => {
      if (!timestamp) return 'Never';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
    timestampInfo.innerHTML = `
      <div>Decay data collected: ${formatTime(originalTimestamp)}</div>
      <div>Dashboard last updated: ${formatTime(dashboardUpdateTime)}</div>
    `;
  } catch (e) {
    console.error("Error updating timestamp display:", e);
    timestampInfo.innerHTML = 'Error loading timestamp data';
  }
}

async function claimAllRewards() {
  const resultsContainer = document.getElementById('analysis-results');
  resultsContainer.innerHTML = '<p>Preparing to claim all rewards...</p>';
  let plotsToVisit = [];
  try {
    const completedResultsString = localStorage.getItem('petroleumHelperCompleteResults');
    if (completedResultsString) {
      const completedResults = JSON.parse(completedResultsString);
      if (completedResults.plotsWithDetails && Array.isArray(completedResults.plotsWithDetails)) {
        plotsToVisit = completedResults.plotsWithDetails.filter(plot => plot.pumps > 0);
      }
    }
  } catch (e) {
    console.error("Error getting plots data:", e);
  }
  if (plotsToVisit.length === 0) {
    try {
      const dashboardData = await getDashboardData();
      plotsToVisit = dashboardData.plotData.filter(plot => plot.pumps > 0);
    } catch (error) {
      resultsContainer.innerHTML = `<p style="color: red;">Error identifying plots: ${error.message}</p>`;
      return;
    }
  }
  if (plotsToVisit.length === 0) {
    resultsContainer.innerHTML = '<p>No plots with pumps found to claim rewards from.</p>';
    return;
  }
  if (!confirm(`Ready to claim rewards from ${plotsToVisit.length} plots. This will navigate through all your plots and require you to approve transactions. Continue?`)) {
    resultsContainer.innerHTML = '<p>Claiming cancelled by user.</p>';
    return;
  }
  const currentUrl = window.location.href;
  const dataToStore = {
    plotsToVisit,
    currentPlotIndex: 0,
    dashboardUrl: currentUrl,
    claimingInProgress: true,
    totalClaimed: 0
  };
  localStorage.setItem('petroleumHelperClaimData', JSON.stringify(dataToStore));
  if (plotsToVisit.length > 0) {
    window.location.href = `https://petroleum.land/dashboard/plot/${plotsToVisit[0].id}`;
  }
}

async function continueClaiming() {
  const claimDataString = localStorage.getItem('petroleumHelperClaimData');
  if (!claimDataString) return;
  try {
    const claimData = JSON.parse(claimDataString);
    if (!claimData.claimingInProgress) return;
    let container = document.getElementById('petroleum-helper');
    if (!container) {
      container = createHelperUI();
      document.body.appendChild(container);
    }
    const resultsContainer = document.getElementById('analysis-results');
    if (!resultsContainer) return;
    if (window.location.pathname.includes('/dashboard/plot/')) {
      const currentIndex = claimData.currentPlotIndex;
      if (currentIndex === undefined || !claimData.plotsToVisit || !claimData.plotsToVisit[currentIndex]) {
        resultsContainer.innerHTML = '<p style="color: red;">Error: Invalid plot data for claiming</p>';
        return;
      }
      const currentPlot = claimData.plotsToVisit[currentIndex];
      resultsContainer.innerHTML = `<p>Claiming rewards from plot #${currentPlot.id} (${currentIndex + 1}/${claimData.plotsToVisit.length})...</p>`;
      try {
        await waitForElement('div[class*="rewardsContainer"]', 20000);
        await new Promise(resolve => setTimeout(resolve, 3000));
        const rewardsContainer = document.querySelector('div[class*="rewardsContainer"]');
        if (rewardsContainer) {
          const rewardValueElement = rewardsContainer.querySelector('div[class*="rewardValue"]');
          let initialRewardText = '';
          let initialRewardValue = 0;
          if (rewardValueElement) {
            initialRewardText = rewardValueElement.textContent;
            const match = initialRewardText.match(/(\d+(?:\.\d+)?)/);
            if (match) {
              initialRewardValue = parseFloat(match[1]);
            }
          }
          if (initialRewardValue > 0) {
            const storeButton = Array.from(rewardsContainer.querySelectorAll('button'))
              .find(button => button.textContent.includes('Store'));
            if (storeButton) {
              resultsContainer.innerHTML += `<p>Found ${initialRewardValue.toFixed(4)} cOIL to claim. Clicking Store button...</p>`;
              storeButton.click();
              let maxWaitTime = 120000;
              let waitInterval = 1000;
              let elapsedTime = 0;
              resultsContainer.innerHTML += `<p>Waiting for transaction confirmation...</p>`;
              const waitForRewardChange = async () => {
                while (elapsedTime < maxWaitTime) {
                  await new Promise(resolve => setTimeout(resolve, waitInterval));
                  elapsedTime += waitInterval;
                  const updatedValueElement = document.querySelector('div[class*="rewardValue"]');
                  if (updatedValueElement) {
                    const updatedText = updatedValueElement.textContent;
                    const updatedMatch = updatedText.match(/(\d+(?:\.\d+)?)/);
                    if (updatedMatch) {
                      const updatedValue = parseFloat(updatedMatch[1]);
                      if (updatedValue < initialRewardValue) {
                        const amountClaimed = initialRewardValue - updatedValue;
                        claimData.totalClaimed += amountClaimed;
                        resultsContainer.innerHTML += `<p style="color: green;">Successfully claimed ${amountClaimed.toFixed(4)} cOIL!</p>`;
                        return true;
                      }
                    }
                  }
                  resultsContainer.innerHTML = `
                    <p>Claiming rewards from plot #${currentPlot.id} (${currentIndex + 1}/${claimData.plotsToVisit.length})...</p>
                    <p>Found ${initialRewardValue.toFixed(4)} cOIL to claim. Clicking Store button...</p>
                    <p>Waiting for transaction confirmation... (${Math.floor(elapsedTime/1000)}s elapsed)</p>
                  `;
                }
                resultsContainer.innerHTML += `<p style="color: orange;">Wait time exceeded. Moving to next plot.</p>`;
                return false;
              };
              await waitForRewardChange();
            } else {
              resultsContainer.innerHTML += `<p>Could not find Store button. Skipping this plot.</p>`;
            }
          } else {
            resultsContainer.innerHTML += `<p>No rewards to claim on this plot.</p>`;
          }
        } else {
          resultsContainer.innerHTML += `<p>Could not find rewards container. Skipping this plot.</p>`;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error claiming from plot ${currentPlot.id}:`, error);
        resultsContainer.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
      }
      claimData.currentPlotIndex++;
      if (claimData.currentPlotIndex >= claimData.plotsToVisit.length) {
        claimData.claimingInProgress = false;
        localStorage.setItem('petroleumHelperClaimData', JSON.stringify(claimData));
        resultsContainer.innerHTML += `
          <p>Completed claiming from all plots!</p>
          <p>Total claimed: ${claimData.totalClaimed.toFixed(4)} cOIL</p>
          <p>Returning to dashboard...</p>
        `;
        await new Promise(resolve => setTimeout(resolve, 3000));
        window.location.href = claimData.dashboardUrl;
      } else {
        localStorage.setItem('petroleumHelperClaimData', JSON.stringify(claimData));
        const nextPlot = claimData.plotsToVisit[claimData.currentPlotIndex];
        window.location.href = `https://petroleum.land/dashboard/plot/${nextPlot.id}`;
      }
    } else if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/') {
      if (!claimData.claimingInProgress) {
        resultsContainer.innerHTML = `
          <p style="color: green;">Claim All Rewards Complete!</p>
          <p>Successfully claimed ${claimData.totalClaimed.toFixed(4)} cOIL from ${claimData.plotsToVisit.length} plots.</p>
        `;
        setTimeout(() => {
          localStorage.removeItem('petroleumHelperClaimData');
          updateDashboardData();
        }, 5000);
      }
    }
  } catch (error) {
    console.error('Error continuing claim process:', error);
    const resultsContainer = document.getElementById('analysis-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p style="color: red;">Error during claim process: ${error.message}</p>`;
    }
  }
}

function calculateReinvestmentPotential(dashboardData, plotsWithDetails) {
  if (!dashboardData || !plotsWithDetails) {
    console.error("Missing required data for calculation");
    return {
      immediateRepairCost: 0,
      availableAfterImmediateRepairs: 0,
      maxImmediateReinvestPumps: 0,
      reservedForUpcomingRepairs: 0,
      recommendedPumps: 0,
      pumpPurchaseSchedule: [],
      decayBatches: [],
      totalRepairCosts: 0,
      nextCriticalRepair: "None",
      next12HoursRepairs: 0
    };
  }
  console.log("Found decay events:", plotsWithDetails);
  const {
    currentBalance,
    unclaimedRewards,
    totalAvailable,
    hourlyProduction,
    minutelyProduction
  } = dashboardData;
  const now = new Date();
  const immediateRepairCost = dashboardData.totalDecayedPumps * 50;
  const availableAfterImmediateRepairs = Math.max(0, totalAvailable - immediateRepairCost);
  const decayEvents = [];
  let validPumpsFound = false;
  for (const plot of plotsWithDetails) {
    if (plot.pumpDetails && plot.pumpDetails.length > 0) {
      validPumpsFound = true;
      for (const pump of plot.pumpDetails) {
        if (pump.decayHours !== undefined && pump.decayHours > 0) {
          const decayMinutes = Math.floor(pump.decayHours * 60);
          const decayTime = new Date(now.getTime() + decayMinutes * 60 * 1000);
          decayEvents.push({
            minute: decayMinutes,
            cost: 50,
            time: decayTime,
            originalTimeStamp: decayTime.getTime()
          });
        } else if (pump.decayTimeText && pump.decayTimeText.trim() !== "") {
          const decayHours = timeStringToHours(pump.decayTimeText);
          if (decayHours > 0) {
            const decayMinutes = Math.floor(decayHours * 60);
            const decayTime = new Date(now.getTime() + decayMinutes * 60 * 1000);
            decayEvents.push({
              minute: decayMinutes,
              cost: 50,
              time: decayTime,
              originalTimeStamp: decayTime.getTime()
            });
          }
        }
      }
      console.log(`Found ${decayEvents.length} valid decay events`);
    }
  }
  const decayBatches = {};
  for (const event of decayEvents) {
    const roundedMinute = Math.floor(event.minute / 5) * 5;
    if (!decayBatches[roundedMinute]) {
      decayBatches[roundedMinute] = {
        minute: roundedMinute,
        minuteOffset: roundedMinute,
        count: 0,
        cost: 0,
        time: event.time,
        timeStamp: event.time.getTime(),
        originalTimeStamp: event.originalTimeStamp
      };
    }
    decayBatches[roundedMinute].count++;
    decayBatches[roundedMinute].cost += event.cost;
  }
  console.log(`Grouped into ${Object.keys(decayBatches).length} batches`);
  if (!validPumpsFound || decayEvents.length === 0) {
    console.log("No valid decay data found. Using fallback estimation based on pump count.");
    const totalPumps = dashboardData.totalActivePumps;
    if (totalPumps > 0) {
      for (let hour = 1; hour <= 48; hour++) {
        const pumpsDecayingThisHour = Math.max(1, Math.round(totalPumps * 0.02 * (Math.random() * 0.5 + 0.75)));
        const roundedMinute = Math.floor(hour * 60 / 5) * 5;
        const decayTime = new Date(now.getTime() + roundedMinute * 60 * 1000);
        decayBatches[roundedMinute] = {
          minute: roundedMinute,
          minuteOffset: roundedMinute,
          count: pumpsDecayingThisHour,
          cost: pumpsDecayingThisHour * 50,
          time: decayTime,
          timeStamp: decayTime.getTime(),
          originalTimeStamp: decayTime.getTime()
        };
      }
    } else {
      for (let hour = 1; hour <= 24; hour += 4) {
        const roundedMinute = Math.floor(hour * 60 / 5) * 5;
        const decayTime = new Date(now.getTime() + roundedMinute * 60 * 1000);
        decayBatches[roundedMinute] = {
          minute: roundedMinute,
          minuteOffset: roundedMinute,
          count: 5 + Math.floor(Math.random() * 6),
          cost: (5 + Math.floor(Math.random() * 6)) * 50,
          time: decayTime,
          timeStamp: decayTime.getTime(),
          originalTimeStamp: decayTime.getTime()
        };
      }
    }
  }
  const sortedDecayBatches = Object.values(decayBatches).sort((a, b) => a.minute - b.minute);
  const totalRepairCosts = sortedDecayBatches.reduce((sum, batch) => sum + batch.cost, 0);
  const repairCostsByMinute = {};
  for (const batch of sortedDecayBatches) {
    repairCostsByMinute[batch.minute] = batch.cost;
  }
  const firstRepair = sortedDecayBatches.length > 0 ? sortedDecayBatches[0] : null;
  const nextCriticalRepairTime = firstRepair ? formatMinutes(firstRepair.minute) : "None";
  const next12HoursRepairs = sortedDecayBatches
    .filter(batch => batch.minute <= 12 * 60)
    .reduce((sum, batch) => sum + batch.cost, 0);
  const next12HoursProduction = 12 * hourlyProduction;
  const balanceAfter12Hours = availableAfterImmediateRepairs + next12HoursProduction - next12HoursRepairs;
  let recommendedPumps = 0;
  let reservedForUpcomingRepairs = 0;
  if (balanceAfter12Hours >= 0) {
    let simulatedBalance = availableAfterImmediateRepairs;
    let lowestBalance = simulatedBalance;
    let lowestMinute = 0;
    for (let minute = 1; minute <= 12 * 60; minute++) {
      simulatedBalance += minutelyProduction;
      if (repairCostsByMinute[minute]) {
        simulatedBalance -= repairCostsByMinute[minute];
      }
      if (simulatedBalance < lowestBalance) {
        lowestBalance = simulatedBalance;
        lowestMinute = minute;
      }
    }
    if (lowestBalance >= 0) {
      recommendedPumps = Math.floor(lowestBalance / 50);
      reservedForUpcomingRepairs = availableAfterImmediateRepairs - (recommendedPumps * 50);
    } else {
      reservedForUpcomingRepairs = Math.abs(lowestBalance);
      const safeToSpend = availableAfterImmediateRepairs - reservedForUpcomingRepairs;
      recommendedPumps = Math.max(0, Math.floor(safeToSpend / 50));
    }
  } else {
    reservedForUpcomingRepairs = availableAfterImmediateRepairs;
    recommendedPumps = 0;
  }
  const pumpPurchaseSchedule = [];
  const maxImmediateReinvestPumps = Math.floor(availableAfterImmediateRepairs / 50);
  let runningBalance = Math.max(0, availableAfterImmediateRepairs - (recommendedPumps * 50));
  let nextPumpNumber = recommendedPumps + 1;
  for (let minute = 1; minute <= 24 * 60; minute++) {
    runningBalance += minutelyProduction;
    if (repairCostsByMinute[minute]) {
      runningBalance -= repairCostsByMinute[minute];
    }
    if (runningBalance >= 50) {
      let sufficientBuffer = true;
      let tempBalance = runningBalance - 50;
      for (let futureMinute = minute + 1; futureMinute <= minute + 60; futureMinute++) {
        if (repairCostsByMinute[futureMinute]) {
          tempBalance -= repairCostsByMinute[futureMinute];
          if (tempBalance < 0) {
            sufficientBuffer = false;
            break;
          }
        }
        tempBalance += minutelyProduction;
      }
      if (sufficientBuffer) {
        const pumpTime = new Date(now.getTime() + minute * 60 * 1000);
        pumpPurchaseSchedule.push({
          pumpNumber: nextPumpNumber,
          time: pumpTime,
          timeStamp: pumpTime.getTime(),
          originalTimeStamp: pumpTime.getTime(),
          oilNeeded: nextPumpNumber * 50,
          minute
        });
        runningBalance -= 50;
        nextPumpNumber++;
        if (pumpPurchaseSchedule.length >= 20) break;
      }
    }
  }
  return {
    immediateRepairCost,
    availableAfterImmediateRepairs,
    maxImmediateReinvestPumps,
    reservedForUpcomingRepairs,
    recommendedPumps,
    pumpPurchaseSchedule,
    decayBatches: sortedDecayBatches,
    totalRepairCosts,
    nextCriticalRepair: nextCriticalRepairTime,
    next12HoursRepairs
  };
}

function displayResults(dashboardData, plotsWithDetails, reinvestmentData) {
  const resultsContainer = document.getElementById('analysis-results');
  const now = new Date();
  resultsContainer.innerHTML = '';
  const summarySection = document.createElement('div');
  summarySection.innerHTML = `
    <h3>Summary</h3>
    <p><strong>Balance:</strong> ${dashboardData.currentBalance.toFixed(2)} cOIL</p>
    <p><strong>Unclaimed Rewards:</strong> ${dashboardData.unclaimedRewards.toFixed(2)} cOIL</p>
    <p><strong>Total Available:</strong> ${dashboardData.totalAvailable.toFixed(2)} cOIL</p>
    <p><strong>Total Production:</strong> ${dashboardData.totalDailyProduction.toFixed(2)} cOIL/day (${dashboardData.hourlyProduction.toFixed(2)} cOIL/hour)</p>
    <p><strong>Active Pumps:</strong> ${dashboardData.totalActivePumps}</p>
    <p><strong>Decayed Pumps:</strong> ${dashboardData.totalDecayedPumps}</p>
    <p><strong>Repair Cost:</strong> ${reinvestmentData.immediateRepairCost.toFixed(2)} cOIL</p>
    <p><strong>Available for New Pumps:</strong> ${Math.max(0, reinvestmentData.availableAfterImmediateRepairs).toFixed(2)} cOIL (${reinvestmentData.maxImmediateReinvestPumps} pumps)</p>
  `;
  const scheduleSection = document.createElement('div');
  scheduleSection.innerHTML = `<h3>Pump Purchase Schedule</h3>`;
  const pumpInfo = document.createElement('div');
  pumpInfo.style.marginBottom = '15px';
  const maxAvailableInfo = document.createElement('div');
  maxAvailableInfo.style.padding = '8px';
  maxAvailableInfo.style.backgroundColor = '#333';
  maxAvailableInfo.style.borderRadius = '4px';
  maxAvailableInfo.style.marginBottom = '10px';
  maxAvailableInfo.innerHTML = `
    <p>Max available: ${reinvestmentData.maxImmediateReinvestPumps} pumps (${(reinvestmentData.maxImmediateReinvestPumps * 50).toFixed(2)} cOIL)</p>
    <p>Reserved for upcoming repairs: ${(reinvestmentData.reservedForUpcomingRepairs || 0).toFixed(2)} cOIL</p>
  `;
  const recommendedInfo = document.createElement('div');
  recommendedInfo.style.backgroundColor = '#1a4d33';
  recommendedInfo.style.padding = '10px';
  recommendedInfo.style.borderRadius = '4px';
  recommendedInfo.style.marginBottom = '10px';
  recommendedInfo.style.fontWeight = 'bold';
  let recommendationDetails = '';
  if (reinvestmentData.recommendedPumps === 0 && reinvestmentData.nextCriticalRepair) {
    recommendationDetails = `
      <p>Cannot safely purchase pumps now due to upcoming repairs.</p>
      <p>Next critical repair: ${reinvestmentData.nextCriticalRepair}</p>
      ${reinvestmentData.nextCriticalRepairPumps ?
        `<p>Pumps: ${reinvestmentData.nextCriticalRepairPumps}, Cost: ${(reinvestmentData.nextCriticalRepairCost || 0).toFixed(2)} cOIL</p>` : ''}
      ${reinvestmentData.productionUntilRepair ?
        `<p>Production until then: ${(reinvestmentData.productionUntilRepair || 0).toFixed(2)} cOIL</p>` : ''}
    `;
  } else if (reinvestmentData.nextCriticalRepair && reinvestmentData.nextCriticalRepair !== "None") {
    recommendationDetails = `
      <p>Reserved funds ensure coverage for ${(reinvestmentData.totalRepairCosts || 0).toFixed(2)} cOIL in upcoming repairs.</p>
      <p>Next critical repair: ${reinvestmentData.nextCriticalRepair}</p>
    `;
  } else {
    recommendationDetails = `
      <p>No critical repairs in the next 6 hours.</p>
    `;
  }
  recommendedInfo.innerHTML = `
    <p><strong>Recommended purchase: ${reinvestmentData.recommendedPumps} pumps (${(reinvestmentData.recommendedPumps * 50).toFixed(2)} cOIL)</strong></p>
    ${recommendationDetails}
  `;
  pumpInfo.appendChild(maxAvailableInfo);
  pumpInfo.appendChild(recommendedInfo);
  scheduleSection.appendChild(pumpInfo);
  const scheduleTable = document.createElement('table');
  scheduleTable.style.width = '100%';
  scheduleTable.style.borderCollapse = 'collapse';
  scheduleTable.style.marginTop = '10px';
  const tableHeader = document.createElement('thead');
  tableHeader.innerHTML = `
    <tr>
      <th style="text-align: left; padding: 5px; border-bottom: 1px solid #555;">Time</th>
      <th style="text-align: right; padding: 5px; border-bottom: 1px solid #555;">Pump #</th>
      <th style="text-align: right; padding: 5px; border-bottom: 1px solid #555;">cOIL Needed</th>
    </tr>
  `;
  scheduleTable.appendChild(tableHeader);
  const tableBody = document.createElement('tbody');
  const displayLimit = 20;
  const pumpsToDisplay = reinvestmentData.pumpPurchaseSchedule ?
    reinvestmentData.pumpPurchaseSchedule.slice(0, displayLimit) : [];
  for (const pump of pumpsToDisplay) {
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    timeCell.style.textAlign = 'left';
    timeCell.style.padding = '5px';
    timeCell.style.borderBottom = '1px solid #333';
    let displayTime = "Unknown";
    try {
      if (pump.time instanceof Date && !isNaN(pump.time.getTime())) {
        displayTime = formatTime(pump.time);
      } else if (pump.timeStamp) {
        displayTime = formatTime(new Date(pump.timeStamp));
      } else if (typeof pump.time === 'string') {
        displayTime = formatTime(new Date(pump.time));
      } else if (pump.minute !== undefined) {
        const pumpTime = new Date(now.getTime() + (pump.minute * 60 * 1000));
        displayTime = formatTime(pumpTime);
      }
    } catch (e) {
      console.error("Error formatting time:", e);
    }
    timeCell.textContent = displayTime;
    const pumpNumberCell = document.createElement('td');
    pumpNumberCell.style.textAlign = 'right';
    pumpNumberCell.style.padding = '5px';
    pumpNumberCell.style.borderBottom = '1px solid #333';
    pumpNumberCell.textContent = pump.pumpNumber;
    const oilNeededCell = document.createElement('td');
    oilNeededCell.style.textAlign = 'right';
    oilNeededCell.style.padding = '5px';
    oilNeededCell.style.borderBottom = '1px solid #333';
    oilNeededCell.textContent = `${pump.oilNeeded.toFixed(2)} cOIL`;
    row.appendChild(timeCell);
    row.appendChild(pumpNumberCell);
    row.appendChild(oilNeededCell);
    tableBody.appendChild(row);
  }
  scheduleTable.appendChild(tableBody);
  scheduleSection.appendChild(scheduleTable);
  if (reinvestmentData.pumpPurchaseSchedule && reinvestmentData.pumpPurchaseSchedule.length > displayLimit) {
    const moreInfo = document.createElement('p');
    moreInfo.textContent = `...and ${reinvestmentData.pumpPurchaseSchedule.length - displayLimit} more opportunities in the next 24 hours`;
    moreInfo.style.fontSize = '12px';
    moreInfo.style.fontStyle = 'italic';
    moreInfo.style.marginTop = '5px';
    scheduleSection.appendChild(moreInfo);
  }
  const decaySection = document.createElement('div');
  decaySection.innerHTML = `<h3>Upcoming Pump Decays</h3>`;
  const decayTable = document.createElement('table');
  decayTable.style.width = '100%';
  decayTable.style.borderCollapse = 'collapse';
  decayTable.style.marginTop = '10px';
  const decayTableHeader = document.createElement('thead');
  decayTableHeader.innerHTML = `
    <tr>
      <th style="text-align: left; padding: 5px; border-bottom: 1px solid #555;">Time</th>
      <th style="text-align: right; padding: 5px; border-bottom: 1px solid #555;">Decaying Pumps</th>
      <th style="text-align: right; padding: 5px; border-bottom: 1px solid #555;">Repair Cost</th>
    </tr>
  `;
  decayTable.appendChild(decayTableHeader);
  const decayTableBody = document.createElement('tbody');
  let displayBatches = [];
  if (reinvestmentData.decayBatches && Array.isArray(reinvestmentData.decayBatches)) {
    displayBatches = reinvestmentData.decayBatches
      .filter(batch => batch &&
        (typeof batch.minute === 'number' || typeof batch.minuteOffset === 'number') &&
        (batch.minute <= 24 * 60 || batch.minuteOffset <= 24 * 60))
      .slice(0, 30);
  }
  if (displayBatches.length > 0) {
    for (const batch of displayBatches) {
      const row = document.createElement('tr');
      const timeCell = document.createElement('td');
      timeCell.style.textAlign = 'left';
      timeCell.style.padding = '5px';
      timeCell.style.borderBottom = '1px solid #333';
      let displayTime = "Unknown";
      try {
        if (batch.time instanceof Date && !isNaN(batch.time.getTime())) {
          displayTime = formatTime(batch.time);
        } else if (batch.timeStamp) {
          displayTime = formatTime(new Date(batch.timeStamp));
        } else if (typeof batch.time === 'string') {
          displayTime = formatTime(new Date(batch.time));
        } else {
          const minutes = batch.minute || batch.minuteOffset || 0;
          const decayTime = new Date(now.getTime() + minutes * 60 * 1000);
          displayTime = formatTime(decayTime);
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          const remainingTime = `${hours}h ${mins}m`;
          displayTime = `${displayTime} (${remainingTime})`;
        }
      } catch (e) {
        console.error("Error formatting decay time:", e);
      }
      timeCell.textContent = displayTime;
      const pumpsCell = document.createElement('td');
      pumpsCell.style.textAlign = 'right';
      pumpsCell.style.padding = '5px';
      pumpsCell.style.borderBottom = '1px solid #333';
      pumpsCell.textContent = batch.count;
      const costCell = document.createElement('td');
      costCell.style.textAlign = 'right';
      costCell.style.padding = '5px';
      costCell.style.borderBottom = '1px solid #333';
      costCell.textContent = `${(batch.count * 50).toFixed(2)} cOIL`;
      row.appendChild(timeCell);
      row.appendChild(pumpsCell);
      row.appendChild(costCell);
      decayTableBody.appendChild(row);
    }
  } else {
    const row = document.createElement('tr');
    const messageCell = document.createElement('td');
    messageCell.colSpan = 3;
    messageCell.style.textAlign = 'center';
    messageCell.style.padding = '10px';
    messageCell.textContent = 'No pump decays detected in the next 24 hours';
    row.appendChild(messageCell);
    decayTableBody.appendChild(row);
  }
  decayTable.appendChild(decayTableBody);
  decaySection.appendChild(decayTable);
  const plotsSection = document.createElement('div');
  plotsSection.innerHTML = `<h3>Plot Details</h3>`;
  for (const plot of plotsWithDetails) {
    const plotDiv = document.createElement('div');
    plotDiv.style.marginBottom = '10px';
    plotDiv.style.padding = '5px';
    plotDiv.style.borderLeft = '3px solid #48cae4';
    plotDiv.style.backgroundColor = '#1a1a1a';
    const validPumpsText = plot.validPumps
      ? `${plot.validPumps}/${plot.pumps} pumps analyzed`
      : `0/${plot.pumps} pumps analyzed (${plot.error || 'unable to fetch data'})`;
    plotDiv.innerHTML = `
      <p><strong>Plot #${plot.id}</strong> - ${plot.production.toFixed(2)} cOIL/day</p>
      <p>${plot.pumps} pumps (${plot.decayedPumps} decayed)</p>
      <p>${validPumpsText}</p>
    `;
    if (plot.pumpDetails && plot.pumpDetails.length > 0) {
      const decayingIn1h = plot.pumpDetails.filter(p => p.decayHours <= 1).length;
      const decayingIn4h = plot.pumpDetails.filter(p => p.decayHours > 1 && p.decayHours <= 4).length;
      const decayingIn24h = plot.pumpDetails.filter(p => p.decayHours > 4 && p.decayHours <= 24).length;
      const decaySummary = document.createElement('div');
      decaySummary.style.marginTop = '5px';
      decaySummary.style.fontSize = '12px';
      decaySummary.innerHTML = `
        <p>Decaying soon: <strong>${decayingIn1h}</strong> in 1h, <strong>${decayingIn4h}</strong> in 4h, <strong>${decayingIn24h}</strong> in 24h</p>
      `;
      plotDiv.appendChild(decaySummary);
    }
    plotsSection.appendChild(plotDiv);
  }
  resultsContainer.appendChild(summarySection);
  resultsContainer.appendChild(scheduleSection);
  resultsContainer.appendChild(decaySection);
  resultsContainer.appendChild(plotsSection);
  updateTimestampDisplay();
}

function analyzeGameData() {
  const resultsContainer = document.getElementById('analysis-results');
  resultsContainer.innerHTML = '<p>Analyzing game data...</p>';
  try {
    localStorage.removeItem('petroleumHelperReloadRetry');
    getDashboardData().then(dashboardData => {
      localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
      navigateToPlots(dashboardData.plotData);
    });
  } catch (error) {
    resultsContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    console.error(error);
  }
}

function initializeExtension() {
  if (window.location.hostname === 'petroleum.land') {
    const container = createHelperUI();
    document.body.appendChild(container);
    if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/') {
      setTimeout(async () => {
        try {
          const dashboardData = await getDashboardData();
          const summaryItems = document.querySelectorAll('[class*="summaryItem"]');
          for (const item of summaryItems) {
            const label = item.querySelector('p');
            if (label && label.textContent === 'cOIL/day') {
              const valueElement = item.querySelector('h3');
              if (valueElement) {
                valueElement.textContent = dashboardData.totalDailyProduction.toFixed(2);
              }
              break;
            }
          }
          const summaryGrid = document.querySelector('[class*="summaryGrid"]');
          if (summaryGrid) {
            let hourlyElement = document.getElementById('hourly-production-element');
            if (!hourlyElement) {
              const existingItem = document.querySelector('[class*="summaryItem"]');
              const summaryItemClass = existingItem ? Array.from(existingItem.classList).find(cls => cls.includes('summaryItem')) : '';
              const existingIcon = document.querySelector('[class*="summaryIcon"]');
              const summaryIconClass = existingIcon ? Array.from(existingIcon.classList).find(cls => cls.includes('summaryIcon')) : '';
              const existingInfo = document.querySelector('[class*="summaryInfo"]');
              const summaryInfoClass = existingInfo ? Array.from(existingInfo.classList).find(cls => cls.includes('summaryInfo')) : '';
              hourlyElement = document.createElement('div');
              hourlyElement.className = summaryItemClass || '_summaryItem';
              hourlyElement.id = 'hourly-production-element';
              hourlyElement.innerHTML = `
                <div class="${summaryIconClass || '_summaryIcon'}">
                  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path>
                  </svg>
                </div>
                <div class="${summaryInfoClass || '_summaryInfo'}">
                  <h3>${dashboardData.hourlyProduction.toFixed(2)}</h3>
                  <p>cOIL/hour</p>
                </div>
              `;
              summaryGrid.appendChild(hourlyElement);
            } else {
              const hourlyValueElement = hourlyElement.querySelector('h3');
              if (hourlyValueElement) {
                hourlyValueElement.textContent = dashboardData.hourlyProduction.toFixed(2);
              }
            }
          }
          const storedDataString = localStorage.getItem('petroleumHelperData');
          const claimDataString = localStorage.getItem('petroleumHelperClaimData');
          let analysisInProgress = false;
          let claimingInProgress = false;
          if (storedDataString) {
            const storedData = JSON.parse(storedDataString);
            analysisInProgress = storedData.analysisInProgress || storedData.analysisComplete;
          }
          if (claimDataString) {
            const claimData = JSON.parse(claimDataString);
            claimingInProgress = claimData.claimingInProgress;
          }
          if (!analysisInProgress && !claimingInProgress) {
            const resultsContainer = document.getElementById('analysis-results');
            if (resultsContainer && resultsContainer.textContent.includes('Collecting dashboard data')) {
              resultsContainer.innerHTML = '';
            }
          }
          updateTimestampDisplay();
        } catch (error) {
          console.error("Error auto-updating dashboard:", error);
        }
      }, 2000);
    }
    const storedDataString = localStorage.getItem('petroleumHelperData');
    if (storedDataString) {
      try {
        const storedData = JSON.parse(storedDataString);
        if (storedData.analysisInProgress || storedData.analysisComplete) {
          setTimeout(() => {
            continueAnalysis();
          }, 2000);
        } else {
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/') {
            setTimeout(() => {
              const resultsContainer = document.getElementById('analysis-results');
              if (resultsContainer && resultsContainer.innerHTML === '') {
                const completedResultsString = localStorage.getItem('petroleumHelperCompleteResults');
                if (completedResultsString) {
                  try {
                    const completedResults = JSON.parse(completedResultsString);
                    const isRecent = completedResults.timestamp &&
                      (Date.now() - completedResults.timestamp < 24 * 60 * 60 * 1000);
                    if (isRecent && completedResults.dashboardData && completedResults.plotsWithDetails) {
                      try {
                        if (completedResults.reinvestmentData && completedResults.reinvestmentData.decayBatches) {
                          for (const batch of completedResults.reinvestmentData.decayBatches) {
                            if (batch.timeStamp) {
                              try {
                                batch.time = new Date(batch.timeStamp);
                              } catch (e) {
                                console.error("Error creating date from timestamp:", e);
                                batch.time = new Date();
                              }
                            } else {
                              batch.time = new Date();
                            }
                          }
                        }
                        if (completedResults.reinvestmentData && completedResults.reinvestmentData.pumpPurchaseSchedule) {
                          for (const pump of completedResults.reinvestmentData.pumpPurchaseSchedule) {
                            if (pump.timeStamp) {
                              try {
                                pump.time = new Date(pump.timeStamp);
                              } catch (e) {
                                console.error("Error creating date from timestamp:", e);
                                pump.time = new Date();
                              }
                            } else {
                              pump.time = new Date();
                            }
                          }
                        }
                        displayResults(
                          completedResults.dashboardData,
                          completedResults.plotsWithDetails,
                          completedResults.reinvestmentData
                        );
                      } catch (displayError) {
                        console.error("Error displaying saved results:", displayError);
                        resultsContainer.innerHTML = `<p style="color: red;">Error displaying saved results: ${displayError.message}</p>`;
                      }
                    }
                  } catch (error) {
                    console.error("Error restoring completed results:", error);
                  }
                }
              }
            }, 3000);
          }
        }
      } catch (e) {
        console.error('Error parsing stored data:', e);
      }
    }
    const claimDataString = localStorage.getItem('petroleumHelperClaimData');
    if (claimDataString) {
      try {
        const claimData = JSON.parse(claimDataString);
        if (claimData.claimingInProgress) {
          setTimeout(() => {
            continueClaiming();
          }, 2000);
        }
      } catch (e) {
        console.error('Error parsing claim data:', e);
      }
    }
  }
}

window.addEventListener('load', () => {
  initializeExtension();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze") {
    analyzeGameData();
    sendResponse({success: true});
  }
  return true;
});
