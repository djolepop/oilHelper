# PetroleumLand Helper (v0.2)

A Chrome extension designed to optimize gameplay in PetroleumLand by analyzing pump data, calculating optimal repair and investment strategies, and automating reward collection.

## Overview

PetroleumLand Helper enhances your gameplay experience by providing data-driven recommendations for maximum efficiency. The extension analyzes your plots, pumps, and decay times to calculate the optimal balance between repairs and expansion.

## Features

- **Dashboard Analysis**: Calculates hourly and daily production rates across all plots
- **Decay Tracking**: Monitors upcoming pump decay times and calculates repair costs
- **Balance Projection**: Provides a detailed timeline of your future balance with repair costs factored in, highlighting potential financial bottlenecks
- **Lowest Balance Highlighting**: Identifies critical points where your balance will be lowest, helping you plan your investment strategy
- **Reward Claiming**: Automates the process of claiming rewards from all plots
- **Time-Sensitive Planning**: Shows when upcoming pump decays will occur and their impact on your balance

## Installation

Since this extension is not available in the Chrome Web Store, you'll need to install it as an unpacked extension:

1. **Download the repository**: 
   - Click the green "Code" button at the top of this GitHub page
   - Select "Download ZIP" from the dropdown menu
   - Extract the ZIP file to a folder on your computer

2. **Open Chrome Extensions**: 
   - Navigate to `chrome://extensions/` in your Chrome browser

3. **Enable Developer Mode**: 
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**: 
   - Click "Load unpacked" 
   - Select the folder containing the extension files (the extracted folder with manifest.json inside)

5. **Verify Installation**: 
   - The extension icon should appear in your Chrome toolbar
   - Navigate to PetroleumLand to see the helper widget

## Security

This extension is designed with security in mind:

- **No Wallet Interaction**: The extension never directly interacts with your cryptocurrency wallet
- **Claim Function**: The "Claim All Rewards" button simply clicks the UI elements on your behalf - you still need to manually approve all transactions in your wallet
- **No External Communication**: All processing happens locally on your device with no data sent to external servers
- **UI Interaction Only**: The extension only interacts with the game's user interface and does not modify any blockchain transactions

**Note**: Some features (like data analysis and reward claiming) will temporarily take control of your browser window to navigate through plot pages for data collection. The extension will always return to the dashboard when finished.

## Using the Extension

### Main Panel

The extension adds a floating panel to your PetroleumLand dashboard with three main action buttons:

- **Analyze Game Data**: Collects comprehensive data from all your plots (requires navigating to each plot)
- **Update Dashboard**: Refreshes calculations based on your current balance without re-scraping plot data
- **Claim All Rewards**: Automatically navigates to each plot and clicks the claim button (you'll still need to approve transactions in your wallet)

### Data Sections

After analysis, the extension displays:

1. **Summary**: Overview of your balance, production, and pump count
2. **Balance Projection**: Timeline of your projected balance, highlighting critical low points in green and yellow
3. **Upcoming Pump Decays**: Schedule of upcoming pump repairs and their costs
4. **Plot Details**: Breakdown of pumps and production by plot

### Balance Projection Features

The new balance projection provides:

- Clear visualization of your future balance after each repair event
- Highlighting of your lowest balance points to help identify financial bottlenecks
- Accurate calculations that factor in both production and repair costs
- Time-based view showing exactly when critical balance points will occur

## Limitations

This extension is built primarily for personal use and has several intentional limitations:

1. **Golden Pumps Only**: Calculations assume standard 50 cOIL golden pumps and don't account for other pump types
2. **No Plot Type Optimization**: Does not consider different plot types or their yield bonuses
3. **No Pump Count Bonuses**: Does not optimize for the bonuses achieved at 30, 60, or 90+ pumps per plot
4. **No Derrick Budgeting**: Does not account for saving funds for derricks
5. **No Profit Taking**: While the tool shows available funds that could be withdrawn, it focuses on reinvestment rather than profit taking
6. **cOIL Only**: Only accounts for cOIL balance and not OIL balance
7. **Dashboard Interface Only**: The extension is designed to work with the Dashboard interface of the game, not with the graphical views of the plots

## Changelog

### v0.2
- Replaced Investment Optimization with Balance Projection feature
- Added highlighting for lowest balance points to better visualize financial planning
- Improved repair cost calculations and time display
- Fixed various bugs related to the "Update Dashboard" functionality
- Added more precise time tracking for decay events

### v0.1
- Initial release with basic dashboard analysis
- Decay tracking and repair cost calculation
- Investment optimization recommendations
- Reward claiming automation

## Disclaimer

This extension is provided as-is. The developer assumes no responsibility for any issues, incorrect data, or potential losses incurred while using this tool. Always verify recommendations before making significant in-game decisions.

This tool was built primarily for personal use according to specific gameplay needs and may not suit all play styles or strategies.

## License

[GPL-3.0 License](LICENSE)