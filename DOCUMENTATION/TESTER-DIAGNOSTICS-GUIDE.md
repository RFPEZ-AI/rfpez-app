# Quick Guide: Layout Issue Diagnostics for Testers

## What's Happening?
You're seeing the artifact panel at the bottom of the screen (like on a phone) even though your browser window is in landscape orientation (wider than it is tall).

## How to Send Us Diagnostics

### Step 1: Navigate to Debug Page
1. Go to: **https://dev.rfpez.ai/debug**
2. You should see a card at the top called **"Viewport Diagnostics"**

### Step 2: Copy Diagnostics
1. Click the **"Copy All Diagnostics"** button
2. Paste the data into:
   - An email to the development team
   - A Slack message
   - A GitHub issue comment
   - A text file attachment

### Step 3: Take Screenshots
Please take **THREE screenshots**:

**Screenshot 1: Full Browser Window**
- Show the entire Chrome window
- Include title bar, address bar, tabs
- Show the dev.rfpez.ai page with the layout issue
- We need to see if DevTools is open, if there's zoom, etc.

**Screenshot 2: Viewport Diagnostics Card**
- Scroll to the "Viewport Diagnostics" card on the debug page
- Make sure all the information is visible
- Especially look for any red warning messages

**Screenshot 3: Browser Settings**
- Press `Ctrl+Shift+I` (or F12) to open DevTools
- Click the three dots menu (⋮) in DevTools
- Take screenshot showing zoom level and display settings

## Quick Fixes to Try

### Fix 1: Reset Browser Zoom
**Windows:** Press `Ctrl+0` (zero)  
**Mac:** Press `Cmd+0` (zero)

This resets zoom to 100%. Check if the layout fixes itself.

### Fix 2: Close DevTools
If DevTools is open at the bottom:
- Press `F12` to close it
- Check if layout returns to normal

### Fix 3: Maximize Browser Window
- Press the maximize button
- Or press `F11` for fullscreen
- Check if layout improves

### Fix 4: Try Different Browser
- Test in Chrome (if using Edge)
- Test in Firefox
- Report which browsers work vs don't work

## What Information Helps Us

When you send diagnostics, please also tell us:

1. **Operating System**: Windows 10? Windows 11? Mac? Version?
2. **Browser**: Chrome? Edge? Firefox? Version number?
3. **Monitor Setup**: 
   - Single monitor or multiple?
   - Monitor resolution (e.g., 1920x1080)?
   - Windows display scaling (100%? 125%? 150%)?
4. **When It Started**: Did this just start happening? Or always been this way?
5. **Other Apps**: Any other browser extensions or apps running?

## What We'll Look For

From your diagnostics, we'll check:

✅ **Aspect Ratio** - Should be >1 for landscape (e.g., 1.78 for 16:9)  
✅ **Orientation** - Should say "LANDSCAPE" not "PORTRAIT"  
✅ **Window Size** - Width should be greater than height  
✅ **Zoom Level** - Should be 100% or close to it  
✅ **Visual Viewport** - Should match window size  

If any of these are wrong, we'll know exactly what to fix!

## Expected Fix Timeline

Once we receive your diagnostics:
1. We'll analyze the data (within 1 hour)
2. Implement a fix if needed (within 1 day)
3. Deploy to dev.rfpez.ai (within 1 day)
4. Ask you to verify the fix (immediate)

## Questions?

If anything is unclear or you need help:
- Send us a message with "Help with diagnostics"
- We'll guide you through step-by-step
- No technical knowledge required!

---

**Thank you for helping us improve RFPEZ.AI! 🙏**

Your detailed diagnostics will help us fix this issue not just for you, but for all future users who might encounter similar problems.
