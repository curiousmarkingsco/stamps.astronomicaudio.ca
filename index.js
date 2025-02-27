document.getElementById("vtt-generate").addEventListener("click", function () {
  const vttContent = document.getElementById("vtt-plaintext").value;
  const seconds = parseFloat(document.getElementById("vtt-seconds").value) || 0;
  const block = parseInt(document.getElementById("vtt-block").value, 10) || 0;
  const fileName = document.getElementById("vtt-filename").value || "output";

  // 'add' or 'subtract' from the toggle
  const arithmeType = document.getElementById("vtt-addsubtract").value;
  const minutes = parseFloat(document.getElementById("vtt-minutes").value) || 0;

  // Combine minutes & seconds into total seconds
  const totalSecondsToShift = (minutes * 60) + seconds;

  function timestampToSeconds(timestamp) {
    // Expects "HH:MM:SS.xxx" or "MM:SS.xxx"
    let [h, m, s] = [0, 0, 0];
    const parts = timestamp.split(":");
    if (parts.length === 3) {
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      s = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      m = parseInt(parts[0], 10);
      s = parseFloat(parts[1]);
    } else if (parts.length === 1) {
      s = parseFloat(parts[0]);
    }
    return (h * 3600) + (m * 60) + s;
  }

  function secondsToTimestamp(totalSeconds) {
    // Ensure no negatives
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toFixed(3).padStart(6, "0"); 
    return `${hours}:${minutes}:${secs}`;
  }

  function updateVTTTimestamps(vttText, shiftSec, startBlock, addOrSubtract) {
    const lines = vttText.split("\n");
    let currentBlock = 0;
    let inBlockRange = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // If line is a block number
      if (/^\d+$/.test(line)) {
        currentBlock = parseInt(line, 10);
        inBlockRange = (currentBlock >= startBlock);
        continue;
      }

      // If in range and line has '-->'
      if (inBlockRange && line.includes("-->")) {
        const [start, end] = line.split("-->").map((x) => x.trim());
        let startSec = timestampToSeconds(start);
        let endSec = timestampToSeconds(end);

        if (addOrSubtract.toLowerCase() === "add") {
          startSec += shiftSec;
          endSec += shiftSec;
        } else {
          startSec -= shiftSec;
          endSec -= shiftSec;
        }
        // Rebuild
        lines[i] = `${secondsToTimestamp(startSec)} --> ${secondsToTimestamp(endSec)}`;
      }
    }
    return lines.join("\n");
  }

  function sanitizeVTT(inputText) {
    const lines = inputText.split('\n');
    let currentSpeaker = ''; // Keeps track of the last speaker
    let blockNumber = 0;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines or lines with just the block number
      if (!line || /^\d+$/.test(line)) {
        if (/^\d+$/.test(line)) {
          console.log(line)
          blockNumber = line; // Store block number
          // if (parseInt(line) === blockNumber) result.push(line)
          continue;
        } else {
          continue;
        }
      }

      let newSpeaker = '';
      const speakerMatch = line.match(/^(.+?):$/);
      if (speakerMatch) {
        newSpeaker = speakerMatch[1].trim();
        if (newSpeaker !== currentSpeaker) {
          currentSpeaker = newSpeaker; // Update speaker only if it changes
        }
      }

      const matchedLine = result.findIndex(item => item === `${blockNumber}`);
      if (matchedLine !== -1) {
        if (newSpeaker !== '') {
          result[matchedLine] = `${newSpeaker}:`;
        } else if (currentSpeaker !== '') {
          result[matchedLine] = `${currentSpeaker}:`;
        }
      }

      // Check if the line is a timestamp
      if (line.includes('-->')) {
        // Extract the start timestamp, remove milliseconds, and reformat
        let [start] = line.split(' --> ');
        start = start.split(/[.,]/)[0]; // Remove milliseconds and handle both ',' and '.'

        // Remove "00:" if present at the beginning
        start = start.replace(/^00:/, '');

        // Add the speaker before the timestamp only if it changes
        if (currentSpeaker) {
          result.push(`\n${start}`);
        } else {
          result.push(`\n${start}`);
        }
      } else if (line === `${newSpeaker}:`) {
        result.push(`${newSpeaker}:`);
      } else {
        // Regular text line, append to the result with the current speaker or block number
        result.push(`${line}`);
      }
    }

    return result.join('\n');
  }

  // Actually update the timestamps now
  const updatedVTT = updateVTTTimestamps(vttContent, totalSecondsToShift, block, arithmeType);
  const sanitizedVTT = sanitizeVTT(updatedVTT);

  // Update the textarea with the newly modified VTT
  document.getElementById("vtt-plaintext").value = updatedVTT;

  // Enable the download/copy buttons
  const txtDownloadBtn = document.getElementById("txt-download");
  const vttCopyBtn = document.getElementById("vtt-copy-plain");
  const vttDownloadBtn = document.getElementById("vtt-download");

  txtDownloadBtn.disabled = false;
  vttCopyBtn.disabled = false;
  vttDownloadBtn.disabled = false;
  txtDownloadBtn.style.opacity = "1";
  txtDownloadBtn.style.cursor = "pointer";
  vttCopyBtn.style.opacity = "1";
  vttCopyBtn.style.cursor = "pointer";
  vttDownloadBtn.style.opacity = "1";
  vttDownloadBtn.style.cursor = "pointer";

  // Copy Clean Text
  vttCopyBtn.onclick = function () {
    navigator.clipboard.writeText(sanitizedVTT);
    alert("Sanitized VTT copied to clipboard!");
  };

  // Download as .txt
  txtDownloadBtn.onclick = function () {
    const blob = new Blob([sanitizedVTT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download as .vtt
  vttDownloadBtn.onclick = function () {
    const blob = new Blob([updatedVTT], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };
});


// Toggle ADD/SUBTRACT switch
function toggleAddSubtractState() {
  const stateElement = document.getElementById('addsubtract-button-state');
  const currentMode = stateElement.getAttribute('data-state');
  const newMode = (currentMode === 'Subtract') ? 'Add' : 'Subtract';
  stateElement.setAttribute('data-state', newMode);
  document.getElementById('vtt-addsubtract').value = newMode;
  stateElement.innerHTML = (newMode === 'Subtract') ? '-' : '+';
  document.getElementById('addsubtract-label').innerHTML 
    = `${newMode} time starting at the beginning block.`;
}

// Disable all download buttons on load
function disableDownloadButtons() {
  const txtDownloadBtn = document.getElementById("txt-download");
  const txtCopyBtn = document.getElementById("vtt-copy-plain");
  const vttDownloadBtn = document.getElementById("vtt-download");

  txtDownloadBtn.disabled = true;
  txtCopyBtn.disabled = true;
  vttDownloadBtn.disabled = true;
  txtDownloadBtn.style.opacity = "0.5";
  txtDownloadBtn.style.cursor = "not-allowed";
  txtCopyBtn.style.opacity = "0.5";
  txtCopyBtn.style.cursor = "not-allowed";
  vttDownloadBtn.style.opacity = "0.5";
  vttDownloadBtn.style.cursor = "not-allowed";
}
disableDownloadButtons();

// Re-disable buttons whenever inputs change
document.getElementById("vtt-plaintext").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-seconds").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-minutes").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-block").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-filename").addEventListener("input", disableDownloadButtons);

// We’ll store the old block time so we can compute differences easily.
let oldBlockTimeInSeconds = 0;

// Helper to parse an HH:MM:SS or MM:SS string into total seconds
function parseTimeToSeconds(str) {
  let [hh, mm, ss] = [0, 0, 0];
  const parts = str.split(":");
  if (parts.length === 3) {
    hh = parseInt(parts[0], 10);
    mm = parseInt(parts[1], 10);
    ss = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    mm = parseInt(parts[0], 10);
    ss = parseFloat(parts[1]);
  } else if (parts.length === 1) {
    ss = parseFloat(parts[0]);
  }
  return (hh * 3600) + (mm * 60) + ss;
}

// Finds the start timestamp for a given block number in the VTT
function getBlockTimestamp(vttText, blockNumber) {
  const lines = vttText.split(/\r?\n/);
  let foundBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === blockNumber.toString()) {
      // Next time we see "-->", that's the time line for this block
      foundBlock = true;
      continue;
    }
    if (foundBlock && line.includes('-->')) {
      // e.g. "00:00:03.500 --> 00:00:05.000"
      const times = line.split('-->');
      if (times.length === 2) {
        return times[0].trim(); // return start time
      }
    }
  }
  // Not found or invalid
  return null;
}

// When block number changes, find its old timestamp and populate #vtt-block-newtime
document.getElementById("vtt-block").addEventListener("input", function () {
  const vttContent = document.getElementById("vtt-plaintext").value;
  const blockNum = parseInt(this.value, 10);
  if (isNaN(blockNum)) return; // ignore invalid

  const startTime = getBlockTimestamp(vttContent, blockNum);
  if (startTime) {
    oldBlockTimeInSeconds = parseTimeToSeconds(startTime);
    document.getElementById("vtt-block-newtime").value = startTime;
  } else {
    oldBlockTimeInSeconds = 0;
    document.getElementById("vtt-block-newtime").value = "";
  }
});

// When user changes the new time, figure out difference in seconds vs. old time,
// pick “Add” or “Subtract” automatically, and set #vtt-minutes & #vtt-seconds accordingly
document.getElementById("vtt-block-newtime").addEventListener("input", function () {
  const newTimeStr = this.value.trim();
  if (!newTimeStr) return;

  const newTimeInSec = parseTimeToSeconds(newTimeStr);
  let diffSec = newTimeInSec - oldBlockTimeInSeconds;

  // Decide if we are adding or subtracting
  if (diffSec >= 0) {
    // Switch the toggle to "Add"
    const toggleBtn = document.getElementById("addsubtract-button-state");
    if (toggleBtn.getAttribute('data-state') === 'Subtract') {
      toggleAddSubtractState(); 
    }
  } else {
    // Switch the toggle to "Subtract"
    if (document.getElementById("addsubtract-button-state").getAttribute('data-state') === 'Add') {
      toggleAddSubtractState();
    }
  }

  diffSec = Math.abs(diffSec);

  // Convert into minutes + leftover seconds
  const wholeMinutes = Math.floor(diffSec / 60);
  const leftoverSec = (diffSec % 60).toFixed(3); // keep fractional if needed

  // Update the minute/second fields
  document.getElementById("vtt-minutes").value = wholeMinutes;
  document.getElementById("vtt-seconds").value = leftoverSec;
});
